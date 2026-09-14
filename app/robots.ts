import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep crawl budget on indexable content: the admin panel requires
        // auth, the newsletter manage links are per-subscriber tokens, and
        // the API routes have no HTML to index.
        disallow: ["/admin", "/admin/", "/newsletter/manage", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
