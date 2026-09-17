import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isDbReady } from "@/lib/practitioners";
import { clientIp, EMAIL_RE, limited, str, UUID_RE } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Support inbox: contact messages + problem reports (admin-only reads).
export async function POST(req: NextRequest) {
  if (!(await isDbReady())) {
    return NextResponse.json({ error: "Database not ready" }, { status: 503 });
  }
  if (limited(`support:${clientIp(req)}`, 10)) {
    return NextResponse.json({ error: "Too many submissions, try again later" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const kind = str(b.kind, 20) || "contact";
  const supabase = createServerClient();

  if (kind === "listing") {
    // Structured report against a specific listing (safety guide flow).
    const postId = Number(b.postId ?? b.post_id);
    const reason = str(b.reason, 80);
    if (!Number.isInteger(postId) || postId <= 0 || !reason) {
      return NextResponse.json({ error: "Listing and reason are required" }, { status: 400 });
    }
    const profileId = str(b.profileId ?? b.profile_id, 40);
    const { error } = await supabase.from("listing_reports").insert({
      post_id: postId,
      reporter_profile_id: UUID_RE.test(profileId) ? profileId : null,
      reason,
      details: str(b.details, 2000) || null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: "Report received, thank you" }, { status: 201 });
  }

  if (kind === "report") {
    const reporterName = str(b.reporterName ?? b.reporter_name ?? b.name, 120);
    const subject = str(b.subject, 180);
    const details = str(b.details ?? b.message, 5000);
    const profileId = str(b.profileId ?? b.profile_id, 40);
    if (!reporterName || !subject || !details) {
      return NextResponse.json({ error: "Name, subject and details are required" }, { status: 400 });
    }
    const { error } = await supabase.from("problem_reports").insert({
      profile_id: UUID_RE.test(profileId) ? profileId : null,
      reporter_name: reporterName,
      reporter_email: str(b.reporterEmail ?? b.reporter_email ?? b.email, 200) || null,
      subject,
      details,
      page_url: str(b.pageUrl ?? b.page_url, 500) || null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: "Report received, thank you" }, { status: 201 });
  }

  const name = str(b.name, 120);
  const email = str(b.email, 200).toLowerCase();
  const subject = str(b.subject, 180);
  const message = str(b.message, 5000);
  if (!name || !EMAIL_RE.test(email) || !subject || !message) {
    return NextResponse.json({ error: "Name, valid email, subject and message are required" }, { status: 400 });
  }
  const { error } = await supabase
    .from("contact_messages")
    .insert({ name, email, subject, message });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Message sent" }, { status: 201 });
}
