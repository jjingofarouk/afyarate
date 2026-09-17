import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import HomeSection from "@/components/home/HomeSection";
import HomeFeatured from "@/components/home/HomeFeatured";
import HomeJobs from "@/components/home/HomeJobs";
import HomeRatings from "@/components/home/HomeRatings";
import HomeRegistry from "@/components/home/HomeRegistry";
import HomeFacilities from "@/components/home/HomeFacilities";
import HomeNewsletter from "@/components/home/HomeNewsletter";
import HomeEmergency from "@/components/home/HomeEmergency";
import HomeHiring from "@/components/home/HomeHiring";
import HomeGateways from "@/components/home/HomeGateways";
import HomeOpportunityTypes from "@/components/home/HomeOpportunityTypes";
import HomeTrustPanel from "@/components/home/HomeTrustPanel";
import HomeHeroSearch, { HeroSearchFallback } from "@/components/home/HomeHeroSearch";
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
    q: "Is Medical Opportunities Hub Uganda free to use?",
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

/**
 * Home page order — opportunities first, directories second.
 *
 * The page deliberately does NOT reorder itself between visits. It used to
 * rotate the jobs/practitioner/facility blocks daily for crawler variety, but
 * a fixed order is what lets the page tell one story: this is a place to find
 * work and opportunities, and it also holds the registry patients need. The
 * registry blocks sit below the opportunity blocks for that reason.
 *
 * Every data-backed block streams behind its own Suspense boundary, so the
 * hero paints from a single cheap render with zero database reads.
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  return (
    <>
      {/* Hero, full-bleed photo, edge to edge, with text overlaid */}
      <FadeIn>
        <section className="relative flex min-h-[420px] items-center overflow-hidden sm:min-h-[480px] lg:min-h-[600px]">
          {/* The brand pair: the same Kampala-and-lake view at
              sunrise (light mode) and dusk (dark mode), so the hero matches the
              theme instead of fighting it. */}
          <MotionImg
            src="/hero-uganda-day.webp"
            alt="Kampala and Lake Victoria at sunrise"
            className="absolute inset-0 h-full w-full object-cover object-center dark:hidden"
            loading="eager"
            width={1920}
            height={768}
          />
          <MotionImg
            src="/hero-uganda-night.webp"
            alt=""
            aria-hidden
            className="absolute inset-0 hidden h-full w-full object-cover object-center dark:block"
            loading="eager"
            width={1920}
            height={768}
          />
          {/* Scrim is heaviest in the upper half (the sunrise sky is bright)
              and lighter over the darker water/wave area, so the photograph
              still reads as itself while the copy stays legible. */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/35 to-slate-950/40 dark:from-slate-950/55 dark:via-slate-950/40 dark:to-slate-950/50" />

          <div className="relative z-10 w-full px-4 py-10 text-center sm:px-10 sm:py-16">
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-white [text-shadow:0_2px_16px_rgba(2,6,23,0.65)] sm:text-5xl">
              <AnimatedWords text="Give and get better healthcare in Uganda." startDelay={0.15} />
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-100 [text-shadow:0_1px_10px_rgba(2,6,23,0.75)]">
              <AnimatedWords
                text="Jobs, scholarships, grants, fellowships and conferences, matched to your role and region. Plus verified practitioners, hospitals and pharmacies across Uganda."
                startDelay={0.6}
                wordDelay={0.018}
              />
            </p>
            <Suspense fallback={<HeroSearchFallback />}>
              <HomeHeroSearch />
            </Suspense>
          </div>
        </section>
      </FadeIn>

      {/* Four gateways into the site, over the brand artwork. */}
      <Suspense fallback={null}>
        <HomeGateways />
      </Suspense>

      {/* Opportunity-first: type tiles with live counts, then deadlines that
          are about to pass. */}
      <HomeSection
        id="listings"
        tone="slate"
        eyebrow="Opportunities"
        title="Explore opportunities by type"
        description="Live counts across every board. Deadlines worth knowing about are flagged first."
        action={{ href: "/posts", label: "Browse all listings" }}
      >
        <Suspense fallback={<JobsFallback />}>
          <HomeOpportunityTypes />
        </Suspense>
      </HomeSection>

      {/* Paid spotlight + the newest listings. */}
      <Suspense fallback={null}>
        <HomeFeatured />
      </Suspense>
      <Suspense fallback={<JobsFallback />}>
        <HomeJobs />
      </Suspense>

      {/* Emergency ambulance strip. */}
      <HomeEmergency />

      {/* What we actually guarantee. */}
      <HomeTrustPanel />

      {/* The registry: valuable, but no longer the first thing a visitor meets.
          Each block keeps its own structured data and streams on its own. */}
      <Suspense fallback={<AmberFallback />}>
        <HomeRatings />
      </Suspense>
      <Suspense fallback={<PlainFallback />}>
        <HomeRegistry q={q} />
      </Suspense>
      <Suspense fallback={<SkyFallback />}>
        <HomeFacilities />
      </Suspense>

      <Suspense fallback={<EmeraldFallback />}>
        <HomeNewsletter />
      </Suspense>

      {/* Recruiter strip. */}
      <HomeHiring />

      {/* Explore */}
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
      >
        <div className="mx-auto max-w-3xl">
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
