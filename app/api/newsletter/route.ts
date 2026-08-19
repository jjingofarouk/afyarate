import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 120;

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Newsletter subscription backed by the site's own Supabase table
 * (newsletter_subscribers): email, name and preference selections. Sending is
 * handled separately once a digest pipeline exists.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid request.");
  }
  const b = body as {
    email_address?: unknown;
    first_name?: unknown;
    last_name?: unknown;
    types?: unknown;
    roles?: unknown;
    regions?: unknown;
  };

  const email = typeof b.email_address === "string" ? b.email_address.trim().toLowerCase() : "";
  if (!email || !EMAIL_RE.test(email)) {
    return badRequest("Please enter a valid email address.");
  }
  const firstName = typeof b.first_name === "string" ? b.first_name.trim().slice(0, MAX_NAME_LENGTH) : "";
  const lastName = typeof b.last_name === "string" ? b.last_name.trim().slice(0, MAX_NAME_LENGTH) : "";
  const strings = (v: unknown): string[] =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean)
      : [];

  const supabase = createServerClient();
  const { error } = await supabase.from("newsletter_subscribers").insert({
    email,
    first_name: firstName || null,
    last_name: lastName || null,
    opportunity_types: strings(b.types),
    roles: strings(b.roles),
    regions: strings(b.regions),
    status: "subscribed",
  });

  if (error) {
    // Already subscribed — idempotent, treat as success.
    if (error.code === "23505" || /duplicate key/i.test(error.message)) {
      return NextResponse.json({ ok: true });
    }
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json(
      { error: "Couldn't subscribe you right now. Please try again in a moment." },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true });
}