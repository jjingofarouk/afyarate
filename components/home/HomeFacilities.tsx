import type { CSSProperties } from "react";
import Link from "next/link";
import { isDbReady } from "@/lib/practitioners";
import {
  getFacilityStats,
  isFacilitiesReady,
  searchFacilities,
} from "@/lib/facilities";
import { SITE_URL } from "@/lib/site";
import type { Facility, FacilityKind } from "@/lib/types";
import FacilityCard from "@/components/FacilityCard";
import HomeSection from "@/components/home/HomeSection";
import { BuildingIcon, CrossIcon, PillIcon } from "@/components/home/HomeIcons";

function FacilityGroup({
  kind,
  facilities,
  total,
}: {
  kind: FacilityKind;
  facilities: Facility[];
  total: number;
}) {
  const isHospital = kind === "hospital";
  const label = isHospital ? "Hospitals" : "Pharmacies";
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
          <span
            className={`grid size-8 place-items-center rounded-xl ${
              isHospital
                ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
                : "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
            }`}
          >
            {isHospital ? <CrossIcon /> : <PillIcon />}
          </span>
          {label}
        </h3>
        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-sky-700 dark:bg-slate-900 dark:text-sky-300">
          {total.toLocaleString()}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {facilities.map((f) => (
          <FacilityCard key={f.id} facility={f} />
        ))}
      </div>
      <Link
        href={`/facilities?kind=${kind}`}
        className="mt-4 text-sm font-semibold text-sky-700 underline-offset-4 hover:underline dark:text-sky-400"
      >
        Browse all {label.toLowerCase()} →
      </Link>
    </div>
  );
}

/**
 * Hospitals & pharmacies block (the "facilities" shuffle slot).
 * Self-fetching so it streams behind a Suspense boundary.
 */
export default async function HomeFacilities({ style }: { style?: CSSProperties }) {
  const [ready, facilitiesReadyRaw] = await Promise.all([
    isDbReady().catch(() => false),
    isFacilitiesReady().catch(() => false),
  ]);
  const facilitiesReady = ready && facilitiesReadyRaw;
  if (!facilitiesReady) return null;

  const [facilityStats, topHospitals, topPharmacies] = await Promise.all([
    getFacilityStats().catch(() => null),
    searchFacilities({ kind: "hospital", sort: "name", page: 1, pageSize: 4 }).catch(
      () => undefined,
    ),
    searchFacilities({ kind: "pharmacy", sort: "name", page: 1, pageSize: 4 }).catch(
      () => undefined,
    ),
  ]);
  const hospitals = topHospitals?.items ?? [];
  const pharmacies = topPharmacies?.items ?? [];
  if (hospitals.length === 0 && pharmacies.length === 0) return null;

  return (
    <>
      <HomeSection
        id="facilities"
        style={style}
        tone="sky"
        eyebrow="Facilities"
        eyebrowIcon={<BuildingIcon />}
        title="Hospitals & pharmacies"
        description="Find hospitals and pharmacies across Uganda. Search by name or city, check what patients say, and rate the care you received."
        action={{ href: "/facilities", label: "Browse all facilities" }}
      >
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {hospitals.length > 0 && (
            <FacilityGroup
              kind="hospital"
              facilities={hospitals}
              total={facilityStats?.hospitals ?? 0}
            />
          )}
          {pharmacies.length > 0 && (
            <FacilityGroup
              kind="pharmacy"
              facilities={pharmacies}
              total={facilityStats?.pharmacies ?? 0}
            />
          )}
        </div>
      </HomeSection>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              hospitals.length > 0 && {
                "@type": "ItemList",
                name: "Hospitals in Uganda",
                itemListElement: hospitals.map((f, i) => ({
                  "@type": "ListItem",
                  position: i + 1,
                  name: f.name,
                  url: `${SITE_URL}/facilities/${f.slug}`,
                })),
              },
              pharmacies.length > 0 && {
                "@type": "ItemList",
                name: "Pharmacies in Uganda",
                itemListElement: pharmacies.map((f, i) => ({
                  "@type": "ListItem",
                  position: i + 1,
                  name: f.name,
                  url: `${SITE_URL}/facilities/${f.slug}`,
                })),
              },
            ].filter(Boolean),
          }),
        }}
      />
    </>
  );
}
