import type { Metadata } from "next";
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
    </div>
  );
}
