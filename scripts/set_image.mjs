#!/usr/bin/env node
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { Client } = require("pg");
import { loadEnv } from "./lib_env.mjs";

loadEnv();
const slug = process.argv[2];
const imageUrl = process.argv[3];
if (!slug || !imageUrl) { console.error("usage: node set_image.mjs <slug> <image_url>"); process.exit(1); }

const c = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const res = await c.query(`update public.posts set image_url = $1, updated_at = now() where slug = $2`, [imageUrl, slug]);
await c.end();
console.log(`updated ${res.rowCount} row(s) for slug=${slug}`);