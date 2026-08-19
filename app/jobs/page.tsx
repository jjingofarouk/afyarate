import type { Metadata } from "next";
import { getPosts, slugify } from "@/lib/posts";
import type { FacetItem } from "@/lib/posts";
import FacetHub from "@/components/FacetHub";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Medical & Health Jobs in Uganda by Profession (${new Date().getFullYear()})`,
  description:
    `Browse current medical and health job vacancies in Uganda by profession: doctors, nurses, clinical officers, midwives, lab technicians and more. Updated daily on ${SITE_NAME}.`,
  alternates: { canonical: "/jobs" },
  openGraph: {
    title: `Health Jobs in Uganda by Profession · ${SITE_NAME}`,
    description:
      "Find health sector job openings in Uganda filtered by your profession: doctors, nurses, lab techs, midwives and more.",
    type: "website",
  },
};

/** Build profession facets scoped to job-type posts only. */
async function getJobProfessions(): Promise<FacetItem[]> {
  const posts = await getPosts({ type: "job" });
  const map = new Map<string, FacetItem>();
  for (const p of posts) {
    const raw = p.profession;
    if (!raw) continue;
    const label = raw.trim();
    if (!label) continue;
    const slug = slugify(label);
    const item = map.get(slug);
    if (item) item.count++;
    else map.set(slug, { slug, label, count: 1 });
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export default async function JobsPage() {
  const facets = await getJobProfessions();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Jobs by Profession" },
        ],
      },
      {
        "@type": "CollectionPage",
        name: `Medical & Health Jobs in Uganda by Profession`,
        description: metadata.description,
        url: `${SITE_URL}/jobs`,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: facets.map((f, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `${f.label} jobs in Uganda`,
            url: `${SITE_URL}/jobs/${f.slug}`,
          })),
        },
      },
    ],
  };

  return (
    <>
      <FacetHub
        facets={facets}
        base="/jobs"
        crumb="Jobs by Profession"
        listLabel="profession"
        title="Browse Medical &amp; Health Jobs by Profession in Uganda"
        blurb={`${facets.length} profession${facets.length === 1 ? "" : "s"} currently have open job vacancies in Uganda. Pick yours to see every live job listing for that role, updated daily.`}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
