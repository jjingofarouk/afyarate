import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPosts, getOrganizations } from "@/lib/posts";
import PostBoard from "@/components/PostBoard";
import { SITE_NAME } from "@/lib/site";

const INITIAL_COUNT = 12;

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const facets = await getOrganizations();
  const facet = facets.find((f) => f.slug === slug);
  if (!facet) return {};
  return {
    title: `${facet.label} — Jobs & Opportunities in Uganda`,
    description: `Current jobs, scholarships, fellowships and grants at ${facet.label} in Uganda — ${facet.count} listing${facet.count === 1 ? "" : "s"} on ${SITE_NAME}.`,
    alternates: { canonical: `/organizations/${facet.slug}` },
    openGraph: {
      title: `${facet.label} · ${SITE_NAME}`,
      description: `Browse ${facet.count} current job and training opportunities at ${facet.label}.`,
      type: "website",
    },
  };
}

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const facets = await getOrganizations();
  const facet = facets.find((f) => f.slug === slug);
  if (!facet) notFound();
  const posts = await getPosts({ organization: slug });

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
          {facet.label} — Jobs &amp; Opportunities
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {facet.count} {facet.count === 1 ? "listing is" : "listings are"} currently open
          at {facet.label} for health workers and researchers in Uganda. New roles are
          added as soon as they&apos;re announced.
        </p>
      </header>

      <div className="mt-8">
        <PostBoard initialPosts={posts.slice(0, INITIAL_COUNT)} total={posts.length} organization={slug} />
      </div>

      <p className="mt-10 border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        Browse more employers:{" "}
        {facets
          .filter((f) => f.slug !== facet.slug)
          .slice(0, 8)
          .map((f, i) => (
            <span key={f.slug}>
              {i > 0 && " · "}
              <a href={`/organizations/${f.slug}`} className="text-emerald-700 underline dark:text-emerald-400">
                {f.label}
              </a>
            </span>
          ))}
      </p>
    </div>
  );
}
