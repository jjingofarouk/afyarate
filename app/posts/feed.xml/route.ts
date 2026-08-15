import { getPosts } from "@/lib/posts";
import { POST_TYPE_LABELS } from "@/lib/types";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

// RSS feed of published listings — lets feed readers, aggregators and search
// engines (Google, Bing, Yandex) discover new jobs/opportunities the moment
// they go live, without waiting for the next sitemap crawl. getPosts() caches
// in the worker for 5 minutes, so this stays cheap to serve.
export const dynamic = "force-dynamic";

const MAX_ITEMS = 100;

function xml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc822(iso: string | null): string {
  if (!iso) return new Date().toUTCString();
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
}

export async function GET() {
  const posts = [...(await getPosts())]
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .slice(0, MAX_ITEMS);

  const feedUrl = `${SITE_URL}/posts/feed.xml`;

  const items = posts
    .map((p) => {
      const url = `${SITE_URL}/posts/${p.slug}`;
      const label = POST_TYPE_LABELS[p.type].label;
      const desc =
        p.summary ??
        `${p.title} at ${p.organization}${
          p.location ? ` in ${p.location}` : ""
        }, ${p.country ?? "Uganda"}.${
          p.deadline ? ` Deadline: ${p.deadline}.` : " Rolling deadline."
        }`;
      return `    <item>
      <title>${xml(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${rfc822(p.publishedAt)}</pubDate>
      <dc:creator>${xml(p.organization)}</dc:creator>
      <category>${xml(label)}</category>
      <description><![CDATA[${desc}]]></description>
    </item>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${xml(SITE_NAME)} — Jobs &amp; Opportunities in Uganda</title>
  <link>${SITE_URL}/posts</link>
  <description>${xml(SITE_DESCRIPTION)}</description>
  <language>en</language>
  <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
  <lastBuildDate>${rfc822(new Date().toISOString())}</lastBuildDate>
${items}
</channel>
</rss>`;

  return new Response(body, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
