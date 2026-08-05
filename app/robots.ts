import type { MetadataRoute } from "next";
import { getStats } from "@/lib/practitioners";
import { SITE_URL } from "@/lib/site";

const SITEMAP_CHUNK = 50000;

export default async function robots(): Promise<MetadataRoute.Robots> {
  let practitionerChunks = 0;
  try {
    const stats = await getStats();
    practitionerChunks = Math.ceil(stats.practitioners / SITEMAP_CHUNK);
  } catch {
    practitionerChunks = 0;
  }

  const sitemap = Array.from(
    { length: practitionerChunks + 1 },
    (_, i) => `${SITE_URL}/sitemap/${i}.xml`,
  );

  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap,
    host: SITE_URL,
  };
}
