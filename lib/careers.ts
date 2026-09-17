import { createServerClient } from "./supabase/server";
import type { Organization, SeekerProfile } from "./types";

type Row = Record<string, unknown>;

const str = (v: unknown): string | null =>
  typeof v === "string" && v !== "" ? v : null;

// ---------------------------------------------------------------------------
// Organizations.
// ---------------------------------------------------------------------------

export async function getOrganizations(): Promise<Organization[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, slug, name, website, description, logo_url, verified")
    .order("verified", { ascending: false })
    .order("name", { ascending: true })
    .limit(200);
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).map((o) => ({
    id: Number(o.id),
    slug: String(o.slug ?? ""),
    name: String(o.name ?? ""),
    website: str(o.website),
    description: str(o.description),
    logoUrl: str(o.logo_url),
    verified: Boolean(o.verified),
  }));
}

// ---------------------------------------------------------------------------
// Seeker ("open to work") directory.
// ---------------------------------------------------------------------------

export async function getSeekerDirectory(limit = 30): Promise<SeekerProfile[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("seeker_profiles")
    .select(
      "profile_id, seeking_title, availability, desired_roles, desired_locations, " +
        "employment_preference, skills, expected_salary, public_summary, updated_at",
    )
    .eq("active", true)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  const rows = ((data ?? []) as unknown) as Row[];
  if (rows.length === 0) return [];
  const ids = rows.map((r) => String(r.profile_id));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, cadre, location")
    .in("id", ids);
  const plist = ((profiles ?? []) as unknown) as Row[];
  const byId = new Map(plist.map((p) => [String(p.id), p]));
  return rows.map((r) => {
    const p = byId.get(String(r.profile_id));
    return {
      profileId: String(r.profile_id),
      seekingTitle: str(r.seeking_title),
      availability: str(r.availability),
      desiredRoles: str(r.desired_roles),
      desiredLocations: str(r.desired_locations),
      employmentPreference: str(r.employment_preference),
      skills: str(r.skills),
      expectedSalary: str(r.expected_salary),
      publicSummary: str(r.public_summary),
      showEmail: false,
      showPhone: false,
      cvVisibility: "private" as const,
      active: true,
      profile: p
        ? {
            id: String(p.id),
            handle: "",
            displayName: String(p.display_name ?? "Member"),
            email: null,
            phone: null,
            role: "jobseeker" as const,
            organization: null,
            cadre: str(p.cadre),
            location: str(p.location),
            bio: null,
            skills: null,
            verified: false,
          }
        : null,
    };
  });
}

export async function getSeekerProfile(profileId: string): Promise<SeekerProfile | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("seeker_profiles")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error || !data) return null;
  const r = data as Row;
  return {
    profileId: String(r.profile_id),
    seekingTitle: str(r.seeking_title),
    availability: str(r.availability),
    desiredRoles: str(r.desired_roles),
    desiredLocations: str(r.desired_locations),
    employmentPreference: str(r.employment_preference),
    skills: str(r.skills),
    expectedSalary: str(r.expected_salary),
    publicSummary: str(r.public_summary),
    showEmail: Boolean(r.show_email),
    showPhone: Boolean(r.show_phone),
    cvVisibility: (str(r.cv_visibility) as SeekerProfile["cvVisibility"]) ?? "private",
    active: Boolean(r.active ?? true),
  };
}

// ---------------------------------------------------------------------------
// Saved listings for a profile handle.
// ---------------------------------------------------------------------------

export async function getSavedPostIds(profileId: string): Promise<number[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("saved_listings")
    .select("post_id")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).map((r) => Number(r.post_id));
}
