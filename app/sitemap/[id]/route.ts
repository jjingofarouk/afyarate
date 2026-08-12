import { getPosts, getProfessions, getLocations, getOrganizations, slugify } from "@/lib/posts";
import { getPractitionerIdsPage, getProfessionCounts, getStats } from "@/lib/practitioners";
import { HELP_ARTICLES } from "@/data/help";
import { POST_TYPE_LABELS, POST_TYPES } from "@/lib/types";
import { SITE_URL } from "@/lib/site";

// Keep chunks under Supabase's 1,000-row response cap so every practitioner
// makes it into the sitemap (a 50k request silently returns only the first
// 1,000 rows). The index (/sitemap.xml) lists 2 + ceil(practitioners/1000)
// chunks; offsets below match that layout.
export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 3600;

const CHUNK = 1000;

export async function generateStaticParams() {
  let practitionerChunks = 0;
  try {
    const stats = await getStats();
    practitionerChunks = Math.max(0, Math.ceil(stats.practitioners / CHUNK));
  } catch {
    practitionerChunks = 0;
  }
  return Array.from({ length: 2 + practitionerChunks }, (_, i) => ({
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

// Chunk layout:
//   id 0  -> static + type landing + help pages
//   id 1  -> posts (detail + profession + location + organization pages)
//   id 2+ -> practitioners
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await ctx.params;
  const chunkId = Number(id) || 0;

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
      { url: `${SITE_URL}/about`, priority: 0.4, freq: "monthly" },
      { url: `${SITE_URL}/contact`, priority: 0.3, freq: "monthly" },
      { url: `${SITE_URL}/terms`, priority: 0.2, freq: "yearly" },
      { url: `${SITE_URL}/privacy`, priority: 0.2, freq: "yearly" },
      { url: `${SITE_URL}/help`, priority: 0.5, freq: "monthly" },
      ...HELP_ARTICLES.map((a) => ({
        url: `${SITE_URL}/help/${a.slug}`,
        priority: 0.4,
        freq: "monthly",
      })),
    ];
  } else if (chunkId === 1) {
    for (const p of await getPosts()) {
      entries.push({
        url: `${SITE_URL}/posts/${p.slug}`,
        lastmod: p.publishedAt ?? undefined,
        priority: 0.8,
        freq: "daily",
      });
    }
    for (const f of await getProfessions()) {
      entries.push({
        url: `${SITE_URL}/professions/${f.slug}`,
        priority: 0.6,
        freq: "weekly",
      });
    }
    for (const f of await getProfessionCounts()) {
      entries.push({
        url: `${SITE_URL}/practitioners/profession/${slugify(f.profession)}`,
        priority: 0.7,
        freq: "weekly",
      });
    }
    for (const f of await getLocations()) {
      entries.push({
        url: `${SITE_URL}/locations/${f.slug}`,
        priority: 0.6,
        freq: "weekly",
      });
    }
    for (const f of await getOrganizations()) {
      entries.push({
        url: `${SITE_URL}/organizations/${f.slug}`,
        priority: 0.6,
        freq: "weekly",
      });
    }
  } else {
    const offset = (chunkId - 2) * CHUNK;
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
