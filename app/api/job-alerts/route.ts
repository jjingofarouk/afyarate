import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isDbReady } from "@/lib/practitioners";
import { clientIp, EMAIL_RE, limited, str } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Job alerts: POST creates one, DELETE ?email= removes them all (unsubscribe).
export async function POST(req: NextRequest) {
  if (!(await isDbReady())) {
    return NextResponse.json({ error: "Database not ready" }, { status: 503 });
  }
  if (limited(`alerts:${clientIp(req)}`, 10)) {
    return NextResponse.json({ error: "Too many requests, try again later" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const email = str(b.email, 200).toLowerCase();
  const frequency = str(b.frequency, 10) || "daily";
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (!["daily", "weekly"].includes(frequency)) {
    return NextResponse.json({ error: "Invalid frequency" }, { status: 400 });
  }
  const supabase = createServerClient();
  const { error } = await supabase.from("job_alerts").insert({
    email,
    keyword: str(b.keyword, 150) || null,
    category: str(b.category, 80) || null,
    cadre: str(b.cadre, 120) || null,
    location: str(b.location, 120) || null,
    frequency,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Job alert created" }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  const supabase = createServerClient();
  const { error } = await supabase.from("job_alerts").delete().eq("email", email);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Unsubscribed" });
}
