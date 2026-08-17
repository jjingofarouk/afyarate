#!/usr/bin/env node
/**
 * Curate one listing at a time:
 *   1. Read a single JSON record from disk.
 *   2. If `image_source_url` is present, download the image and re-host it in
 *      the public Supabase `post-images` bucket.
 *   3. Upsert the listing into `public.posts`.
 *
 * The input file should be a JSON object with fields matching the `posts`
 * table, plus optional `image_source_url` for the remote image to upload.
 *
 * Usage:
 *   node scripts/curate_listing.mjs data/posts/example.json
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "./lib_env.mjs";

const require = createRequire(import.meta.url);
const { Client } = require("pg");

loadEnv();

const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/curate_listing.mjs <listing.json>");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const dbUrl = process.env.SUPABASE_DB_URL;
if (!supabaseUrl || !key || !dbUrl) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / SUPABASE_DB_URL");
  process.exit(1);
}

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function slugify(title) {
  return String(title || "listing")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function searchText(row) {
  return [
    row.title,
    row.organization,
    row.category,
    row.profession,
    row.location,
    row.eligibility,
    row.summary,
    row.description,
    row.benefits,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function uniqueName(slug, ext) {
  const stamp = Date.now().toString(36);
  return `${slug}-${stamp}.${ext}`;
}

async function fetchWithTimeout(url, opts = {}, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function uploadImage(sourceUrl, slug) {
  const res = await fetchWithTimeout(sourceUrl, { headers: { "User-Agent": UA }, redirect: "follow" }, 30000);
  if (!res.ok) throw new Error(`Image download failed (${res.status}) for ${sourceUrl}`);
  const mime = (res.headers.get("content-type") || "").split(";")[0].trim();
  if (!mime.startsWith("image/")) throw new Error(`Source is not an image: ${mime || "unknown"}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length) throw new Error("Downloaded image was empty");
  if (buf.length > MAX_IMAGE_BYTES) throw new Error(`Image too large: ${buf.length} bytes`);

  const ext = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
  }[mime] || "jpg";

  const filename = uniqueName(slug, ext);
  const up = await fetchWithTimeout(`${supabaseUrl}/storage/v1/object/post-images/${filename}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": mime,
    },
    body: buf,
  }, 30000);

  if (!up.ok) {
    const body = await up.text().catch(() => "");
    throw new Error(`Image upload failed (${up.status}): ${body.slice(0, 200)}`);
  }

  return `${supabaseUrl}/storage/v1/object/public/post-images/${filename}`;
}

const inputPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", input);
const raw = JSON.parse(readFileSync(inputPath, "utf8"));
if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
  console.error("Expected a single JSON object.");
  process.exit(1);
}

const row = { ...raw };
if (!row.slug) row.slug = slugify(row.title);
if (!row.search_text) row.search_text = searchText(row);
if (row.status === "published" && !row.published_at) row.published_at = new Date().toISOString();
if (row.deadline) row.deadline = String(row.deadline).slice(0, 10);

if (!row.image_url && row.image_source_url) {
  console.log(`Uploading image for ${row.slug} from ${row.image_source_url}`);
  row.image_url = await uploadImage(row.image_source_url, row.slug);
  console.log(`Image uploaded -> ${row.image_url}`);
}
delete row.image_source_url;

const cols = [
  "slug",
  "type",
  "title",
  "organization",
  "category",
  "profession",
  "location",
  "country",
  "employment_type",
  "experience_level",
  "qualification",
  "eligibility",
  "salary",
  "description",
  "summary",
  "how_to_apply",
  "application_url",
  "application_email",
  "deadline",
  "source_name",
  "source_url",
  "tags",
  "benefits",
  "required_documents",
  "key_dates",
  "featured",
  "status",
  "published_at",
  "views",
  "search_text",
  "image_url",
].filter((c) => row[c] !== undefined && row[c] !== null && row[c] !== "");

if (!cols.includes("description") || !cols.includes("title") || !cols.includes("organization")) {
  console.error("Missing required fields: title, organization, description");
  process.exit(1);
}

const params = cols.map((c) => (Array.isArray(row[c]) ? row[c] : row[c]));
const placeholders = cols.map((_, i) => `$${i + 1}`).join(",");
const conflict = cols
  .filter((c) => c !== "slug")
  .map((c) => `${c} = excluded.${c}`)
  .concat("updated_at = now()")
  .join(", ");

const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  console.log(`Upserting ${row.slug}...`);
  await client.query(
    `insert into public.posts (${cols.join(",")}) values (${placeholders})
     on conflict (slug) do update set ${conflict}`,
    params,
  );
  console.log(`Done ✅ ${row.title}`);
} finally {
  await client.end();
}
