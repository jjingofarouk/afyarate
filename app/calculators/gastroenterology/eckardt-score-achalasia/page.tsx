import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import EckardtCalculator from "./EckardtCalculator";
import {
  ECKARDT_SCORE_META,
  ECKARDT_DOMAINS,
  ECKARDT_STAGES,
  TREATMENT_MODALITIES,
  CLINICAL_PEARLS,
  RED_FLAGS,
  VALIDATED_REFERENCES,
  DIAGNOSTIC_IMAGES,
  CALCULATOR_FAQS,
} from "@/data/calculators/gastroenterology/eckardt-score-achalasia";

const PAGE_URL = `${SITE_URL}/calculators/gastroenterology/eckardt-score-achalasia`;

export const metadata: Metadata = {
  title: `${ECKARDT_SCORE_META.title} — Clinical Calculator`,
  description: `${ECKARDT_SCORE_META.summary} Free, evidence-based tool for gastroenterologists and GI surgeons. Validated against 8 peer-reviewed references including ACG guidelines and NEJM trials.`,
  keywords: [
    ...ECKARDT_SCORE_META.aliases,
    ...ECKARDT_SCORE_META.tags,
    "clinical calculator",
    "medical calculator",
    "gastroenterology calculator",
    "free medical tool",
    "evidence based calculator",
  ],
  alternates: { canonical: `/calculators/gastroenterology/eckardt-score-achalasia` },
  // Calculators shipped by mistake; keep them out of the index.
  robots: { index: false, follow: true },
  openGraph: {
    title: `${ECKARDT_SCORE_META.title} — ${SITE_NAME}`,
    description: ECKARDT_SCORE_META.summary,
    url: PAGE_URL,
    type: "website",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: CALCULATOR_FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Calculators", item: `${SITE_URL}/calculators` },
    { "@type": "ListItem", position: 3, name: "Gastroenterology", item: `${SITE_URL}/calculators/gastroenterology` },
    { "@type": "ListItem", position: 4, name: ECKARDT_SCORE_META.shortTitle, item: PAGE_URL },
  ],
};

const medicalWebPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "MedicalWebPage",
  name: ECKARDT_SCORE_META.title,
  description: ECKARDT_SCORE_META.summary,
  url: PAGE_URL,
  about: {
    "@type": "MedicalCondition",
    name: "Achalasia",
    code: { "@type": "MedicalCode", code: "K22.0", codingSystem: "ICD-10" },
    associatedAnatomy: { "@type": "AnatomicalStructure", name: "Esophagus" },
  },
  audience: { "@type": "MedicalAudience", audienceType: "Clinician" },
  lastReviewed: "2026-08-01",
};

export default function EckardtScoreAchalasiaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(medicalWebPageJsonLd) }}
      />

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* ── Breadcrumb ─────────────────────────────────────────── */}
        <nav
          className="mb-6 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="transition hover:text-emerald-700 dark:hover:text-emerald-400">
            Home
          </Link>
          <span aria-hidden>/</span>
          <Link href="/calculators" className="transition hover:text-emerald-700 dark:hover:text-emerald-400">
            Calculators
          </Link>
          <span aria-hidden>/</span>
          <Link href="/calculators/gastroenterology" className="transition hover:text-emerald-700 dark:hover:text-emerald-400">
            Gastroenterology
          </Link>
          <span aria-hidden>/</span>
          <span className="text-slate-600 dark:text-slate-300">{ECKARDT_SCORE_META.shortTitle}</span>
        </nav>

        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              {ECKARDT_SCORE_META.specialty}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {ECKARDT_SCORE_META.category}
            </span>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              ICD-10: K22.0
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
            {ECKARDT_SCORE_META.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
            {ECKARDT_SCORE_META.description}
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Evidence level: {ECKARDT_SCORE_META.evidenceLevel} · Updated {ECKARDT_SCORE_META.lastUpdated}
          </p>

          {/* Clinical context alert */}
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-200">
            <strong>Clinical context:</strong> {ECKARDT_SCORE_META.clinicalContext}
          </div>
        </header>

        {/* ── Interactive Calculator ─────────────────────────────── */}
        <section id="calculator" aria-label="Eckardt Score Calculator">
          <EckardtCalculator
            domains={ECKARDT_DOMAINS}
            stages={ECKARDT_STAGES}
            treatmentModalities={TREATMENT_MODALITIES}
          />
        </section>

        {/* ── Scoring Reference Table ────────────────────────────── */}
        <section id="scoring-table" className="mt-14">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Eckardt Score — Reference Table
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Each of the four domains is rated 0–3. The total score (0–12) determines the clinical stage.
          </p>
          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Score</th>
                  {ECKARDT_DOMAINS.map((d) => (
                    <th key={d.key} className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                      {d.shortLabel}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {[0, 1, 2, 3].map((score) => (
                  <tr key={score} className="bg-white dark:bg-slate-950">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100 tabular-nums">{score}</td>
                    {ECKARDT_DOMAINS.map((d) => (
                      <td key={d.key} className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {d.options[score]?.label}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Stage interpretation */}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {ECKARDT_STAGES.map((s) => {
              const borderColor = s.color === "emerald" ? "border-emerald-400 dark:border-emerald-700" :
                s.color === "amber" ? "border-amber-400 dark:border-amber-700" :
                "border-red-400 dark:border-red-700";
              const bgColor = s.color === "emerald" ? "bg-emerald-50 dark:bg-emerald-950/20" :
                s.color === "amber" ? "bg-amber-50 dark:bg-amber-950/20" :
                "bg-red-50 dark:bg-red-950/20";
              const textColor = s.color === "emerald" ? "text-emerald-900 dark:text-emerald-100" :
                s.color === "amber" ? "text-amber-900 dark:text-amber-100" :
                "text-red-900 dark:text-red-100";
              const subColor = s.color === "emerald" ? "text-emerald-700 dark:text-emerald-300" :
                s.color === "amber" ? "text-amber-700 dark:text-amber-300" :
                "text-red-700 dark:text-red-300";
              return (
                <div key={s.stage} className={`rounded-xl border-2 ${borderColor} ${bgColor} p-4`}>
                  <div className={`font-bold ${textColor}`}>{s.stage}</div>
                  <div className={`text-sm font-semibold ${subColor}`}>Score {s.scoreRange[0]}–{s.scoreRange[1]}</div>
                  <p className={`mt-2 text-xs leading-relaxed ${textColor}`}>{s.label}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Diagnostic Images ──────────────────────────────────── */}
        <section id="diagnostic-images" className="mt-14">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Diagnostic Reference Images
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Imaging and endoscopic findings relevant to achalasia diagnosis and treatment monitoring.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {DIAGNOSTIC_IMAGES.map((img) => (
              <div
                key={img.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.title}
                  className="h-52 w-full object-cover bg-slate-100 dark:bg-slate-800"
                  loading="lazy"
                />
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{img.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {img.caption}
                  </p>
                  <div className="mt-3 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
                    <p className="text-xs leading-relaxed text-emerald-800 dark:text-emerald-300">
                      <strong>Clinical relevance:</strong> {img.clinicalRelevance}
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                    {img.source} · {img.license}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Clinical Pearls ────────────────────────────────────── */}
        <section id="clinical-pearls" className="mt-14">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Clinical Pearls</h2>
          <ul className="mt-4 space-y-3">
            {CLINICAL_PEARLS.map((pearl, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{pearl}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Red Flags ─────────────────────────────────────────── */}
        <section id="red-flags" className="mt-14">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Red Flags — Suspect Pseudo-Achalasia or Malignancy
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            These features warrant urgent workup before attributing symptoms to primary achalasia.
          </p>
          <div className="mt-4 space-y-3">
            {RED_FLAGS.map((rf, i) => (
              <div
                key={i}
                className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/20"
              >
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">⚠ {rf.flag}</p>
                <p className="mt-1 text-sm text-red-700 dark:text-red-400">{rf.action}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Treatment Options ─────────────────────────────────── */}
        <section id="treatment-options" className="mt-14">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Treatment Options & Expected Outcomes
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            All options aim to achieve Eckardt Score ≤3. Therapy selection depends on achalasia subtype
            (HRM Chicago Classification), patient age, surgical risk, and center expertise.
          </p>
          <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                    Treatment
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                    Success Rate*
                  </th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 sm:table-cell">
                    Key Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {TREATMENT_MODALITIES.map((t) => (
                  <tr key={t.abbreviation} className="bg-white dark:bg-slate-950">
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {t.abbreviation}
                      </span>
                      <span className="ml-1.5 text-xs text-slate-400 dark:text-slate-500">
                        {t.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        {t.successRate}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-slate-600 dark:text-slate-400 sm:table-cell">
                      {t.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            * Success = Eckardt Score ≤3 at ≥12 months post-treatment. Rates based on pooled data from systematic reviews and RCTs.
          </p>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────── */}
        <section id="faq" className="mt-14">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Frequently Asked Questions
          </h2>
          <div className="mt-5 space-y-4">
            {CALCULATOR_FAQS.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{faq.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── References ────────────────────────────────────────── */}
        <section id="references" className="mt-14">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Validated References
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            This calculator is grounded in {VALIDATED_REFERENCES.length} peer-reviewed publications, including ACG/UEG guidelines and landmark NEJM/JAMA trials.
          </p>
          <ol className="mt-5 space-y-4">
            {VALIDATED_REFERENCES.map((ref, i) => (
              <li key={ref.id} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-slate-800 dark:text-slate-200">
                    {ref.authors}.{" "}
                    <strong className="font-semibold">{ref.title}.</strong>{" "}
                    <em>{ref.journal}</em>. {ref.year}.
                    {ref.doi && (
                      <>
                        {" "}doi:{" "}
                        <a
                          href={ref.url ?? `https://doi.org/${ref.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 underline dark:text-emerald-400"
                        >
                          {ref.doi}
                        </a>
                      </>
                    )}
                    {ref.pmid && <> PMID: {ref.pmid}.</>}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{ref.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Disclaimer ────────────────────────────────────────── */}
        <div className="mt-14 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Medical Disclaimer
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            This calculator is intended for use by qualified healthcare professionals as a clinical decision-support tool. It does not replace clinical judgment, a thorough patient history, physical examination, or validated diagnostic workup including high-resolution manometry and esophageal imaging. All treatment decisions must be made by a licensed clinician in the context of the individual patient. {SITE_NAME} bears no responsibility for clinical decisions made on the basis of this tool.
          </p>
        </div>

        <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
          Last updated: {ECKARDT_SCORE_META.lastUpdated} · {ECKARDT_SCORE_META.evidenceLevel}
        </p>
      </div>
    </>
  );
}
