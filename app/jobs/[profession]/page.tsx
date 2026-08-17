import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPosts, slugify, facetOptions } from "@/lib/posts";
import type { FacetItem } from "@/lib/posts";
import PostBoard from "@/components/PostBoard";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const INITIAL_COUNT = 12;

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build profession facets from job-type posts only. */
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

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ profession: string }>;
}): Promise<Metadata> {
  const { profession: slug } = await params;
  const facets = await getJobProfessions();
  const facet = facets.find((f) => f.slug === slug);
  if (!facet) return {};

  const year = new Date().getFullYear();
  const title = `${facet.label} Jobs in Uganda (${year})`;
  const description = `Find ${facet.label} job vacancies in Uganda — ${facet.count} current ${facet.label} job${facet.count === 1 ? "" : "s"} listed on ${SITE_NAME}. Hospitals, NGOs, government and universities.`;

  return {
    title,
    description,
    alternates: { canonical: `/jobs/${facet.slug}` },
    openGraph: {
      title: `${facet.label} Jobs in Uganda · ${SITE_NAME}`,
      description: `Browse ${facet.count} current ${facet.label} job${facet.count === 1 ? "" : "s"} and vacancies in Uganda.`,
      type: "website",
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function JobProfessionPage({
  params,
}: {
  params: Promise<{ profession: string }>;
}) {
  const { profession: slug } = await params;

  // Validate the slug against live data so unknown slugs → 404.
  const facets = await getJobProfessions();
  const facet = facets.find((f) => f.slug === slug);
  if (!facet) notFound();

  const posts = await getPosts({ type: "job", profession: slug });
  const year = new Date().getFullYear();

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Jobs by Profession", item: `${SITE_URL}/jobs` },
      { "@type": "ListItem", position: 3, name: `${facet.label} Jobs` },
    ],
  };

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${facet.label} Jobs in Uganda`,
    description: `${facet.count} open ${facet.label} job${facet.count === 1 ? "" : "s"} in Uganda.`,
    url: `${SITE_URL}/jobs/${facet.slug}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.slice(0, 20).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/posts/${p.slug}`,
      })),
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 text-xs text-slate-400 dark:text-slate-500">
        <a href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">Home</a>
        <span className="mx-1.5">/</span>
        <a href="/jobs" className="hover:text-emerald-700 dark:hover:text-emerald-400">Jobs by Profession</a>
        <span className="mx-1.5">/</span>
        <span className="text-slate-600 dark:text-slate-400">{facet.label}</span>
      </nav>

      {/* Header */}
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {facet.label} Jobs in Uganda ({year})
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {facet.count} {facet.count === 1 ? "vacancy is" : "vacancies are"} currently open for{" "}
          {facet.label}s in Uganda — across hospitals, clinics, universities, NGOs and government.
          New listings are added every week.
        </p>
      </header>

      {/* Cross-links */}
      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={`/professions/${facet.slug}`}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          All {facet.label} opportunities →
        </a>
        <a
          href={`/practitioners/profession/${facet.slug}`}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
        >
          Find a registered {facet.label} →
        </a>
      </div>

      {/* Job board */}
      {posts.length === 0 ? (
        <p className="mt-10 text-sm text-slate-500 dark:text-slate-400">
          No {facet.label} jobs are listed right now. Browse{" "}
          <a href="/jobs" className="text-emerald-700 underline dark:text-emerald-400">
            all professions
          </a>{" "}
          or{" "}
          <a href="/posts" className="text-emerald-700 underline dark:text-emerald-400">
            all listings
          </a>
          .
        </p>
      ) : (
        <div className="mt-8">
          <PostBoard
            initialPosts={posts.slice(0, INITIAL_COUNT)}
            total={posts.length}
            type="job"
            profession={slug}
            locations={facetOptions(posts, (p) => p.location)}
          />
        </div>
      )}

      {/* Footer cross-links to other profession job pages */}
      <p className="mt-10 border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        Jobs by profession:{" "}
        {facets
          .filter((f) => f.slug !== facet.slug)
          .slice(0, 8)
          .map((f, i) => (
            <span key={f.slug}>
              {i > 0 && " · "}
              <a href={`/jobs/${f.slug}`} className="text-emerald-700 underline dark:text-emerald-400">
                {f.label}
              </a>
            </span>
          ))}
      </p>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumbLd, collectionLd]) }}
      />
    </div>
  );
}
