import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { adminListFacilityEdits } from "@/lib/facilities";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const edits = await adminListFacilityEdits();
    return NextResponse.json({ edits });
  } catch (err) {
    console.error("admin facility-edits list error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
