import type { Metadata } from "next";
import Link from "next/link";
import { getFacilityStats, getFacilityCities } from "@/lib/facilities";
import { getLocations, getPosts } from "@/lib/posts";
import { getProfessionCounts, getStats } from "@/lib/practitioners";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { slugify } from "@/lib/posts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Uganda Health Workforce Stats",
  description:
    "National health workforce statistics for Uganda, plus location pages for the busiest job and facility markets.",
  alternates: { canonical: "/stats" },
  openGraph: {
    title: `Uganda Health Workforce Stats · ${SITE_NAME}`,
    description:
      "National health workforce statistics for Uganda, plus location pages for the busiest job and facility markets.",
    type: "website",
  },
};

export default async function StatsPage() {
  const [stats, facilityStats, professionCounts, jobLocations, facilityCities, jobs] =
    await Promise.all([
      getStats().catch(() => null),
      getFacilityStats().catch(() => null),
      getProfessionCounts().catch(() => []),
      getLocations().catch(() => []),
      getFacilityCities().catch(() => []),
      getPosts({ type: "job" }).catch(() => []),
    ]);

  const featuredLocations = jobLocations.slice(0, 8);
  const featuredFacilityCities = facilityCities.slice(0, 8);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Uganda Health Workforce Stats",
    description: metadata.description,
    url: `${SITE_URL}/stats`,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="mb-6 text-xs text-slate-400 dark:text-slate-500">
        <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">
          Home
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-600 dark:text-slate-400">Stats</span>
      </nav>

      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-400">
          Data moat
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Uganda health workforce stats
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          A national snapshot of the registry, facilities directory and live jobs board, plus the
          city and district pages that matter most.
        </p>
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          stats ? { label: "Practitioners", value: stats.practitioners.toLocaleString() } : null,
          stats ? { label: "Active licences", value: stats.active.toLocaleString() } : null,
          stats ? { label: "Patient ratings", value: stats.totalRatings.toLocaleString() } : null,
          facilityStats ? { label: "Hospitals", value: facilityStats.hospitals.toLocaleString() } : null,
          facilityStats ? { label: "Pharmacies", value: facilityStats.pharmacies.toLocaleString() } : null,
        ]
          .filter((item): item is { label: string; value: string } => item !== null)
          .map((item) => (
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
            Top job locations
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {featuredLocations.map((location) => (
              <Link
                key={location.slug}
                href={`/stats/${location.slug}`}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-800 dark:text-slate-300 dark:hover:text-emerald-400"
              >
                {location.label} ({location.count})
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Top facility cities
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {featuredFacilityCities.map((city) => (
              <Link
                key={city}
                href={`/facilities/hospital/${slugify(city)}`}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-800 dark:text-slate-300 dark:hover:text-emerald-400"
              >
                {city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Current demand by profession
          </h2>
          <ul className="mt-4 space-y-2">
            {professionCounts.slice(0, 8).map((item) => (
              <li key={item.profession} className="flex items-center justify-between gap-3 text-sm">
                <Link
                  href={`/practitioners/profession/${slugify(item.profession)}`}
                  className="text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400"
                >
                  {item.profession}
                </Link>
                <span className="text-slate-500 dark:text-slate-400">
                  {item.count.toLocaleString()} licensed
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Live job inventory
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            There are currently {jobs.length.toLocaleString()} published healthcare jobs and
            opportunities on the board.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/jobs"
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Browse jobs
            </Link>
            <Link
              href="/practitioners"
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300"
            >
              Search practitioners
            </Link>
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
