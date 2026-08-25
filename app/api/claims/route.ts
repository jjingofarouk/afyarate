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
 * POST /api/claims
 * body: { practitionerId, name, phone, email? }
 * Auto-matches the claimant against the registry, then initiates a one-time
 * UGX 5,000 MarzPay collection. Payment completion happens via webhook.
 */
export async function POST(req: NextRequest) {
  if (!marzPayConfigured()) {
    return NextResponse.json(
      {
        error: "Payments are not configured yet. Please try again later.",
        debug: {
          hasMarzKey: !!process.env.MARZ_API_KEY,
          hasMarzSecret: !!process.env.MARZ_API_SECRET,
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        },
      },
      { status: 503 }
    );
  }
  // Surface env presence even on success path — remove after diagnosis.
  console.log("[/api/claims] env check", {
    hasMarzKey: !!process.env.MARZ_API_KEY,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  });

  let body: { practitionerId?: number | string; name?: string; phone?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const practitionerId = Number(body.practitionerId);
  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim() || null;
  const phone = normalizeUgPhone(body.phone ?? "");

  if (!practitionerId || !name || !phone) {
    return NextResponse.json(
      { error: "Your profile, full name and a valid Ugandan phone number are required." },
      { status: 400 }
    );
  }

  let db: ReturnType<typeof createAdminClient>;
  try {
    db = createAdminClient();
  } catch (e) {
    return NextResponse.json({ error: "Server configuration error.", detail: (e as Error).message }, { status: 500 });
  }

  // Registry lookup — the primary source we already hold.
  const { data: practitioner, error: pErr } = await db
    .schema("public")
    .from("practitioners")
    .select("id, name, claimed")
    .eq("id", practitionerId)
    .maybeSingle();

  if (pErr || !practitioner) {
    console.error("[/api/claims] practitioner lookup failed:", pErr?.message);
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  if (practitioner.claimed) {
    return NextResponse.json(
      { error: "This profile has already been claimed." },
      { status: 409 }
    );
  }

  // Light identity check: the submitted name must share a token with the
  // registry name. Full document verification only kicks in on disputes.
  const submitted = new Set(nameTokens(name));
  const registry = nameTokens(practitioner.name as string);
  if (!registry.some((t) => submitted.has(t))) {
    return NextResponse.json(
      {
        error:
          "That name doesn't match this profile. Use the name exactly as it appears on your licence.",
      },
      { status: 422 }
    );
  }

  // One paid claim per practitioner, ever.
  const { data: existingPaid } = await db
    .from("claim_requests")
    .select("id")
    .eq("practitioner_id", practitionerId)
    .eq("status", "paid")
    .limit(1);
  if ((existingPaid?.length ?? 0) > 0) {
    return NextResponse.json(
      { error: "This profile has already been claimed." },
      { status: 409 }
    );
  }

  const reference = crypto.randomUUID();
  const editToken = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, "");
  const { data: claim, error: cErr } = await db
    .from("claim_requests")
    .insert({
      practitioner_id: practitionerId,
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
    console.error("[/api/claims] claim insert failed:", cErr?.message);
    return NextResponse.json({ error: "Could not start your claim.", detail: cErr?.message ?? "unknown" }, { status: 500 });
  }

  const result = await collectMoney({
    amount: CLAIM_AMOUNT_UGX,
    phone,
    reference,
    description: `Musawo verified profile (one-time) - ${practitioner.name}`,
    metadata: [{ claimId: String(claim.id) }],
  });

  if (!result.ok) {
    await db.from("claim_requests").update({ status: "failed" }).eq("id", claim.id);
    return NextResponse.json(
      { error: `${result.error} Please try again.` },
      { status: 502 }
    );
  }

  await db
    .from("claim_requests")
    .update({
      status: "processing",
      marzpay_txn_uuid: result.transactionUuid || null,
    })
    .eq("id", claim.id);

  return NextResponse.json({
    claimId: claim.id,
    status: "processing",
    message:
      "Check your phone for the mobile money prompt and enter your PIN to confirm.",
  });
}
