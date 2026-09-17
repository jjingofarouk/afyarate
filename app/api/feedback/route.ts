import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isDbReady } from "@/lib/practitioners";
import { getBroadcasts, getFeedback } from "@/lib/community";
import { clientIp, limited, str, UUID_RE } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Platform feedback: list approved feedback, submit new, or vote helpfulness.
export async function GET() {
  try {
    return NextResponse.json({ items: await getFeedback() });
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
  if (limited(`fb:${clientIp(req)}`, 10)) {
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

  if (action === "vote") {
    const feedbackId = Number(b.feedbackId ?? b.feedback_id);
    const profileId = str(b.profileId ?? b.profile_id, 40);
    const vote = Number(b.vote);
    if (!Number.isInteger(feedbackId) || feedbackId <= 0 || !UUID_RE.test(profileId)) {
      return NextResponse.json({ error: "Missing feedbackId or profileId" }, { status: 400 });
    }
    if (vote !== 1 && vote !== -1) {
      return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
    }
    const { error } = await supabase
      .from("feedback_votes")
      .upsert(
        { feedback_id: feedbackId, profile_id: profileId, vote },
        { onConflict: "feedback_id,profile_id" },
      );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ voted: true });
  }

  const authorName = str(b.authorName ?? b.author_name, 120);
  const rating = Number(b.rating);
  const feedbackText = str(b.feedbackText ?? b.feedback_text, 2000);
  const profileId = str(b.profileId ?? b.profile_id, 40);
  if (!authorName || !feedbackText) {
    return NextResponse.json({ error: "Name and feedback are required" }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });
  }
  const { error } = await supabase.from("platform_feedback").insert({
    profile_id: UUID_RE.test(profileId) ? profileId : null,
    author_name: authorName,
    rating,
    feedback_text: feedbackText,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Thanks for your feedback" }, { status: 201 });
}
