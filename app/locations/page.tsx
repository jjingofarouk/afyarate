import type { Metadata } from "next";
import { getLocations } from "@/lib/posts";
import FacetHub from "@/components/FacetHub";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse Health Jobs by Location in Uganda",
  description:
    "Browse medical and health jobs, internships, scholarships, grants and fellowships in Uganda by location — Kampala, Mbarara, Gulu, Jinja, Arua and more.",
  alternates: { canonical: "/locations" },
  openGraph: {
    title: "Browse Health Jobs by Location in Uganda · Rate Musawo",
    description:
      "Find health sector jobs and opportunities in Uganda by location.",
    type: "website",
  },
};

export default async function LocationsPage() {
  const facets = await getLocations();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Locations" },
        ],
      },
      {
        "@type": "CollectionPage",
        name: "Health Jobs by Location in Uganda",
        description: metadata.description,
        url: `${SITE_URL}/locations`,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: facets.map((f, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `Healthcare jobs in ${f.label}`,
            url: `${SITE_URL}/locations/${f.slug}`,
          })),
        },
      },
    ],
  };
  return (
    <>
      <FacetHub
        facets={facets}
        base="/locations"
        crumb="Locations"
        listLabel="location"
        title="Browse Jobs &amp; Opportunities by Location in Uganda"
        blurb={`${facets.length} locations across Uganda currently have open roles, training or funding — pick one to see every live opportunity there. We update listings daily.`}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
