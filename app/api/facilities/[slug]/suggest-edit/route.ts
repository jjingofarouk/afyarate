import { NextRequest, NextResponse } from "next/server";
import { getFacility, submitFacilityEditSuggestion } from "@/lib/facilities";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;

  const description = typeof b.description === "string" ? b.description.trim() : "";
  const services = Array.isArray(b.services) ? (b.services as string[]).filter(Boolean) : [];
  const phone = typeof b.phone === "string" ? b.phone.trim() : "";

  if (!description && services.length === 0 && !phone) {
    return NextResponse.json({ error: "Add at least one update before submitting." }, { status: 400 });
  }

  try {
    const facility = await getFacility(slug);
    if (!facility) return NextResponse.json({ error: "Facility not found." }, { status: 404 });

    await submitFacilityEditSuggestion({
      facilityId: facility.id,
      suggestedDescription: description || undefined,
      suggestedServices: services.length ? services : undefined,
      suggestedPhone: phone || undefined,
      submittedByName: typeof b.name === "string" ? b.name.slice(0, 100) : undefined,
      submittedByEmail: typeof b.email === "string" ? b.email.slice(0, 200) : undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("facility edit suggestion error:", err);
    return NextResponse.json({ error: "Could not submit update." }, { status: 500 });
  }
}
