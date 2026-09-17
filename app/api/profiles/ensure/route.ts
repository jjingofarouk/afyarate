import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUserId } from "@/lib/auth-server";
import { str } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Ensure a profiles row for the logged-in user (id = auth user id).
export async function POST(req: NextRequest) {
  const userId = await getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const displayName = str(b.displayName ?? b.display_name, 120) || "Member";

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
  const { data: existing } = await admin
    .from("profiles")
    .select("id, handle, display_name, role")
    .eq("id", userId)
    .maybeSingle();
  if (existing) return NextResponse.json({ profile: existing });

  const { data: userRes } = await admin.auth.admin.getUserById(userId);
  const email = userRes.user?.email ?? null;
  const base =
    displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30) ||
    (email ? email.split("@")[0].replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 30) : "member");
  const handle = `${base}-${Math.random().toString(36).slice(2, 7)}`;
  const { data, error } = await admin
    .from("profiles")
    .insert({ id: userId, handle, display_name: displayName, email, role: "member" })
    .select("id, handle, display_name, role")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data }, { status: 201 });
}
