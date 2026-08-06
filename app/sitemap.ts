import type { MetadataRoute } from "next";
import { getPosts, getProfessions, getLocations, getOrganizations } from "@/lib/posts";
import { getPractitionerIdsPage, getStats } from "@/lib/practitioners";
import { HELP_ARTICLES } from "@/data/help";
import { POST_TYPE_LABELS, POST_TYPES } from "@/lib/types";
import { SITE_URL } from "@/lib/site";

const CHUNK = 50000;

// Chunk layout:
//   id 0  -> static + type landing pages
//   id 1  -> posts (detail + profession + location + organization pages)
//   id 2+ -> practitioners
export async function generateSitemaps() {
  try {
    const stats = await getStats();
    const practitionerChunks = Math.max(0, Math.ceil(stats.practitioners / CHUNK));
    return Array.from({ length: 2 + practitionerChunks }, (_, i) => ({ id: i }));
  } catch {
    return [{ id: 0 }, { id: 1 }];
  }
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const chunkId = Number(id) || 0;

  if (chunkId === 0) {
    const typePages: MetadataRoute.Sitemap = POST_TYPES.map((t) => ({
      url: `${SITE_URL}/${POST_TYPE_LABELS[t].plural.toLowerCase()}`,
      changeFrequency: "daily",
      priority: 0.9,
    }));
    return [
      { url: SITE_URL, changeFrequency: "daily", priority: 1 },
      { url: `${SITE_URL}/posts`, changeFrequency: "daily", priority: 0.9 },
      { url: `${SITE_URL}/posts/new`, changeFrequency: "weekly", priority: 0.4 },
      ...typePages,
      { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.4 },
      { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.3 },
      { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
      { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
      { url: `${SITE_URL}/help`, changeFrequency: "monthly", priority: 0.5 },
      ...HELP_ARTICLES.map((a) => ({
        url: `${SITE_URL}/help/${a.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.4,
      })),
    ];
  }

  if (chunkId === 1) {
    const entries: MetadataRoute.Sitemap = [];
    for (const p of await getPosts()) {
      entries.push({
        url: `${SITE_URL}/posts/${p.slug}`,
        lastModified: p.publishedAt ?? undefined,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
    for (const f of await getProfessions()) {
      entries.push({
        url: `${SITE_URL}/professions/${f.slug}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
    for (const f of await getLocations()) {
      entries.push({
        url: `${SITE_URL}/locations/${f.slug}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
    for (const f of await getOrganizations()) {
      entries.push({
        url: `${SITE_URL}/organizations/${f.slug}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
    return entries;
  }

  // Practitioners.
  const offset = (chunkId - 2) * CHUNK;
  const rows = await getPractitionerIdsPage(offset, CHUNK);
  return rows.map((r) => ({
    url: `${SITE_URL}/practitioners/${r.id}`,
    lastModified: r.updatedAt ?? undefined,
    changeFrequency: "monthly",
    priority: 0.6,
  }));
}
