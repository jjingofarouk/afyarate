import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPosts, getLocations, facetOptions } from "@/lib/posts";
import { searchFacilities } from "@/lib/facilities";
import FacilityCard from "@/components/FacilityCard";
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
  const facets = await getLocations();
  const facet = facets.find((f) => f.slug === slug);
  if (!facet) return {};
  return {
    title: `Healthcare Jobs in ${facet.label} (${new Date().getFullYear()})`,
    description: `Find jobs, internships, scholarships and grants for health workers in ${facet.label}, Uganda — ${facet.count} current listings on ${SITE_NAME}.`,
    alternates: { canonical: `/locations/${facet.slug}` },
    openGraph: {
      title: `Healthcare Jobs in ${facet.label} · ${SITE_NAME}`,
      description: `Browse ${facet.count} healthcare jobs and opportunities in ${facet.label}, Uganda.`,
      type: "website",
    },
  };
}

export default async function LocationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const facets = await getLocations();
  const facet = facets.find((f) => f.slug === slug);
  if (!facet) notFound();
  const [posts, facilities] = await Promise.all([
    getPosts({ location: slug }),
    searchFacilities({ city: facet.label, sort: "rating", page: 1, pageSize: 4 }).catch(
      () => null,
    ),
  ]);

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
          Healthcare Jobs in {facet.label}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {facet.count} {facet.count === 1 ? "listing is" : "listings are"} currently open
          in {facet.label} for doctors, nurses, midwives, clinical officers and allied
          health professionals. New roles are added regularly.
        </p>
      </header>

      <div className="mt-8">
        <PostBoard
            initialPosts={posts.slice(0, INITIAL_COUNT)}
            total={posts.length}
            location={slug}
            professions={facetOptions(posts, (p) => p.profession)}
          />
      </div>

      {facilities && facilities.items.length > 0 && (
        <section className="mt-12">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Hospitals and pharmacies in {facet.label}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Nearby facilities surfaced from the directory.
              </p>
            </div>
            <Link
              href={`/facilities/hospital/${facet.slug}`}
              className="text-sm font-medium text-emerald-700 underline dark:text-emerald-400"
            >
              Browse the full directory →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {facilities.items.map((facility) => (
              <FacilityCard key={facility.id} facility={facility} />
            ))}
          </div>
        </section>
      )}

      <p className="mt-10 border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        Browse other locations:{" "}
        {facets
          .filter((f) => f.slug !== facet.slug)
          .slice(0, 8)
          .map((f, i) => (
            <span key={f.slug}>
              {i > 0 && " · "}
              <a href={`/locations/${f.slug}`} className="text-emerald-700 underline dark:text-emerald-400">
                {f.label}
              </a>
            </span>
          ))}
      </p>
    </div>
  );
}
