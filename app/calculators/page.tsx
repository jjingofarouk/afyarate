import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Clinical Calculators — Evidence-Based Medical Scoring Tools",
  description:
    "Free, evidence-based clinical calculators for gastroenterology, general medicine, and other specialties. Each tool is grounded in peer-reviewed literature with validated references and clinical interpretation guidance.",
  keywords: [
    "clinical calculator",
    "medical calculator",
    "scoring tool",
    "gastroenterology calculator",
    "Eckardt score",
    "achalasia",
    "evidence based medicine",
    "clinical decision support",
    "medical scoring",
  ],
  alternates: { canonical: "/calculators" },
  // Calculators shipped by mistake; keep them out of the index.
  robots: { index: false, follow: true },
  openGraph: {
    title: `Clinical Calculators — ${SITE_NAME}`,
    description: "Evidence-based clinical scoring tools for healthcare professionals.",
    url: `${SITE_URL}/calculators`,
    type: "website",
  },
};

const SPECIALTIES = [
  {
    slug: "gastroenterology",
    name: "Gastroenterology",
    description: "Motility disorders, IBD severity scoring, and GI functional disease assessment.",
    calculatorCount: 1,
    featured: "Eckardt Score for Achalasia",
    href: "/calculators/gastroenterology",
    color: "emerald",
  },
];

export default function CalculatorsIndexPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500" aria-label="Breadcrumb">
        <Link href="/" className="transition hover:text-emerald-700 dark:hover:text-emerald-400">Home</Link>
        <span>/</span>
        <span className="text-slate-600 dark:text-slate-300">Calculators</span>
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
          Clinical Calculators
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
          Free, evidence-based clinical scoring tools for healthcare professionals. Each calculator
          includes validated references, clinical interpretation, pearls, red flags, and guidance on
          appropriate use.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SPECIALTIES.map((specialty) => (
          <Link
            key={specialty.slug}
            href={specialty.href}
            className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 transition hover:border-emerald-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 transition group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-400">
                {specialty.name}
              </h2>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                {specialty.calculatorCount} tool{specialty.calculatorCount !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {specialty.description}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Featured: <span className="font-medium text-slate-600 dark:text-slate-300">{specialty.featured}</span>
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">About these tools</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          All calculators on {SITE_NAME} are grounded in validated, peer-reviewed clinical literature.
          Each tool includes explicit references, clinical context, limitations, and guidance on appropriate
          patient populations. These tools are intended for use by qualified clinicians as decision support
          aids and do not replace clinical judgment.
        </p>
      </div>
    </div>
  );
}
