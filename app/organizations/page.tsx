import type { Metadata } from "next";
import { getOrganizations } from "@/lib/posts";
import OrganizationDirectory from "@/components/OrganizationDirectory";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse Health Jobs by Organization in Uganda",
  description:
    "Browse medical and health jobs, internships, scholarships, grants and fellowships in Uganda by employer: hospitals, universities, NGOs, government ministries and international organisations.",
  alternates: { canonical: "/organizations" },
  openGraph: {
    title: "Browse Health Jobs by Organization in Uganda · Rate Musawo",
    description:
      "Find health sector jobs and opportunities in Uganda by organisation.",
    type: "website",
  },
};

export default async function OrganizationsPage() {
  const facets = await getOrganizations();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Organizations" },
        ],
      },
      {
        "@type": "CollectionPage",
        name: "Health Jobs by Organization in Uganda",
        description: metadata.description,
        url: `${SITE_URL}/organizations`,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: facets.map((f, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `${f.label} jobs`,
            url: `${SITE_URL}/organizations/${f.slug}`,
          })),
        },
      },
    ],
  };
  return (
    <>
      <OrganizationDirectory
        facets={facets}
        base="/organizations"
        crumb="Organizations"
        listLabel="organization"
        title="Browse Jobs &amp; Opportunities by Organization in Uganda"
        blurb={`${facets.length} hospitals, universities, NGOs, government bodies and international organisations currently have open roles, training or funding. Search or filter to find one, then pick it to see every live opportunity. We update listings daily.`}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
