import { NextRequest, NextResponse } from "next/server";
import { isFacilitiesReady, searchFacilities } from "@/lib/facilities";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await isFacilitiesReady())) {
    return NextResponse.json({ error: "Database not ready" }, { status: 503 });
  }
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q") ?? "";
  const kind = sp.get("kind") ?? "";
  const city = sp.get("city") ?? "";
  const sort = (sp.get("sort") ?? "rating") as "rating" | "name";
  const page = Number(sp.get("page") ?? 1) || 1;
  const pageSize = Number(sp.get("pageSize") ?? 12) || 12;

  const result = await searchFacilities({ q, kind, city, sort, page, pageSize });
  return NextResponse.json(result);
}
