import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isDbReady } from "@/lib/practitioners";
import { getCommunityComments } from "@/lib/community";
import { clientIp, limited, str, UUID_RE } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const postId = Number(req.nextUrl.searchParams.get("postId"));
  if (!Number.isInteger(postId) || postId <= 0) {
    return NextResponse.json({ error: "Missing postId" }, { status: 400 });
  }
  try {
    return NextResponse.json({ items: await getCommunityComments(postId) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  if (!(await isDbReady())) {
    return NextResponse.json({ error: "Database not ready" }, { status: 503 });
  }
  if (limited(`ccomment:${clientIp(req)}`, 20)) {
    return NextResponse.json({ error: "Too many comments, try again later" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const postId = Number(b.postId ?? b.post_id);
  const authorName = str(b.authorName ?? b.author_name, 120);
  const commentBody = str(b.body, 1200);
  const profileId = str(b.profileId ?? b.profile_id, 40);
  if (!Number.isInteger(postId) || postId <= 0) {
    return NextResponse.json({ error: "Missing postId" }, { status: 400 });
  }
  if (!authorName || !commentBody) {
    return NextResponse.json({ error: "Name and comment are required" }, { status: 400 });
  }
  const supabase = createServerClient();
  const { error } = await supabase.from("community_comments").insert({
    post_id: postId,
    profile_id: profileId && UUID_RE.test(profileId) ? profileId : null,
    author_name: authorName,
    body: commentBody,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Comment posted" }, { status: 201 });
}
