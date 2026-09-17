import { cache } from "react";
import { createServerClient } from "./supabase/server";
import type {
  LicenseRecord,
  Practitioner,
  ProfileDetails,
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

/**
 * Claimed (paid) practitioners can upload their own preferred photo to
 * profile_details.photo_url. List queries don't join that table, so cards
 * would keep showing the stale registry image. Batch-fetch claimed photos
 * for the given ids and prefer them over image_url — one query per list,
 * not per row.
 */
async function attachClaimedPhotos<T extends { id: number; imageUrl: string | null }>(
  items: T[]
): Promise<T[]> {
  if (items.length === 0) return items;
  try {
    const supabase = createServerClient();
    const ids = [...new Set(items.map((i) => i.id))];
    const { data } = await supabase
      .from("profile_details")
      .select("practitioner_id, photo_url")
      .in("practitioner_id", ids);
    if (!data) return items;
    const photoById = new Map<number, string>();
    for (const r of data as Row[]) {
      const url = asString(r.photo_url);
      if (url) photoById.set(Number(r.practitioner_id), url);
    }
    if (photoById.size === 0) return items;
    return items.map((item) => {
      const claimed = photoById.get(item.id);
      return claimed ? { ...item, imageUrl: claimed } : item;
    });
  } catch {
    return items;
  }
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
  // Names are matched token-by-token (AND): every whitespace-separated word
  // must appear in the name or registration/licence number, in any order, so
  // "sarah nakato", "nakato sarah" and "sarah" all find Sarah Nakato.
  // Tokens strip PostgREST `or()` structural chars (`,`, `(`, `)`) and the
  // LIKE wildcard `%` so punctuation in a query can't break the filter.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildFilters = (qb: any) => {
    if (q) {
      const tokens = q
        .split(/\s+/)
        .map((t) => t.replace(/[%(),]/g, ""))
        .filter(Boolean);
      if (tokens.length === 0) {
        // Query was only punctuation: match nothing rather than everything.
        qb = qb.eq("id", -1);
      }
      for (const tok of tokens) {
        const like = `%${tok}%`;
        qb = qb.or(
          `search_name.ilike.${like},registration_no.ilike.${like},license_number.ilike.${like}`,
        );
      }
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
  const mapped = items.map(mapPractitioner);
  // Claimed photo wins in every card / carousel — single batched lookup.
  const withPhotos = await attachClaimedPhotos(mapped);
  return {
    items: withPhotos,
    total: count,
    page,
    pageSize,
    councils,
    professions,
  };
}

/** Top-rated practitioners for the home page: only those with at least one
 *  rating, ordered by number of ratings then average score (a single 5-star is
 *  less meaningful than a well-reviewed 4.5-star). Dedicated query because the
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
  return attachClaimedPhotos(((data ?? []) as Row[]).map(mapPractitioner));
}

/** The three regulator councils a Ugandan health worker is registered with, in
 *  the order the home page shows them: medical & dental, nursing & midwifery,
 *  then allied health. */
const HOME_COUNCIL_PATTERNS = [
  "%Medical & Dental%",
  "%Nurses & Midwives%",
  "%Allied Health%",
];

/** One practitioner for a single council, photo-first because the home card is
 *  photo-led, then by name so the pick is stable between requests.
 *
 *  The second tier matters for real data: every one of the 47k Nurses &
 *  Midwives records currently has licence_status "Inactive" (their published
 *  expiry dates are stale) while registration_status is "Active", so without
 *  it that council would contribute no card at all. The fallback still leads
 *  with a photo (the card is photo-led) and then takes the most recent expiry,
 *  and the card shows the council's real status rather than hiding it. */
async function oneFeaturedPerCouncil(pattern: string): Promise<Practitioner[]> {
  const supabase = createServerClient();
  const tiers = [
    { column: "licence_status", byExpiry: false },
    { column: "registration_status", byExpiry: true },
  ];
  for (const tier of tiers) {
    let qb = supabase
      .from("practitioners_overview")
      .select("*")
      .ilike("council", pattern)
      .eq(tier.column, "Active");
    qb = qb.order("image_url", { ascending: true, nullsFirst: false });
    if (tier.byExpiry) {
      qb = qb.order("license_expiry_date", { ascending: false, nullsFirst: false });
    }
    const { data, error } = await qb.order("name", { ascending: true }).limit(1);
    if (!error && data && data.length > 0) {
      return ((data ?? []) as Row[]).map(mapPractitioner);
    }
  }
  return [];
}

/** Three practitioners for the home page's registry section, one per regulator
 *  council, so the row shows the breadth of the register instead of three of a
 *  kind. */
export async function getFeaturedPractitionersByCouncil(): Promise<Practitioner[]> {
  const slots = await Promise.all(HOME_COUNCIL_PATTERNS.map(oneFeaturedPerCouncil));
  return attachClaimedPhotos(slots.flat());
}

export interface FeaturedProfile {
  practitioner: Practitioner;
  details: ProfileDetails | null;
}

/** One practitioner to spotlight on the home page as the featured verified
 *  profile. Prefers a claimed practitioner who left contact channels
 *  (call/WhatsApp) so the contact CTAs work, photo-first; falls back to the
 *  best-rated practitioner with a photo so the slot never breaks when no
 *  claim exists yet. Returns null only when the registry is empty. */
export async function getFeaturedVerifiedPractitioner(): Promise<FeaturedProfile | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("practitioners_overview")
    .select("*")
    .eq("claimed", true)
    .order("image_url", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true })
    .limit(5);
  for (const row of (data ?? []) as Row[]) {
    const details = await getProfileDetails(Number(row.id));
    if (details?.phone || details?.whatsapp) {
      const p = mapPractitioner(row);
      // Claimed upload wins on the featured spotlight too.
      if (details?.photoUrl) p.imageUrl = details.photoUrl;
      return { practitioner: p, details };
    }
  }
  const top = await getTopRatedPractitioners(5).catch(() => []);
  for (const p of top) {
    if (!p.imageUrl) continue;
    const details = await getProfileDetails(p.id).catch(() => null);
    return { practitioner: p, details };
  }
  return null;
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
  if (!data) return null;
  const mapped = mapPractitioner(data);
  const [withPhoto] = await attachClaimedPhotos([mapped]);
  return withPhoto ?? mapped;
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

/** Public contact/workplace details a claimant added after paying. Returns
 *  null when the practitioner never filled them in. Readable by everyone. */
export async function getProfileDetails(
  practitionerId: number,
): Promise<ProfileDetails | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("profile_details")
    .select(
      "phone, whatsapp, workplace, work_address, bio, specialties, languages, " +
        "consultation_fee, availability, photo_url, website, facebook, x_handle, tiktok, instagram",
    )
    .eq("practitioner_id", practitionerId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const r = data as unknown as Row;
  const toList = (v: unknown): string[] =>
    Array.isArray(v)
      ? (v as unknown[]).map((s) => String(s)).filter(Boolean)
      : [];
  const specialties = toList(r.specialties);
  const languages = toList(r.languages);
  if (
    !asString(r.phone) &&
    !asString(r.whatsapp) &&
    !asString(r.workplace) &&
    !asString(r.work_address) &&
    !asString(r.bio) &&
    specialties.length === 0 &&
    languages.length === 0 &&
    !asString(r.consultation_fee) &&
    !asString(r.availability) &&
    !asString(r.photo_url) &&
    !asString(r.website) &&
    !asString(r.facebook) &&
    !asString(r.x_handle) &&
    !asString(r.tiktok) &&
    !asString(r.instagram)
  ) {
    return null;
  }
  return {
    phone: asString(r.phone),
    whatsapp: asString(r.whatsapp),
    workplace: asString(r.workplace),
    workAddress: asString(r.work_address),
    bio: asString(r.bio),
    specialties,
    languages,
    consultationFee: asString(r.consultation_fee),
    availability: asString(r.availability),
    photoUrl: asString(r.photo_url),
    website: asString(r.website),
    facebook: asString(r.facebook),
    xHandle: asString(r.x_handle),
    tiktok: asString(r.tiktok),
    instagram: asString(r.instagram),
  };
}

// Name-rich canonical URLs + route-param parsing live in the client-safe
// module so cards and forms can use them too; re-exported here for
// server-side convenience.
export { practitionerUrl, parsePractitionerIdParam } from "./practitioner-url";

/** Lightweight id + last-modified page, for sitemap generation. */
export async function getPractitionerIdsPage(
  offset: number,
  limit: number,
): Promise<{ id: number; name: string; updatedAt: string | null }[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("practitioners")
    .select("id, name, updated_at")
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: Row) => ({
    id: Number(r.id),
    name: String(r.name ?? ""),
    updatedAt: asString(r.updated_at),
  }));
}

/** How many paid/claimed (verified) practitioners exist, for sitemap chunk math. */
export async function getClaimedPractitionerCount(): Promise<number> {
  const supabase = createServerClient();
  const { count, error } = await supabase
    .from("practitioners")
    .select("id", { count: "exact", head: true })
    .eq("claimed", true);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Claimed (paid, verified) practitioners page, for the priority sitemap
 *  chunks. Same shape as getPractitionerIdsPage, newest-claim-agnostic
 *  id order so chunks are stable across regenerations. */
export async function getClaimedPractitionerIdsPage(
  offset: number,
  limit: number,
): Promise<{ id: number; name: string; updatedAt: string | null }[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("practitioners")
    .select("id, name, updated_at")
    .eq("claimed", true)
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: Row) => ({
    id: Number(r.id),
    name: String(r.name ?? ""),
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
