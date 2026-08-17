#!/usr/bin/env node
/**
 * Download the IDI graduate trainee group photo and re-host it in the
 * Supabase `post-images` bucket, then point the JSONL listing at it.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { loadEnv } from "./lib_env.mjs";

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!supabaseUrl || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY not set in .env.local");
  process.exit(1);
}

const SRC =
  "https://news.mak.ac.ug/wp-content/uploads/2026/07/Makerere-IDI-Continental-Incident-Management-Support-Team-Launch-26thJun2026-Group.jpg";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

const res = await fetch(SRC, { redirect: "follow", headers: { "User-Agent": UA } });
if (!res.ok) throw new Error(`download failed: ${res.status}`);
const ct = res.headers.get("content-type") ?? "";
if (!ct.startsWith("image/")) throw new Error(`not an image: ${ct}`);
const buf = Buffer.from(await res.arrayBuffer());
const mime = ct.split(";")[0].trim();
const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" }[mime] ?? "jpg";
console.log(`Downloaded ${buf.length} bytes (${mime})`);

const filename = `graduate-trainee-health-security-infectious-diseases-institute.${ext}`;
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

const file = "data/posts/graduate-trainee-health-security-idi.jsonl";
const rec = JSON.parse(readFileSync(file, "utf8").trim());
rec.image_url = publicUrl;
writeFileSync(file, JSON.stringify(rec) + "\n");
console.log("JSONL image_url updated.");
