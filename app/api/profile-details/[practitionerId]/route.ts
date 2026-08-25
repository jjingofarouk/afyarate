import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const FIELDS = ["phone", "whatsapp", "workplace", "bio", "specialties", "website"] as const;
type Field = (typeof FIELDS)[number];

function clean(value: unknown, maxLen: number): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim().slice(0, maxLen);
  return v || null;
}

async function authorize(
  db: ReturnType<typeof createAdminClient>,
  practitionerId: number,
  token: string | null
) {
  if (!token) return false;
  const { data } = await db
    .from("claim_requests")
    .select("id")
    .eq("practitioner_id", practitionerId)
    .eq("status", "paid")
    .eq("edit_token", token)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

/** GET /api/profile-details/[practitionerId]?t=token — load the payer's edits. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ practitionerId: string }> }
) {
  const { practitionerId: rawId } = await params;
  const pid = Number(rawId);
  const token = req.nextUrl.searchParams.get("t");
  if (!pid || !token) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const db = createAdminClient();
  if (!(await authorize(db, pid, token))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { data } = await db
    .from("profile_details")
    .select(FIELDS.join(", "))
    .eq("practitioner_id", pid)
    .maybeSingle();

  return NextResponse.json({ details: data ?? {} });
}

/** POST /api/profile-details/[practitionerId] — upsert the payer's edits. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ practitionerId: string }> }
) {
  const { practitionerId: rawId } = await params;
  const pid = Number(rawId);
  if (!pid) {
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
  if (!(await authorize(db, pid, token))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const row: Record<string, unknown> = { practitioner_id: pid };
  for (const f of FIELDS) {
    if (f === "specialties") {
      // Accept a comma-separated string or array; store as text[].
      const raw = body.specialties;
      const list = Array.isArray(raw)
        ? raw.map((s) => String(s).trim()).filter(Boolean)
        : typeof raw === "string"
          ? raw.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 15)
          : [];
      row.specialties = list.slice(0, 60).map((s) => s.slice(0, 40));
    } else {
      row[f] = clean(body[f], f === "bio" ? 1200 : 200);
    }
  }

  const { error } = await db
    .from("profile_details")
    .upsert(row, { onConflict: "practitioner_id" });

  if (error) {
    console.error("[/api/profile-details] upsert failed:", error.message);
    return NextResponse.json({ error: "Could not save your details." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
