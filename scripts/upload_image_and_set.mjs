#!/usr/bin/env node
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const { Client } = require("pg");
import { loadEnv } from "./lib_env.mjs";

loadEnv();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const dbUrl = process.env.SUPABASE_DB_URL;

const file = process.argv[2];
const targetSlug = process.argv[3];
if (!file || !targetSlug) { console.error("usage: node upload_image_and_set.mjs <local-file> <slug>"); process.exit(1); }

const buf = readFileSync(file);
const ext = file.endsWith(".png") ? "png" : "jpg";
const mime = ext === "png" ? "image/png" : "image/jpeg";
const filename = `${targetSlug}-${Date.now()}.${ext}`;

const upRes = await fetch(`${url}/storage/v1/object/post-images/${filename}`, {
  method: "POST",
  headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": mime },
  body: buf,
});
if (!upRes.ok) { console.error("upload failed", upRes.status, await upRes.text()); process.exit(1); }
const publicUrl = `${url}/storage/v1/object/public/post-images/${filename}`;
console.log("uploaded:", publicUrl);

const c = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
await c.connect();
await c.query(`update public.posts set image_url = $1, updated_at = now() where slug = $2`, [publicUrl, targetSlug]);
await c.end();
console.log("updated post image_url");