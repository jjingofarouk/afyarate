import { cache } from "react";
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
    profession: asString(row.profession),
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
    claimed: Boolean((row as Record<string, unknown>).claimed),
  };
}

export interface SearchOptions {
  q?: string;
  council?: string;
  profession?: string;
  status?: "all" | "active" | "inactive";
  sort?: "name" | "rating" | "random";
  page?: number;
  pageSize?: number;
  // "exact" for the dedicated search pages (correct pagination totals);
  // "estimated" for lightweight callers like header search autocomplete,
  // where an approximate count is fine and exact costs a full table visit
  // on a 114k+ row table regardless of indexing.
  countMode?: "exact" | "estimated";
}

export interface Stats {
  practitioners: number;
  active: number;
  totalRatings: number;
}

/** True when the Supabase schema has been created (run scripts/setup_supabase.mjs). */
export async function isDbReady(): Promise<boolean> {
  try {
    const supabase = createServerClient();
    // No count needed at all, just confirm the table is queryable.
    const { error } = await supabase.from("practitioners").select("id").limit(1);
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
  const profession = (opts.profession ?? "").trim();
  const status = opts.status ?? "all";
  const sort = opts.sort ?? "random";
  const page = Math.max(1, Number.isFinite(opts.page) ? (opts.page as number) : 1);
  const pageSize = Math.min(
    50,
    Math.max(1, Number.isFinite(opts.pageSize) ? (opts.pageSize as number) : 12),
  );
  const offset = (page - 1) * pageSize;
  const countMode = opts.countMode ?? "exact";

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
    if (profession) qb = qb.eq("profession", profession);
    if (status === "active") qb = qb.eq("licence_status", "Active");
    else if (status === "inactive")
      qb = qb.or("licence_status.neq.Active,licence_status.is.null");
    return qb;
  };

  let items: Row[] = [];
  let count = 0;

  if (sort === "random") {
    // Randomised slice so browsing shows a mix of councils/specialties.
    // The row RPC and the count query are independent, run together.
    const [{ data, error }, { count: c, error: cErr }] = await Promise.all([
      supabase.rpc("search_random", {
        p_limit: pageSize,
        p_offset: offset,
        p_q: q,
        p_council: council,
        p_status: status,
        p_profession: profession,
      }),
      buildFilters(
        supabase
          .from("practitioners_overview")
          .select("id", { count: countMode, head: true }),
      ),
    ]);
    if (error) throw new Error(error.message);
    // Defensive: enforce the page size regardless of what the RPC returns.
    items = ((data ?? []) as Row[]).slice(0, pageSize);
    if (cErr) throw new Error(cErr.message);
    count = c ?? 0;
  } else {
    let query = buildFilters(
      supabase
        .from("practitioners_overview")
        .select("*", { count: countMode })
        .range(offset, offset + pageSize - 1),
    );
    // Top rated: only rated practitioners, best first. Photo-first ordering
    // deliberately does NOT apply here (it would bury top-rated practitioners
    // without photos under unrated ones that have them).
    if (sort === "rating") {
      query = buildFilters(
        supabase
          .from("practitioners_overview")
          .select("*", { count: countMode })
          .gt("rating_count", 0)
          .range(offset, offset + pageSize - 1),
      );
      query = query
        .order("rating_count", { ascending: false })
        .order("avg_rating", { ascending: false })
        .order("name", { ascending: true });
    } else {
      // Photos first: practitioners with a profile photo always come before
      // those without one (image_url is ordered NULLS LAST).
      query = query.order("image_url", { ascending: true, nullsFirst: false });
      query = query.order("name", { ascending: true });
    }
    const { data, count: c, error } = await query;
    if (error) throw new Error(error.message);
    items = (data ?? []) as Row[];
    count = c ?? 0;
  }

  const [councils, professions] = await Promise.all([getCouncils(), getProfessions()]);
  return {
    items: items.map(mapPractitioner),
    total: count,
    page,
    pageSize,
    councils,
    professions,
  };
}

/** Top-rated practitioners for the home page: only those with at least one
 *  rating, ordered by number of ratings then average score (a single 5★ is
 *  less meaningful than a well-reviewed 4.5★). Dedicated query because the
 *  search path deliberately puts profile photos first. */
export async function getTopRatedPractitioners(limit = 8): Promise<Practitioner[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("practitioners_overview")
    .select("*")
    .gt("rating_count", 0)
    .order("rating_count", { ascending: false })
    .order("avg_rating", { ascending: false })
    .order("image_url", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).map(mapPractitioner);
}

// cache(): dedupes within a single request, generateMetadata() and the page
// body both look up the same practitioner, and this collapses that back to
// one Supabase call. Scoped per-request only, so a rating submitted via
// router.refresh() still shows up immediately (unlike a cross-request cache).
export const getPractitioner = cache(async (id: number): Promise<Practitioner | null> => {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("practitioners_overview")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapPractitioner(data) : null;
});

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

/** Lightweight id + last-modified page, for sitemap generation. */
export async function getPractitionerIdsPage(
  offset: number,
  limit: number,
): Promise<{ id: number; updatedAt: string | null }[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("practitioners")
    .select("id, updated_at")
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: Row) => ({
    id: Number(r.id),
    updatedAt: asString(r.updated_at),
  }));
}

// Module-scoped: survives for the lifetime of a warm Worker isolate, so
// repeat requests it handles skip Supabase entirely. Resets on cold start, // that's fine, this is a best-effort cut in query volume, not a guarantee.
const COUNCILS_TTL_MS = 15 * 60 * 1000; // council list changes essentially never
let councilsCache: { data: string[]; expires: number } | null = null;

export async function getCouncils(): Promise<string[]> {
  if (councilsCache && councilsCache.expires > Date.now()) {
    return councilsCache.data;
  }
  const supabase = createServerClient();
  const { data, error } = await supabase.from("councils").select("council");
  if (error) return councilsCache?.data ?? [];
  const councils = (data ?? []).map((r) => String(r.council)).filter(Boolean);
  councilsCache = { data: councils, expires: Date.now() + COUNCILS_TTL_MS };
  return councils;
}

// Profession list changes even less often than councils, same cache approach.
let professionsCache: { data: string[]; expires: number } | null = null;

export async function getProfessions(): Promise<string[]> {
  if (professionsCache && professionsCache.expires > Date.now()) {
    return professionsCache.data;
  }
  const supabase = createServerClient();
  const { data, error } = await supabase.from("professions").select("profession");
  if (error) return professionsCache?.data ?? [];
  const professions = (data ?? []).map((r) => String(r.profession)).filter(Boolean);
  professionsCache = { data: professions, expires: Date.now() + COUNCILS_TTL_MS };
  return professions;
}

export interface ProfessionCount {
  profession: string;
  count: number;
}

// Registered-practitioner counts per profession, used to build the SEO
// landing pages ("Doctors in Uganda", "Nurses in Uganda", …). Read from the
// profession_counts view; cached like the council list.
let professionCountsCache: { data: ProfessionCount[]; expires: number } | null = null;

export async function getProfessionCounts(): Promise<ProfessionCount[]> {
  if (professionCountsCache && professionCountsCache.expires > Date.now()) {
    return professionCountsCache.data;
  }
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("profession_counts")
    .select("profession, practitioner_count");
  if (error) return professionCountsCache?.data ?? [];
  const counts = (data ?? []).map((r) => ({
    profession: String(r.profession),
    count: Number(r.practitioner_count ?? 0),
  }));
  professionCountsCache = { data: counts, expires: Date.now() + COUNCILS_TTL_MS };
  return counts;
}

const STATS_TTL_MS = 5 * 60 * 1000;
let statsCache: { data: Stats; expires: number } | null = null;

export async function getStats(): Promise<Stats> {
  if (statsCache && statsCache.expires > Date.now()) {
    return statsCache.data;
  }
  const supabase = createServerClient();
  const [p, a, rt] = await Promise.all([
    supabase
      .from("practitioners")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("practitioners")
      .select("id", { count: "exact", head: true })
      .eq("licence_status", "Active"),
    supabase.from("ratings").select("id", { count: "exact", head: true }),
  ]);
  const stats: Stats = {
    practitioners: p.count ?? 0,
    active: a.count ?? 0,
    totalRatings: rt.count ?? 0,
  };
  statsCache = { data: stats, expires: Date.now() + STATS_TTL_MS };
  return stats;
}
