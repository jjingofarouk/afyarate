import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isDbReady } from "@/lib/practitioners";
import { clientIp, limited, str, UUID_RE } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Message a connection request thread. GET ?requestId=&profileId= lists,
// POST appends (notifies the other party via notifications where possible).
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const requestId = Number(sp.get("requestId"));
  const profileId = sp.get("profileId") ?? "";
  if (!Number.isInteger(requestId) || requestId <= 0 || !UUID_RE.test(profileId)) {
    return NextResponse.json({ error: "Missing requestId or profileId" }, { status: 400 });
  }
  const supabase = createServerClient();
  const { data: reqRow } = await supabase
    .from("connection_requests")
    .select("sender_profile_id, recipient_profile_id")
    .eq("id", requestId)
    .maybeSingle();
  const r = reqRow as { sender_profile_id: string | null; recipient_profile_id: string | null } | null;
  if (!r || (r.sender_profile_id !== profileId && r.recipient_profile_id !== profileId)) {
    return NextResponse.json({ error: "Not a party to this request" }, { status: 403 });
  }
  const { data, error } = await supabase
    .from("request_messages")
    .select("id, sender_name, body, created_at")
    .eq("request_id", requestId)
    .order("id", { ascending: true })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!(await isDbReady())) {
    return NextResponse.json({ error: "Database not ready" }, { status: 503 });
  }
  if (limited(`reqmsg:${clientIp(req)}`, 30)) {
    return NextResponse.json({ error: "Too many messages, slow down" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const requestId = Number(b.requestId ?? b.request_id);
  const senderProfileId = str(b.senderProfileId ?? b.sender_profile_id, 40);
  const senderName = str(b.senderName ?? b.sender_name, 120);
  const msgBody = str(b.body, 3000);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
  }
  if (!UUID_RE.test(senderProfileId) || !senderName || !msgBody) {
    return NextResponse.json({ error: "Name and message are required" }, { status: 400 });
  }
  const supabase = createServerClient();
  const { data: reqRow } = await supabase
    .from("connection_requests")
    .select("sender_profile_id, recipient_profile_id")
    .eq("id", requestId)
    .maybeSingle();
  const r = reqRow as { sender_profile_id: string | null; recipient_profile_id: string | null } | null;
  if (!r || (r.sender_profile_id !== senderProfileId && r.recipient_profile_id !== senderProfileId)) {
    return NextResponse.json({ error: "Not a party to this request" }, { status: 403 });
  }
  const { error } = await supabase.from("request_messages").insert({
    request_id: requestId,
    sender_profile_id: senderProfileId,
    sender_name: senderName,
    body: msgBody,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const other =
    r.sender_profile_id === senderProfileId ? r.recipient_profile_id : r.sender_profile_id;
  if (other) {
    await supabase.from("notifications").insert({
      profile_id: other,
      type: "request_message",
      title: `New message from ${senderName}`,
      body: msgBody.slice(0, 200),
      link: `/requests?requestId=${requestId}`,
    });
  }
  return NextResponse.json({ message: "Sent" }, { status: 201 });
}
