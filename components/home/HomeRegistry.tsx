import type { CSSProperties } from "react";
import Link from "next/link";
import {
  getProfessionCounts,
  isDbReady,
  searchPractitioners,
} from "@/lib/practitioners";
import { PAGE_SIZE } from "@/lib/site";
import { pluralProfession, slugify } from "@/lib/posts";
import PractitionerSearch from "@/components/PractitionerSearch";
import HomeSection from "@/components/home/HomeSection";
import { UsersIcon } from "@/components/home/HomeIcons";

/**
 * Verified registry search block (second half of the "practitioners" shuffle
 * slot). Uses an estimated count, the exact 114k-row count is pure latency
 * here and pagination stays correct.
 */
export default async function HomeRegistry({
  q,
  style,
}: {
  q?: string;
  style?: CSSProperties;
}) {
  const ready = await isDbReady().catch(() => false);
  const [initialResults, practitionerProfessions] = await Promise.all([
    ready
      ? searchPractitioners({
          q,
          status: "all",
          sort: "random",
          page: 1,
          pageSize: PAGE_SIZE,
          countMode: "estimated",
        }).catch(() => undefined)
      : Promise.resolve(undefined),
    ready ? getProfessionCounts().catch(() => []) : Promise.resolve([]),
  ]);

  return (
    <HomeSection
      id="practitioners"
      style={style}
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
                      {pluralProfession(c.profession)}
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
  );
}
