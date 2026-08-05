#!/usr/bin/env node
/**
 * Upsert curated listings (jobs, opportunities, grants, scholarships…) into
 * Supabase's `posts` table. Reads newline-delimited JSON (JSONL), one record
 * per line — same shape as the app's Post type (snake_case or camelCase keys).
 *
 * Idempotent: upserts on `slug`, so re-running the same file updates rather
 * than duplicates. Auto-computes `slug` and `search_text` when missing.
 *
 * Usage:
 *   node scripts/upload_posts.mjs data/posts.jsonl
 *   cat file.json | node scripts/upload_posts.mjs -
 *
 * Requires SUPABASE_DB_URL in .env.local (Direct or Session-pooler connection).
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { loadEnv } from "./lib_env.mjs";

const require = createRequire(import.meta.url);
const { Client } = require("pg");

loadEnv();

const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/upload_posts.mjs <posts.jsonl | ->");
  process.exit(1);
}
if (!process.env.SUPABASE_DB_URL) {
  console.error("SUPABASE_DB_URL is not set in .env.local");
  process.exit(1);
}

const raw = input === "-" ? readFileSync(0, "utf8") : readFileSync(input, "utf8");
const records = raw
  .split("\n")
  .filter(Boolean)
  .map((l) => {
    try {
      return JSON.parse(l);
    } catch (e) {
      console.warn(`  (skip) unparseable line: ${l.slice(0, 80)}`);
      return null;
    }
  })
  .filter(Boolean);

if (records.length === 0) {
  console.error("No records found.");
  process.exit(1);
}
console.log(`Loaded ${records.length} listing(s)`);

// Accept snake_case or camelCase keys; map both to DB column names.
const KEY_MAP = {
  type: "type", title: "title", organization: "organization", org: "organization",
  category: "category", profession: "profession", location: "location",
  country: "country", employmentType: "employment_type", employment_type: "employment_type",
  experienceLevel: "experience_level", experience_level: "experience_level",
  qualification: "qualification", qualifications: "qualification",
  eligibility: "eligibility", salary: "salary", description: "description",
  summary: "summary", howToApply: "how_to_apply", how_to_apply: "how_to_apply",
  applicationUrl: "application_url", application_url: "application_url",
  applicationEmail: "application_email", application_email: "application_email",
  deadline: "deadline", sourceName: "source_name", source_name: "source_name",
  sourceUrl: "source_url", source_url: "source_url", tags: "tags",
  featured: "featured", status: "status", publishedAt: "published_at",
  published_at: "published_at", views: "views", slug: "slug",
};

function toColumn(rec) {
  const out = {};
  for (const [k, v] of Object.entries(rec)) {
    if (v === undefined || v === null || v === "") continue;
    const col = KEY_MAP[k] ?? k;
    if (Array.isArray(v)) out[col] = v.map(String);
    else if (v === true || v === false) out[col] = v;
    else out[col] = String(v);
  }
  return out;
}

// Deterministic slug from title (+ deadline if present to keep re-posts unique).
function makeSlug(rec) {
  const base = String(rec.title || "listing")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return rec.deadline ? `${base}-${rec.deadline}` : base;
}

function buildSearchText(rec) {
  return [
    rec.title, rec.organization, rec.category, rec.profession,
    rec.location, rec.summary, rec.description, rec.salary,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

const rows = records.map((r) => {
  const rec = toColumn(r);
  const slug = rec.slug || makeSlug(r);
  if (!rec.title) throw new Error(`Record missing title (slug=${slug})`);
  return {
    ...rec,
    slug,
    search_text: rec.search_text || buildSearchText(rec),
    status: rec.status || "draft",
  };
});

// Sanity: duplicate slugs would blow up the upsert — fail loudly instead.
const seen = new Set();
for (const row of rows) {
  if (seen.has(row.slug)) throw new Error(`Duplicate slug: ${row.slug}`);
  seen.add(row.slug);
}

// Only include columns that appear in at least one record, so absent columns
// fall back to their database defaults (e.g. featured=false, views=0).
const presentCols = new Set();
for (const row of rows) {
  for (const k of Object.keys(row)) {
    if (row[k] !== null && row[k] !== undefined) presentCols.add(k);
  }
}
const COLS = [
  "slug", "type", "title", "organization", "category", "profession", "location",
  "country", "employment_type", "experience_level", "qualification", "eligibility",
  "salary", "description", "summary", "how_to_apply", "application_url",
  "application_email", "deadline", "source_name", "source_url", "tags", "featured",
  "status", "published_at", "views", "search_text", "image_url",
].filter((c) => presentCols.has(c));

const conflictSets = COLS.filter((c) => c !== "slug").map((c) => `${c} = excluded.${c}`);
conflictSets.push("updated_at = now()");
const CONFLICT = `on conflict (slug) do update set\n  ${conflictSets.join(",\n  ")}`;
const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("Connected. Upserting listings...");
  const params = [];
  const valueRows = rows.map((row) => {
    const start = params.length;
    for (const col of COLS) {
      const v = row[col];
      // Pass JS arrays through so node-pg serialises them as Postgres array literals.
      params.push(Array.isArray(v) ? v : (v ?? null));
    }
    return `(${COLS.map((_, i) => `$${start + i + 1}`).join(",")})`;
  });
  const sql = `insert into public.posts (${COLS.join(",")}) values ${valueRows.join(",")} ${CONFLICT}`;
  const res = await client.query(sql, params);

  const byStatus = rows.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  console.log(`Done ✅ ${res.rowCount} upserted (${Object.entries(byStatus)
    .map(([s, n]) => `${s}: ${n}`)
    .join(", ")})`);
} finally {
  await client.end();
}
