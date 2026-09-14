#!/usr/bin/env node
import { createRequire } from "node:module";
import { loadEnv } from "./lib_env.mjs";
const require = createRequire(import.meta.url);
const { Client } = require("pg");
loadEnv();

const c = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const r = await c.query(`
  select s.id as missing_id
  from generate_series(1, (select max(id) from public.newsletter_subscribers)) s(id)
  left join public.newsletter_subscribers n on n.id = s.id
  where n.id is null
  order by s.id;
`);
console.log("missing ids:", r.rows.map(x => x.missing_id).join(", "));
const c2 = await c.query(`select min(id) min_id, max(id) max_id, count(*) total from public.newsletter_subscribers`);
console.log("current range:", c2.rows[0]);
await c.end();