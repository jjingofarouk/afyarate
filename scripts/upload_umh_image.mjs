#!/usr/bin/env node
/**
 * One-off: re-host the Uganda Martyrs' Hospital (Diocese of Jinja) image in the
 * Supabase `post-images` bucket and set image_url on its job listings.
 */
import { readFileSync } from "node:fs";
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

const buf = readFileSync("/var/folders/7d/lsp5f20n7vj9_nj5bt8hkjrm0000gn/T/opencode/umh.jpg");
const filename = "uganda-martyrs-hospital-jinja.jpg";
const up = await fetch(`${supabaseUrl}/storage/v1/object/post-images/${filename}`, {
  method: "POST",
  headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "image/jpeg", "x-upsert": "true" },
  body: buf,
});
if (!up.ok) {
  const body = await up.text().catch(() => "");
  throw new Error(`upload failed: ${up.status}: ${body.slice(0, 200)}`);
}
const publicUrl = `${supabaseUrl}/storage/v1/object/public/post-images/${filename}`;
console.log(`Uploaded -> ${publicUrl}`);

const client = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
const res = await client.query(
  `update public.posts set image_url = $1 where organization = 'Uganda Martyrs'' Hospital - Diocese of Jinja'`,
  [publicUrl]
);
console.log(`image_url set on ${res.rowCount} post(s)`);
await client.end();
