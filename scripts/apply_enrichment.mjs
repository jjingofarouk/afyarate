#!/usr/bin/env node
/**
 * Applies deep-enrichment output (richer description/eligibility/benefits/
 * required_documents/key_dates, plus a unique verified photo for posts that
 * were sharing one) to the posts added on 2026-08-20. Reads the JSON files
 * written by four research agents, one per category.
 *
 * For each entry:
 *   1. Updates the text fields.
 *   2. If image_source_url is set, downloads it, re-hosts it in the
 *      `post-images` Supabase bucket (one upload per post, no sharing), and
 *      updates image_url.
 *
 * Usage: node scripts/apply_enrichment.mjs
 */
import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { loadEnv } from "./lib_env.mjs";

const require = createRequire(import.meta.url);
const { Client } = require("pg");

loadEnv();
const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const dbUrl = process.env.SUPABASE_DB_URL;
if (!supaUrl || !key || !dbUrl) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / PUBLISHABLE_KEY / SUPABASE_DB_URL");
  process.exit(1);
}

const SCRATCH = "/private/tmp/claude-501/-Users-mac-Code-rate/2ed92140-e808-48f2-a8b4-c929a4bb3256/scratchpad";
const FILES = [
  "enriched_scholarships.json",
  "enriched_grants.json",
  "enriched_conferences.json",
  "enriched_internships.json",
];

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

async function fetchWithTimeout(input, opts = {}, timeoutMs = 25000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(input, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function downloadImage(src) {
  const res = await fetchWithTimeout(src, { headers: { "User-Agent": UA } }, 30000);
  if (!res.ok) throw new Error(`download failed (${res.status})`);
  const ct = (res.headers.get("content-type") || "").split(";")[0].trim();
  if (!ct.startsWith("image/")) throw new Error(`not an image (${ct})`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length) throw new Error("empty download");
  return { buf, mime: ct };
}

async function uploadToBucket(filename, buf, mime) {
  const res = await fetchWithTimeout(
    `${supaUrl}/storage/v1/object/post-images/${filename}`,
    { method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": mime }, body: buf },
    30000,
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`upload ${res.status}: ${body.slice(0, 200)}`);
  }
  return `${supaUrl}/storage/v1/object/public/post-images/${filename}`;
}

let entries = [];
for (const f of FILES) {
  const path = `${SCRATCH}/${f}`;
  if (!existsSync(path)) {
    console.error(`Missing ${path}, aborting.`);
    process.exit(1);
  }
  const data = JSON.parse(readFileSync(path, "utf8"));
  console.log(`${f}: ${data.length} entries`);
  entries = entries.concat(data);
}
console.log(`Total entries to apply: ${entries.length}`);

const nonce = Date.now().toString(36);
const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
await client.connect();

let textUpdated = 0;
let imageUpdated = 0;
let imageFailed = 0;

for (const e of entries) {
  await client.query(
    `update public.posts
     set description = $1, eligibility = $2, benefits = $3, required_documents = $4,
         key_dates = $5, updated_at = now()
     where id = $6`,
    [e.description, e.eligibility || null, e.benefits || null, e.required_documents || null, e.key_dates || null, e.id],
  );
  textUpdated++;

  if (e.image_source_url) {
    try {
      const { buf, mime } = await downloadImage(e.image_source_url);
      const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[mime] ?? "jpg";
      const filename = `enriched-${e.id}-${nonce}.${ext}`;
      const publicUrl = await uploadToBucket(filename, buf, mime);
      await client.query(`update public.posts set image_url = $1, updated_at = now() where id = $2`, [publicUrl, e.id]);
      imageUpdated++;
      console.log(`  ✓ #${e.id} image -> ${filename}`);
    } catch (err) {
      imageFailed++;
      console.log(`  ✗ #${e.id} image failed: ${err.message} (source: ${e.image_source_url})`);
    }
  }
}

await client.end();
console.log(`\nDone → text updated: ${textUpdated}, images updated: ${imageUpdated}, image failures: ${imageFailed}`);
