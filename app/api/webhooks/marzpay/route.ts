import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/marzpay";

export const dynamic = "force-dynamic";

type MarzCallback = {
  event_type?: string;
  transaction?: {
    uuid?: string;
    reference?: string;
    status?: string;
  };
  collection?: {
    provider_transaction_id?: string | null;
    phone_number?: string;
  };
};

/**
 * POST /api/webhooks/marzpay
 * Final-status callbacks from MarzPay. Idempotent: safe to receive the same
 * reference multiple times. Handles both direct callback payloads and the
 * dashboard `{ data: ... }` wrapper.
 *
 * On collection.completed: mark the claim paid (once — enforced by a partial
 * unique index) and flip practitioners.claimed.
 */
export async function POST(req: NextRequest) {
  let raw = "";
  try {
    raw = await req.text();
  } catch {
    return NextResponse.json({ received: true });
  }

  const sig = req.headers.get("X-MarzPay-Signature");
  const ts = req.headers.get("X-MarzPay-Timestamp");
  if (!(await verifyWebhookSignature(raw, ts, sig))) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let body: { data?: { event_type?: string } & MarzCallback } & MarzCallback;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ received: true });
  }

  // Dashboard-registered webhooks wrap the same payload under `data`.
  const payload = ((body.data?.event_type ? body.data : body) ?? {}) as MarzCallback;
  const event = payload.event_type ?? "";
  const reference = payload.transaction?.reference;

  if (!reference) return NextResponse.json({ received: true });

  if (!event.startsWith("collection.")) {
    // Not a collection event — nothing to do, but acknowledge.
    return NextResponse.json({ received: true });
  }

  const db = createAdminClient();

  const { data: claim } = await db
    .from("claim_requests")
    .select("id, status, practitioner_id")
    .eq("marzpay_reference", reference)
    .maybeSingle();

  if (!claim) return NextResponse.json({ received: true });

  if (event === "collection.completed" || payload.transaction?.status === "completed") {
    if (claim.status !== "paid") {
      await db
        .from("claim_requests")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          provider_txn_id: payload.collection?.provider_transaction_id ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", claim.id)
        .neq("status", "paid");

      await db
        .from("practitioners")
        .update({ claimed: true })
        .eq("id", claim.practitioner_id)
        .eq("claimed", false);
    }
  } else if (
    event === "collection.failed" ||
    event === "collection.cancelled" ||
    payload.transaction?.status === "failed"
  ) {
    if (claim.status === "processing" || claim.status === "matched") {
      await db
        .from("claim_requests")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", claim.id);
    }
  }

  // Always ACK quickly so MarzPay doesn't retry-storm us.
  return NextResponse.json({ received: true });
}
