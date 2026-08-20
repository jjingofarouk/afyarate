import { NextRequest, NextResponse } from "next/server";
import { getPostsPage } from "@/lib/posts";
import { searchPractitioners, isDbReady } from "@/lib/practitioners";
import { searchFacilities, isFacilitiesReady } from "@/lib/facilities";
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
  if (!q) return NextResponse.json({ items: [], total: 0 });

  const [dbReady, facilitiesReady] = await Promise.all([isDbReady(), isFacilitiesReady()]);

  const [postsPage, practitionerResult, facilityResult] = await Promise.all([
    getPostsPage({ q, limit: PER_KIND_LIMIT }).catch(() => ({ items: [], total: 0 })),
    dbReady
      ? searchPractitioners({ q, sort: "rating", pageSize: PER_KIND_LIMIT }).catch(() => null)
      : Promise.resolve(null),
    facilitiesReady
      ? searchFacilities({ q, sort: "rating", pageSize: PER_KIND_LIMIT }).catch(() => null)
      : Promise.resolve(null),
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

  return NextResponse.json({ items, totals });
}
