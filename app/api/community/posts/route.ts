import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isDbReady } from "@/lib/practitioners";
import { getCommunityPosts } from "@/lib/community";
import { clientIp, limited, str, UUID_RE } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const posts = await getCommunityPosts(
      req.nextUrl.searchParams.get("profileId") ?? undefined,
    );
    return NextResponse.json({ items: posts });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load" },
      { status: 500 },
    );
  }
}

// Publish a community post (goes live immediately, like the legacy platform;
// admin can hide from the moderation queue).
export async function POST(req: NextRequest) {
  if (!(await isDbReady())) {
    return NextResponse.json({ error: "Database not ready" }, { status: 503 });
  }
  if (limited(`cpost:${clientIp(req)}`, 10)) {
    return NextResponse.json({ error: "Too many posts, try again later" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const authorName = str(b.authorName ?? b.author_name, 120);
  const postBody = str(b.body, 2000);
  const profileId = str(b.profileId ?? b.profile_id, 40);
  const visibility = str(b.visibility, 20);
  if (!authorName) return NextResponse.json({ error: "Your name is required" }, { status: 400 });
  if (!postBody) return NextResponse.json({ error: "Write something first" }, { status: 400 });
  const supabase = createServerClient();
  const { error } = await supabase.from("community_posts").insert({
    profile_id: profileId && UUID_RE.test(profileId) ? profileId : null,
    author_name: authorName,
    body: postBody,
    visibility: ["public", "followers", "following", "network"].includes(visibility)
      ? visibility
      : "public",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Posted" }, { status: 201 });
}
