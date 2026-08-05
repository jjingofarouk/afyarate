#!/usr/bin/env node
/**
 * Apply supabase/schema.sql to the Supabase project.
 *
 * Requires SUPABASE_DB_URL in .env.local (a Direct/Session-pooler connection
 * string from the Supabase dashboard: Connect → Direct connection).
 *
 * Usage: node scripts/setup_supabase.mjs
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { Client } = require("pg");
import { loadEnv } from "./lib_env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA = path.join(__dirname, "..", "supabase", "schema.sql");

loadEnv(); // load .env.local (does not override existing env vars)

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("SUPABASE_DB_URL is not set in .env.local");
  process.exit(1);
}

const sql = readFileSync(SCHEMA, "utf8");

// Split into statements (schema.sql avoids functions/DO-blocks, so ';' is safe).
const statements = sql
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter(Boolean);

const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  console.log(`Connected. Applying ${statements.length} statements...`);
  for (const stmt of statements) {
    try {
      await client.query(stmt);
    } catch (err) {
      // Tolerate "already exists" style errors so re-runs are safe.
      const msg = String(err.message || "");
      if (/already exists|duplicate|multiple primary keys/i.test(msg)) {
        console.log(`  (skip) ${msg.slice(0, 90)}`);
        continue;
      }
      throw err;
    }
  }
  const check = await client.query(
    `select table_name from information_schema.tables
     where table_schema='public' and table_name in ('practitioners','licenses','ratings')
     order by table_name`,
  );
  console.log("Tables present:", check.rows.map((r) => r.table_name).join(", "));
  console.log("Schema applied successfully ✅");
} finally {
  await client.end();
}
