import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { effectiveId, getAuthUserId } from "@/lib/auth-server";
import { str, UUID_RE } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Employer workspace data: listings I own (posts.owner_profile_id) with
// applicant counts and per-status breakdowns.
export async function GET(req: NextRequest) {
  const profileId = effectiveId(
    await getAuthUserId(req),
    req.nextUrl.searchParams.get("profileId") ?? "",
  );
  if (!UUID_RE.test(profileId)) {
    return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
  }
  const pub = createServerClient();
  const { data: posts, error } = await pub
    .from("posts")
    .select("id, slug, title, organization, status, deadline, views, created_at")
    .eq("owner_profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (posts ?? []) as Record<string, unknown>[];
  if (rows.length === 0) return NextResponse.json({ items: [] });

  let counts: Record<number, { total: number; byStatus: Record<string, number> }> = {};
  try {
    const admin = createAdminClient();
    const ids = rows.map((p) => Number(p.id));
    const { data: apps } = await admin
      .from("applications")
      .select("post_id, status")
      .in("post_id", ids);
    for (const a of ((apps ?? []) as Record<string, unknown>[])) {
      const pid = Number(a.post_id);
      counts[pid] ??= { total: 0, byStatus: {} };
      counts[pid].total += 1;
      const s = String(a.status ?? "submitted");
      counts[pid].byStatus[s] = (counts[pid].byStatus[s] ?? 0) + 1;
    }
  } catch {
    // Service key missing: listings still listed, counts empty.
  }
  return NextResponse.json({
    items: rows.map((p) => ({
      ...p,
      applicants: counts[Number(p.id)] ?? { total: 0, byStatus: {} },
    })),
  });
}

// Per-listing applicant list for the owner.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const profileId = effectiveId(await getAuthUserId(req), str(b.profileId ?? b.profile_id, 40));
  const postId = Number(b.postId ?? b.post_id);
  if (!UUID_RE.test(profileId) || !Number.isInteger(postId) || postId <= 0) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
  const { data: post } = await admin
    .from("posts")
    .select("id, title, owner_profile_id")
    .eq("id", postId)
    .maybeSingle();
  const p = post as { id: number; title: string; owner_profile_id: string | null } | null;
  if (!p || p.owner_profile_id !== profileId) {
    return NextResponse.json({ error: "Only the listing owner can do this" }, { status: 403 });
  }
  const { data: apps, error } = await admin
    .from("applications")
    .select("id, applicant_name, applicant_email, applicant_phone, cover_note, cv_url, document_id, status, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: { id: p.id, title: p.title }, items: apps ?? [] });
}
