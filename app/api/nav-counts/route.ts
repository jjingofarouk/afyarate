import { NextResponse } from "next/server";
import { getPosts } from "@/lib/posts";
import { getStats } from "@/lib/practitioners";
import { getFacilityStats } from "@/lib/facilities";
import { createServerClient } from "@/lib/supabase/server";
import { POST_TYPES } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 300;

// Lightweight counts for nav badges. Posts reuse getPosts()' existing
// in-memory cache (no extra DB load); practitioners/facilities reuse their
// own cached stats helpers. Only ambulances needs a fresh small count query.
export async function GET() {
  const [posts, practitionerStats, facilityStats, ambulanceResult] = await Promise.allSettled([
    getPosts(),
    getStats(),
    getFacilityStats(),
    createServerClient()
      .from("ambulance_providers")
      .select("id", { count: "estimated", head: true })
      .eq("status", "approved"),
  ]);

  const byType: Record<string, number> = {};
  if (posts.status === "fulfilled") {
    for (const t of POST_TYPES) byType[t] = 0;
    for (const p of posts.value) byType[p.type] = (byType[p.type] ?? 0) + 1;
  }

  return NextResponse.json({
    byType,
    total: posts.status === "fulfilled" ? posts.value.length : 0,
    practitioners: practitionerStats.status === "fulfilled" ? practitionerStats.value.practitioners : 0,
    facilities: facilityStats.status === "fulfilled" ? facilityStats.value.total : 0,
    ambulances:
      ambulanceResult.status === "fulfilled" ? ambulanceResult.value.count ?? 0 : 0,
  });
}
