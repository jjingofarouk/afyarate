import { DatabaseSync } from "node:sqlite";
import path from "node:path";

// `node:sqlite` is built into Node.js 22.5+ (unflagged in Node 24+), so the app
// has zero native dependencies. The DB is created by scripts/import.mjs from
// the scraped JSONL.
export const DB_PATH = path.join(process.cwd(), "data", "app.db");

let _db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!_db) {
    _db = new DatabaseSync(DB_PATH);
    _db.exec("PRAGMA journal_mode = WAL;");
    _db.exec("PRAGMA foreign_keys = ON;");
    _db.exec("PRAGMA busy_timeout = 5000;");
  }
  return _db;
}

/** Rebuild the schema. Used by the import script. */
export function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS practitioners (
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

    CREATE TABLE IF NOT EXISTS licenses (
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

    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      practitioner_id INTEGER NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT,
      reviewer_name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      verified INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_practitioners_search ON practitioners(search_name);
    CREATE INDEX IF NOT EXISTS idx_practitioners_council ON practitioners(council);
    CREATE INDEX IF NOT EXISTS idx_practitioners_status ON practitioners(licence_status);
    CREATE INDEX IF NOT EXISTS idx_licenses_prac ON licenses(practitioner_id);
    CREATE INDEX IF NOT EXISTS idx_ratings_prac ON ratings(practitioner_id);
    CREATE INDEX IF NOT EXISTS idx_ratings_created ON ratings(created_at);
  `);
}
