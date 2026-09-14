import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { ECKARDT_SCORE_META } from "@/data/calculators/gastroenterology/eckardt-score-achalasia";

export const metadata: Metadata = {
  title: "Gastroenterology Clinical Calculators",
  description:
    "Evidence-based gastroenterology clinical calculators including achalasia severity scoring, motility assessment tools, and GI disease management aids for clinicians.",
  alternates: { canonical: "/calculators/gastroenterology" },
  // Calculators shipped by mistake; keep them out of the index.
  robots: { index: false, follow: true },
  openGraph: {
    title: `Gastroenterology Calculators — ${SITE_NAME}`,
    description: "Evidence-based GI clinical scoring tools for gastroenterologists and GI surgeons.",
    url: `${SITE_URL}/calculators/gastroenterology`,
    type: "website",
  },
};

const CALCULATORS = [
  {
    ...ECKARDT_SCORE_META,
    href: "/calculators/gastroenterology/eckardt-score-achalasia",
    scoreDomains: "Dysphagia · Regurgitation · Chest Pain · Weight Loss",
    scoreRange: "0–12",
    uses: ["Treatment decision", "Post-POEM/LHM monitoring", "Remission assessment"],
  },
];

export default function GastroenterologyCalculatorsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500" aria-label="Breadcrumb">
        <Link href="/" className="transition hover:text-emerald-700 dark:hover:text-emerald-400">Home</Link>
        <span>/</span>
        <Link href="/calculators" className="transition hover:text-emerald-700 dark:hover:text-emerald-400">Calculators</Link>
        <span>/</span>
        <span className="text-slate-600 dark:text-slate-300">Gastroenterology</span>
      </nav>

      <header className="mb-10">
        <div className="mb-3">
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            Gastroenterology
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
          Gastroenterology Clinical Calculators
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
          Evidence-based scoring tools for gastroenterologists and GI surgeons. All calculators include
          validated references, clinical pearls, and interpretation guidance.
        </p>
      </header>

      <div className="space-y-4">
        {CALCULATORS.map((calc) => (
          <Link
            key={calc.slug}
            href={calc.href}
            className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 transition hover:border-emerald-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold text-slate-900 transition group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-400">
                  {calc.title}
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{calc.category}</p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Score {calc.scoreRange}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{calc.summary}</p>
            <div className="flex flex-wrap gap-1.5">
              {calc.uses.map((u) => (
                <span
                  key={u}
                  className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                >
                  {u}
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Domains: {calc.scoreDomains}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          About these calculators
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          All calculators on {SITE_NAME} are grounded in peer-reviewed clinical literature and include
          explicit references, clinical context, and guidance on limitations. They are intended for use
          by qualified clinicians as decision support tools, not as standalone diagnostic instruments.
        </p>
      </div>
    </div>
  );
}
