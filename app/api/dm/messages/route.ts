import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isDbReady } from "@/lib/practitioners";
import { getDmMessages } from "@/lib/community";
import { clientIp, limited, str, UUID_RE } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const threadId = Number(sp.get("threadId"));
  const profileId = sp.get("profileId") ?? "";
  if (!Number.isInteger(threadId) || threadId <= 0 || !UUID_RE.test(profileId)) {
    return NextResponse.json({ error: "Missing threadId or profileId" }, { status: 400 });
  }
  try {
    const items = await getDmMessages(threadId, profileId);
    // Best-effort read receipts for the other side's messages.
    const supabase = createServerClient();
    await supabase
      .from("dm_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("thread_id", threadId)
      .neq("sender_profile_id", profileId)
      .is("read_at", null);
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
  if (limited(`dmmsg:${clientIp(req)}`, 60)) {
    return NextResponse.json({ error: "Too many messages, slow down" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const threadId = Number(b.threadId ?? b.thread_id);
  const senderProfileId = str(b.senderProfileId ?? b.sender_profile_id, 40);
  const senderName = str(b.senderName ?? b.sender_name, 120);
  const msgBody = str(b.body, 2000);
  if (!Number.isInteger(threadId) || threadId <= 0) {
    return NextResponse.json({ error: "Missing threadId" }, { status: 400 });
  }
  if (!UUID_RE.test(senderProfileId) || !senderName || !msgBody) {
    return NextResponse.json({ error: "Name and message are required" }, { status: 400 });
  }
  const supabase = createServerClient();
  const { data: thread } = await supabase
    .from("dm_threads")
    .select("participant_a, participant_b")
    .eq("id", threadId)
    .maybeSingle();
  const t = thread as { participant_a: string; participant_b: string } | null;
  if (!t || (t.participant_a !== senderProfileId && t.participant_b !== senderProfileId)) {
    return NextResponse.json({ error: "Not a participant of this thread" }, { status: 403 });
  }
  const { error } = await supabase.from("dm_messages").insert({
    thread_id: threadId,
    sender_profile_id: senderProfileId,
    sender_name: senderName,
    body: msgBody,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.from("dm_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
  return NextResponse.json({ message: "Sent" }, { status: 201 });
}
