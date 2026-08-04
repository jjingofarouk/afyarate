import { getDb } from "./db";
import type {
  LicenseRecord,
  Practitioner,
  Rating,
  SearchResult,
} from "./types";

// Columns + derived rating aggregates, aliased to camelCase for the UI.
const PRACTITIONER_COLS = `
  p.id,
  p.name,
  p.council,
  p.registration_status AS registrationStatus,
  p.registration_no AS registrationNo,
  p.registration_date AS registrationDate,
  p.license_number AS licenseNumber,
  p.license_expiry_date AS licenseExpiryDate,
  p.licence_status AS licenceStatus,
  p.qualifications,
  p.image_url AS imageUrl,
  p.record_count AS recordCount,
  (SELECT ROUND(AVG(r.rating), 2) FROM ratings r WHERE r.practitioner_id = p.id) AS avgRating,
  (SELECT COUNT(*) FROM ratings r WHERE r.practitioner_id = p.id) AS ratingCount
`;

export interface SearchOptions {
  q?: string;
  council?: string;
  status?: "all" | "active" | "inactive";
  sort?: "name" | "rating";
  page?: number;
  pageSize?: number;
}

export function isDbReady(): boolean {
  try {
    const db = getDb();
    const row = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'practitioners'",
      )
      .get();
    return Boolean(row);
  } catch {
    return false;
  }
}

export function searchPractitioners(opts: SearchOptions = {}): SearchResult {
  const db = getDb();
  const q = (opts.q ?? "").trim();
  const council = (opts.council ?? "").trim();
  const status = opts.status ?? "all";
  const sort = opts.sort ?? "name";
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, opts.pageSize ?? 12));

  const where: string[] = [];
  const params: unknown[] = [];

  if (q) {
    where.push(
      "(p.search_name LIKE ? OR p.registration_no LIKE ? OR p.license_number LIKE ?)",
    );
    const like = `%${q.toLowerCase()}%`;
    params.push(like, like, like);
  }
  if (council) {
    where.push("p.council = ?");
    params.push(council);
  }
  if (status === "active") {
    where.push("p.licence_status = 'Active'");
  } else if (status === "inactive") {
    where.push("p.licence_status <> 'Active' OR p.licence_status IS NULL");
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const orderSql =
    sort === "rating"
      ? "ORDER BY ratingCount DESC, COALESCE(avgRating, 0) DESC, p.name ASC"
      : "ORDER BY p.name ASC";

  const totalRow = db
    .prepare(`SELECT COUNT(*) AS c FROM practitioners p ${whereSql}`)
    .get(...params) as { c: number } | undefined;
  const total = totalRow?.c ?? 0;

  const offset = (page - 1) * pageSize;
  const items = db
    .prepare(
      `SELECT ${PRACTITIONER_COLS} FROM practitioners p ${whereSql} ${orderSql} LIMIT ? OFFSET ?`,
    )
    .all(...params, pageSize, offset) as unknown as Practitioner[];

  const councils = (
    db
      .prepare(
        "SELECT DISTINCT council FROM practitioners WHERE council IS NOT NULL AND council <> '' ORDER BY council",
      )
      .all() as { council: string }[]
  ).map((r) => r.council);

  return { items, total, page, pageSize, councils };
}

export function getPractitioner(id: number): Practitioner | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT ${PRACTITIONER_COLS} FROM practitioners p WHERE p.id = ?`)
    .get(id) as unknown as Practitioner | undefined;
  return row ?? null;
}

export function getLicenses(practitionerId: number): LicenseRecord[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, practitioner_id AS practitionerId, name, council,
              registration_no AS registrationNo, registration_date AS registrationDate,
              license_number AS licenseNumber, license_expiry_date AS licenseExpiryDate,
              licence_status AS licenceStatus, qualifications, image_url AS imageUrl
       FROM licenses WHERE practitioner_id = ?
       ORDER BY license_expiry_date DESC`,
    )
    .all(practitionerId) as unknown as LicenseRecord[];
}

export function getRatings(practitionerId: number): Rating[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, practitioner_id AS practitionerId, rating, comment,
              reviewer_name AS reviewerName, created_at AS createdAt, verified
       FROM ratings WHERE practitioner_id = ?
       ORDER BY created_at DESC`,
    )
    .all(practitionerId) as unknown as Rating[];
}

export function getCouncils(): string[] {
  const db = getDb();
  return (
    db
      .prepare(
        "SELECT DISTINCT council FROM practitioners WHERE council IS NOT NULL AND council <> '' ORDER BY council",
      )
      .all() as { council: string }[]
  ).map((r) => r.council);
}

export interface Stats {
  practitioners: number;
  active: number;
  withPhoto: number;
  rated: number;
  totalRatings: number;
}

export function getStats(): Stats {
  const db = getDb();
  const p = db
    .prepare(
      `SELECT
         COUNT(*) AS practitioners,
         SUM(CASE WHEN licence_status = 'Active' THEN 1 ELSE 0 END) AS active,
         SUM(CASE WHEN image_url IS NOT NULL THEN 1 ELSE 0 END) AS withPhoto
       FROM practitioners`,
    )
    .get() as { practitioners: number; active: number; withPhoto: number };
  const r = db
    .prepare(`SELECT COUNT(*) AS c, COUNT(DISTINCT practitioner_id) AS d FROM ratings`)
    .get() as { c: number; d: number };
  return {
    practitioners: p.practitioners ?? 0,
    active: p.active ?? 0,
    withPhoto: p.withPhoto ?? 0,
    rated: r.d ?? 0,
    totalRatings: r.c ?? 0,
  };
}
