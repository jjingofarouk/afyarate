import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/practitioners/[id] — minimal public info, used by the claim
 * banner to address the practitioner viewing their own profile by name.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pid = Number(id);
  if (!pid) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const db = createServerClient();
  const { data, error } = await db
    .from("practitioners")
    .select("name, profession, council, claimed")
    .eq("id", pid)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}
