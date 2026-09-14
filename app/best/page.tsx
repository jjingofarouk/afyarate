import type { Metadata } from "next";
import Link from "next/link";
import { pluralProfession, slugify } from "@/lib/posts";
import {
  BEST_CITIES,
  BEST_FACILITY_KINDS,
  BEST_PROFESSIONS,
  bestProfessionKeyword,
} from "@/lib/best-pages";
import { getProfessionCounts } from "@/lib/practitioners";
import { getFacilityStats } from "@/lib/facilities";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

const year = new Date().getFullYear();

const TITLE = `Best Doctors, Hospitals & Pharmacies in Uganda (${year})`;

export const metadata: Metadata = {
  title: TITLE,
  description: `Patient-rated rankings of the best doctors, nurses, hospitals and pharmacies in Uganda (${year}). Verified licences, real patient reviews and contact details, all in one place.`,
  keywords: [
    "best doctors in uganda",
    "best hospitals in uganda",
    "best pharmacies in uganda",
    "best nurses in uganda",
    "top doctors in uganda",
    "best clinics in uganda",
    "doctor ratings uganda",
    "hospital ratings uganda",
  ],
  alternates: { canonical: "/best" },
  openGraph: {
    title: `${TITLE} · ${SITE_NAME}`,
    description: `Patient-rated rankings of the best doctors, hospitals and pharmacies in Uganda. Verified licences and real patient reviews.`,
    url: `${SITE_URL}/best`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} · ${SITE_NAME}`,
    description: `Patient-rated rankings of the best doctors, hospitals and pharmacies in Uganda.`,
  },
};

export default async function BestHubPage() {
  const [counts, fstats] = await Promise.all([
    getProfessionCounts().catch(() => []),
    getFacilityStats().catch(() => ({ hospitals: 0, pharmacies: 0, total: 0 })),
  ]);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Best of Uganda", item: `${SITE_URL}/best` },
    ],
  };

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: TITLE,
    url: `${SITE_URL}/best`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: [
        ...BEST_PROFESSIONS.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `Best ${bestProfessionKeyword(p)} in Uganda`,
          url: `${SITE_URL}/best/${slugify(p)}`,
        })),
        ...BEST_FACILITY_KINDS.map((k, i) => ({
          "@type": "ListItem",
          position: BEST_PROFESSIONS.length + i + 1,
          name: `Best ${k === "hospital" ? "Hospitals" : "Pharmacies"} in Uganda`,
          url: `${SITE_URL}/best/${k}`,
        })),
      ],
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumbLd, itemListLd]) }}
      />

      <nav className="mb-6 text-xs text-slate-400 dark:text-slate-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-600 dark:text-slate-400">Best of Uganda</span>
      </nav>

      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-400">
          Patient-rated rankings
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
          Best Doctors, Hospitals &amp; Pharmacies in Uganda ({year})
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          The best health workers and facilities in Uganda, ranked by real patient
          feedback. Every practitioner listed shows their council, registration number
          and licence status; every facility shows its location and patient rating.
          Choose a category below to see the current top-rated listings.
        </p>
      </header>

      {/* Practitioner categories */}
      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Best health workers by profession
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BEST_PROFESSIONS.map((p) => {
            const count = counts.find((c) => c.profession === p)?.count ?? 0;
            return (
              <li key={p}>
                <Link
                  href={`/best/${slugify(p)}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-500 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-400"
                >
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    Best {bestProfessionKeyword(p)} in Uganda
                  </span>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    {count.toLocaleString()}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Facility categories */}
      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Best hospitals &amp; pharmacies
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {BEST_FACILITY_KINDS.map((k) => (
            <li key={k}>
              <Link
                href={`/best/${k}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-500 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-400"
              >
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  Best {k === "hospital" ? "Hospitals" : "Pharmacies"} in Uganda
                </span>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  {(k === "hospital" ? fstats.hospitals : fstats.pharmacies).toLocaleString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* City pages */}
      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Best facilities by city
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Top-rated hospitals and pharmacies in Uganda&apos;s major cities.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {BEST_CITIES.map((c) => (
            <Link
              key={c.slug}
              href={`/best/hospitals/${c.slug}`}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-400 dark:hover:text-emerald-400"
            >
              Best hospitals in {c.label}
            </Link>
          ))}
        </div>
      </section>

      <p className="mt-10 border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        How rankings work: listings are ordered by patient rating count and average
        score, so more reviews move a doctor, hospital or pharmacy up the list.
        Licensing data comes from the official Uganda registers; ratings are community
        opinions, not medical advice.
      </p>
    </div>
  );
}
