import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDbReady } from "@/lib/practitioners";
import { effectiveId, getAuthUserId } from "@/lib/auth-server";
import { clientIp, EMAIL_RE, limited, str, UUID_RE } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function admin() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

// My applications (applicant dashboard). Filtered server-side by handle;
// reads use the service role because application rows are not public.
export async function GET(req: NextRequest) {
  // Verified login wins over the supplied handle (prevents handle spoofing).
  const profileId = effectiveId(
    await getAuthUserId(req),
    req.nextUrl.searchParams.get("profileId") ?? "",
  );
  if (!UUID_RE.test(profileId)) {
    return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
  }
  const supabase = admin();
  if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const { data, error } = await supabase
    .from("applications")
    .select("id, post_id, applicant_name, cover_note, status, created_at, document_id")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data ?? []) as Record<string, unknown>[];
  if (rows.length === 0) return NextResponse.json({ items: [] });
  const ids = rows.map((r) => Number(r.post_id));
  const pub = createServerClient();
  const { data: posts } = await pub
    .from("posts")
    .select("id, slug, title, organization")
    .in("id", ids);
  const byId = new Map(
    ((posts ?? []) as Record<string, unknown>[]).map((p) => [Number(p.id), p]),
  );
  return NextResponse.json({
    items: rows.map((r) => ({ ...r, post: byId.get(Number(r.post_id)) ?? null })),
  });
}

// Apply to a listing. One application per email per listing. Optionally links
// the applicant handle + one vault document for reuse/tracking.
export async function POST(req: NextRequest) {
  if (!(await isDbReady())) {
    return NextResponse.json({ error: "Database not ready" }, { status: 503 });
  }
  if (limited(`apply:${clientIp(req)}`, 10)) {
    return NextResponse.json({ error: "Too many applications, try again later" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const postId = Number(b.postId ?? b.post_id);
  const applicantName = str(b.applicantName ?? b.applicant_name, 120);
  const applicantEmail = str(b.applicantEmail ?? b.applicant_email, 200).toLowerCase();
  const applicantPhone = str(b.applicantPhone ?? b.applicant_phone, 40);
  const coverNote = str(b.coverNote ?? b.cover_note, 5000);
  const cvUrl = str(b.cvUrl ?? b.cv_url, 500);
  const profileId = effectiveId(await getAuthUserId(req), str(b.profileId ?? b.profile_id, 40));
  const documentId = Number(b.documentId ?? b.document_id);
  if (!Number.isInteger(postId) || postId <= 0) {
    return NextResponse.json({ error: "Missing listing" }, { status: 400 });
  }
  if (!applicantName) {
    return NextResponse.json({ error: "Your name is required" }, { status: 400 });
  }
  if (!EMAIL_RE.test(applicantEmail)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  const supabase = createServerClient();
  const { data: post } = await supabase
    .from("posts")
    .select("id")
    .eq("id", postId)
    .eq("status", "published")
    .maybeSingle();
  if (!post) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  const { error } = await supabase.from("applications").insert({
    post_id: postId,
    applicant_name: applicantName,
    applicant_email: applicantEmail,
    applicant_phone: applicantPhone || null,
    cover_note: coverNote || null,
    cv_url: cvUrl || null,
    profile_id: UUID_RE.test(profileId) ? profileId : null,
    document_id: Number.isInteger(documentId) && documentId > 0 ? documentId : null,
  });
  if (error) {
    const dup = /duplicate|unique/i.test(error.message);
    return NextResponse.json(
      { error: dup ? "You have already applied to this listing" : error.message },
      { status: dup ? 409 : 500 },
    );
  }
  return NextResponse.json({ message: "Application submitted" }, { status: 201 });
}

const STATUSES = new Set(["reviewing", "shortlisted", "rejected", "hired", "submitted"]);

// Employer shortlists/rejects from /employers. The requester must own the
// listing (posts.owner_profile_id). Status changes notify the applicant
// in-app where the application carries a handle.
export async function PATCH(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const applicationId = Number(b.applicationId ?? b.application_id ?? b.id);
  const profileId = effectiveId(await getAuthUserId(req), str(b.profileId ?? b.profile_id, 40));
  const status = str(b.status, 20);
  if (!Number.isInteger(applicationId) || applicationId <= 0 || !UUID_RE.test(profileId)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const supabase = admin();
  if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const { data: app } = await supabase
    .from("applications")
    .select("id, post_id, applicant_name, profile_id, status")
    .eq("id", applicationId)
    .maybeSingle();
  const a = app as {
    id: number;
    post_id: number;
    applicant_name: string;
    profile_id: string | null;
    status: string;
  } | null;
  if (!a) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const { data: post } = await supabase
    .from("posts")
    .select("id, title, owner_profile_id")
    .eq("id", a.post_id)
    .maybeSingle();
  const p = post as { id: number; title: string; owner_profile_id: string | null } | null;
  if (!p || p.owner_profile_id !== profileId) {
    return NextResponse.json({ error: "Only the listing owner can do this" }, { status: 403 });
  }

  const { error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", applicationId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (a.profile_id) {
    await supabase.from("notifications").insert({
      profile_id: a.profile_id,
      type: "application_status",
      title: `Your application for “${p.title}” is now ${status}`,
      body: null,
      link: "/applications",
    });
  }
  return NextResponse.json({ ok: true, status });
}
