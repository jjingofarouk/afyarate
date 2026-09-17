import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME}: Rate Uganda's Health Workers`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    // Brand green from the RateMusawo logo (emerald-600).
    theme_color: "#059669",
    icons: [{ src: "/logo-mark.png", sizes: "512x512", type: "image/png", purpose: "any" }],
  };
}
