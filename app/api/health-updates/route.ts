import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isDbReady } from "@/lib/practitioners";
import { getHealthUpdates } from "@/lib/community";
import { clientIp, limited, str, UUID_RE } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const items = await getHealthUpdates(
      req.nextUrl.searchParams.get("profileId") ?? undefined,
    );
    return NextResponse.json({ items });
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
  if (limited(`hu:${clientIp(req)}`, 10)) {
    return NextResponse.json({ error: "Too many submissions, try again later" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const action = str(b.action, 20) || "post";
  const supabase = createServerClient();

  if (action === "like" || action === "unlike") {
    const updateId = Number(b.updateId ?? b.update_id);
    const profileId = str(b.profileId ?? b.profile_id, 40);
    if (!Number.isInteger(updateId) || updateId <= 0 || !UUID_RE.test(profileId)) {
      return NextResponse.json({ error: "Missing updateId or profileId" }, { status: 400 });
    }
    const { error } =
      action === "like"
        ? await supabase
            .from("health_update_likes")
            .upsert({ update_id: updateId, profile_id: profileId }, { onConflict: "update_id,profile_id" })
        : await supabase
            .from("health_update_likes")
            .delete()
            .eq("update_id", updateId)
            .eq("profile_id", profileId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ liked: action === "like" });
  }

  if (action === "comment") {
    const updateId = Number(b.updateId ?? b.update_id);
    const authorName = str(b.authorName ?? b.author_name, 120);
    const commentBody = str(b.body, 1200);
    const profileId = str(b.profileId ?? b.profile_id, 40);
    if (!Number.isInteger(updateId) || updateId <= 0 || !authorName || !commentBody) {
      return NextResponse.json({ error: "Name and comment are required" }, { status: 400 });
    }
    const { error } = await supabase.from("health_update_comments").insert({
      update_id: updateId,
      profile_id: UUID_RE.test(profileId) ? profileId : null,
      author_name: authorName,
      body: commentBody,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: "Comment posted" }, { status: 201 });
  }

  const authorName = str(b.authorName ?? b.author_name, 120);
  const title = str(b.title, 180);
  const updateBody = str(b.body, 10000);
  const profileId = str(b.profileId ?? b.profile_id, 40);
  const sourceUrl = str(b.sourceUrl ?? b.source_url, 700);
  if (!authorName || !title || !updateBody) {
    return NextResponse.json({ error: "Name, title and details are required" }, { status: 400 });
  }
  const { error } = await supabase.from("health_updates").insert({
    profile_id: UUID_RE.test(profileId) ? profileId : null,
    author_name: authorName,
    title,
    body: updateBody,
    source_url: sourceUrl || null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Update published" }, { status: 201 });
}
