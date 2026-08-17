import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import FacilitySearch from "@/components/FacilitySearch";
import { getFacilityCities, searchFacilities } from "@/lib/facilities";
import { FACILITY_KIND_LABELS } from "@/lib/types";
import { getLocations, slugify } from "@/lib/posts";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ kind: string; city: string }>;
}): Promise<Metadata> {
  const { kind, city } = await params;
  if (kind !== "hospital" && kind !== "pharmacy") return { title: "Not found" };
  const cities = await getFacilityCities();
  const cityLabel = cities.find((item) => slugify(item) === city);
  if (!cityLabel) return { title: "Not found" };
  const kindLabel = FACILITY_KIND_LABELS[kind].plural;
  return {
    title: `${kindLabel} in ${cityLabel}`,
    description: `Browse ${kindLabel.toLowerCase()} in ${cityLabel}, Uganda.`,
    alternates: { canonical: `/facilities/${kind}/${city}` },
    openGraph: {
      title: `${kindLabel} in ${cityLabel} · ${SITE_NAME}`,
      description: `Browse ${kindLabel.toLowerCase()} in ${cityLabel}, Uganda.`,
      type: "website",
    },
  };
}

export default async function FacilityCityPage({
  params,
}: {
  params: Promise<{ kind: string; city: string }>;
}) {
  const { kind, city } = await params;
  if (kind !== "hospital" && kind !== "pharmacy") notFound();

  const cities = await getFacilityCities();
  const cityLabel = cities.find((item) => slugify(item) === city);
  if (!cityLabel) notFound();
  const jobLocation = (await getLocations()).find((item) => item.slug === city);

  const initialData = await searchFacilities({
    kind,
    city: cityLabel,
    sort: "rating",
    page: 1,
    pageSize: 12,
  });

  const kindLabel = FACILITY_KIND_LABELS[kind].plural;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="mb-6 text-xs text-slate-400 dark:text-slate-500">
        <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">
          Home
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/facilities" className="hover:text-emerald-700 dark:hover:text-emerald-400">
          Facilities
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-600 dark:text-slate-400">
          {kindLabel} in {cityLabel}
        </span>
      </nav>

      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-400">
          Local directory
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {kindLabel} in {cityLabel}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Browse the {initialData.total.toLocaleString()} {kindLabel.toLowerCase()} listed in{" "}
          {cityLabel}, then filter by name or specialty.
        </p>
      </header>

      <div className="mt-8">
        <FacilitySearch
          initialKind={kind}
          initialCity={cityLabel}
          initialData={initialData}
        />
      </div>

      <p className="mt-10 border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        Explore related pages:{" "}
        <Link href={`/facilities?kind=${kind}`} className="text-emerald-700 underline dark:text-emerald-400">
          all {kindLabel.toLowerCase()}
        </Link>{" "}
        ·{" "}
        {jobLocation ? (
          <Link
            href={`/stats/${city}`}
            className="text-emerald-700 underline dark:text-emerald-400"
          >
            {cityLabel} stats
          </Link>
        ) : (
          <Link href="/stats/uganda" className="text-emerald-700 underline dark:text-emerald-400">
            Uganda stats
          </Link>
        )}
      </p>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `${kindLabel} in ${cityLabel}`,
            description: `Browse ${kindLabel.toLowerCase()} in ${cityLabel}, Uganda.`,
            url: `${SITE_URL}/facilities/${kind}/${city}`,
          }),
        }}
      />
    </div>
  );
}
