#!/usr/bin/env node
/**
 * Sets image_url on every post to a category illustration based on its
 * `type` (public/opportunities/{type}.svg, generated, on-brand, no
 * fabricated/scraped photos of specific organizations).
 *
 * Requires SUPABASE_DB_URL in .env.local.
 * Usage: node scripts/set_opportunity_images.mjs
 */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { Client } = require("pg");
import { loadEnv } from "./lib_env.mjs";

loadEnv();
const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("SUPABASE_DB_URL is not set in .env.local");
  process.exit(1);
}

const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  const types = ["job", "internship", "scholarship", "grant", "fellowship", "conference", "opportunity", "other"];
  for (const t of types) {
    const r = await client.query(
      "update public.posts set image_url = $1 where type = $2 and (image_url is null or image_url = '')",
      [`/opportunities/${t}.svg`, t],
    );
    console.log(`${t}: updated ${r.rowCount} rows`);
  }
  const check = await client.query("select type, image_url, count(*)::int n from public.posts group by type, image_url order by type");
  console.log(check.rows);
} finally {
  await client.end();
}
