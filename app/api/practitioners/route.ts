import { NextRequest, NextResponse } from "next/server";
import { searchPractitioners } from "@/lib/practitioners";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q") ?? "";
  const council = sp.get("council") ?? "";
  const profession = sp.get("profession") ?? "";
  const status = (sp.get("status") ?? "all") as "all" | "active" | "inactive";
  const sort = (sp.get("sort") ?? "random") as "name" | "rating" | "random";
  const page = Number(sp.get("page") ?? 1) || 1;
  const pageSize = Number(sp.get("pageSize") ?? 12) || 12;

  const result = await searchPractitioners({ q, council, profession, status, sort, page, pageSize }).catch(() => null);
  // No separate readiness probe (it would cost a full sequential database
  // round trip on every search); a failed lookup means the DB isn't ready.
  if (!result) {
    return NextResponse.json({ error: "Database not ready" }, { status: 503 });
  }
  // Public, slow-changing data: let browsers reuse identical searches briefly
  // so retyping/back-navigation resolves instantly without a network round trip.
  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" },
  });
}
