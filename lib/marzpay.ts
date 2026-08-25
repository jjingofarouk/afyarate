import { SITE_URL } from "@/lib/site";

const BASE = process.env.MARZ_BASE_URL ?? "https://wallet.wearemarz.com/api/v1";

export const CLAIM_AMOUNT_UGX = 5000;

export function marzPayConfigured(): boolean {
  return Boolean(process.env.MARZ_API_KEY && process.env.MARZ_API_SECRET);
}

function authHeader(): string {
  return `Basic ${btoa(`${process.env.MARZ_API_KEY}:${process.env.MARZ_API_SECRET}`)}`;
}

/** Normalize Ugandan phone input to E.164 (+256…). Returns null if invalid. */
export function normalizeUgPhone(input: string): string | null {
  let phone = (input ?? "").replace(/\s+/g, "").trim();
  if (phone.startsWith("0")) phone = "+256" + phone.slice(1);
  else if (/^256/.test(phone) && !phone.startsWith("+")) phone = "+" + phone;
  if (!/^\+256(7|3)\d{8}$/.test(phone)) return null;
  return phone;
}

export function claimCallbackUrl(): string {
  return `${SITE_URL}/api/webhooks/marzpay`;
}

export type CollectionResult =
  | {
      ok: true;
      transactionUuid: string;
      reference: string;
      status: string;
      provider: string | null;
    }
  | { ok: false; error: string };

/**
 * Initiate a mobile-money collection. The customer gets a STK push on their
 * phone. Do NOT treat "processing" as paid — wait for the webhook or a
 * confirmed status check.
 */
export async function collectMoney(opts: {
  amount: number;
  phone: string;
  reference: string;
  description: string;
  metadata?: Record<string, string>[];
}): Promise<CollectionResult> {
  try {
    const res = await fetch(`${BASE}/collect-money`, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        amount: opts.amount,
        phone_number: opts.phone,
        reference: opts.reference,
        country: "UG",
        description: opts.description.slice(0, 255),
        callback_url: claimCallbackUrl(),
        ...(opts.metadata ? { metadata: opts.metadata } : {}),
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || data?.status === "error") {
      return { ok: false, error: data?.message || "Payment initiation failed." };
    }
    return {
      ok: true,
      transactionUuid: data?.data?.transaction?.uuid ?? "",
      reference: opts.reference,
      status: data?.data?.transaction?.status ?? "processing",
      provider: data?.data?.collection?.provider ?? null,
    };
  } catch (err) {
    return { ok: false, error: (err as Error).message || "Network error." };
  }
}

/**
 * Fallback status check when a webhook is delayed. Returns the final
 * callback-shaped payload for a transaction uuid.
 */
export async function getTransaction(uuid: string): Promise<{
  eventType: string;
  reference: string | null;
} | null> {
  try {
    const res = await fetch(`${BASE}/collect-money/${uuid}`, {
      headers: { Authorization: authHeader(), Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      eventType: data?.event_type ?? "",
      reference: data?.transaction?.reference ?? null,
    };
  } catch {
    return null;
  }
}

/** Optional HMAC verification when webhook signing is enabled on MarzPay. */
export async function verifyWebhookSignature(
  rawBody: string,
  timestamp: string | null,
  signature: string | null
): Promise<boolean> {
  const secret = process.env.MARZPAY_WEBHOOK_SECRET;
  if (!secret) return true; // signing not enabled — accept
  if (!timestamp || !signature) return false;
  const expected = `${timestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret.replace(/^whsec_/, "")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(expected));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const provided = signature.startsWith("v1=") ? signature.slice(3) : signature;
  return hex === provided;
}
