#!/usr/bin/env node
/**
 * Download and re-host the St. Joseph's Hospital Kitovu images in the
 * Supabase `post-images` bucket, then point the post JSON files at the
 * new URLs.
 *
 *   - Medical Lab Assistant -> image #1
 *   - Medical Officer       -> image #2 (replaces the old kitovuhospital.org photo)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { loadEnv } from "./lib_env.mjs";

const require = createRequire(import.meta.url);

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!supabaseUrl || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY not set in .env.local");
  process.exit(1);
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

const nonce = Date.now().toString(36);

const JOBS = [
  {
    file: "data/posts/medical-lab-assistant-st-josephs-hospital-kitovu.json",
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJMRYebd1jv8ha0O5tpEnhnVaxVVQkRK3xQ85fZmTPGg&s=10",
    filename: `medical-lab-assistant-st-josephs-hospital-kitovu-${nonce}`,
  },
  {
    file: "data/posts/medical-officer-st-josephs-hospital-kitovu.json",
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQg5NOlX_R7kIDqX5O3uLWVBE4x0Yuu0NQdoxJTsx8dCZyJDwe7PlnERDww&s=10",
    filename: `medical-officer-st-josephs-hospital-kitovu-2-${nonce}`,
  },
];

for (const job of JOBS) {
  const res = await fetch(job.src, { redirect: "follow", headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${job.filename}: download failed (${res.status})`);
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.startsWith("image/")) throw new Error(`${job.filename}: not an image (${ct})`);
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = ct.split(";")[0].trim();
  const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" }[mime] ?? "jpg";
  console.log(`${job.filename}: downloaded ${buf.length} bytes (${mime})`);

  const fname = `${job.filename}.${ext}`;
  const up = await fetch(`${supabaseUrl}/storage/v1/object/post-images/${fname}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": mime },
    body: buf,
  });
  if (!up.ok) {
    const body = await up.text().catch(() => "");
    throw new Error(`${job.filename}: upload failed: ${up.status}: ${body.slice(0, 200)}`);
  }
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/post-images/${fname}`;
  console.log(`${job.filename}: uploaded -> ${publicUrl}`);

  const rec = JSON.parse(readFileSync(job.file, "utf8"));
  rec.image_url = publicUrl;
  writeFileSync(job.file, JSON.stringify(rec, null, 2) + "\n");
  console.log(`${job.file}: image_url updated.`);
}

// Remove the old, now-unused Medical Officer photo from storage.
const oldUrl = `${supabaseUrl}/storage/v1/object/post-images/medical-officer-st-josephs-hospital-kitovu.jpg`;
await fetch(oldUrl, {
  method: "DELETE",
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
console.log("Old Medical Officer image removed from storage (best-effort).");