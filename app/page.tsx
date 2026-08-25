import type { Metadata } from "next";
import {
  getProfessionCounts,
  getStats,
  getTopRatedPractitioners,
  isDbReady,
  searchPractitioners,
} from "@/lib/practitioners";
import {
  getFacilityStats,
  isFacilitiesReady,
  searchFacilities,
} from "@/lib/facilities";
import { getPosts, getProfessions, getLocations } from "@/lib/posts";
import PractitionerSearch from "@/components/PractitionerSearch";
import FacilityCard from "@/components/FacilityCard";
import PostCard from "@/components/PostCard";
import PostTypePanel from "@/components/home/PostTypePanel";
import HomeSection from "@/components/home/HomeSection";
import SpotlightListing from "@/components/home/SpotlightListing";
import RatedPractitionerCard from "@/components/home/RatedPractitionerCard";
import { PAGE_SIZE, SITE_URL } from "@/lib/site";
import { FadeIn } from "@/components/motion/FadeIn";
import { SlideIn } from "@/components/motion/SlideIn";
import { StaggerGrid, StaggerItem } from "@/components/motion/StaggerGrid";
import { AnimatedWords } from "@/components/motion/AnimatedWords";
import { MotionImg } from "@/components/motion/MotionImg";
import { slugify } from "@/lib/posts";
import {
  POST_TYPES,
  POST_TYPE_LABELS,
  type Facility,
  type FacilityKind,
} from "@/lib/types";
import Link from "next/link";
import Newsletter from "@/components/Newsletter";

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

// Small inline icons used in section eyebrows.
function StarIcon() {
  return (
    <svg className="size-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2.5l2.95 5.98 6.6.96-4.78 4.66 1.13 6.58L12 17.58l-5.9 3.1 1.13-6.58L2.45 9.44l6.6-.96L12 2.5z" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg
      className="size-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg
      className="size-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      className="size-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      className="size-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
      />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg
      className="size-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15L15 9.75M12 21a16.8 16.8 0 01-7.18-3.33A16.1 16.1 0 012.25 6.54l.07-.03A16.1 16.1 0 0112 3c2.7 0 5.2.82 7.18 2.34l.07.03a16.1 16.1 0 01-2.57 11.13A16.8 16.8 0 0112 21z"
      />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg
      className="size-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3z"
      />
    </svg>
  );
}

function PillIcon() {
  return (
    <svg
      className="size-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 13.5l6-6M7 11.5l3.5-3.5a4.95 4.95 0 117 7l-3.5 3.5a4.95 4.95 0 11-7-7z"
      />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      className="size-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c-2.21 0-4-4.03-4-9s1.79-9 4-9 4 4.03 4 9-1.79 9-4 9zm-8-9h16"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      className="size-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  );
}

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

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  // Fetched here (not just client-side) so the first page of results is
  // already in the initial HTML, no client round-trip before anything shows.
  // Each call below gets its own Supabase client (see lib/supabase/server.ts),
  // so these are safe to run in parallel.
  const [ready, facilitiesReadyRaw] = await Promise.all([isDbReady(), isFacilitiesReady()]);
  const facilitiesReady = ready && facilitiesReadyRaw;

  const [
    stats,
    initialResults,
    practitionerProfessions,
    facilityStats,
    topHospitals,
    topPharmacies,
    topRated,
    allPosts,
  ] = await Promise.all([
    ready ? getStats() : Promise.resolve(null),
    ready
      ? searchPractitioners({ q, status: "all", sort: "random", page: 1, pageSize: PAGE_SIZE })
      : Promise.resolve(undefined),
    ready ? getProfessionCounts() : Promise.resolve([]),
    facilitiesReady ? getFacilityStats() : Promise.resolve(null),
    facilitiesReady
      ? searchFacilities({ kind: "hospital", sort: "name", page: 1, pageSize: 4 })
      : Promise.resolve(undefined),
    facilitiesReady
      ? searchFacilities({ kind: "pharmacy", sort: "name", page: 1, pageSize: 4 })
      : Promise.resolve(undefined),
    ready ? getTopRatedPractitioners(8) : Promise.resolve([]),
    ready ? getPosts() : Promise.resolve([]),
  ]);

  // Fetch newsletter options after posts are loaded (getProfessions/getLocations
  // reuse the already-cached posts result, so no extra DB call)
  const [newsletterProfessions, newsletterLocations] = await Promise.all([
    ready ? getProfessions() : Promise.resolve([]),
    ready ? getLocations() : Promise.resolve([]),
  ]);
  const roleOptions = newsletterProfessions.map((p) => p.label);
  const locationOptions = newsletterLocations.map((l) => l.label);

  const hospitals = topHospitals?.items ?? [];
  const pharmacies = topPharmacies?.items ?? [];

  // Group listings by type so every category gets a visible slice of the
  // board, jobs lead, then a panel per type (scholarships, grants,
  // conferences, fellowships, internships, opportunities, …).
  const topJobs = allPosts.filter((p) => p.type === "job").slice(0, 4);
  const typePanels = POST_TYPES.filter((t) => t !== "job")
    .map((t) => ({
      type: t,
      posts: allPosts.filter((p) => p.type === t),
    }))
    .filter((g) => g.posts.length > 0);

  // Spotlight: prefer a featured listing, otherwise the newest post overall.
  const spotlight =
    allPosts.find((p) => p.featured) ?? (allPosts.length > 0 ? allPosts[0] : null);

  const statTiles = (
    [
      stats
        ? {
            label: "Practitioners",
            value: stats.practitioners.toLocaleString(),
            icon: <UsersIcon />,
          }
        : null,
      stats
        ? {
            label: "Active licences",
            value: stats.active.toLocaleString(),
            icon: <ShieldCheckIcon />,
          }
        : null,
      stats
        ? {
            label: "Patient ratings",
            value: stats.totalRatings.toLocaleString(),
            icon: <StarIcon />,
          }
        : null,
      facilityStats
        ? {
            label: "Hospitals",
            value: facilityStats.hospitals.toLocaleString(),
            icon: <CrossIcon />,
          }
        : null,
      facilityStats
        ? {
            label: "Pharmacies",
            value: facilityStats.pharmacies.toLocaleString(),
            icon: <PillIcon />,
          }
        : null,
    ] as ({
      label: string;
      value: string;
      icon: React.ReactNode;
    } | null)[]
  ).filter((s): s is { label: string; value: string; icon: React.ReactNode } => s !== null);

  return (
    <>
      {/* Hero, full-bleed photo, edge to edge, with text overlaid */}
      <FadeIn>
        <section className="relative flex min-h-[420px] items-center overflow-hidden sm:min-h-[480px] lg:min-h-[600px]">
          <MotionImg
            src="https://idishukmepvkzyguhxnm.supabase.co/storage/v1/object/public/post-images/home-hero-pediatric-checkup.webp"
            alt="A doctor giving a pediatric check-up to a smiling boy with his mother"
            className="absolute inset-0 h-full w-full object-cover object-top"
            loading="eager"
            width={1200}
            height={800}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />

          <div className="relative z-10 w-full px-4 py-10 text-center sm:px-10 sm:py-16">
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
              <AnimatedWords text="Jobs, grants, scholarships, fellowships, conferences, & more for Uganda's health workers." startDelay={0.15} />
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

      {/* Jump-to nav, makes the section stack obvious at a glance */}
      {ready && (
        <HomeSection tone="slate" compact>
          <nav
            aria-label="Home page sections"
            className="flex flex-wrap items-center justify-center gap-2"
          >
            {[
              { href: "#listings", label: "Jobs & opportunities" },
              { href: "#ratings", label: "Top-rated health workers" },
              { href: "#practitioners", label: "Search the registry" },
              { href: "#facilities", label: "Hospitals & pharmacies" },
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
      )}

      {/* Listings, hoisted to slot 2; asymmetric editorial layout */}
      {allPosts.length > 0 && (
        <section
          id="listings"
          className="scroll-mt-20 border-y border-emerald-100 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20"
        >
          <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">

            {/* Asymmetric section header */}
            <SlideIn from="left">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    Opportunities
                  </p>
                  <h2 className="mt-2 text-4xl font-black leading-[0.95] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-slate-50">
                    Jobs &amp;<br />Opportunities
                  </h2>
                </div>
                <div className="sm:text-right">
                  <p className="max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    Fresh listings for Uganda's health workforce, covering every career stage, every region.
                  </p>
                  <Link
                    href="/posts"
                    className="mt-2 inline-block text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
                  >
                    View all listings →
                  </Link>
                </div>
              </div>
            </SlideIn>

            {/* Spotlight (7 cols) + type panels sidebar (5 cols) */}
            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
              {spotlight && (
                <SlideIn from="left" className="lg:col-span-7">
                  <SpotlightListing post={spotlight} />
                </SlideIn>
              )}
              {typePanels.length > 0 && (
                <SlideIn from="right" delay={0.1} className="lg:col-span-5 flex flex-col gap-4">
                  {typePanels.slice(0, 3).map((g) => (
                    <PostTypePanel
                      key={g.type}
                      typeLabel={POST_TYPE_LABELS[g.type].plural}
                      href={`/${POST_TYPE_LABELS[g.type].plural.toLowerCase()}`}
                      count={g.posts.length}
                      posts={g.posts.slice(0, 2)}
                      type={g.type}
                    />
                  ))}
                </SlideIn>
              )}
            </div>

            {/* Latest jobs, staggered cards */}
            {topJobs.length > 0 && (
              <div className="mt-10">
                <SlideIn from="bottom">
                  <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Latest jobs
                  </p>
                </SlideIn>
                <StaggerGrid className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {topJobs.map((p, i) => (
                    <StaggerItem
                      key={p.id}
                      className={i % 2 === 1 ? "lg:mt-6" : ""}
                    >
                      <PostCard post={p} />
                    </StaggerItem>
                  ))}
                </StaggerGrid>
              </div>
            )}

            {/* Remaining type panels */}
            {typePanels.length > 3 && (
              <StaggerGrid className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {typePanels.slice(3).map((g) => (
                  <StaggerItem key={g.type}>
                    <PostTypePanel
                      typeLabel={POST_TYPE_LABELS[g.type].plural}
                      href={`/${POST_TYPE_LABELS[g.type].plural.toLowerCase()}`}
                      count={g.posts.length}
                      posts={g.posts.slice(0, 2)}
                      type={g.type}
                    />
                  </StaggerItem>
                ))}
              </StaggerGrid>
            )}

            <SlideIn from="bottom" delay={0.1}>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white/70 p-4 dark:border-emerald-900/40 dark:bg-slate-900/60">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Know an opening students or health workers would want to see?
                </p>
                <Link
                  href="/posts/new"
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Post a listing
                </Link>
              </div>
            </SlideIn>
          </div>
        </section>
      )}

      {/* Newsletter, job alerts by email */}
      <HomeSection
        id="newsletter"
        tone="emerald"
        eyebrow="Job alerts"
        eyebrowIcon={<MailIcon />}
        title="New jobs, straight to your inbox"
        description="Never miss an opening. Subscribe and get fresh jobs, scholarships, grants and conferences across Uganda delivered by email."
      >
        <SlideIn from="bottom">
          <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-100 bg-white/70 p-6 sm:p-8 dark:border-emerald-900/40 dark:bg-slate-900/60">
            <Newsletter roleOptions={roleOptions} locationOptions={locationOptions} />
          </div>
        </SlideIn>
      </HomeSection>

      {/* Section 2, the ratings of doctors */}
      <HomeSection
        id="ratings"
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

      {/* Section 3, the verified registry search */}
      <HomeSection
        id="practitioners"
        tone="white"
        eyebrow="Verified registry"
        eyebrowIcon={<UsersIcon />}
        title="Search licensed practitioners"
        description="Search every licensed health professional in Uganda by name, profession, council or licence number and check their registration status."
        action={{ href: "/practitioners", label: "Browse by profession" }}
      >
        {!ready ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900/50 dark:bg-amber-950/30">
            <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-300">
              Database not set up yet
            </h2>
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-400">
              Run{" "}
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">node scripts/setup_supabase.mjs</code>{" "}
              (with <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">SUPABASE_DB_URL</code> in{" "}
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">.env.local</code>) to create the
              tables, then{" "}
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">npm run import</code> to load the
              scraped registry. <Link href="/about" className="underline">Learn more</Link>
            </p>
          </div>
        ) : (
          <>
            <PractitionerSearch initialQuery={q ?? ""} initialData={initialResults} />
            {practitionerProfessions.length > 0 && (
              <div className="mt-2">
                <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Browse by profession
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {practitionerProfessions.slice(0, 10).map((c) => (
                    <Link
                      key={c.profession}
                      href={`/practitioners/profession/${slugify(c.profession)}`}
                      className="group rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-500 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-400"
                    >
                      <div className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-400">
                        {c.profession}s
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {c.count.toLocaleString()} licensed
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </HomeSection>

      {/* Section 4, hospitals & pharmacies, both clearly represented */}
      {facilitiesReady && (hospitals.length > 0 || pharmacies.length > 0) && (
        <HomeSection
          id="facilities"
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
      )}

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
            "@graph": [
              {
                "@type": "FAQPage",
                mainEntity: FAQS.map((f) => ({
                  "@type": "Question",
                  name: f.q,
                  acceptedAnswer: { "@type": "Answer", text: f.a },
                })),
              },
              topJobs.length > 0 && {
                "@type": "ItemList",
                name: "Health jobs in Uganda",
                itemListElement: topJobs.map((p, i) => ({
                  "@type": "ListItem",
                  position: i + 1,
                  name: p.title,
                  url: `${SITE_URL}/posts/${p.slug}`,
                })),
              },
              ...typePanels.map((g) => ({
                "@type": "ItemList",
                name: `${POST_TYPE_LABELS[g.type].plural} for health workers in Uganda`,
                itemListElement: g.posts.slice(0, 6).map((p, i) => ({
                  "@type": "ListItem",
                  position: i + 1,
                  name: p.title,
                  url: `${SITE_URL}/posts/${p.slug}`,
                })),
              })),
              topRated.length > 0 && {
                "@type": "ItemList",
                name: "Top-rated health workers in Uganda",
                itemListElement: topRated.map((p, i) => ({
                  "@type": "ListItem",
                  position: i + 1,
                  name: p.name,
                  url: `${SITE_URL}/practitioners/${p.id}`,
                })),
              },
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