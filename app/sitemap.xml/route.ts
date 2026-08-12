import { getStats } from "@/lib/practitioners";
import { SITE_URL } from "@/lib/site";

// Keep chunks under Supabase's 1,000-row response cap so every practitioner
// actually makes it into the sitemap. With ~114k practitioners that's ~115
// chunks plus 2 (static + posts) — a valid sitemap index lists up to 50,000.
export const dynamic = "force-static";
export const revalidate = 3600;

const CHUNK = 1000;

export async function generateStaticParams() {
  return [{ id: "0" }];
}

export async function GET() {
  let practitionerChunks = 0;
  try {
    const stats = await getStats();
    practitionerChunks = Math.max(0, Math.ceil(stats.practitioners / CHUNK));
  } catch {
    practitionerChunks = 0;
  }

  const total = 2 + practitionerChunks;
  const urls = Array.from(
    { length: total },
    (_, i) => `${SITE_URL}/sitemap/${i}`,
  );

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <sitemap><loc>${u}</loc></sitemap>`).join("\n")}
</sitemapindex>`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
