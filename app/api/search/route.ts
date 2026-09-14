import { NextRequest, NextResponse } from "next/server";
import { getPostsPage } from "@/lib/posts";
import { searchPractitioners } from "@/lib/practitioners";
import { searchFacilities } from "@/lib/facilities";
import { POST_TYPE_LABELS, FACILITY_KIND_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export interface SearchHit {
  kind: "post" | "practitioner" | "facility";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  imageUrl: string | null;
}

// One combined dropdown across jobs/opportunities, licensed practitioners
// (doctors, nurses, etc.) and facilities (hospitals & pharmacies), so the
// header search box covers everything the site indexes, not just posts.
const PER_KIND_LIMIT = 4;

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  // Public, slow-changing data: let browsers reuse identical autocomplete
  // queries briefly so retyping resolves instantly without a round trip.
  const cacheHeaders = {
    "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
  };
  if (!q) return NextResponse.json({ items: [], total: 0 }, { headers: cacheHeaders });

  // NOTE: practitioners are searched with sort "name" (not "rating") so the
  // header covers the whole registry. sort "rating" filters to practitioners
  // with rating_count > 0, which would hide ~all unrated clinicians here.
  // No separate readiness probes: each lookup already falls back to empty on
  // error, and skipping the probes saves a full sequential database round
  // trip on every keystroke.
  const [postsPage, practitionerResult, facilityResult] = await Promise.all([
    getPostsPage({ q, limit: PER_KIND_LIMIT }).catch(() => ({ items: [], total: 0 })),
    searchPractitioners({ q, sort: "name", pageSize: PER_KIND_LIMIT, countMode: "estimated" }).catch(() => null),
    searchFacilities({ q, sort: "rating", pageSize: PER_KIND_LIMIT, countMode: "estimated" }).catch(() => null),
  ]);

  const postHits: SearchHit[] = postsPage.items.map((p) => ({
    kind: "post",
    id: `post-${p.id}`,
    title: p.title,
    subtitle: `${POST_TYPE_LABELS[p.type].label} · ${p.organization}`,
    href: `/posts/${p.slug}`,
    imageUrl: p.imageUrl,
  }));

  const practitionerHits: SearchHit[] = (practitionerResult?.items ?? []).map((p) => ({
    kind: "practitioner",
    id: `practitioner-${p.id}`,
    title: p.name,
    subtitle: [p.profession, p.council].filter(Boolean).join(" · ") || "Licensed practitioner",
    href: `/practitioners/${p.id}`,
    imageUrl: p.imageUrl,
  }));

  const facilityHits: SearchHit[] = (facilityResult?.items ?? []).map((f) => ({
    kind: "facility",
    id: `facility-${f.id}`,
    title: f.name,
    subtitle: [FACILITY_KIND_LABELS[f.kind].label, f.city].filter(Boolean).join(" · "),
    href: `/facilities/${f.slug}`,
    imageUrl: f.imageUrl,
  }));

  const items = [...postHits, ...practitionerHits, ...facilityHits];
  const totals = {
    post: postsPage.total,
    practitioner: practitionerResult?.total ?? 0,
    facility: facilityResult?.total ?? 0,
  };

  return NextResponse.json({ items, totals }, { headers: cacheHeaders });
}
