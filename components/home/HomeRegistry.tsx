import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  getFeaturedPractitionersByCouncil,
  getProfessionCounts,
  isDbReady,
} from "@/lib/practitioners";
import { pluralProfession, slugify } from "@/lib/posts";
import PractitionerCard from "@/components/PractitionerCard";
import HomeSection from "@/components/home/HomeSection";
import { UsersIcon } from "@/components/home/HomeIcons";
import { StaggerGrid, StaggerItem } from "@/components/motion/StaggerGrid";

/**
 * Verified registry block: three practitioners the register is built from, one
 * from each regulator council (medical & dental, nursing & midwifery, allied
 * health), plus the profession counts to browse deeper. One row, like the
 * top-rated block. The search box and its filters live at /practitioners, and
 * the hero search already covers looking someone up by name from here.
 */
export default async function HomeRegistry({ style }: { style?: CSSProperties }) {
  const ready = await isDbReady().catch(() => false);
  const [featured, practitionerProfessions] = await Promise.all([
    ready ? getFeaturedPractitionersByCouncil().catch(() => []) : Promise.resolve([]),
    ready ? getProfessionCounts().catch(() => []) : Promise.resolve([]),
  ]);

  return (
    <HomeSection
      id="practitioners"
      style={style}
      tone="white"
      eyebrow="Verified registry"
      eyebrowIcon={<UsersIcon />}
      title="Licensed practitioners"
      description="One from each regulator council: doctors and dentists, nurses and midwives, and allied health professionals. Every profile carries the licence status the council published, and the full register can be searched by name, profession or licence number."
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
          {featured.length > 0 && (
            <>
              <StaggerGrid className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((p) => (
                  <StaggerItem key={p.id}>
                    <PractitionerCard p={p} />
                  </StaggerItem>
                ))}
              </StaggerGrid>
              <div className="mt-6 flex justify-center">
                <Link
                  href="/practitioners"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  See more licensed practitioners
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </>
          )}
          {practitionerProfessions.length > 0 && (
            <div className={featured.length > 0 ? "mt-10" : "mt-2"}>
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
