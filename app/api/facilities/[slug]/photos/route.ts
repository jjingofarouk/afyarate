import { NextRequest, NextResponse } from "next/server";
import { getFacility, submitFacilityPhoto } from "@/lib/facilities";

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
  const imageUrl = typeof b.imageUrl === "string" ? b.imageUrl.trim() : "";
  const storagePath = typeof b.storagePath === "string" ? b.storagePath.trim() : "";
  if (!imageUrl || !storagePath) {
    return NextResponse.json({ error: "Missing photo." }, { status: 400 });
  }

  try {
    const facility = await getFacility(slug);
    if (!facility) return NextResponse.json({ error: "Facility not found." }, { status: 404 });

    await submitFacilityPhoto({
      facilityId: facility.id,
      imageUrl,
      storagePath,
      submittedByName: typeof b.name === "string" ? b.name.slice(0, 100) : undefined,
      submittedByEmail: typeof b.email === "string" ? b.email.slice(0, 200) : undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("facility photo submission error:", err);
    return NextResponse.json({ error: "Could not submit photo." }, { status: 500 });
  }
}
