import type { Metadata } from "next";
import Link from "next/link";
import {
  getFacilityCities,
  getFacilityStats,
  isFacilitiesReady,
  searchFacilities,
} from "@/lib/facilities";
import FacilitySearch from "@/components/FacilitySearch";
import { FadeIn } from "@/components/motion/FadeIn";
import { slugify } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rate Uganda's Hospitals & Pharmacies",
  description:
    "Find and rate hospitals, clinics and pharmacies across Uganda — search by name, city or specialty, read patient ratings and leave your own.",
  alternates: { canonical: "/facilities" },
  openGraph: {
    title: "Rate Uganda's Hospitals & Pharmacies · Rate Musawo",
    description:
      "Find and rate hospitals, clinics and pharmacies across Uganda — search by name, city or specialty.",
    type: "website",
  },
};

const INITIAL_COUNT = 12;

const VALID_KIND = new Set(["hospital", "pharmacy"]);

export default async function FacilitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; type?: string; q?: string; city?: string; location?: string }>;
}) {
  const sp = await searchParams;
  const kindValue = sp.kind ?? sp.type ?? "";
  const cityValue = sp.city ?? sp.location ?? "";
  const kind = kindValue && VALID_KIND.has(kindValue) ? kindValue : "";
  const q = sp.q ?? "";
  const city = cityValue;

  const ready = await isFacilitiesReady();
  const stats = ready ? await getFacilityStats() : null;
  const cities = ready ? await getFacilityCities() : [];
  const initialResults = ready
    ? await searchFacilities({
        q,
        kind,
        city,
        sort: "rating",
        page: 1,
        pageSize: INITIAL_COUNT,
      })
    : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Uganda's Hospitals and Pharmacies",
    description: metadata.description,
    url: `${SITE_URL}/facilities`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Hospitals in Uganda",
          url: `${SITE_URL}/facilities?kind=hospital`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Pharmacies in Uganda",
          url: `${SITE_URL}/facilities?kind=pharmacy`,
        },
      ],
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="mb-6 text-xs text-slate-400 dark:text-slate-500">
        <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-600 dark:text-slate-400">Facilities</span>
      </nav>

      <FadeIn>
        <header className="max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Rate Uganda&apos;s Hospitals &amp; Pharmacies
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Hospitals, clinics and pharmacies from across Uganda — search by name, city or
            specialty, check what patients say, and leave your own rating.
          </p>
        </header>

        {stats && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/facilities?kind=hospital"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-emerald-400"
            >
              🏥 Hospitals
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                {stats.hospitals.toLocaleString()}
              </span>
            </Link>
            <Link
              href="/facilities?kind=pharmacy"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-emerald-400"
            >
              💊 Pharmacies
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                {stats.pharmacies.toLocaleString()}
              </span>
            </Link>
          </div>
        )}

        {cities.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {cities.slice(0, 8).map((label) => (
              <Link
                key={label}
                href={`/facilities/hospital/${slugify(label)}`}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-emerald-400"
              >
                Hospitals in {label}
              </Link>
            ))}
          </div>
        )}
      </FadeIn>

      {!ready ? (
        <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900/50 dark:bg-amber-950/30">
          <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-300">
            Facilities not loaded yet
          </h2>
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-400">
            Run{" "}
            <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">npm run db:setup</code>{" "}
            then{" "}
            <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">node scripts/import_facilities.mjs</code>{" "}
            to load the directory.
          </p>
        </div>
      ) : (
        <div className="mt-8">
          <FacilitySearch
            key={`${kind}:${q}`}
            initialQuery={q}
            initialKind={kind}
            initialCity={city}
            initialData={initialResults}
          />
        </div>
      )}

      <p className="mt-10 border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        Directory data courtesy of the Uganda Healthcare Directory. See{" "}
        <a href="/practitioners" className="text-emerald-700 underline dark:text-emerald-400">
          licensed practitioners
        </a>{" "}
        or{" "}
        <a href="/posts" className="text-emerald-700 underline dark:text-emerald-400">
          jobs &amp; opportunities
        </a>
        .
      </p>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
