#!/usr/bin/env node
/**
 * Re-host the Grace Family Health Centre logo under clean, post-specific
 * filenames and point each post at its own image URL.
 */
import { createRequire } from "node:module";
import { loadEnv } from "./lib_env.mjs";
import { readFileSync, writeFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const { Client } = require("pg");

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const dbUrl = process.env.SUPABASE_DB_URL;

const SRC =
  "https://cdn.greatugandajobs.com/jsjobsdata/data/employer/comp_12991/logo/WhatsApp%20Image%202026-08-15%20at%2009.31.19.jpeg";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

async function downloadImage(imgUrl) {
  const res = await fetch(imgUrl, {
    redirect: "follow",
    headers: { "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`download ${res.status}`);
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.startsWith("image/")) throw new Error(`not an image: ${ct}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" }[ct.split(";")[0].trim()] ?? "jpg";
  return { buf, mime: ct.split(";")[0].trim(), ext };
}

async function uploadToBucket(filename, buf, mime) {
  const res = await fetch(`${supabaseUrl}/storage/v1/object/post-images/${filename}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": mime },
    body: buf,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`upload ${res.status}: ${body.slice(0, 200)}`);
  }
  return `${supabaseUrl}/storage/v1/object/public/post-images/${filename}`;
}

const img = await downloadImage(SRC);

const targets = [
  {
    slug: "medical-records-personnel-grace-family-health-centre-2026-09-30",
    filename: `medical-records-personnel-grace-family-health-centre.${img.ext}`,
  },
  {
    slug: "enrolled-midwife-2-positions-grace-family-health-centre-2026-09-30",
    filename: `enrolled-midwife-grace-family-health-centre.${img.ext}`,
  },
];

const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
await client.connect();

for (const t of targets) {
  const publicUrl = await uploadToBucket(t.filename, img.buf, img.mime);
  const { rowCount } = await client.query(
    `update public.posts set image_url = $1, updated_at = now() where slug = $2`,
    [publicUrl, t.slug],
  );
  console.log(`${t.slug}\n  -> ${publicUrl} (rows: ${rowCount})`);
}

await client.end();

// keep the JSONL files in sync
const localFiles = [
  "/Users/mac/Code/rate/data/posts/medical-records-grace-family.jsonl",
  "/Users/mac/Code/rate/data/posts/enrolled-midwife-grace-family.jsonl",
];
for (const f of localFiles) {
  const r = JSON.parse(readFileSync(f, "utf8").trim());
  const t = targets.find((t) => r.slug === t.slug);
  if (t) {
    r.image_url = `${supabaseUrl}/storage/v1/object/public/post-images/${t.filename}`;
    writeFileSync(f, JSON.stringify(r) + "\n");
    console.log("JSONL updated:", f.split("/").pop());
  }
}