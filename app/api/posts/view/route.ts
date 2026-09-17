import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIp, limited, str } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Count one view per visitor per day per listing (powers employer analytics).
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const slug = str((body as Record<string, unknown>).slug, 220);
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  if (limited(`view:${clientIp(req)}:${slug}`, 1, 24 * 60 * 60 * 1000)) {
    return NextResponse.json({ counted: false });
  }
  const pub = createServerClient();
  const { data: post } = await pub
    .from("posts")
    .select("id, views")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  const p = post as { id: number; views: number } | null;
  if (!p) return NextResponse.json({ counted: false });
  try {
    const admin = createAdminClient();
    await admin.from("posts").update({ views: (Number(p.views) || 0) + 1 }).eq("id", p.id);
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
  return NextResponse.json({ counted: true });
}
