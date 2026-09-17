import type { Metadata } from "next";
import Link from "next/link";
import { HELP_GUIDES } from "@/data/help-guides";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Guides",
  description: `Role and safety guides for ${SITE_NAME}: jobseekers, employers, organization verification and applicant safety.`,
  alternates: { canonical: "/help/guides" },
};

export default function HelpGuidesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <nav className="text-xs text-slate-400 dark:text-slate-500">
        <Link href="/help" className="hover:text-emerald-700 dark:hover:text-emerald-400">
          Help Center
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-600 dark:text-slate-400">Guides</span>
      </nav>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        Guides
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Step-by-step guidance for each role on the platform, plus staying safe while you apply.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {HELP_GUIDES.map((g) => (
          <Link
            key={g.slug}
            href={`/help/guides/${g.slug}`}
            className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-800"
          >
            <h2 className="font-semibold text-slate-900 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-400">
              {g.title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {g.intro}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
