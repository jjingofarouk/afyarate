import type { MetadataRoute } from "next";
import { getPractitionerIdsPage, getStats } from "@/lib/practitioners";
import { SITE_URL } from "@/lib/site";

const CHUNK = 50000;

// id 0 = static pages; id N (N>0) = practitioners [(N-1)*CHUNK, N*CHUNK).
export async function generateSitemaps() {
  try {
    const stats = await getStats();
    const practitionerChunks = Math.max(1, Math.ceil(stats.practitioners / CHUNK));
    return Array.from({ length: practitionerChunks + 1 }, (_, i) => ({ id: i }));
  } catch {
    return [{ id: 0 }];
  }
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const chunkId = Number(id) || 0;

  if (chunkId === 0) {
    return [
      { url: SITE_URL, changeFrequency: "daily", priority: 1 },
      { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    ];
  }

  const offset = (chunkId - 1) * CHUNK;
  const rows = await getPractitionerIdsPage(offset, CHUNK);
  return rows.map((r) => ({
    url: `${SITE_URL}/practitioners/${r.id}`,
    lastModified: r.updatedAt ?? undefined,
    changeFrequency: "monthly",
    priority: 0.6,
  }));
}
