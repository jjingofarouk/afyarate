import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPosts, getProfessions, slugify, facetOptions } from "@/lib/posts";
import PostBoard from "@/components/PostBoard";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const INITIAL_COUNT = 12;

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const facets = await getProfessions();
  const facet = facets.find((f) => f.slug === slug);
  if (!facet) return {};
  return {
    title: `${facet.label} Jobs in Uganda (${new Date().getFullYear()})`,
    description: `Find ${facet.label} jobs, fellowships, scholarships and grants in Uganda. ${facet.count} current ${facet.label} opportunity${facet.count === 1 ? "" : "s"} on ${SITE_NAME}.`,
    alternates: { canonical: `/professions/${facet.slug}` },
    openGraph: {
      title: `${facet.label} Jobs in Uganda · ${SITE_NAME}`,
      description: `Browse ${facet.count} current ${facet.label} jobs and opportunities in Uganda.`,
      type: "website",
    },
  };
}

export default async function ProfessionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const facets = await getProfessions();
  const facet = facets.find((f) => f.slug === slug);
  if (!facet) notFound();
  const posts = await getPosts({ profession: slug });
  const salaryPosts = posts.filter((post) => post.salary).slice(0, 3);
  const topEmployers = [...new Set(posts.map((post) => post.organization))].slice(0, 5);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Jobs & Opportunities",
        item: `${SITE_URL}/posts`,
      },
      { "@type": "ListItem", position: 3, name: `${facet.label} jobs` },
    ],
  };

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${facet.label} Jobs & Opportunities in Uganda`,
    description: `${facet.count} open ${facet.label} jobs and opportunities in Uganda.`,
    url: `${SITE_URL}/professions/${facet.slug}`,
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
      <nav className="mb-6 text-xs text-slate-400 dark:text-slate-500">
        <a href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">Home</a>
        <span className="mx-1.5">/</span>
        <a href="/posts" className="hover:text-emerald-700 dark:hover:text-emerald-400">Jobs &amp; Opportunities</a>
        <span className="mx-1.5">/</span>
        <span className="text-slate-600 dark:text-slate-400">{facet.label}</span>
      </nav>

      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {facet.label} Jobs &amp; Opportunities in Uganda
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {facet.count} {facet.count === 1 ? "listing is" : "listings are"} currently open
          for {facet.label} roles and training in Uganda, from hospitals, universities,
          NGOs and government. Check back often as we add new opportunities every week.
        </p>
      </header>

      <a
        href={`/practitioners/profession/${facet.slug}`}
        className="mt-5 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
      >
        Looking for a registered {facet.label}? Browse {facet.label}s in Uganda →
      </a>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
            How to become a {facet.label} in Uganda
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Follow the accredited training path for your cadre, complete any required internship or
            supervised practice, and keep your registration and practising licence current.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            <li>Pick an accredited training programme that matches the cadre you want.</li>
            <li>Track licensing and registration deadlines through the council and registry.</li>
            <li>Use live job openings to see which employers are hiring right now.</li>
            <li>Keep CPD and specialty training in mind as you plan your career path.</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="/help/how-does-rate-musawo-work"
              className="text-sm font-medium text-emerald-700 underline dark:text-emerald-400"
            >
              How verification works →
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Salary signals and active employers
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            These live listings show what employers are currently advertising for {facet.label}
            roles.
          </p>
          {salaryPosts.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {salaryPosts.map((post) => (
                <li key={post.slug} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {post.title}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {post.organization}
                  </div>
                  {post.salary && (
                    <div className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      Salary: {post.salary}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              No salary data has been captured yet for this profession.
            </p>
          )}
          {topEmployers.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {topEmployers.map((org) => (
                <a
                  key={org}
                  href={`/organizations/${slugify(org)}`}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-800 dark:text-slate-300 dark:hover:text-emerald-400"
                >
                  {org}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="mt-8">
        <PostBoard
            initialPosts={posts.slice(0, INITIAL_COUNT)}
            total={posts.length}
            profession={slug}
            locations={facetOptions(posts, (p) => p.location)}
          />
      </div>

      <p className="mt-10 border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        Explore more by profession:{" "}
        {facets
          .filter((f) => f.slug !== facet.slug)
          .slice(0, 6)
          .map((f, i) => (
            <span key={f.slug}>
              {i > 0 && " · "}
              <a href={`/professions/${f.slug}`} className="text-emerald-700 underline dark:text-emerald-400">
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
