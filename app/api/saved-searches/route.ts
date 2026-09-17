import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { effectiveId, getAuthUserId } from "@/lib/auth-server";
import { str, UUID_RE } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function admin() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

// List my saved searches (service-role read, filtered by handle).
export async function GET(req: NextRequest) {
  const profileId = effectiveId(
    await getAuthUserId(req),
    req.nextUrl.searchParams.get("profileId") ?? "",
  );
  if (!UUID_RE.test(profileId)) {
    return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
  }
  const supabase = admin();
  if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const { data, error } = await supabase
    .from("saved_searches")
    .select("id, name, type, q, profession, location, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const profileId = effectiveId(await getAuthUserId(req), str(b.profileId ?? b.profile_id, 40));
  const name = str(b.name, 120);
  if (!UUID_RE.test(profileId)) {
    return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
  }
  if (!name) return NextResponse.json({ error: "Name this search first" }, { status: 400 });
  const supabase = admin();
  if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const { data, error } = await supabase
    .from("saved_searches")
    .insert({
      profile_id: profileId,
      name,
      type: str(b.type, 30) || null,
      q: str(b.q, 150) || null,
      profession: str(b.profession, 120) || null,
      location: str(b.location, 120) || null,
    })
    .select("id, name, type, q, profession, location, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ search: data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const profileId = effectiveId(await getAuthUserId(req), sp.get("profileId") ?? "");
  const id = Number(sp.get("id"));
  if (!UUID_RE.test(profileId) || !Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { createServerClient } = await import("@/lib/supabase/server");
  const supabase = createServerClient();
  // RLS allows anyone to delete (mirrors job_alerts); scope to own row.
  const { error } = await supabase
    .from("saved_searches")
    .delete()
    .eq("id", id)
    .eq("profile_id", profileId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
