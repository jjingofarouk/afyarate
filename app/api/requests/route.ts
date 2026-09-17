import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isDbReady } from "@/lib/practitioners";
import { clientIp, limited, str, UUID_RE } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const TARGETS = new Set(["member", "practitioner", "facility", "organization"]);
const TYPES = new Set([
  "message",
  "appointment_service",
  "consultation_enquiry",
  "referral",
  "other",
]);

// List my sent/received requests, or create one.
export async function GET(req: NextRequest) {
  const profileId = req.nextUrl.searchParams.get("profileId") ?? "";
  if (!UUID_RE.test(profileId)) {
    return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
  }
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("connection_requests")
    .select("id, sender_name, target_type, target_id, request_type, subject, details, status, created_at")
    .or(`sender_profile_id.eq.${profileId},recipient_profile_id.eq.${profileId}`)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!(await isDbReady())) {
    return NextResponse.json({ error: "Database not ready" }, { status: 503 });
  }
  if (limited(`conn:${clientIp(req)}`, 10)) {
    return NextResponse.json({ error: "Too many requests, try again later" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const senderProfileId = str(b.senderProfileId ?? b.sender_profile_id, 40);
  const senderName = str(b.senderName ?? b.sender_name, 120);
  const subject = str(b.subject, 180);
  const details = str(b.details, 5000);
  const targetType = str(b.targetType ?? b.target_type, 20) || "member";
  const requestType = str(b.requestType ?? b.request_type, 30) || "other";
  const targetId = Number(b.targetId ?? b.target_id);
  const recipientProfileId = str(b.recipientProfileId ?? b.recipient_profile_id, 40);
  if (!senderName || !subject || !details) {
    return NextResponse.json({ error: "Name, subject and details are required" }, { status: 400 });
  }
  if (!TARGETS.has(targetType) || !TYPES.has(requestType)) {
    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  }
  const supabase = createServerClient();
  const { error } = await supabase.from("connection_requests").insert({
    sender_profile_id: UUID_RE.test(senderProfileId) ? senderProfileId : null,
    sender_name: senderName,
    recipient_profile_id: UUID_RE.test(recipientProfileId) ? recipientProfileId : null,
    target_type: targetType,
    target_id: Number.isInteger(targetId) && targetId > 0 ? targetId : null,
    request_type: requestType,
    subject,
    details,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Request sent" }, { status: 201 });
}
