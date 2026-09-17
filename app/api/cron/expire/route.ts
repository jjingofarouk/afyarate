import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Flip published listings with a past deadline to expired (mirrors legacy
// cron_expire.php). Auth: CRON_SECRET bearer (any daily cron service,
// e.g. cron-job.org) or the admin session (manual "Expire overdue" runs).
// Set CRON_SECRET via `wrangler secret put CRON_SECRET` for production.
export async function POST(req: NextRequest) {
  const bearer = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET ?? "";
  const bySecret = !!cronSecret && bearer === `Bearer ${cronSecret}`;
  if (!bySecret && !isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await admin
    .from("posts")
    .update({ status: "expired" })
    .eq("status", "published")
    .lt("deadline", today)
    .select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expired: (data ?? []).length });
}

// How many would expire (dry run for the admin panel).
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await admin
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("status", "published")
    .lt("deadline", today);
  return NextResponse.json({ overdue: count ?? 0 });
}
