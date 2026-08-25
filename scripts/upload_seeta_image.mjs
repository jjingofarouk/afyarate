#!/usr/bin/env node
/**
 * Upload the Seeta University image (from ~/Downloads/seeta.jpeg) to the
 * Supabase `post-images` bucket and point both Seeta post JSON files at the
 * new URL.
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

const SRC = process.env.HOME + "/Downloads/seeta.jpeg";
const buf = readFileSync(SRC);
const mime = "image/jpeg";
console.log(`Read ${buf.length} bytes (${mime}) from ${SRC}`);

const filename = "seeta-university-anatomy-positions.jpg";
const up = await fetch(`${supabaseUrl}/storage/v1/object/post-images/${filename}`, {
  method: "POST",
  headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": mime },
  body: buf,
});
if (!up.ok) {
  const body = await up.text().catch(() => "");
  throw new Error(`upload failed: ${up.status}: ${body.slice(0, 200)}`);
}
const publicUrl = `${supabaseUrl}/storage/v1/object/public/post-images/${filename}`;
console.log(`Uploaded -> ${publicUrl}`);

for (const file of [
  "data/posts/lecturer-anatomy-seeta-university.json",
  "data/posts/lab-technician-anatomy-seeta-university.json",
]) {
  const rec = JSON.parse(readFileSync(file, "utf8"));
  rec.image_url = publicUrl;
  writeFileSync(file, JSON.stringify(rec, null, 2) + "\n");
  console.log(`${file}: image_url updated.`);
}