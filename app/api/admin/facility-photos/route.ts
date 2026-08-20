import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { adminListFacilityPhotos } from "@/lib/facilities";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const photos = await adminListFacilityPhotos("pending");
    return NextResponse.json({ photos });
  } catch (err) {
    console.error("admin facility-photos list error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
