import { createServerClient } from "./supabase/server";
import type {
  LicenseRecord,
  Practitioner,
  Rating,
  SearchResult,
} from "./types";

// PostgREST returns snake_case columns; map them to the camelCase UI types.
type Row = Record<string, unknown>;

function asString(v: unknown): string | null {
  return typeof v === "string" && v !== "" ? v : null;
}

function mapPractitioner(row: Row): Practitioner {
  return {
    id: Number(row.id),
    name: String(row.name ?? ""),
    council: asString(row.council),
    registrationStatus: asString(row.registration_status),
    registrationNo: asString(row.registration_no),
    registrationDate: asString(row.registration_date),
    licenseNumber: asString(row.license_number),
    licenseExpiryDate: asString(row.license_expiry_date),
    licenceStatus: asString(row.licence_status),
    qualifications: asString(row.qualifications),
    imageUrl: asString(row.image_url),
    recordCount: Number(row.record_count ?? 1),
    avgRating: row.avg_rating != null ? Number(row.avg_rating) : null,
    ratingCount: Number(row.rating_count ?? 0),
  };
}

export interface SearchOptions {
  q?: string;
  council?: string;
  status?: "all" | "active" | "inactive";
  sort?: "name" | "rating" | "random";
  page?: number;
  pageSize?: number;
}

export interface Stats {
  practitioners: number;
  active: number;
  withPhoto: number;
  totalRatings: number;
}

/** True when the Supabase schema has been created (run scripts/setup_supabase.mjs). */
export async function isDbReady(): Promise<boolean> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("practitioners")
      .select("id", { count: "exact", head: true })
      .limit(1);
    return !error;
  } catch {
    return false;
  }
}

export async function searchPractitioners(
  opts: SearchOptions = {},
): Promise<SearchResult> {
  const supabase = createServerClient();
  const q = (opts.q ?? "").trim();
  const council = (opts.council ?? "").trim();
  const status = opts.status ?? "all";
  const sort = opts.sort ?? "random";
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, opts.pageSize ?? 12));
  const offset = (page - 1) * pageSize;

  // Shared filter builder (used for both the count and the result queries).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildFilters = (qb: any) => {
    if (q) {
      const like = `%${q}%`;
      qb = qb.or(
        `search_name.ilike.${like},registration_no.ilike.${like},license_number.ilike.${like}`,
      );
    }
    if (council) qb = qb.eq("council", council);
    if (status === "active") qb = qb.eq("licence_status", "Active");
    else if (status === "inactive")
      qb = qb.or("licence_status.neq.Active,licence_status.is.null");
    return qb;
  };

  let items: Row[] = [];
  let count = 0;

  if (sort === "random") {
    // Randomised slice so browsing shows a mix of councils/specialties.
    const { data, error } = await supabase.rpc("search_random", {
      p_limit: pageSize,
      p_offset: offset,
      p_q: q,
      p_council: council,
      p_status: status,
    });
    if (error) throw new Error(error.message);
    items = (data ?? []) as Row[];
    const { count: c, error: cErr } = await buildFilters(
      supabase
        .from("practitioners_overview")
        .select("id", { count: "exact", head: true }),
    );
    if (cErr) throw new Error(cErr.message);
    count = c ?? 0;
  } else {
    let query = buildFilters(
      supabase
        .from("practitioners_overview")
        .select("*", { count: "exact" })
        .range(offset, offset + pageSize - 1),
    );
    if (sort === "rating") {
      query = query
        .order("rating_count", { ascending: false, nullsFirst: false })
        .order("avg_rating", { ascending: false, nullsFirst: false })
        .order("name", { ascending: true });
    } else {
      query = query.order("name", { ascending: true });
    }
    const { data, count: c, error } = await query;
    if (error) throw new Error(error.message);
    items = (data ?? []) as Row[];
    count = c ?? 0;
  }

  return {
    items: items.map(mapPractitioner),
    total: count,
    page,
    pageSize,
    councils: await getCouncils(),
  };
}

export async function getPractitioner(id: number): Promise<Practitioner | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("practitioners_overview")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapPractitioner(data) : null;
}

export async function getLicenses(
  practitionerId: number,
): Promise<LicenseRecord[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("licenses")
    .select("*")
    .eq("practitioner_id", practitionerId)
    .order("license_expiry_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: Row) => ({
    id: Number(r.id),
    practitionerId: Number(r.practitioner_id),
    name: asString(r.name),
    council: asString(r.council),
    registrationNo: asString(r.registration_no),
    registrationDate: asString(r.registration_date),
    licenseNumber: asString(r.license_number),
    licenseExpiryDate: asString(r.license_expiry_date),
    licenceStatus: asString(r.licence_status),
    qualifications: asString(r.qualifications),
    imageUrl: asString(r.image_url),
  }));
}

export async function getRatings(practitionerId: number): Promise<Rating[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("ratings")
    .select("*")
    .eq("practitioner_id", practitionerId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: Row) => ({
    id: Number(r.id),
    practitionerId: Number(r.practitioner_id),
    rating: Number(r.rating),
    comment: asString(r.comment),
    reviewerName: asString(r.reviewer_name),
    createdAt: String(r.created_at ?? ""),
    verified: Boolean(r.verified),
  }));
}

export async function getCouncils(): Promise<string[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("councils").select("council");
  if (error) return [];
  return (data ?? []).map((r) => String(r.council)).filter(Boolean);
}

export async function getStats(): Promise<Stats> {
  const supabase = createServerClient();
  const [p, a, ph, rt] = await Promise.all([
    supabase
      .from("practitioners")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("practitioners")
      .select("id", { count: "exact", head: true })
      .eq("licence_status", "Active"),
    supabase
      .from("practitioners")
      .select("id", { count: "exact", head: true })
      .not("image_url", "is", null),
    supabase.from("ratings").select("id", { count: "exact", head: true }),
  ]);
  return {
    practitioners: p.count ?? 0,
    active: a.count ?? 0,
    withPhoto: ph.count ?? 0,
    totalRatings: rt.count ?? 0,
  };
}
