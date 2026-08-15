#!/usr/bin/env node
/**
 * Bulk-load the hospitals & pharmacies directory into the `facilities` table.
 *
 * Reads data/facilities/hospitals.json + data/facilities/pharmacies.json
 * (originally exported from the Uganda Healthcare Directory). Normalises each
 * entry (name, slug, city/region from the address, phone, image), dedupes by
 * slug, and upserts. Idempotent — safe to re-run after a fresh export; never
 * touches `facility_ratings`, so community ratings survive refreshes.
 *
 * Requires SUPABASE_DB_URL in .env.local (Direct or Session-pooler connection).
 *
 * Usage: node scripts/import_facilities.mjs
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { Client } = require("pg");
import { loadEnv } from "./lib_env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data", "facilities");
const DIRECTORY_BASE = "https://www.ughealthdirectory.com";
const BATCH = 500;

loadEnv();
const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("SUPABASE_DB_URL is not set in .env.local");
  process.exit(1);
}

// --- normalisation helpers ------------------------------------------------

/** Collapse whitespace and trim. */
function clean(s) {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

function slugify(s) {
  return clean(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Split "Kampala, Central Region, Uganda" into [city, region]. */
function parseAddress(address) {
  const parts = clean(address)
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const city = parts[0] || null;
  const region = parts[1] || null;
  return [city, region];
}

/** Drop directory placeholders; keep real photo URLs. */
function cleanImage(url) {
  const u = clean(url);
  if (!u || u === "N/A") return null;
  if (/default/i.test(u) || /placeholder/i.test(u)) return null;
  return u;
}

function cleanDescription(d) {
  const s = clean(d);
  if (!s || s === "N/A" || s === "NA") return null;
  return s;
}

function cleanPhone(p) {
  const s = clean(p).replace(/^call\s*:?\s*/i, "");
  return s || null;
}

// --- load + normalise -----------------------------------------------------

function loadFile(file) {
  const raw = readFileSync(path.join(DATA_DIR, file), "utf8");
  try {
    return JSON.parse(raw);
  } catch {
    console.error(`Failed to parse ${file} — expected a JSON array.`);
    process.exit(1);
  }
}

const rows = [];
let duplicates = 0;
const seen = new Set();

function push(entry) {
  const key = entry.slug || slugify(entry.name);
  if (seen.has(key)) {
    duplicates += 1;
    return;
  }
  seen.add(key);
  rows.push({ slug: key, ...entry });
}

for (const h of loadFile("hospitals.json")) {
  const [city, region] = parseAddress(h.address);
  const profileUrl = clean(h.profile_url);
  push({
    kind: "hospital",
    name: clean(h.name),
    address: clean(h.address) || null,
    city,
    region,
    description: cleanDescription(h.description),
    phone: cleanPhone(h.phone),
    specialties: null,
    image_url: cleanImage(h.photo),
    source_url: profileUrl ? `${DIRECTORY_BASE}${profileUrl.startsWith("/") ? profileUrl : `/${profileUrl}`}` : null,
  });
}

for (const p of loadFile("pharmacies.json")) {
  const [city, region] = parseAddress(p.address);
  push({
    kind: "pharmacy",
    name: clean(p.name),
    address: clean(p.address) || null,
    city,
    region,
    description: cleanDescription(p.description),
    phone: cleanPhone(p.phone),
    specialties: clean(p.specialties) || null,
    image_url: cleanImage(p.image_url),
    source_url: clean(p.link) || null,
  });
}

// search_text powers the ILIKE search: name + city + region + specialties + address.
for (const r of rows) {
  r.search_text = [r.name, r.city, r.region, r.specialties, r.address]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

const hospitals = rows.filter((r) => r.kind === "hospital").length;
const pharmacies = rows.filter((r) => r.kind === "pharmacy").length;
console.log(
  `Loaded ${rows.length} facilities (${hospitals} hospitals, ${pharmacies} pharmacies), ` +
    `${duplicates} duplicate(s) skipped by slug`,
);

// --- upsert ---------------------------------------------------------------
const COLS = [
  "slug", "kind", "name", "address", "city", "region", "description",
  "phone", "specialties", "image_url", "source_url", "search_text",
];
const CONFLICT = `on conflict (slug) do update set
  kind = excluded.kind, name = excluded.name, address = excluded.address,
  city = excluded.city, region = excluded.region, description = excluded.description,
  phone = excluded.phone, specialties = excluded.specialties,
  image_url = excluded.image_url, source_url = excluded.source_url,
  search_text = excluded.search_text, updated_at = now()`;

async function runBatch(client, rows) {
  const colList = COLS.join(",");
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const params = [];
    const valueRows = chunk.map((row) => {
      const start = params.length;
      COLS.forEach((c) => params.push(row[c]));
      return `(${COLS.map((_, c) => `$${start + c + 1}`).join(",")})`;
    });
    const sql = `insert into public.facilities (${colList}) values ${valueRows.join(",")} ${CONFLICT}`;
    await client.query(sql, params);
    if (i + BATCH >= rows.length || (i / BATCH + 1) % 10 === 0) {
      console.log(`  upserted ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
    }
  }
}

const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  console.log("Connected. Upserting facilities...");
  await runBatch(client, rows);
  const c = await client.query(
    `select kind, count(*)::int n from public.facilities group by kind order by kind`,
  );
  const r = await client.query(
    `select count(*)::int n from public.facility_ratings`,
  );
  console.log(
    "Done ✅ " +
      c.rows.map((row) => `${row.kind}=${row.n}`).join("  ") +
      `  facility_ratings=${r.rows[0].n} (preserved)`,
  );
} finally {
  await client.end();
}
