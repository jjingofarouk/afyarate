import { NextRequest, NextResponse } from "next/server";
import { submitAmbulanceProvider } from "@/lib/ambulances";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;

  const name = typeof b.name === "string" ? b.name.trim() : "";
  const phone = typeof b.phone === "string" ? b.phone.trim() : "";
  if (!name) return NextResponse.json({ error: "Business name is required." }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "A phone number is required." }, { status: 400 });

  try {
    await submitAmbulanceProvider({
      name,
      phone,
      altPhone: typeof b.altPhone === "string" ? b.altPhone.trim() : undefined,
      email: typeof b.email === "string" ? b.email.trim() : undefined,
      city: typeof b.city === "string" ? b.city.trim() : undefined,
      region: typeof b.region === "string" ? b.region.trim() : undefined,
      coverageArea: typeof b.coverageArea === "string" ? b.coverageArea.trim() : undefined,
      vehicleTypes: Array.isArray(b.vehicleTypes) ? (b.vehicleTypes as string[]) : undefined,
      services: Array.isArray(b.services) ? (b.services as string[]) : undefined,
      description: typeof b.description === "string" ? b.description.trim() : undefined,
      imageUrl: typeof b.imageUrl === "string" ? b.imageUrl : undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("ambulance registration error:", err);
    return NextResponse.json({ error: "Could not submit registration." }, { status: 500 });
  }
}
