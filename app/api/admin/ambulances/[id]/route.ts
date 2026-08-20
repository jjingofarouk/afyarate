import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { adminUpdateAmbulance } from "@/lib/ambulances";

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
  const b = (body ?? {}) as Record<string, unknown>;
  const action = typeof b.action === "string" ? b.action : "";

  const changes: Record<string, unknown> = {};
  if (action === "approve") changes.status = "approved";
  else if (action === "reject") changes.status = "rejected";
  else if (action === "feature") changes.featured = true;
  else if (action === "unfeature") changes.featured = false;
  else return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  try {
    const provider = await adminUpdateAmbulance(id, changes);
    return NextResponse.json({ provider });
  } catch (err) {
    console.error("admin ambulance update error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
