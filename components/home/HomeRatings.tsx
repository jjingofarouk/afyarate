import type { CSSProperties } from "react";
import Link from "next/link";
import { getTopRatedPractitioners } from "@/lib/practitioners";
import { practitionerUrl } from "@/lib/practitioner-url";
import { SITE_URL } from "@/lib/site";
import HomeSection from "@/components/home/HomeSection";
import RatedPractitionerCard from "@/components/home/RatedPractitionerCard";
import { StarIcon } from "@/components/home/HomeIcons";
import { StaggerGrid, StaggerItem } from "@/components/motion/StaggerGrid";

/**
 * Top-rated health workers block (first half of the "practitioners" shuffle
 * slot). Self-fetching so it streams behind a Suspense boundary.
 */
export default async function HomeRatings({ style }: { style?: CSSProperties }) {
  const topRated = await getTopRatedPractitioners(8).catch(() => []);
  return (
    <>
      <HomeSection
        id="ratings"
        style={style}
        tone="amber"
        eyebrow="Community ratings"
        eyebrowIcon={<StarIcon />}
        title="Top-rated health workers"
        description="See which doctors, nurses, midwives and clinical officers patients rate highest, with verified licences with genuine feedback, then add your own."
        action={{ href: "/practitioners", label: "See all practitioners" }}
      >
        {topRated.length > 0 ? (
          <>
            <StaggerGrid className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {topRated.map((p, i) => (
                <StaggerItem key={p.id} className={i % 2 === 0 ? "lg:mt-4" : ""}>
                  <RatedPractitionerCard p={p} />
                </StaggerItem>
              ))}
            </StaggerGrid>
            <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-amber-200/70 bg-white/70 p-5 text-center sm:flex-row sm:text-left dark:border-amber-900/40 dark:bg-slate-900/60">
              <div>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  Have you seen a health worker recently?
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Help other patients choose well, rate the care you received.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/practitioners"
                  className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
                >
                  Rate a health worker
                </Link>
                <Link
                  href="/facilities"
                  className="rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-800 transition hover:border-amber-400 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-300"
                >
                  Rate a hospital or pharmacy
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-white/70 p-6 text-center dark:border-amber-900/40 dark:bg-slate-900/60">
            <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-300">
              No ratings yet
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Be the first to rate a doctor, nurse or midwife and help patients across Uganda
              choose well.
            </p>
            <Link
              href="/practitioners"
              className="mt-4 inline-block rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
            >
              Leave the first rating
            </Link>
          </div>
        )}
      </HomeSection>
      {topRated.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: "Top-rated health workers in Uganda",
              itemListElement: topRated.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: p.name,
                url: `${SITE_URL}${practitionerUrl(p.id, p.name)}`,
              })),
            }),
          }}
        />
      )}
    </>
  );
}
