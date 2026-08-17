import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFacilityStats, searchFacilities } from "@/lib/facilities";
import { getLocations, getPosts, slugify } from "@/lib/posts";
import { getProfessionCounts, getStats } from "@/lib/practitioners";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "uganda") {
    return {
      title: "Uganda Health Workforce Statistics",
      description: `A national snapshot of Uganda's practitioners, facilities and jobs on ${SITE_NAME}.`,
      alternates: { canonical: "/stats/uganda" },
    };
  }
  const locations = await getLocations();
  const location = locations.find((item) => item.slug === slug);
  if (!location) return { title: "Not found" };
  return {
    title: `${location.label} Health Directory`,
    description: `Jobs, facilities and health data for ${location.label}, Uganda.`,
    alternates: { canonical: `/stats/${slug}` },
  };
}

function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default async function StatsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (slug === "uganda") {
    const [stats, facilityStats, professions, jobs] = await Promise.all([
      getStats(),
      getFacilityStats(),
      getProfessionCounts(),
      getPosts({ type: "job" }),
    ]);

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "Uganda health workforce statistics",
      description: "National snapshot of practitioners, facilities and jobs in Uganda.",
      url: `${SITE_URL}/stats/uganda`,
    };

    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <nav className="mb-6 text-xs text-slate-400 dark:text-slate-500">
          <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">
            Home
          </Link>
          <span className="mx-1.5">/</span>
          <Link href="/stats" className="hover:text-emerald-700 dark:hover:text-emerald-400">
            Stats
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-slate-600 dark:text-slate-400">Uganda</span>
        </nav>

        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-400">
            National view
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Uganda health workforce statistics
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            This page combines the registry, facilities directory and live jobs board into one
            overview.
          </p>
        </header>

        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Practitioners", value: stats.practitioners.toLocaleString() },
            { label: "Active licences", value: stats.active.toLocaleString() },
            { label: "Patient ratings", value: stats.totalRatings.toLocaleString() },
            { label: "Hospitals", value: facilityStats.hospitals.toLocaleString() },
            { label: "Pharmacies", value: facilityStats.pharmacies.toLocaleString() },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {item.value}
              </div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {item.label}
              </div>
            </div>
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
              High-intent next steps
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/practitioners"
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Search practitioners
            </Link>
              <Link
                href="/practitioners"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300"
              >
                Search practitioners
              </Link>
              <Link
                href="/facilities"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:text-emerald-400"
              >
                Browse facilities
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Current job market
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {jobs.length.toLocaleString()} live jobs and opportunities are currently published.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {professions.slice(0, 6).map((item) => (
                <Link
                  key={item.profession}
                  href={`/professions/${slugify(item.profession)}`}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-800 dark:text-slate-300 dark:hover:text-emerald-400"
                >
                  {item.profession}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      </div>
    );
  }

  const locations = await getLocations();
  const location = locations.find((item) => item.slug === slug);
  if (!location) notFound();

  const [posts, facilities] = await Promise.all([
    getPosts({ location: slug, sort: "newest" }),
    searchFacilities({ city: location.label, sort: "rating", page: 1, pageSize: 6 }).catch(() => ({
      items: [],
      total: 0,
      page: 1,
      pageSize: 6,
      kinds: ["hospital", "pharmacy"] as const,
      cities: [],
    })),
  ]);
  const facilityTotal = facilities?.total ?? 0;
  const facilityItems = facilities?.items ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${location.label} health directory`,
    description: `${posts.length} jobs and ${facilityTotal} facilities in ${location.label}, Uganda.`,
    url: `${SITE_URL}/stats/${location.slug}`,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <nav className="mb-6 text-xs text-slate-400 dark:text-slate-500">
        <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">
          Home
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/stats" className="hover:text-emerald-700 dark:hover:text-emerald-400">
          Stats
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-600 dark:text-slate-400">{location.label}</span>
      </nav>

      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-400">
          Location view
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {location.label} health directory
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {posts.length.toLocaleString()} open jobs and {facilityTotal.toLocaleString()} nearby
          facilities are currently surfaced for this location.
        </p>
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {posts.length.toLocaleString()}
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Jobs and opportunities
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {facilityTotal.toLocaleString()}
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Facilities in the area
          </div>
        </div>
      </section>

      <section className="mt-10 flex flex-wrap gap-3">
        <Link
          href={`/locations/${location.slug}`}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Browse jobs in {location.label}
        </Link>
        <Link
          href={`/facilities/hospital/${location.slug}`}
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300"
        >
          Hospitals in {location.label}
        </Link>
        <Link
          href={`/facilities/pharmacy/${location.slug}`}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:text-emerald-400"
        >
          Pharmacies in {location.label}
        </Link>
      </section>

      {facilityItems.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Nearby facilities
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {facilityItems.slice(0, 3).map((facility) => (
              <Link
                key={facility.id}
                href={`/facilities/${facility.slug}`}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-400"
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {facility.name}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {facility.kind} {facility.city ? `· ${facility.city}` : ""}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
    </div>
  );
}
