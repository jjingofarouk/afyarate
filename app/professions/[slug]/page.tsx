import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPosts, getProfessions } from "@/lib/posts";
import PostGrid from "@/components/PostGrid";
import { SITE_NAME } from "@/lib/site";

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
    description: `Find ${facet.label} jobs, fellowships, scholarships and grants in Uganda — ${facet.count} current ${facet.label} opportunity${facet.count === 1 ? "" : "s"} on ${SITE_NAME}.`,
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
          for {facet.label} roles and training in Uganda — from hospitals, universities,
          NGOs and government. Check back often as we add new opportunities every week.
        </p>
      </header>

      <div className="mt-8">
        <PostGrid posts={posts} />
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
    </div>
  );
}
