import type { Metadata } from "next";
import { getProfessions } from "@/lib/posts";
import FacetHub from "@/components/FacetHub";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse Health Jobs by Profession in Uganda",
  description:
    "Browse medical and health jobs, internships, scholarships, grants and fellowships in Uganda by profession: doctors, nurses, clinical officers, midwives, lab technicians and more.",
  alternates: { canonical: "/professions" },
  openGraph: {
    title: "Browse Health Jobs by Profession in Uganda · Rate Musawo",
    description:
      "Find health sector jobs and opportunities in Uganda by profession.",
    type: "website",
  },
};

export default async function ProfessionsPage() {
  const facets = await getProfessions();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Professions" },
        ],
      },
      {
        "@type": "CollectionPage",
        name: "Health Jobs by Profession in Uganda",
        description: metadata.description,
        url: `${SITE_URL}/professions`,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: facets.map((f, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `${f.label} jobs in Uganda`,
            url: `${SITE_URL}/professions/${f.slug}`,
          })),
        },
      },
    ],
  };
  return (
    <>
      <FacetHub
        facets={facets}
        base="/professions"
        crumb="Professions"
        listLabel="profession"
        title="Browse Jobs &amp; Opportunities by Profession in Uganda"
        blurb={`${facets.length} professions currently have open roles, training or funding. Pick one to see every live opportunity for that role. We update listings daily.`}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
