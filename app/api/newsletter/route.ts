import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const EO_API = "https://api.emailoctopus.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Newsletter subscription backed by EmailOctopus (emailoctopus.com).
 * Upserts the address onto the configured list using the API's bearer token.
 * The list's own double-opt-in setting decides whether the contact starts as
 * "pending" (a confirmation email is sent) or is subscribed immediately.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.EMAILOCTOPUS_API_KEY;
  const listId = process.env.EMAILOCTOPUS_LIST_ID;
  if (!apiKey || !listId) {
    console.error("Newsletter API: EMAILOCTOPUS_API_KEY or EMAILOCTOPUS_LIST_ID is not set");
    return NextResponse.json(
      { error: "The newsletter isn't set up yet. Please try again later." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid request.");
  }
  const b = body as {
    email_address?: unknown;
    tags?: unknown;
    fields?: unknown;
  };
  const email = typeof b?.email_address === "string" ? b.email_address.trim() : "";
  if (!email || !EMAIL_RE.test(email)) {
    return badRequest("Please enter a valid email address.");
  }
  const tags = Array.isArray(b.tags)
    ? b.tags.filter((t): t is string => typeof t === "string")
    : [];
  const fields =
    b.fields && typeof b.fields === "object" && !Array.isArray(b.fields)
      ? (b.fields as Record<string, unknown>)
      : {};
  const fieldsRecord: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (typeof v === "string" && v.trim()) fieldsRecord[k] = v.trim();
  }

  const listRes = await fetch(`${EO_API}/lists/${encodeURIComponent(listId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const list = await listRes.json().catch(() => null);
  const doubleOptIn = listRes.ok && typeof list?.double_opt_in === "boolean"
    ? list.double_opt_in
    : false;

  const res = await fetch(`${EO_API}/lists/${encodeURIComponent(listId)}/contacts`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      email_address: email,
      status: doubleOptIn ? "pending" : "subscribed",
      ...(tags.length > 0 ? { tags: Object.fromEntries(tags.map((t) => [t, true])) } : {}),
      ...(Object.keys(fieldsRecord).length > 0 ? { fields: fieldsRecord } : {}),
    }),
  });

  if (res.ok) {
    return NextResponse.json({ ok: true, double_opt_in: doubleOptIn });
  }

  // An existing (e.g. unsubscribed) contact still counts as a successful
  // subscribe — the upsert either re-subscribes them or leaves them in place.
  if (res.status === 409) {
    return NextResponse.json({ ok: true, double_opt_in: doubleOptIn });
  }

  const err = await res.json().catch(() => ({}));
  const detail = `${err?.title ?? ""} ${err?.detail ?? ""}`.toLowerCase();
  if (/already|exists|subscribed/i.test(detail)) {
    return NextResponse.json({ ok: true, double_opt_in: doubleOptIn });
  }

  console.error("EmailOctopus subscribe error:", res.status, err);
  return NextResponse.json(
    { error: "Couldn't subscribe you right now. Please try again in a moment." },
    { status: 502 },
  );
}
