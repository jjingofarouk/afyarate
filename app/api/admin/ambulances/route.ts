import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { adminListAmbulances } from "@/lib/ambulances";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const status = req.nextUrl.searchParams.get("status") ?? undefined;
    const providers = await adminListAmbulances(status);
    return NextResponse.json({ providers });
  } catch (err) {
    console.error("admin ambulances list error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
