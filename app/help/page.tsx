import type { Metadata } from "next";
import Link from "next/link";
import HelpSearch from "@/components/HelpSearch";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Help Center",
  description: `Help Center for ${SITE_NAME}: articles about searching the registry, patient ratings, licensing data, privacy, and the job board.`,
  alternates: { canonical: "/help" },
};

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        Help Center
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Search for articles about using {SITE_NAME} or browse by topic below.
      </p>

      <div className="mt-8">
        <HelpSearch />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/help/guides"
          className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-800"
        >
          <h2 className="font-semibold text-slate-900 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-400">
            Guides
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Jobseeker, employer, organization verification and applicant safety guides.
          </p>
        </Link>
        <Link
          href="/career"
          className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-800"
        >
          <h2 className="font-semibold text-slate-900 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-400">
            Career resources
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            CVs, cover letters, interviews, application strategy and career planning.
          </p>
        </Link>
      </div>
    </div>
  );
}
