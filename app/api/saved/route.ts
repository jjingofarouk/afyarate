import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getSavedPostIds } from "@/lib/careers";
import { getPosts } from "@/lib/posts";
import { effectiveId, getAuthUserId } from "@/lib/auth-server";
import { str, UUID_RE } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Saved listings for a profile handle. GET ?profileId= → saved posts.
export async function GET(req: NextRequest) {
  const profileId = effectiveId(
    await getAuthUserId(req),
    req.nextUrl.searchParams.get("profileId") ?? "",
  );
  if (!UUID_RE.test(profileId)) {
    return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
  }
  try {
    const ids = await getSavedPostIds(profileId);
    if (ids.length === 0) return NextResponse.json({ items: [] });
    const all = await getPosts();
    const set = new Set(ids);
    return NextResponse.json({ items: all.filter((p) => set.has(p.id)) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load" },
      { status: 500 },
    );
  }
}

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
    return NextResponse.json({ error: "Missing profileId or postId" }, { status: 400 });
  }
  const supabase = createServerClient();
  const { error } = await supabase
    .from("saved_listings")
    .upsert({ profile_id: profileId, post_id: postId }, { onConflict: "profile_id,post_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ saved: true });
}

export async function DELETE(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const profileId = effectiveId(await getAuthUserId(req), sp.get("profileId") ?? "");
  const postId = Number(sp.get("postId"));
  if (!UUID_RE.test(profileId) || !Number.isInteger(postId) || postId <= 0) {
    return NextResponse.json({ error: "Missing profileId or postId" }, { status: 400 });
  }
  const supabase = createServerClient();
  const { error } = await supabase
    .from("saved_listings")
    .delete()
    .eq("profile_id", profileId)
    .eq("post_id", postId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ saved: false });
}
