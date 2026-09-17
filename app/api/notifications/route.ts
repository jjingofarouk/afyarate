import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { str, UUID_RE } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Per-profile notification inbox. GET ?profileId= lists, POST marks read.
export async function GET(req: NextRequest) {
  const profileId = req.nextUrl.searchParams.get("profileId") ?? "";
  if (!UUID_RE.test(profileId)) {
    return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
  }
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, link, is_read, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const items = (data ?? []) as Record<string, unknown>[];
  return NextResponse.json({
    items,
    unread: items.filter((n) => !n.is_read).length,
  });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const profileId = str(b.profileId ?? b.profile_id, 40);
  const id = Number(b.id);
  if (!UUID_RE.test(profileId)) {
    return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
  }
  const supabase = createServerClient();
  const q = supabase.from("notifications").update({ is_read: true }).eq("profile_id", profileId);
  const { error } = Number.isInteger(id) && id > 0 ? await q.eq("id", id) : await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ read: true });
}
