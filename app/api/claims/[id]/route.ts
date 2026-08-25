import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeUgPhone } from "@/lib/marzpay";

export const dynamic = "force-dynamic";

/**
 * GET /api/claims/[id]?phone=+256…
 * Minimal status for the claim page to poll. Once the claim is paid, the
 * edit token is released — but only if the caller proves the payer's phone
 * number, so a guessed sequential claim id can't hijack the edit link.
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
    .from("claim_requests")
    .select("status, practitioner_id, paid_at, phone, edit_token")
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

  return NextResponse.json({
    status: data.status,
    paid: data.status === "paid",
    practitionerId: data.practitioner_id,
    paidAt: data.paid_at,
    ...(editToken ? { editToken } : {}),
  });
}
