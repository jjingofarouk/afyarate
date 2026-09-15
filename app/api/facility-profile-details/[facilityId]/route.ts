import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const FIELDS = [
  "phone",
  "whatsapp",
  "description",
  "services",
  "photo_url",
  "website",
  "facebook",
  "x_handle",
  "instagram",
] as const;
type Field = (typeof FIELDS)[number];

const MAX_LEN: Record<Field, number> = {
  phone: 40,
  whatsapp: 40,
  description: 2000,
  services: 0,
  photo_url: 500,
  website: 300,
  facebook: 300,
  x_handle: 100,
  instagram: 300,
};

function clean(value: unknown, maxLen: number): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim().slice(0, maxLen);
  return v || null;
}

async function authorize(
  db: ReturnType<typeof createAdminClient>,
  facilityId: number,
  token: string | null
) {
  if (!token) return false;
  const { data } = await db
    .from("facility_claim_requests")
    .select("id")
    .eq("facility_id", facilityId)
    .eq("status", "paid")
    .eq("edit_token", token)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

/** GET /api/facility-profile-details/[facilityId]?t=token */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ facilityId: string }> }
) {
  const { facilityId: rawId } = await params;
  const fid = Number(rawId);
  const token = req.nextUrl.searchParams.get("t");
  if (!fid || !token) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const db = createAdminClient();
  if (!(await authorize(db, fid, token))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const { data } = await db
    .from("facility_profile_details")
    .select(FIELDS.join(", "))
    .eq("facility_id", fid)
    .maybeSingle();
  return NextResponse.json({ details: data ?? {} });
}

/** POST /api/facility-profile-details/[facilityId] */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ facilityId: string }> }
) {
  const { facilityId: rawId } = await params;
  const fid = Number(rawId);
  if (!fid) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  let body: Partial<Record<Field | "token", unknown>>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const token = typeof body.token === "string" ? body.token : null;
  const db = createAdminClient();
  if (!(await authorize(db, fid, token))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const toList = (raw: unknown): string[] => {
    const list = Array.isArray(raw)
      ? raw.map((s) => String(s).trim()).filter(Boolean)
      : typeof raw === "string"
        ? raw.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
    return list.slice(0, 20).map((s) => s.slice(0, 60));
  };
  const row: Record<string, unknown> = { facility_id: fid };
  for (const f of FIELDS) {
    if (f === "services") row.services = toList(body.services);
    else row[f] = clean(body[f], MAX_LEN[f]);
  }
  const { error } = await db
    .from("facility_profile_details")
    .upsert(row, { onConflict: "facility_id" });
  if (error) {
    return NextResponse.json({ error: "Could not save your details." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
