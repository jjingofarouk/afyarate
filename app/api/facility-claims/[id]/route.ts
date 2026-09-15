import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeUgPhone } from "@/lib/marzpay";

export const dynamic = "force-dynamic";

/**
 * GET /api/facility-claims/[id]?phone=+256…
 * Polling status for the facility claim page. Releases the edit token only
 * to the payer's phone number.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const claimId = Number(id);
  if (!claimId) {
    return NextResponse.json({ error: "Invalid claim." }, { status: 400 });
  }

  const db = createAdminClient();
  const { data, error } = await db
    .from("facility_claim_requests")
    .select("status, facility_id, paid_at, phone, edit_token")
    .eq("id", claimId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Claim not found." }, { status: 404 });
  }

  let editToken: string | null = null;
  if (data.status === "paid" && data.edit_token) {
    const provided = normalizeUgPhone(req.nextUrl.searchParams.get("phone") ?? "");
    if (provided && data.phone && provided === data.phone) {
      editToken = data.edit_token;
    }
  }

  // Resolve slug for the success redirect without exposing extra data.
  let slug: string | null = null;
  if (data.status === "paid") {
    const { data: f } = await db
      .from("facilities")
      .select("slug")
      .eq("id", data.facility_id)
      .maybeSingle();
    slug = (f?.slug as string | null) ?? null;
  }

  return NextResponse.json({
    status: data.status,
    paid: data.status === "paid",
    facilityId: data.facility_id,
    slug,
    paidAt: data.paid_at,
    ...(editToken ? { editToken } : {}),
  });
}
