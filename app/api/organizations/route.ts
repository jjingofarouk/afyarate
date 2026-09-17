import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isDbReady } from "@/lib/practitioners";
import { getOrganizations } from "@/lib/careers";
import { slugify } from "@/lib/practitioner-url";
import { clientIp, limited, str, UUID_RE } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ items: await getOrganizations() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load" },
      { status: 500 },
    );
  }
}

// Register an employer organization (verified later by admin).
export async function POST(req: NextRequest) {
  if (!(await isDbReady())) {
    return NextResponse.json({ error: "Database not ready" }, { status: 503 });
  }
  if (limited(`orgs:${clientIp(req)}`, 10)) {
    return NextResponse.json({ error: "Too many requests, try again later" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const name = str(b.name, 180);
  const ownerProfileId = str(b.ownerProfileId ?? b.owner_profile_id, 40);
  if (!name) return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
  const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 7)}`;
  const supabase = createServerClient();
  const { error } = await supabase.from("organizations").insert({
    slug,
    name,
    website: str(b.website, 255) || null,
    description: str(b.description, 5000) || null,
    logo_url: str(b.logoUrl ?? b.logo_url, 500) || null,
    owner_profile_id: UUID_RE.test(ownerProfileId) ? ownerProfileId : null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Organization registered, pending verification", slug }, { status: 201 });
}
