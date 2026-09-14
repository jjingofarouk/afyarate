import Link from "next/link";
import { isDbReady } from "@/lib/practitioners";
import FeaturedVerifiedProfile from "@/components/home/FeaturedVerifiedProfile";
import HomeSection from "@/components/home/HomeSection";

export type HomeShuffleKey = "jobs" | "practitioners" | "facilities";

/**
 * Pinned strip directly under the hero: the paid featured-verified banner
 * (never shuffles — claimants paid for this spotlight) plus the jump-to nav
 * mirroring the day's shuffled section order. Gated on DB readiness so the
 * hero never waits on it; streams behind Suspense.
 */
export default async function HomeFeatured({
  sectionOrder,
}: {
  sectionOrder: HomeShuffleKey[];
}) {
  const ready = await isDbReady().catch(() => false);
  if (!ready) return null;
  return (
    <>
      {/* Featured verified practitioner: loud banner directly under the hero */}
      <FeaturedVerifiedProfile />

      {/* Jump-to nav, mirrors the day's shuffled section order at a glance */}
      <HomeSection tone="slate" compact>
        <nav
          aria-label="Home page sections"
          className="flex flex-wrap items-center justify-center gap-2"
        >
          {[
            { href: "#emergency", label: "Emergency ambulance" },
            ...sectionOrder.flatMap((key) =>
              key === "jobs"
                ? [{ href: "#listings", label: "Jobs & opportunities" }]
                : key === "practitioners"
                  ? [
                      { href: "#ratings", label: "Top-rated health workers" },
                      { href: "#practitioners", label: "Search the registry" },
                    ]
                    : [{ href: "#facilities", label: "Hospitals & pharmacies" }],
              ),
              { href: "#hiring", label: "Are you hiring?" },
              { href: "#faq", label: "FAQs" },
            ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-400 dark:hover:text-emerald-400"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </HomeSection>
    </>
  );
}
