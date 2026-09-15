import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CLAIM_AMOUNT_UGX,
  collectMoney,
  marzPayConfigured,
  normalizeUgPhone,
} from "@/lib/marzpay";

export const dynamic = "force-dynamic";

function nameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/**
 * POST /api/facility-claims
 * body: { facilityId, name, phone, email? }
 * Mirrors POST /api/claims for practitioners: token-overlap auto-match
 * against the facilities directory, then a one-time UGX 5,000 MarzPay
 * collection. Webhook completes it.
 */
export async function POST(req: NextRequest) {
  if (!marzPayConfigured()) {
    return NextResponse.json(
      { error: "Payments are not configured yet. Please try again later." },
      { status: 503 }
    );
  }

  let body: { facilityId?: number | string; name?: string; phone?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const facilityId = Number(body.facilityId);
  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim() || null;
  const phone = normalizeUgPhone(body.phone ?? "");

  if (!facilityId || !name || !phone) {
    return NextResponse.json(
      { error: "Your facility, your full name and a valid Ugandan phone number are required." },
      { status: 400 }
    );
  }

  let db: ReturnType<typeof createAdminClient>;
  try {
    db = createAdminClient();
  } catch (e) {
    return NextResponse.json({ error: "Server configuration error.", detail: (e as Error).message }, { status: 500 });
  }

  const { data: facility, error: fErr } = await db
    .from("facilities")
    .select("id, name, claimed")
    .eq("id", facilityId)
    .maybeSingle();

  if (fErr || !facility) {
    return NextResponse.json({ error: "Facility not found." }, { status: 404 });
  }

  if (facility.claimed) {
    return NextResponse.json(
      { error: "This facility has already been claimed." },
      { status: 409 }
    );
  }

  // Light ownership signal: submitted name must share a token with the
  // facility name (person's name rarely matches — accept either side).
  // Full document verification kicks in on disputes.
  const submitted = new Set(nameTokens(name));
  const registry = nameTokens(String(facility.name ?? ""));
  const overlaps = registry.some((t) => submitted.has(t));
  // Staff claim with their own name: allow when at least a first/last name
  // token is plausibly human (2+ tokens submitted) even without overlap —
  // payment + phone identity + dispute flow is the real filter, same as clinicians.
  const plausibleHuman = nameTokens(name).length >= 2;
  if (!overlaps && !plausibleHuman) {
    return NextResponse.json(
      { error: "Please enter your full name as the facility representative." },
      { status: 422 }
    );
  }

  const { data: existingPaid } = await db
    .from("facility_claim_requests")
    .select("id")
    .eq("facility_id", facilityId)
    .eq("status", "paid")
    .limit(1);
  if ((existingPaid?.length ?? 0) > 0) {
    return NextResponse.json(
      { error: "This facility has already been claimed." },
      { status: 409 }
    );
  }

  const reference = crypto.randomUUID();
  const editToken = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, "");
  const { data: claim, error: cErr } = await db
    .from("facility_claim_requests")
    .insert({
      facility_id: facilityId,
      requester_name: name,
      phone,
      email,
      status: "matched",
      amount: CLAIM_AMOUNT_UGX,
      marzpay_reference: reference,
      edit_token: editToken,
    })
    .select("id")
    .single();

  if (cErr || !claim) {
    return NextResponse.json({ error: "Could not start your claim.", detail: cErr?.message ?? "unknown" }, { status: 500 });
  }

  const result = await collectMoney({
    amount: CLAIM_AMOUNT_UGX,
    phone,
    reference,
    description: `Musawo verified facility (one-time) - ${facility.name}`,
    metadata: [{ facilityClaimId: String(claim.id) }],
  });

  if (!result.ok) {
    await db.from("facility_claim_requests").update({ status: "failed" }).eq("id", claim.id);
    return NextResponse.json(
      { error: `${result.error} Please try again.` },
      { status: 502 }
    );
  }

  await db
    .from("facility_claim_requests")
    .update({
      status: "processing",
      marzpay_txn_uuid: result.transactionUuid || null,
    })
    .eq("id", claim.id);

  return NextResponse.json({
    claimId: claim.id,
    status: "processing",
    message: "Check your phone for the mobile money prompt and enter your PIN to confirm.",
  });
}
