import { cache } from "react";
import { createServerClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";

export interface AmbulanceProvider {
  id: number;
  slug: string;
  name: string;
  phone: string;
  altPhone: string | null;
  email: string | null;
  city: string | null;
  region: string | null;
  coverageArea: string | null;
  vehicleTypes: string[];
  services: string[];
  description: string | null;
  imageUrl: string | null;
  status: "pending" | "approved" | "rejected";
  featured: boolean;
  createdAt: string;
}

type Row = Record<string, unknown>;

function asString(v: unknown): string | null {
  return typeof v === "string" && v !== "" ? v : null;
}

function mapAmbulance(row: Row): AmbulanceProvider {
  return {
    id: Number(row.id),
    slug: String(row.slug ?? ""),
    name: String(row.name ?? ""),
    phone: String(row.phone ?? ""),
    altPhone: asString(row.alt_phone),
    email: asString(row.email),
    city: asString(row.city),
    region: asString(row.region),
    coverageArea: asString(row.coverage_area),
    vehicleTypes: Array.isArray(row.vehicle_types) ? (row.vehicle_types as string[]) : [],
    services: Array.isArray(row.services) ? (row.services as string[]) : [],
    description: asString(row.description),
    imageUrl: asString(row.image_url),
    status: (row.status as AmbulanceProvider["status"]) ?? "pending",
    featured: Boolean(row.featured),
    createdAt: String(row.created_at ?? ""),
  };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Approved ambulance providers only, for the public listing. */
export async function searchAmbulances(opts: { q?: string; city?: string } = {}): Promise<
  AmbulanceProvider[]
> {
  const supabase = createServerClient();
  let query = supabase.from("ambulance_providers").select("*").eq("status", "approved");
  if (opts.city) query = query.eq("city", opts.city);
  const { data, error } = await query
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = ((data ?? []) as Row[]).map(mapAmbulance);
  const q = (opts.q ?? "").trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      (r.coverageArea ?? "").toLowerCase().includes(q) ||
      (r.city ?? "").toLowerCase().includes(q),
  );
}

export const getAmbulance = cache(async (slug: string): Promise<AmbulanceProvider | null> => {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("ambulance_providers")
    .select("*")
    .eq("slug", slug)
    .eq("status", "approved")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapAmbulance(data as Row) : null;
});

export async function getAmbulanceCities(): Promise<string[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("ambulance_providers")
    .select("city")
    .eq("status", "approved")
    .not("city", "is", null);
  if (error) return [];
  return [...new Set((data ?? []).map((r: Row) => String(r.city)).filter(Boolean))].sort();
}

export interface AmbulanceSubmission {
  name: string;
  phone: string;
  altPhone?: string;
  email?: string;
  city?: string;
  region?: string;
  coverageArea?: string;
  vehicleTypes?: string[];
  services?: string[];
  description?: string;
  imageUrl?: string;
}

/** Public registration, anon key, RLS allows insert, always lands as pending. */
export async function submitAmbulanceProvider(input: AmbulanceSubmission): Promise<void> {
  const supabase = createServerClient();
  const base = slugify(input.name) || "ambulance";
  const slug = `${base}-${Date.now().toString(36)}`;
  const { error } = await supabase.from("ambulance_providers").insert({
    slug,
    name: input.name.trim(),
    phone: input.phone.trim(),
    alt_phone: input.altPhone?.trim() || null,
    email: input.email?.trim() || null,
    city: input.city?.trim() || null,
    region: input.region?.trim() || null,
    coverage_area: input.coverageArea?.trim() || null,
    vehicle_types: input.vehicleTypes ?? [],
    services: input.services ?? [],
    description: input.description?.trim() || null,
    image_url: input.imageUrl || null,
    status: "pending",
  });
  if (error) throw new Error(error.message);
}

// ── Admin (service role, bypasses RLS) ──────────────────────────────────────

export async function adminListAmbulances(status?: string): Promise<AmbulanceProvider[]> {
  const supabase = createAdminClient();
  let query = supabase.from("ambulance_providers").select("*");
  if (status) query = query.eq("status", status);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).map(mapAmbulance);
}

export async function adminUpdateAmbulance(
  id: string,
  changes: Record<string, unknown>,
): Promise<AmbulanceProvider> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ambulance_providers")
    .update({ ...changes, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapAmbulance(data as Row);
}
