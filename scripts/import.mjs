#!/usr/bin/env node
/**
 * Import scraped health worker records into the SQLite database.
 *
 * Reads:  data/health_workers.jsonl   (one JSON object per license record)
 * Writes: data/app.db
 *
 * The source portal stores one row per *licence* — a single person often has
 * several rows (annual renewals). This importer collapses them into one
 * practitioner per (name + council) group:
 *   - the "main" row is the one with an Active licence (ties broken by newest
 *     expiry date), so the profile always shows the currently valid licence
 *   - all rows are preserved in the `licenses` table as the licence history
 *   - qualifications across all rows are merged
 *
 * Usage: npm run import
 */
import { DatabaseSync } from "node:sqlite";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const JSONL = path.join(DATA_DIR, "health_workers.jsonl");
const DB = path.join(DATA_DIR, "app.db");

if (!existsSync(JSONL)) {
  console.error(`Missing ${JSONL} — run the scraper first (npm run scrape).`);
  process.exit(1);
}

const lines = readFileSync(JSONL, "utf8").split("\n").filter(Boolean);
const records = lines.map((l) => {
  try {
    return JSON.parse(l);
  } catch {
    return null;
  }
}).filter(Boolean);
console.log(`Loaded ${records.length} licence records from JSONL`);

const db = new DatabaseSync(DB);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

// Drop and rebuild so re-imports are idempotent.
db.exec(`
  DROP TABLE IF EXISTS ratings;
  DROP TABLE IF EXISTS licenses;
  DROP TABLE IF EXISTS practitioners;
`);
db.exec(`
  CREATE TABLE practitioners (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    council TEXT,
    registration_status TEXT,
    registration_no TEXT,
    registration_date TEXT,
    license_number TEXT,
    license_expiry_date TEXT,
    licence_status TEXT,
    qualifications TEXT,
    image_url TEXT,
    record_count INTEGER NOT NULL DEFAULT 1,
    search_name TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE licenses (
    id INTEGER PRIMARY KEY,
    practitioner_id INTEGER REFERENCES practitioners(id) ON DELETE CASCADE,
    name TEXT,
    council TEXT,
    registration_no TEXT,
    registration_date TEXT,
    license_number TEXT,
    license_expiry_date TEXT,
    licence_status TEXT,
    qualifications TEXT,
    image_url TEXT
  );
  CREATE TABLE ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    practitioner_id INTEGER NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    reviewer_name TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    verified INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX idx_practitioners_search ON practitioners(search_name);
  CREATE INDEX idx_practitioners_council ON practitioners(council);
  CREATE INDEX idx_practitioners_status ON practitioners(licence_status);
  CREATE INDEX idx_licenses_prac ON licenses(practitioner_id);
  CREATE INDEX idx_ratings_prac ON ratings(practitioner_id);
  CREATE INDEX idx_ratings_created ON ratings(created_at);
`);

// Group by (name, council).
const groups = new Map();
let unnamed = 0;
for (const r of records) {
  const name = (r.name || "").trim();
  if (!name) {
    unnamed += 1;
    continue;
  }
  const key = `${name.toLowerCase()}||${(r.council || "").trim().toLowerCase()}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(r);
}

const insertPract = db.prepare(`
  INSERT INTO practitioners
    (id, name, council, registration_status, registration_no, registration_date,
     license_number, license_expiry_date, licence_status, qualifications,
     image_url, record_count, search_name)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertLic = db.prepare(`
  INSERT INTO licenses
    (id, practitioner_id, name, council, registration_no, registration_date,
     license_number, license_expiry_date, licence_status, qualifications, image_url)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let practitionerCount = 0;
let activeCount = 0;
let withPhoto = 0;

for (const recs of groups.values()) {
  // Prefer an Active licence; tie-break by newest expiry date.
  const sorted = [...recs].sort((a, b) => {
    const aActive = a.licence_status === "Active" ? 1 : 0;
    const bActive = b.licence_status === "Active" ? 1 : 0;
    if (aActive !== bActive) return bActive - aActive;
    return (b.license_expiry_date || "").localeCompare(a.license_expiry_date || "");
  });
  const main = sorted[0];
  const quals = [...new Set(recs.map((r) => (r.qualifications || "").trim()).filter(Boolean))]
    .join(" | ");
  const pid = main.id;

  insertPract.run(
    pid,
    main.name,
    main.council,
    main.registration_status,
    main.registration_no,
    main.registration_date,
    main.license_number,
    main.license_expiry_date,
    main.licence_status,
    quals || null,
    main.image_url || null,
    recs.length,
    main.name.toLowerCase(),
  );

  for (const r of recs) {
    insertLic.run(
      r.id,
      pid,
      r.name,
      r.council,
      r.registration_no,
      r.registration_date,
      r.license_number,
      r.license_expiry_date,
      r.licence_status,
      r.qualifications,
      r.image_url,
    );
  }

  practitionerCount += 1;
  if (main.licence_status === "Active") activeCount += 1;
  if (main.image_url) withPhoto += 1;
}

console.log(
  `Imported ${practitionerCount} practitioners from ${records.length} licence records` +
    ` (${unnamed} unnamed skipped).`,
);
console.log(
  `  ${activeCount} currently have an Active licence | ${withPhoto} have a photo`,
);

// Derived helper view for search results: include avg rating + count.
db.exec(`
  CREATE VIEW IF NOT EXISTS practitioner_stats AS
  SELECT p.*,
    (SELECT ROUND(AVG(r.rating), 2) FROM ratings r WHERE r.practitioner_id = p.id) AS avg_rating,
    (SELECT COUNT(*) FROM ratings r WHERE r.practitioner_id = p.id) AS rating_count
  FROM practitioners p;
`);
