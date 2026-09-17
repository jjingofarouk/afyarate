import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isDbReady } from "@/lib/practitioners";
import { getSeekerProfile } from "@/lib/careers";
import { effectiveId, getAuthUserId } from "@/lib/auth-server";
import { clientIp, limited, str, UUID_RE } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const VIS = new Set(["private", "employers", "public"]);

// "Open to work" profile: GET ?profileId=, POST upserts.
export async function GET(req: NextRequest) {
  const profileId = effectiveId(
    await getAuthUserId(req),
    req.nextUrl.searchParams.get("profileId") ?? "",
  );
  if (!UUID_RE.test(profileId)) {
    return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
  }
  return NextResponse.json({ profile: await getSeekerProfile(profileId) });
}

export async function POST(req: NextRequest) {
  if (!(await isDbReady())) {
    return NextResponse.json({ error: "Database not ready" }, { status: 503 });
  }
  if (limited(`seeker:${clientIp(req)}`, 20)) {
    return NextResponse.json({ error: "Too many requests, try again later" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const profileId = effectiveId(await getAuthUserId(req), str(b.profileId ?? b.profile_id, 40));
  if (!UUID_RE.test(profileId)) {
    return NextResponse.json({ error: "Create your handle first" }, { status: 400 });
  }
  const cv = str(b.cvVisibility ?? b.cv_visibility, 20) || "private";
  const supabase = createServerClient();
  const row = {
    profile_id: profileId,
    seeking_title: str(b.seekingTitle ?? b.seeking_title, 180) || null,
    availability: str(b.availability, 100) || null,
    desired_roles: str(b.desiredRoles ?? b.desired_roles, 500) || null,
    desired_locations: str(b.desiredLocations ?? b.desired_locations, 500) || null,
    employment_preference: str(b.employmentPreference ?? b.employment_preference, 180) || null,
    skills: str(b.skills, 800) || null,
    expected_salary: str(b.expectedSalary ?? b.expected_salary, 180) || null,
    public_summary: str(b.publicSummary ?? b.public_summary, 3000) || null,
    show_email: Boolean(b.showEmail ?? b.show_email),
    show_phone: Boolean(b.showPhone ?? b.show_phone),
    cv_visibility: VIS.has(cv) ? cv : "private",
    active: b.active === undefined ? true : Boolean(b.active),
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("seeker_profiles")
    .upsert(row, { onConflict: "profile_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Profile saved" }, { status: 201 });
}
