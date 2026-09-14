import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import HomeSection from "@/components/home/HomeSection";
import HomeFeatured, { type HomeShuffleKey } from "@/components/home/HomeFeatured";
import HomeJobs from "@/components/home/HomeJobs";
import HomeRatings from "@/components/home/HomeRatings";
import HomeRegistry from "@/components/home/HomeRegistry";
import HomeFacilities from "@/components/home/HomeFacilities";
import HomeNewsletter from "@/components/home/HomeNewsletter";
import HomeEmergency from "@/components/home/HomeEmergency";
import HomeHiring from "@/components/home/HomeHiring";
import {
  AmberFallback,
  EmeraldFallback,
  JobsFallback,
  PlainFallback,
  SkyFallback,
} from "@/components/home/HomeFallbacks";
import { FadeIn } from "@/components/motion/FadeIn";
import { AnimatedWords } from "@/components/motion/AnimatedWords";
import { MotionImg } from "@/components/motion/MotionImg";

export const metadata: Metadata = {
  title: "Jobs, grants, scholarships, fellowships, conferences, & more for Uganda's health workers",
  description:
    "The home for Uganda's health workers. Read patient ratings of doctors and nurses, find trusted hospitals and pharmacies, and browse current jobs, scholarships, grants and conferences across Uganda.",
};

const FAQS = [
  {
    q: "Is Rate Musawo free to use?",
    a: "Yes. Searching the registry, browsing jobs and opportunities, and reading facility and practitioner pages is completely free.",
  },
  {
    q: "Where does the licensing data come from?",
    a: "We use the official public register published by the Uganda Medical and Dental Practitioners Council (UMDPC), which lists every practitioner with a current licence.",
  },
  {
    q: "Who can leave a rating?",
    a: "Anyone who has seen a health worker can leave feedback: patients, their families, or colleagues. Each rating is reviewed and clearly marked as verified or unverified.",
  },
  {
    q: "Can I find a doctor near me?",
    a: "Yes. Search by name, profession, council or licence number. Every practitioner page shows their council, registration and licence status so you can check they are currently licensed.",
  },
  {
    q: "How do I correct or update a listing?",
    a: "If you see outdated or incorrect licensing details, contact us and we will verify it against the official registry and fix it.",
  },
];

export const dynamic = "force-dynamic";

const HOME_SHUFFLE_PERMUTATIONS: HomeShuffleKey[][] = [
  ["jobs", "practitioners", "facilities"],
  ["jobs", "facilities", "practitioners"],
  ["practitioners", "jobs", "facilities"],
  ["practitioners", "facilities", "jobs"],
  ["facilities", "jobs", "practitioners"],
  ["facilities", "practitioners", "jobs"],
];

/**
 * Daily-rotating homepage section order.
 *
 * The featured verified (claimed/paid) banner always stays pinned directly
 * under the hero — this only shuffles the three discovery blocks below it
 * (jobs, practitioners, hospitals/pharmacies) so repeat visitors and
 * crawlers see a different layout each day.
 *
 * Deliberately deterministic per UTC day (not Math.random() per request) so
 * the HTML is stable within a day for SEO, caching and CLS, yet rotates
 * across days. Day-of-year % 6 walks all permutations evenly.
 */
function getHomeSectionOrder(now = new Date()): HomeShuffleKey[] {
  const start = Date.UTC(now.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start) / 86400000);
  return HOME_SHUFFLE_PERMUTATIONS[dayOfYear % HOME_SHUFFLE_PERMUTATIONS.length];
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; layout?: string }>;
}) {
  const { q, layout } = await searchParams;

  // Daily-rotating visual order for the three discovery blocks below the
  // pinned featured-verified banner (jobs, practitioners, hospitals). The
  // paid spotlight never moves; only these three rotate, one permutation per
  // UTC day (stable within a day for SEO/caching/CLS). `?layout=` overrides
  // for previewing, e.g. ?layout=facilities,jobs,practitioners.
  const sectionOrder: HomeShuffleKey[] = (() => {
    if (layout) {
      const keys = layout
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(
          (s): s is HomeShuffleKey =>
            s === "jobs" || s === "practitioners" || s === "facilities",
        );
      const deduped = [...new Set(keys)];
      if (deduped.length === 3) return deduped;
    }
    return getHomeSectionOrder();
  })();
  const orderOf = (key: HomeShuffleKey | "newsletter"): number =>
    key === "newsletter" ? 10 : sectionOrder.indexOf(key);

  // Every discovery block below fetches its own data and streams behind a
  // Suspense boundary: the hero paints in the first flush (~one cheap render,
  // zero DB reads) while the heavier registry/jobs/facility queries resolve
  // behind it. Nothing below the hero can delay the first paint, so tapping
  // home always feels instant.
  return (
    <>
      {/* Hero, full-bleed photo, edge to edge, with text overlaid */}
      <FadeIn>
        <section className="relative flex min-h-[420px] items-center overflow-hidden sm:min-h-[480px] lg:min-h-[600px]">
          <MotionImg
            src="/hero.jpg"
            alt="Healthcare workers in a hospital corridor"
            className="absolute inset-0 h-full w-full object-cover object-center"
            loading="eager"
            width={1200}
            height={800}
          />
          <div className="absolute inset-0 bg-black/60" />

          <div className="relative z-10 w-full px-4 py-10 text-center sm:px-10 sm:py-16">
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
              <AnimatedWords text="Give and get better healthcare in Uganda." startDelay={0.15} />
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-200">
              <AnimatedWords
                text="Jobs, scholarships, grants, fellowships and conferences, matched to your role and region. Plus verified practitioners, hospitals and pharmacies across Uganda."
                startDelay={0.6}
                wordDelay={0.018}
              />
            </p>
            <div className="mx-auto mt-8 flex max-w-md flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="#listings"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 sm:w-auto"
              >
                Browse opportunities
              </Link>
              <Link
                href="#practitioners"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 sm:w-auto"
              >
                Search the registry
              </Link>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Pinned paid spotlight + jump nav (streams; never blocks the hero) */}
      <Suspense fallback={null}>
        <HomeFeatured sectionOrder={sectionOrder} />
      </Suspense>

      {/* Emergency ambulance strip: fixed above the shuffle, never rotates. */}
      <HomeEmergency />

      {/* Shuffled discovery blocks: visual order rotates daily (see
          sectionOrder above). DOM order stays fixed for screen readers;
          `order` controls what visitors see first. */}
      <div className="flex flex-col">
        <Suspense fallback={<JobsFallback />}>
          <HomeJobs style={{ order: orderOf("jobs") }} />
        </Suspense>
        <Suspense fallback={<AmberFallback />}>
          <HomeRatings style={{ order: orderOf("practitioners") }} />
        </Suspense>
        <Suspense fallback={<PlainFallback />}>
          <HomeRegistry q={q} style={{ order: orderOf("practitioners") }} />
        </Suspense>
        <Suspense fallback={<SkyFallback />}>
          <HomeFacilities style={{ order: orderOf("facilities") }} />
        </Suspense>
        <Suspense fallback={<EmeraldFallback />}>
          <HomeNewsletter style={{ order: orderOf("newsletter") }} />
        </Suspense>
      </div>

      {/* Recruiter strip: fixed below discovery, never shuffles. */}
      <HomeHiring />

      {/* Section 5, explore */}
      <HomeSection
        id="explore"
        tone="slate"
        eyebrow="Go further"
        title="Search, verify and explore"
        description="Dedicated pages for licence checks, statistics, jobs and editorial guides."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              href: "/best",
              title: "Best of Uganda",
              text: "Patient-ranked lists of the best doctors, nurses, hospitals and pharmacies in Uganda.",
            },
            {
              href: "/practitioners",
              title: "Search the registry",
              text: "Find licensed practitioners by name, profession or council.",
            },
            {
              href: "/stats/uganda",
              title: "Uganda health stats",
              text: "See the national counts for practitioners, facilities and jobs.",
            },
            {
              href: "/help",
              title: "How it works",
              text: "Read how the registry, listings and ratings sections work together.",
            },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-400"
            >
              <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {card.text}
              </p>
            </Link>
          ))}
        </div>
      </HomeSection>

      {/* Best-of internal links: sitewide crawl path to the "best X in Uganda"
          landing pages (rankings from live rating data). */}
      <HomeSection
        id="best"
        tone="emerald"
        eyebrow="Patient rankings"
        title="The best of Uganda's healthcare"
        description="Ranked by real patient ratings, not ads."
        action={{ href: "/best", label: "See all best-of pages" }}
      >
        <div className="flex flex-wrap gap-2">
          {[
            ["/best/doctor", "Best doctors in Uganda"],
            ["/best/nurse-midwife", "Best nurses & midwives in Uganda"],
            ["/best/clinical-officer", "Best clinical officers in Uganda"],
            ["/best/pharmacist", "Best pharmacists in Uganda"],
            ["/best/dentist", "Best dentists in Uganda"],
            ["/best/hospital", "Best hospitals in Uganda"],
            ["/best/pharmacy", "Best pharmacies in Uganda"],
            ["/best/hospital/kampala", "Best hospitals in Kampala"],
            ["/best/pharmacy/kampala", "Best pharmacies in Kampala"],
            ["/best/hospital/mbarara", "Best hospitals in Mbarara"],
            ["/best/pharmacy/mbarara", "Best pharmacies in Mbarara"],
            ["/best/hospital/gulu", "Best hospitals in Gulu"],
            ["/best/pharmacy/gulu", "Best pharmacies in Gulu"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="rounded-full border border-emerald-200 bg-white px-3.5 py-1.5 text-xs font-medium text-emerald-800 transition hover:border-emerald-500 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300 dark:hover:border-emerald-400"
            >
              {label}
            </Link>
          ))}
        </div>
      </HomeSection>

      {/* FAQ, mirrors the FAQPage structured data below */}
      <HomeSection
        id="faq"
        tone="white"
        title="Frequently asked questions"
        className="mx-auto w-full"
      >        <div className="mx-auto max-w-3xl">
          <div className="space-y-3">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900 marker:content-none dark:text-slate-100">
                  <span className="flex items-center justify-between gap-3">
                    {f.q}
                    <svg
                      className="size-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </HomeSection>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
    </>
  );
}
