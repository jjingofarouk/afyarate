import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isDbReady } from "@/lib/practitioners";
import { getDmThreads } from "@/lib/community";
import { clientIp, limited, str, UUID_RE } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// List my threads, or open (find-or-create) a thread with another profile.
export async function GET(req: NextRequest) {
  const profileId = req.nextUrl.searchParams.get("profileId") ?? "";
  if (!UUID_RE.test(profileId)) {
    return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
  }
  try {
    return NextResponse.json({ items: await getDmThreads(profileId) });
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
  if (limited(`dmthread:${clientIp(req)}`, 20)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const me = str(b.profileId ?? b.profile_id, 40);
  const other = str(b.otherProfileId ?? b.other_profile_id, 40);
  if (!UUID_RE.test(me) || !UUID_RE.test(other) || me === other) {
    return NextResponse.json({ error: "Invalid participants" }, { status: 400 });
  }
  // Canonical ordering so (a,b) and (b,a) map to one thread.
  const [a, b2] = me < other ? [me, other] : [other, me];
  const supabase = createServerClient();
  const { data: existing } = await supabase
    .from("dm_threads")
    .select("id")
    .eq("participant_a", a)
    .eq("participant_b", b2)
    .maybeSingle();
  if (existing) return NextResponse.json({ threadId: (existing as { id: number }).id });
  const { data, error } = await supabase
    .from("dm_threads")
    .insert({ participant_a: a, participant_b: b2 })
    .select("id")
    .single();
  if (error) {
    // Race: someone else created it first.
    const { data: retry } = await supabase
      .from("dm_threads")
      .select("id")
      .eq("participant_a", a)
      .eq("participant_b", b2)
      .maybeSingle();
    if (retry) return NextResponse.json({ threadId: (retry as { id: number }).id });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ threadId: (data as { id: number }).id }, { status: 201 });
}
