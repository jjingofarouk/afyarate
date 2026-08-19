import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 120;

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

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
  if (!email || !EMAIL_RE.test(email)) return badRequest("Please enter a valid email address.");

  const firstName = typeof b.first_name === "string" ? b.first_name.trim().slice(0, MAX_NAME_LENGTH) : "";
  const lastName = typeof b.last_name === "string" ? b.last_name.trim().slice(0, MAX_NAME_LENGTH) : "";
  if (!firstName) return badRequest("First name is required.");
  if (!lastName) return badRequest("Last name is required.");

  const strings = (v: unknown): string[] =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean)
      : [];

  const types = strings(b.types);
  const roles = strings(b.roles);
  const regions = strings(b.regions);
  if (types.length === 0) return badRequest("Please choose at least one opportunity type.");
  if (roles.length === 0) return badRequest("Please choose at least one role.");
  if (regions.length === 0) return badRequest("Please choose at least one location.");

  const supabase = createServerClient();
  const { error } = await supabase.from("newsletter_subscribers").upsert(
    {
      email,
      first_name: firstName,
      last_name: lastName,
      opportunity_types: types,
      roles,
      regions,
      status: "subscribed",
    },
    { onConflict: "email" },
  );

  if (error) {
    console.error("Newsletter upsert error:", error);
    return NextResponse.json(
      { error: "Couldn't save your subscription right now. Please try again in a moment." },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true });
}
