#!/usr/bin/env node
/**
 * Bulk-load the scraped registry (data/health_workers.jsonl) into Supabase.
 *
 * - Collapses per-licence rows into one practitioner per (name + council),
 *   upserts them into `practitioners`, and upserts the full licence history
 *   into `licenses`. Upserts are idempotent, safe to re-run after a fresh
 *   scrape.
 * - Never touches `ratings`, community ratings survive registry refreshes.
 *
 * Requires SUPABASE_DB_URL in .env.local (Direct or Session-pooler connection).
 *
 * Usage: node scripts/import_supabase.mjs
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { Client } = require("pg");
import { loadEnv } from "./lib_env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JSONL = path.join(__dirname, "..", "data", "health_workers.jsonl");
const BATCH = 500;

loadEnv();
const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("SUPABASE_DB_URL is not set in .env.local");
  process.exit(1);
}

// --- profession classification --------------------------------------------
// Derives a coarse cadre/profession from council + qualifications. Kept here
// (not in SQL) so the logic is easy to read and tune; the result is stored on
// each practitioner row for fast, indexable filtering.
const PROFESSION_RULES = [
  // Qualification-based, most specific first (council fallbacks below).
  [/\bMBCHB\b|\bMBBS\b|\bMD\b|DOCTOR OF MEDICINE|BACHELOR OF MEDICINE|MEDICINE AND BACHELOR|SURGERY \(/, "Doctor"],
  [/DENT|BDS\b/, "Dentist"],
  [/PHARMACY|PHARMACEUTICAL|PHARMACIST|DISPENS/, "Pharmacist"],
  [/CLINICAL MEDICINE/, "Clinical Officer"],
  [/LABORATOR/, "Laboratory"],
  [/ENVIRONMENTAL HEALTH/, "Environmental Health"],
  [/RADIOGRAPH|MEDICAL IMAGING|IMAGING/, "Radiography / Imaging"],
  [/THEATRE|THEATER|ANAESTHESIA|ANESTHESIA/, "Theatre / Anaesthesia"],
  [/PHYSIOTHERAP|PHYSICAL THERAPY|OCCUPATIONAL THERAPY|ORTHOPEDIC|ORTHOPAEDIC/, "Physiotherapy / Occupational"],
  [/OPHTHALM|OPTOMETR|EYE/, "Ophthalmology / Optometry"],
  [/NUTRITION|DIETETIC/, "Nutrition / Dietetics"],
  [/PUBLIC HEALTH/, "Public Health"],
  [/PSYCHIATR|MENTAL HEALTH/, "Mental Health"],
  [/MIDWIF|NURSING|NURSE\b|BSN\b/, "Nurse / Midwife"],
  [/ENT\b|EAR, NOSE/, "Other Allied Health"],
];

function classifyProfession(council, qualifications) {
  const q = (qualifications || "").toUpperCase();
  const c = (council || "").toUpperCase();
  if (c.includes("NURSES")) return "Nurse / Midwife";
  if (c.includes("MEDICAL") && c.includes("DENTAL")) {
    return /DENT|BDS\b/.test(q) ? "Dentist" : "Doctor";
  }
  for (const [re, prof] of PROFESSION_RULES) {
    if (re.test(q)) return prof;
  }
  return c.includes("ALLIED") ? "Other Allied Health" : null;
}

// --- load + group ---------------------------------------------------------
const records = readFileSync(JSONL, "utf8")
  .split("\n")
  .filter(Boolean)
  .map((l) => {
    try {
      return JSON.parse(l);
    } catch {
      return null;
    }
  })
  .filter(Boolean);
console.log(`Loaded ${records.length} licence records from JSONL`);

const groups = new Map();
let unnamed = 0;
for (const r of records) {
  const name = (r.name || "").trim();
  if (!name) {
    unnamed += 1;
    continue;
  }
  const key = `${name.toLowerCase()}||${(r.council || "").trim().toLowerCase()}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(r);
}

const practitioners = [];
const licenses = [];
const seenPrac = new Set();
const seenLic = new Set();
for (const recs of groups.values()) {
  const sorted = [...recs].sort((a, b) => {
    const aActive = a.licence_status === "Active" ? 1 : 0;
    const bActive = b.licence_status === "Active" ? 1 : 0;
    if (aActive !== bActive) return bActive - aActive;
    return (b.license_expiry_date || "").localeCompare(a.license_expiry_date || "");
  });
  const main = sorted[0];
  if (!seenPrac.has(main.id)) {
    seenPrac.add(main.id);
    const quals = [...new Set(recs.map((r) => (r.qualifications || "").trim()).filter(Boolean))]
      .join(" | ");
    practitioners.push([
      main.id,
      main.name,
      main.council,
      main.registration_status,
      main.registration_no,
      main.registration_date,
      main.license_number,
      main.license_expiry_date,
      main.licence_status,
      quals || null,
      main.image_url || null,
      recs.length,
      main.name.toLowerCase(),
      classifyProfession(main.council, quals),
    ]);
  }
  for (const r of recs) {
    if (seenLic.has(r.id)) continue; // JSONL may contain re-fetched duplicates
    seenLic.add(r.id);
    licenses.push([
      r.id,
      main.id,
      r.name,
      r.council,
      r.registration_no,
      r.registration_date,
      r.license_number,
      r.license_expiry_date,
      r.licence_status,
      r.qualifications,
      r.image_url,
    ]);
  }
}
console.log(
  `Grouped into ${practitioners.length} practitioners / ${licenses.length} licences` +
    ` (${unnamed} unnamed skipped)`,
);

// --- upsert helpers -------------------------------------------------------
const PRACT_COLS = [
  "id", "name", "council", "registration_status", "registration_no",
  "registration_date", "license_number", "license_expiry_date", "licence_status",
  "qualifications", "image_url", "record_count", "search_name", "profession",
];
const PRACT_CONFLICT = `on conflict (id) do update set
  name = excluded.name, council = excluded.council,
  registration_status = excluded.registration_status,
  registration_no = excluded.registration_no,
  registration_date = excluded.registration_date,
  license_number = excluded.license_number,
  license_expiry_date = excluded.license_expiry_date,
  licence_status = excluded.licence_status,
  qualifications = excluded.qualifications,
  image_url = excluded.image_url,
  record_count = excluded.record_count,
  search_name = excluded.search_name,
  profession = excluded.profession,
  updated_at = now()`;

const LIC_COLS = [
  "id", "practitioner_id", "name", "council", "registration_no",
  "registration_date", "license_number", "license_expiry_date", "licence_status",
  "qualifications", "image_url",
];
const LIC_CONFLICT = `on conflict (id) do update set
  practitioner_id = excluded.practitioner_id,
  name = excluded.name, council = excluded.council,
  registration_no = excluded.registration_no,
  registration_date = excluded.registration_date,
  license_number = excluded.license_number,
  license_expiry_date = excluded.license_expiry_date,
  licence_status = excluded.licence_status,
  qualifications = excluded.qualifications,
  image_url = excluded.image_url`;

async function runBatch(client, table, cols, rows, conflictSql, label) {
  const colList = cols.join(",");
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const params = [];
    const valueRows = chunk.map((row) => {
      const start = params.length;
      row.forEach((v) => params.push(v));
      return `(${row.map((_, c) => `$${start + c + 1}`).join(",")})`;
    });
    const sql = `insert into public.${table} (${colList}) values ${valueRows.join(",")} ${conflictSql}`;
    await client.query(sql, params);
    if (((i / BATCH + 1) | 0) % 10 === 0 || i + BATCH >= rows.length) {
      console.log(`  ${label}: ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
    }
  }
}

// --- run ------------------------------------------------------------------
const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  console.log("Connected. Upserting practitioners...");
  await runBatch(client, "practitioners", PRACT_COLS, practitioners, PRACT_CONFLICT, "practitioners");
  console.log("Upserting licences...");
  await runBatch(client, "licenses", LIC_COLS, licenses, LIC_CONFLICT, "licences");

  const c = await client.query("select count(*)::int n from public.practitioners");
  const l = await client.query("select count(*)::int n from public.licenses");
  const r = await client.query("select count(*)::int n from public.ratings");
  console.log(
    `Done ✅  practitioners=${c.rows[0].n}  licences=${l.rows[0].n}  ratings=${r.rows[0].n} (preserved)`,
  );
} finally {
  await client.end();
}
