#!/usr/bin/env node
/**
 * One-off: re-host the Go Overseas hero image for the CFHI Virtual Global &
 * Public Health Internship - Uganda post in Supabase `post-images` and set it
 * as the post's image_url.
 */
import { createRequire } from "node:module";
import { loadEnv } from "./lib_env.mjs";

const require = createRequire(import.meta.url);
const { Client } = require("pg");

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set in .env.local");
  process.exit(1);
}

const SLUG = "virtual-global-public-health-internship-uganda";
const IMAGE_SRC =
  "https://www.gooverseas.com/sites/default/files/styles/medium/public/image-collections/2020-06-23/brooke-cagle-n1m25jvupeu-unsplash.jpg?itok=v0CEmmVm";
const IMAGE_NAME = "virtual-global-public-health-internship-uganda.jpg";

// --- 1. Download + re-host the image --------------------------------------
const imgRes = await fetch(IMAGE_SRC, {
  headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
});
if (!imgRes.ok) throw new Error(`image download failed: ${imgRes.status}`);
const buf = Buffer.from(await imgRes.arrayBuffer());
console.log(`Downloaded image (${(buf.length / 1024).toFixed(0)} KB)`);

const up = await fetch(`${supabaseUrl}/storage/v1/object/post-images/${IMAGE_NAME}`, {
  method: "POST",
  headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "image/jpeg", "x-upsert": "true" },
  body: buf,
});
if (!up.ok) throw new Error(`upload failed: ${up.status}: ${(await up.text()).slice(0, 200)}`);
const publicUrl = `${supabaseUrl}/storage/v1/object/public/post-images/${IMAGE_NAME}`;
console.log(`Uploaded -> ${publicUrl}`);

// --- 2. Update the post ----------------------------------------------------
const client = new Client({ connectionString: process.env.SUPABASE_DB_URL });
await client.connect();
const res = await client.query(
  `update public.posts set
     image_url = $2,
     updated_at = now()
   where slug = $1 returning id`,
  [SLUG, publicUrl]
);
console.log(`Updated ${res.rowCount} post(s)`);
await client.end();
