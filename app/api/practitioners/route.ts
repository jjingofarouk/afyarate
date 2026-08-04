import { NextRequest, NextResponse } from "next/server";
import { isDbReady, searchPractitioners } from "@/lib/practitioners";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isDbReady()) {
    return NextResponse.json({ error: "Database not ready" }, { status: 503 });
  }
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q") ?? "";
  const council = sp.get("council") ?? "";
  const status = (sp.get("status") ?? "all") as "all" | "active" | "inactive";
  const sort = (sp.get("sort") ?? "name") as "name" | "rating";
  const page = Number(sp.get("page") ?? 1) || 1;
  const pageSize = Number(sp.get("pageSize") ?? 12) || 12;

  const result = searchPractitioners({ q, council, status, sort, page, pageSize });
  return NextResponse.json(result);
}
