import { cache } from "react";
import { createServerClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";
import type {
  Facility,
  FacilityKind,
  FacilityRating,
  FacilitySearchResult,
} from "./types";

// PostgREST returns snake_case columns; map them to the camelCase UI types.
type Row = Record<string, unknown>;

function asString(v: unknown): string | null {
  return typeof v === "string" && v !== "" ? v : null;
}

function mapFacility(row: Row): Facility {
  return {
    id: Number(row.id),
    slug: String(row.slug ?? ""),
    kind: (row.kind as FacilityKind) ?? "hospital",
    name: String(row.name ?? ""),
    address: asString(row.address),
    city: asString(row.city),
    region: asString(row.region),
    description: asString(row.description),
    phone: asString(row.phone),
    specialties: asString(row.specialties),
    imageUrl: asString(row.image_url),
    sourceUrl: asString(row.source_url),
    avgRating: row.avg_rating != null ? Number(row.avg_rating) : null,
    ratingCount: Number(row.rating_count ?? 0),
    services: Array.isArray(row.services) ? (row.services as string[]) : [],
  };
}

export interface FacilityPhoto {
  id: number;
  imageUrl: string;
  storagePath: string;
  submittedByName: string | null;
  createdAt: string;
}

function mapPhoto(row: Row): FacilityPhoto {
  return {
    id: Number(row.id),
    imageUrl: String(row.image_url ?? ""),
    storagePath: String(row.storage_path ?? ""),
    submittedByName: asString(row.submitted_by_name),
    createdAt: String(row.created_at ?? ""),
  };
}

/** Approved photos only, for the public gallery. */
export async function getFacilityPhotos(facilityId: number): Promise<FacilityPhoto[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("facility_photos")
    .select("*")
    .eq("facility_id", facilityId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).map(mapPhoto);
}

/** Public submission, RLS allows insert, lands as pending until an admin approves it. */
export async function submitFacilityPhoto(input: {
  facilityId: number;
  imageUrl: string;
  storagePath: string;
  submittedByName?: string;
  submittedByEmail?: string;
}): Promise<void> {
  const supabase = createServerClient();
  const { error } = await supabase.from("facility_photos").insert({
    facility_id: input.facilityId,
    image_url: input.imageUrl,
    storage_path: input.storagePath,
    submitted_by_name: input.submittedByName?.trim() || null,
    submitted_by_email: input.submittedByEmail?.trim() || null,
    status: "pending",
  });
  if (error) throw new Error(error.message);
}

/** Public suggestion for services/description/phone, moderated before it touches the live record. */
export async function submitFacilityEditSuggestion(input: {
  facilityId: number;
  suggestedDescription?: string;
  suggestedServices?: string[];
  suggestedPhone?: string;
  submittedByName?: string;
  submittedByEmail?: string;
}): Promise<void> {
  const supabase = createServerClient();
  const { error } = await supabase.from("facility_edit_suggestions").insert({
    facility_id: input.facilityId,
    suggested_description: input.suggestedDescription?.trim() || null,
    suggested_services: input.suggestedServices ?? null,
    suggested_phone: input.suggestedPhone?.trim() || null,
    submitted_by_name: input.submittedByName?.trim() || null,
    submitted_by_email: input.submittedByEmail?.trim() || null,
    status: "pending",
  });
  if (error) throw new Error(error.message);
}

// ── Admin moderation (service role, bypasses RLS) ───────────────────────────

export interface FacilityPhotoModeration extends FacilityPhoto {
  facilityId: number;
  facilityName: string | null;
  submittedByEmail: string | null;
  status: "pending" | "approved" | "rejected";
}

export async function adminListFacilityPhotos(
  status = "pending",
): Promise<FacilityPhotoModeration[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("facility_photos")
    .select("*, facilities(name)")
    .eq("status", status)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).map((row) => ({
    ...mapPhoto(row),
    facilityId: Number(row.facility_id),
    facilityName: asString((row.facilities as Row | null)?.name),
    submittedByEmail: asString(row.submitted_by_email),
    status: (row.status as FacilityPhotoModeration["status"]) ?? "pending",
  }));
}

export async function adminReviewFacilityPhoto(
  id: string,
  approve: boolean,
  rejectionReason?: string,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("facility_photos")
    .update({
      status: approve ? "approved" : "rejected",
      rejection_reason: approve ? null : (rejectionReason ?? "").slice(0, 1000),
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export interface FacilityEditModeration {
  id: number;
  facilityId: number;
  facilityName: string | null;
  suggestedDescription: string | null;
  suggestedServices: string[] | null;
  suggestedPhone: string | null;
  submittedByName: string | null;
  submittedByEmail: string | null;
  createdAt: string;
}

export async function adminListFacilityEdits(): Promise<FacilityEditModeration[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("facility_edit_suggestions")
    .select("*, facilities(name)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).map((row) => ({
    id: Number(row.id),
    facilityId: Number(row.facility_id),
    facilityName: asString((row.facilities as Row | null)?.name),
    suggestedDescription: asString(row.suggested_description),
    suggestedServices: Array.isArray(row.suggested_services)
      ? (row.suggested_services as string[])
      : null,
    suggestedPhone: asString(row.suggested_phone),
    submittedByName: asString(row.submitted_by_name),
    submittedByEmail: asString(row.submitted_by_email),
    createdAt: String(row.created_at ?? ""),
  }));
}

/** Approve merges the suggested fields into the live facility row; reject just closes it out. */
export async function adminReviewFacilityEdit(id: string, approve: boolean): Promise<void> {
  const supabase = createAdminClient();
  if (approve) {
    const { data: suggestion, error: fetchErr } = await supabase
      .from("facility_edit_suggestions")
      .select("*")
      .eq("id", id)
      .single();
    if (fetchErr) throw new Error(fetchErr.message);

    const changes: Record<string, unknown> = {};
    if (suggestion.suggested_description) changes.description = suggestion.suggested_description;
    if (suggestion.suggested_services) changes.services = suggestion.suggested_services;
    if (suggestion.suggested_phone) changes.phone = suggestion.suggested_phone;

    if (Object.keys(changes).length > 0) {
      const { error: updateErr } = await supabase
        .from("facilities")
        .update({ ...changes, updated_at: new Date().toISOString() })
        .eq("id", suggestion.facility_id);
      if (updateErr) throw new Error(updateErr.message);
    }
  }
  const { error } = await supabase
    .from("facility_edit_suggestions")
    .update({ status: approve ? "approved" : "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export interface FacilitySearchOptions {
  q?: string;
  kind?: string;
  city?: string;
  sort?: "rating" | "name";
  page?: number;
  pageSize?: number;
  // See countMode on practitioners' SearchOptions, same tradeoff.
  countMode?: "exact" | "estimated";
}

export interface FacilityStats {
  hospitals: number;
  pharmacies: number;
  total: number;
}

/** True when the facilities schema has been created (run scripts/setup_supabase.mjs). */
export async function isFacilitiesReady(): Promise<boolean> {
  try {
    const supabase = createServerClient();
    // No count needed, just confirm the table is queryable.
    const { error } = await supabase.from("facilities").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}

export async function searchFacilities(
  opts: FacilitySearchOptions = {},
): Promise<FacilitySearchResult> {
  const supabase = createServerClient();
  const q = (opts.q ?? "").trim();
  const kind = (opts.kind ?? "").trim();
  const city = (opts.city ?? "").trim();
  const sort = opts.sort ?? "rating";
  const page = Math.max(1, Number.isFinite(opts.page) ? (opts.page as number) : 1);
  const pageSize = Math.min(
    50,
    Math.max(1, Number.isFinite(opts.pageSize) ? (opts.pageSize as number) : 12),
  );
  const offset = (page - 1) * pageSize;
  const countMode = opts.countMode ?? "exact";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildFilters = (qb: any) => {
    if (q) qb = qb.ilike("search_text", `%${q}%`);
    if (kind === "hospital" || kind === "pharmacy") qb = qb.eq("kind", kind);
    if (city) qb = qb.eq("city", city);
    return qb;
  };

  let query = buildFilters(
    supabase
      .from("facilities_overview")
      .select("*", { count: countMode })
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

  const citiesQuery = buildFilters(supabase.from("facilities_overview").select("city"));
  const [{ data, count, error }, { data: cityRows }] = await Promise.all([query, citiesQuery]);
  if (error) throw new Error(error.message);

  return {
    items: ((data ?? []) as Row[]).map(mapFacility),
    total: count ?? 0,
    page,
    pageSize,
    kinds: ["hospital", "pharmacy"],
    cities: [
      ...new Set(
        ((cityRows ?? []) as Row[])
          .map((r) => asString(r.city))
          .filter((c): c is string => Boolean(c)),
      ),
    ].sort(),
  };
}

// cache(): dedupes within a single request, generateMetadata() and the page
// body both look up the same facility, and this collapses that back to one
// Supabase call. Scoped per-request only, so a rating submitted via
// router.refresh() still shows up immediately (unlike a cross-request cache).
export const getFacility = cache(async (slug: string): Promise<Facility | null> => {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("facilities_overview")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapFacility(data as Row) : null;
});

export async function getFacilityRatings(
  facilityId: number,
): Promise<FacilityRating[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("facility_ratings")
    .select("*")
    .eq("facility_id", facilityId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: Row) => ({
    id: Number(r.id),
    facilityId: Number(r.facility_id),
    rating: Number(r.rating),
    comment: asString(r.comment),
    reviewerName: asString(r.reviewer_name),
    createdAt: String(r.created_at ?? ""),
    verified: Boolean(r.verified),
  }));
}

const STATS_TTL_MS = 5 * 60 * 1000;
let statsCache: { data: FacilityStats; expires: number } | null = null;

export async function getFacilityStats(): Promise<FacilityStats> {
  if (statsCache && statsCache.expires > Date.now()) {
    return statsCache.data;
  }
  const supabase = createServerClient();
  const [h, p] = await Promise.all([
    supabase
      .from("facilities")
      .select("id", { count: "exact", head: true })
      .eq("kind", "hospital"),
    supabase
      .from("facilities")
      .select("id", { count: "exact", head: true })
      .eq("kind", "pharmacy"),
  ]);
  const stats: FacilityStats = {
    hospitals: h.count ?? 0,
    pharmacies: p.count ?? 0,
    total: (h.count ?? 0) + (p.count ?? 0),
  };
  statsCache = { data: stats, expires: Date.now() + STATS_TTL_MS };
  return stats;
}

const CITIES_TTL_MS = 15 * 60 * 1000;
let citiesCache: { data: string[]; expires: number } | null = null;

/** Distinct cities for the filter dropdown (top-level, cached). */
export async function getFacilityCities(): Promise<string[]> {
  if (citiesCache && citiesCache.expires > Date.now()) {
    return citiesCache.data;
  }
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("facilities")
    .select("city")
    .not("city", "is", null)
    .order("city");
  if (error) return citiesCache?.data ?? [];
  const cities = [...new Set((data ?? []).map((r) => String(r.city)).filter(Boolean))];
  citiesCache = { data: cities, expires: Date.now() + CITIES_TTL_MS };
  return cities;
}

/** Lightweight id + last-modified page, for sitemap generation. */
export async function getFacilityIdsPage(
  offset: number,
  limit: number,
): Promise<{ id: number; slug: string; updatedAt: string | null }[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("facilities")
    .select("id, slug, updated_at")
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: Row) => ({
    id: Number(r.id),
    slug: String(r.slug ?? ""),
    updatedAt: asString(r.updated_at),
  }));
}
