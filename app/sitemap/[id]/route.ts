import { getPosts, getProfessions, getLocations, getOrganizations, slugify } from "@/lib/posts";
import { getPractitionerIdsPage, getProfessionCounts, getStats } from "@/lib/practitioners";
import { getFacilityCities, getFacilityIdsPage, getFacilityStats } from "@/lib/facilities";
import { HELP_ARTICLES } from "@/data/help";
import { POST_TYPE_LABELS, POST_TYPES } from "@/lib/types";
import { SITE_URL } from "@/lib/site";

// Keep chunks under Supabase's 1,000-row response cap so every URL makes it
// into the sitemap (a 50k request silently returns only the first 1,000 rows).
// Chunk layout:
//   0                                     -> static + type landing + help pages
//   1                                     -> posts (detail + facet) + practitioner-profession
//   2 .. 1+facilityChunks                 -> facilities detail pages
//   (2+facilityChunks) ..                 -> practitioners
export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 3600;

const CHUNK = 1000;

export async function generateStaticParams() {
  const [statsResult, fstatsResult] = await Promise.allSettled([getStats(), getFacilityStats()]);
  const practitionerChunks =
    statsResult.status === "fulfilled"
      ? Math.max(0, Math.ceil(statsResult.value.practitioners / CHUNK))
      : 0;
  const facilityChunks =
    fstatsResult.status === "fulfilled"
      ? Math.max(0, Math.ceil(fstatsResult.value.total / CHUNK))
      : 0;
  return Array.from({ length: 2 + facilityChunks + practitionerChunks }, (_, i) => ({
    id: String(i),
  }));
}

function validDate(s: string | null | undefined): string | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

interface Entry {
  url: string;
  lastmod?: string | null;
  priority?: number;
  freq?: string;
}

function xml(url: string): string {
  return url
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildXml(entries: Entry[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map((e) => {
    const lastmod = validDate(e.lastmod);
    return `  <url>
    <loc>${xml(e.url)}</loc>
${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ""}${e.priority != null ? `    <priority>${e.priority}</priority>\n` : ""}${e.freq ? `    <changefreq>${e.freq}</changefreq>\n` : ""}  </url>`;
  })
  .join("\n")}
</urlset>`;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await ctx.params;
  const chunkId = Number(id) || 0;

  let facilityChunks = 0;
  try {
    const fstats = await getFacilityStats();
    facilityChunks = Math.max(0, Math.ceil(fstats.total / CHUNK));
  } catch {
    facilityChunks = 0;
  }
  const PRACTITIONER_START = 2 + facilityChunks;

  let entries: Entry[] = [];

  if (chunkId === 0) {
    entries = [
      { url: SITE_URL, priority: 1, freq: "daily" },
      { url: `${SITE_URL}/posts`, priority: 0.9, freq: "daily" },
      { url: `${SITE_URL}/posts/new`, priority: 0.4, freq: "weekly" },
      ...POST_TYPES.map((t) => ({
        url: `${SITE_URL}/${POST_TYPE_LABELS[t].plural.toLowerCase()}`,
        priority: 0.9,
        freq: "daily",
      })),
      { url: `${SITE_URL}/professions`, priority: 0.6, freq: "weekly" },
      { url: `${SITE_URL}/locations`, priority: 0.6, freq: "weekly" },
      { url: `${SITE_URL}/organizations`, priority: 0.6, freq: "weekly" },
      { url: `${SITE_URL}/practitioners`, priority: 0.7, freq: "weekly" },
      { url: `${SITE_URL}/facilities`, priority: 0.7, freq: "weekly" },
      { url: `${SITE_URL}/about`, priority: 0.4, freq: "monthly" },
      { url: `${SITE_URL}/contact`, priority: 0.3, freq: "monthly" },
      { url: `${SITE_URL}/terms`, priority: 0.2, freq: "yearly" },
      { url: `${SITE_URL}/privacy`, priority: 0.2, freq: "yearly" },
      { url: `${SITE_URL}/help`, priority: 0.5, freq: "monthly" },
      { url: `${SITE_URL}/stats`, priority: 0.6, freq: "weekly" },
      { url: `${SITE_URL}/stats/uganda`, priority: 0.7, freq: "weekly" },
      ...HELP_ARTICLES.map((a) => ({
        url: `${SITE_URL}/help/${a.slug}`,
        priority: 0.4,
        freq: "monthly",
      })),
    ];
  } else if (chunkId === 1) {
    // getProfessions/getLocations/getOrganizations all derive from getPosts()'
    // in-memory cache, so they're cheap once posts is loaded, but posts and
    // facility cities are two genuinely separate DB calls with no dependency
    // on each other. Run them concurrently instead of back to back, one slow
    // Supabase round trip is enough to push a Worker close to its request
    // time limit and turn a large chunk like this one into a 5xx.
    const [posts, professions, professionCounts, locations, organizations, facilityCities] =
      await Promise.all([
        getPosts(),
        getProfessions(),
        getProfessionCounts(),
        getLocations(),
        getOrganizations(),
        getFacilityCities(),
      ]);

    for (const p of posts) {
      entries.push({
        url: `${SITE_URL}/posts/${p.slug}`,
        lastmod: p.publishedAt ?? undefined,
        priority: 0.8,
        freq: "daily",
      });
    }
    for (const f of professions) {
      entries.push({
        url: `${SITE_URL}/professions/${f.slug}`,
        priority: 0.6,
        freq: "weekly",
      });
    }
    for (const f of professionCounts) {
      entries.push({
        url: `${SITE_URL}/practitioners/profession/${slugify(f.profession)}`,
        priority: 0.7,
        freq: "weekly",
      });
    }
    for (const f of locations) {
      entries.push(
        { url: `${SITE_URL}/locations/${f.slug}`, priority: 0.6, freq: "weekly" },
        { url: `${SITE_URL}/stats/${f.slug}`, priority: 0.6, freq: "weekly" },
      );
    }
    for (const f of organizations) {
      entries.push({
        url: `${SITE_URL}/organizations/${f.slug}`,
        priority: 0.6,
        freq: "weekly",
      });
    }
    for (const city of facilityCities) {
      const citySlug = slugify(city);
      entries.push(
        {
          url: `${SITE_URL}/facilities/hospital/${citySlug}`,
          priority: 0.6,
          freq: "weekly",
        },
        {
          url: `${SITE_URL}/facilities/pharmacy/${citySlug}`,
          priority: 0.6,
          freq: "weekly",
        },
      );
    }
  } else if (chunkId < PRACTITIONER_START) {
    // Facilities detail pages (hospitals & pharmacies).
    const offset = (chunkId - 2) * CHUNK;
    const rows = await getFacilityIdsPage(offset, CHUNK);
    entries = rows.map((r) => ({
      url: `${SITE_URL}/facilities/${r.slug}`,
      lastmod: r.updatedAt ?? undefined,
      priority: 0.6,
      freq: "weekly",
    }));
  } else {
    const offset = (chunkId - PRACTITIONER_START) * CHUNK;
    const rows = await getPractitionerIdsPage(offset, CHUNK);
    entries = rows.map((r) => ({
      url: `${SITE_URL}/practitioners/${r.id}`,
      lastmod: r.updatedAt ?? undefined,
      priority: 0.6,
      freq: "monthly",
    }));
  }

  return new Response(buildXml(entries), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
