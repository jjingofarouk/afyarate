import { getChunkCounts } from "@/lib/sitemap-chunks";
import { SITE_URL } from "@/lib/site";

// Sitemap index over the sharded /sitemap/[id] route.
//
// Chunk layout (see app/sitemap/[id]/route.ts):
//   0                                     -> static + type landing + help + /best pages
//   1                                     -> posts (detail + facet) + practitioner-profession + jobs-by-profession
//   2 .. 1+facilityChunks                 -> facilities detail pages
//   next claimedChunks                    -> CLAIMED (paid/verified) practitioners
//   remainder                             -> all practitioners, name-slug URLs
//
// The index is regenerated hourly and derives the shard list from the shared
// getChunkCounts() helper in lib/sitemap-chunks, which falls back to
// last-known-good counts when Supabase hiccups so the shard list never
// collapses (a collapsed index would drop already-discovered URLs).
export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const { facilityChunks, claimedChunks, practitionerChunks } = await getChunkCounts();

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
