import { getStats, isDbReady, searchPractitioners } from "@/lib/practitioners";
import PractitionerSearch from "@/components/PractitionerSearch";
import { PAGE_SIZE } from "@/lib/site";
import { FadeIn } from "@/components/motion/FadeIn";
import { AnimatedWords } from "@/components/motion/AnimatedWords";
import { MotionImg } from "@/components/motion/MotionImg";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const ready = await isDbReady();
  // Fetched here (not just client-side) so the first page of results is
  // already in the initial HTML — no client round-trip before anything shows.
  // Sequential, not Promise.all: concurrent calls on the shared Supabase
  // client produced garbled results (seen: 1000 items, then 0, for the
  // same query) — one request at a time is reliable.
  const stats = ready ? await getStats() : null;
  const initialResults = ready
    ? await searchPractitioners({ q, status: "all", sort: "random", page: 1, pageSize: PAGE_SIZE })
    : undefined;

  return (
    <>
      {/* Hero — full-bleed photo, edge to edge, with text overlaid */}
      <FadeIn>
        <section className="relative flex min-h-[420px] items-center overflow-hidden sm:min-h-[480px] lg:min-h-[600px]">
          <MotionImg
            src="/dr-jjingo-hero.jpg"
            alt="Dr. Jjingofarouk, founder of Rate Musawo"
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            width={1200}
            height={800}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />

          <div className="relative z-10 w-full px-4 py-10 text-center sm:px-10 sm:py-16">
            <p className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              🇺🇬 Uganda&apos;s licensed health professionals, rated by patients
            </p>
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
              <AnimatedWords text="Find a licensed practitioner." startDelay={0.15} />{" "}
              <AnimatedWords
                text="See how patients rate them."
                startDelay={0.15 + 4 * 0.045}
                className="text-emerald-400"
              />
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-200">
              <AnimatedWords
                text="Search doctors, nurses, pharmacists and allied health professionals with a valid licence, read community ratings, and leave your own."
                startDelay={0.6}
                wordDelay={0.018}
              />
            </p>
          </div>
        </section>
      </FadeIn>

      <div className="mx-auto max-w-6xl px-4">
        {/* Stats */}
        {stats && (
          <FadeIn delay={0.1}>
            <section className="mb-8 mt-8 grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: "Practitioners", value: stats.practitioners.toLocaleString() },
                { label: "Active licences", value: stats.active.toLocaleString() },
                { label: "Patient ratings", value: stats.totalRatings.toLocaleString() },
              ].map((s) => (
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
      </div>
    </>
  );
}
