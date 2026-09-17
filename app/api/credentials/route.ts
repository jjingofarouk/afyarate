import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { effectiveId, getAuthUserId } from "@/lib/auth-server";
import { clientIp, limited, str, UUID_RE } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Professional credentials for review (mirrors legacy jobseeker/credentials.php).
// credential_number is never returned by any public endpoint and the table has
// no anon/auth select policy: all reads go through here, scoped to the owner.
const TYPES = [
  "License",
  "Degree",
  "Diploma",
  "Certificate",
  "Registration",
  "Fellowship",
  "Other",
] as const;

function admin() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

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
    .from("professional_credentials")
    .select("id, credential_type, credential_name, issuing_body, credential_number, issued_year, status, review_note, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [], types: TYPES });
}

export async function POST(req: NextRequest) {
  if (limited(`credentials:${clientIp(req)}`, 10)) {
    return NextResponse.json({ error: "Too many requests, try again later" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const profileId = effectiveId(await getAuthUserId(req), str(b.profileId ?? b.profile_id, 40));
  if (!UUID_RE.test(profileId)) {
    return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
  }
  const type = str(b.credentialType, 40);
  const name = str(b.credentialName, 200);
  if (!type || !name) {
    return NextResponse.json(
      { error: "Credential type and name are required." },
      { status: 400 },
    );
  }
  const year = Number(b.issuedYear);
  const thisYear = new Date().getFullYear();
  const supabase = admin();
  if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const { data, error } = await supabase
    .from("professional_credentials")
    .insert({
      profile_id: profileId,
      credential_type: TYPES.includes(type as (typeof TYPES)[number]) ? type : "Other",
      credential_name: name,
      issuing_body: str(b.issuingBody, 200) || null,
      credential_number: str(b.credentialNumber, 120) || null,
      issued_year: year >= 1950 && year <= thisYear ? year : null,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(
    { id: (data as { id: number }).id, message: "Credential submitted for review." },
    { status: 201 },
  );
}

export async function DELETE(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const profileId = effectiveId(await getAuthUserId(req), sp.get("profileId") ?? "");
  const id = Number(sp.get("id"));
  if (!UUID_RE.test(profileId) || !Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const supabase = admin();
  if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  // Only pending/rejected submissions can be withdrawn (verified ones are
  // authoritative; mirrors the legacy status<>'verified' guard).
  const { error } = await supabase
    .from("professional_credentials")
    .delete()
    .eq("id", id)
    .eq("profile_id", profileId)
    .neq("status", "verified");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
