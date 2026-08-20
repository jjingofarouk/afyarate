import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { adminReviewFacilityEdit } from "@/lib/facilities";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const action = typeof (body as Record<string, unknown>)?.action === "string"
    ? (body as Record<string, unknown>).action
    : "";
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
  }

  try {
    await adminReviewFacilityEdit(id, action === "approve");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("admin facility-edit review error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
