import { getClaimedPractitionerCount, getStats } from "@/lib/practitioners";
import { getFacilityStats } from "@/lib/facilities";
import { SITE_URL } from "@/lib/site";

// Keep chunks under Supabase's 1,000-row response cap so every URL actually
// makes it into the sitemap (a 50k request silently returns only the first
// 1,000 rows). A valid sitemap index lists up to 50,000 entries.
//
// Chunk layout (see app/sitemap/[id]/route.ts):
//   0                                     -> static + type landing + help pages
//   1                                     -> posts (detail + facet) + practitioner-profession
//   2 .. 1+facilityChunks                 -> facilities detail pages
//   next claimedChunks                    -> CLAIMED (paid/verified) practitioners,
//                                            name-slug URLs, crawled first
//   remainder                             -> all practitioners, name-slug URLs
export const dynamic = "force-static";
export const revalidate = 3600;

const CHUNK = 1000;

export async function GET() {
  const [statsResult, fstatsResult, claimedResult] = await Promise.allSettled([
    getStats(),
    getFacilityStats(),
    getClaimedPractitionerCount(),
  ]);
  const practitionerChunks =
    statsResult.status === "fulfilled"
      ? Math.max(0, Math.ceil(statsResult.value.practitioners / CHUNK))
      : 0;
  const facilityChunks =
    fstatsResult.status === "fulfilled"
      ? Math.max(0, Math.ceil(fstatsResult.value.total / CHUNK))
      : 0;
  const claimedChunks =
    claimedResult.status === "fulfilled"
      ? Math.max(0, Math.ceil(claimedResult.value / CHUNK))
      : 0;

  const total = 2 + facilityChunks + claimedChunks + practitionerChunks;
  const urls = Array.from(
    { length: total },
    (_, i) => `${SITE_URL}/sitemap/${i}`,
  );
  // This index itself is regenerated hourly (see `revalidate` above), so
  // "now" is an accurate-enough lastmod for every shard without an extra
  // query per shard to find its true max(updated_at).
  const lastmod = new Date().toISOString().slice(0, 10);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <sitemap><loc>${u}</loc><lastmod>${lastmod}</lastmod></sitemap>`).join("\n")}
</sitemapindex>`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
