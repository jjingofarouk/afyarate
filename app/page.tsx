import { getProfessionCounts, getStats, isDbReady, searchPractitioners } from "@/lib/practitioners";
import { getFacilityStats, isFacilitiesReady, searchFacilities } from "@/lib/facilities";
import { getPosts } from "@/lib/posts";
import PractitionerSearch from "@/components/PractitionerSearch";
import FacilityCard from "@/components/FacilityCard";
import PostCard from "@/components/PostCard";
import { PAGE_SIZE, SITE_URL } from "@/lib/site";
import { FadeIn } from "@/components/motion/FadeIn";
import { AnimatedWords } from "@/components/motion/AnimatedWords";
import { MotionImg } from "@/components/motion/MotionImg";
import { slugify } from "@/lib/posts";
import Link from "next/link";

const FAQS = [
  {
    q: "Is Rate Musawo free to use?",
    a: "Yes. Searching the registry and reading or leaving ratings is completely free — for patients and health workers.",
  },
  {
    q: "Where does the licensing data come from?",
    a: "We use the official public register published by the Uganda Medical and Dental Practitioners Council (UMDPC), which lists every practitioner with a current licence.",
  },
  {
    q: "Who can leave a rating?",
    a: "Anyone who has seen a health worker can rate them — patients, their families, or colleagues. Each rating is reviewed and clearly marked as verified or unverified.",
  },
  {
    q: "Can I find a doctor near me?",
    a: "Yes — search by name, profession, council or licence number. Every practitioner page shows their council, registration and licence status so you can check they are currently licensed.",
  },
  {
    q: "How do I correct or update a listing?",
    a: "If you see outdated or incorrect licensing details, contact us and we will verify it against the official registry and fix it.",
  },
];

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  // Fetched here (not just client-side) so the first page of results is
  // already in the initial HTML — no client round-trip before anything shows.
  // Each call below gets its own Supabase client (see lib/supabase/server.ts),
  // so — unlike before — these are safe to run in parallel.
  const [ready, facilitiesReadyRaw] = await Promise.all([isDbReady(), isFacilitiesReady()]);
  const facilitiesReady = ready && facilitiesReadyRaw;

  const [stats, initialResults, practitionerProfessions, facilityStats, topFacilities, posts] =
    await Promise.all([
      ready ? getStats() : Promise.resolve(null),
      ready
        ? searchPractitioners({ q, status: "all", sort: "random", page: 1, pageSize: PAGE_SIZE })
        : Promise.resolve(undefined),
      ready ? getProfessionCounts() : Promise.resolve([]),
      facilitiesReady ? getFacilityStats() : Promise.resolve(null),
      facilitiesReady
        ? searchFacilities({ sort: "rating", page: 1, pageSize: 6 })
        : Promise.resolve(undefined),
      ready ? getPosts() : Promise.resolve([]),
    ]);
  const recentPosts = posts.slice(0, 6);

  return (
    <>
      {/* Hero — full-bleed photo, edge to edge, with text overlaid */}
      <FadeIn>
        <section className="relative flex min-h-[420px] items-center overflow-hidden sm:min-h-[480px] lg:min-h-[600px]">
          <MotionImg
            src="https://media.istockphoto.com/id/2156017445/photo/pediatric-checkup-for-smiling-boy-with-mother-and-doctor.webp?a=1&b=1&s=612x612&w=0&k=20&c=sQDaqjnI8xIG2k5xPD6hfVZhs872KhwoTZF-k1mCJ48="
            alt="A doctor giving a pediatric check-up to a smiling boy with his mother"
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            width={1200}
            height={800}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />

          <div className="relative z-10 w-full px-4 py-10 text-center sm:px-10 sm:py-16">
            <p className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              🇺🇬 The home for Uganda&apos;s health workers — verified, rated and hiring
            </p>
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
              <AnimatedWords text="Find the right care in Uganda." startDelay={0.15} />{" "}
              <AnimatedWords
                text="Rate it like a patient."
                startDelay={0.15 + 5 * 0.045}
                className="text-emerald-400"
              />
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-200">
              <AnimatedWords
                text="Search licensed doctors, nurses, pharmacists and allied health professionals, rate hospitals and pharmacies, and browse current health jobs and opportunities."
                startDelay={0.6}
                wordDelay={0.018}
              />
            </p>
          </div>
        </section>
      </FadeIn>

      <div className="mx-auto max-w-6xl px-4">
        {/* Stats */}
        {(stats || facilityStats) && (
          <FadeIn delay={0.1}>
            <section className="mb-8 mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
              {[
                stats ? { label: "Practitioners", value: stats.practitioners.toLocaleString() } : null,
                stats ? { label: "Active licences", value: stats.active.toLocaleString() } : null,
                stats ? { label: "Patient ratings", value: stats.totalRatings.toLocaleString() } : null,
                facilityStats ? { label: "Hospitals", value: facilityStats.hospitals.toLocaleString() } : null,
                facilityStats ? { label: "Pharmacies", value: facilityStats.pharmacies.toLocaleString() } : null,
              ]
                .filter((s): s is { label: string; value: string } => s !== null)
                .map((s) => (
                  <div
                    key={s.label}
                    className="min-w-0 rounded-2xl border border-slate-200 bg-white p-2.5 text-center shadow-sm sm:p-4 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="truncate text-lg font-bold text-emerald-700 sm:text-2xl dark:text-emerald-400">
                      {s.value}
                    </div>
                    <div className="mt-0.5 text-[10px] font-medium uppercase leading-tight tracking-wide text-slate-500 sm:text-xs dark:text-slate-400">
                      {s.label}
                    </div>
                  </div>
                ))}
            </section>
          </FadeIn>
        )}

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
          <PractitionerSearch initialQuery={q ?? ""} initialData={initialResults} />
        )}

        {/* Rate hospitals & pharmacies — top-rated, with a link to the full directory */}
        {topFacilities && topFacilities.items.length > 0 && (
          <section className="mt-14">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  Rate hospitals &amp; pharmacies
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {facilityStats
                    ? `${facilityStats.hospitals.toLocaleString()} hospitals and ${facilityStats.pharmacies.toLocaleString()} pharmacies across Uganda — see how patients rate them.`
                    : "Hospitals and pharmacies across Uganda, rated by patients."}
                </p>
              </div>
              <Link
                href="/facilities"
                className="text-sm font-medium text-emerald-700 underline hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Browse all facilities →
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topFacilities.items.map((f) => (
                <FacilityCard key={f.id} facility={f} />
              ))}
            </div>
          </section>
        )}

        {/* Latest jobs & opportunities — fresh listings from the board */}
        {recentPosts.length > 0 && (
          <section className="mt-14">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  Latest jobs &amp; opportunities
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Fresh openings for Uganda&apos;s health workforce.
                </p>
              </div>
              <Link
                href="/posts"
                className="text-sm font-medium text-emerald-700 underline hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                View all listings →
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentPosts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </section>
        )}

        {/* Browse by profession — internal linking that keeps crawl depth shallow */}
        {practitionerProfessions.length > 0 && (
          <section className="mt-14">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  Browse by profession
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Licensed practitioners and current openings, organised by cadre.
                </p>
              </div>
              <Link
                href="/practitioners"
                className="text-sm font-medium text-emerald-700 underline hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                View all →
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
          </section>
        )}

        {/* FAQ — mirrors the FAQPage structured data below */}
        <section className="mx-auto mt-14 max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Frequently asked questions
          </h2>
          <div className="mt-6 space-y-3">
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
        </section>
      </div>

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
              recentPosts.length > 0 && {
                "@type": "ItemList",
                name: "Latest health jobs & opportunities in Uganda",
                itemListElement: recentPosts.map((p, i) => ({
                  "@type": "ListItem",
                  position: i + 1,
                  name: p.title,
                  url: `${SITE_URL}/posts/${p.slug}`,
                })),
              },
              topFacilities && topFacilities.items.length > 0 && {
                "@type": "ItemList",
                name: "Hospitals & pharmacies in Uganda",
                itemListElement: topFacilities.items.slice(0, 6).map((f, i) => ({
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
