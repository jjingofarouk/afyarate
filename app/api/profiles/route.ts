import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isDbReady } from "@/lib/practitioners";
import { clientIp, limited, str } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// One-click identity: create a profile handle (no password). The client
// persists the returned uuid in localStorage (see lib/handle.ts).
export async function POST(req: NextRequest) {
  if (!(await isDbReady())) {
    return NextResponse.json({ error: "Database not ready" }, { status: 503 });
  }
  if (limited(`profiles:${clientIp(req)}`, 10)) {
    return NextResponse.json({ error: "Too many requests, try again later" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const handle = str(b.handle, 60).toLowerCase();
  const displayName = str(b.displayName ?? b.display_name, 120);
  const role = str(b.role, 20);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(handle)) {
    return NextResponse.json({ error: "Invalid handle" }, { status: 400 });
  }
  if (!displayName) {
    return NextResponse.json({ error: "Display name is required" }, { status: 400 });
  }
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      handle,
      display_name: displayName,
      email: str(b.email, 200) || null,
      phone: str(b.phone, 40) || null,
      role: ["member", "jobseeker", "employer"].includes(role) ? role : "member",
      organization: str(b.organization, 180) || null,
      cadre: str(b.cadre, 120) || null,
      location: str(b.location, 120) || null,
    })
    .select("id, handle, display_name, role")
    .single();
  if (error) {
    const dup = /duplicate|unique/i.test(error.message);
    return NextResponse.json(
      { error: dup ? "That handle is taken, try another name" : error.message },
      { status: dup ? 409 : 500 },
    );
  }
  return NextResponse.json({ profile: data }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get("handle")?.trim().toLowerCase();
  if (!handle) return NextResponse.json({ error: "Missing handle" }, { status: 400 });
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, handle, display_name, role, cadre, location, bio, verified")
    .eq("handle", handle)
    .maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ profile: data });
}
