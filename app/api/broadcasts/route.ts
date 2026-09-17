import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getBroadcasts } from "@/lib/community";
import { str, UUID_RE } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Active announcements, plus mark-as-read (POST { broadcastId, profileId }).
export async function GET(req: NextRequest) {
  try {
    const items = await getBroadcasts(
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
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const broadcastId = Number(b.broadcastId ?? b.broadcast_id);
  const profileId = str(b.profileId ?? b.profile_id, 40);
  if (!Number.isInteger(broadcastId) || broadcastId <= 0 || !UUID_RE.test(profileId)) {
    return NextResponse.json({ error: "Missing broadcastId or profileId" }, { status: 400 });
  }
  const supabase = createServerClient();
  await supabase
    .from("broadcast_reads")
    .upsert({ broadcast_id: broadcastId, profile_id: profileId }, { onConflict: "broadcast_id,profile_id" });
  return NextResponse.json({ read: true });
}
