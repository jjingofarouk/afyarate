import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isDbReady } from "@/lib/practitioners";
import { clientIp, limited, str, UUID_RE } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Toggle a like: POST likes, DELETE unlikes. Requires a profile handle id.
export async function POST(req: NextRequest) {
  if (!(await isDbReady())) {
    return NextResponse.json({ error: "Database not ready" }, { status: 503 });
  }
  if (limited(`clike:${clientIp(req)}`, 60)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const postId = Number(b.postId ?? b.post_id);
  const profileId = str(b.profileId ?? b.profile_id, 40);
  if (!Number.isInteger(postId) || postId <= 0 || !UUID_RE.test(profileId)) {
    return NextResponse.json({ error: "Missing postId or profileId" }, { status: 400 });
  }
  const supabase = createServerClient();
  const { error } = await supabase
    .from("community_likes")
    .upsert({ post_id: postId, profile_id: profileId }, { onConflict: "post_id,profile_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ liked: true });
}

export async function DELETE(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const postId = Number(sp.get("postId"));
  const profileId = sp.get("profileId") ?? "";
  if (!Number.isInteger(postId) || postId <= 0 || !UUID_RE.test(profileId)) {
    return NextResponse.json({ error: "Missing postId or profileId" }, { status: 400 });
  }
  const supabase = createServerClient();
  const { error } = await supabase
    .from("community_likes")
    .delete()
    .eq("post_id", postId)
    .eq("profile_id", profileId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ liked: false });
}
