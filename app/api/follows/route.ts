import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isDbReady } from "@/lib/practitioners";
import { clientIp, limited, str, UUID_RE } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Follow / unfollow a member profile.
export async function POST(req: NextRequest) {
  if (!(await isDbReady())) {
    return NextResponse.json({ error: "Database not ready" }, { status: 503 });
  }
  if (limited(`follow:${clientIp(req)}`, 60)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const follower = str(b.followerProfileId ?? b.follower_profile_id, 40);
  const followed = str(b.followedProfileId ?? b.followed_profile_id, 40);
  if (!UUID_RE.test(follower) || !UUID_RE.test(followed) || follower === followed) {
    return NextResponse.json({ error: "Invalid follow request" }, { status: 400 });
  }
  const supabase = createServerClient();
  const { error } = await supabase.from("follows").upsert(
    { follower_profile_id: follower, followed_profile_id: followed },
    { onConflict: "follower_profile_id,followed_profile_id" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ following: true });
}

export async function DELETE(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const follower = sp.get("followerProfileId") ?? "";
  const followed = sp.get("followedProfileId") ?? "";
  if (!UUID_RE.test(follower) || !UUID_RE.test(followed)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const supabase = createServerClient();
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_profile_id", follower)
    .eq("followed_profile_id", followed);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ following: false });
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const follower = sp.get("followerProfileId") ?? sp.get("follower") ?? "";
  const followed = sp.get("followedProfileId") ?? sp.get("followed") ?? "";
  const supabase = createServerClient();
  // Am I following them? (single check for buttons)
  if (UUID_RE.test(follower) && UUID_RE.test(followed)) {
    const { data } = await supabase
      .from("follows")
      .select("follower_profile_id")
      .eq("follower_profile_id", follower)
      .eq("followed_profile_id", followed)
      .maybeSingle();
    return NextResponse.json({ following: !!data });
  }
  // Everyone I follow (one request per feed render).
  const followingOf = sp.get("followingOf") ?? "";
  if (UUID_RE.test(followingOf)) {
    const { data } = await supabase
      .from("follows")
      .select("followed_profile_id")
      .eq("follower_profile_id", followingOf);
    return NextResponse.json({
      ids: ((data ?? []) as { followed_profile_id: string }[]).map((r) => r.followed_profile_id),
    });
  }
  const profileId = sp.get("profileId") ?? "";
  if (!UUID_RE.test(profileId)) {
    return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
  }
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("followed_profile_id", profileId),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_profile_id", profileId),
  ]);
  return NextResponse.json({ followers: followers ?? 0, following: following ?? 0 });
}
