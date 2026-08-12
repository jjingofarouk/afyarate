import type { Metadata } from "next";
import Link from "next/link";
import { getProfessionCounts } from "@/lib/practitioners";
import { getProfessions as getJobProfessions } from "@/lib/posts";
import { slugify } from "@/lib/posts";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse Uganda's Licensed Health Professionals by Profession",
  description:
    "Search every licensed doctor, nurse, clinical officer, midwife, pharmacist, dentist and allied health professional in Uganda by profession — with patient ratings.",
  alternates: { canonical: "/practitioners" },
  openGraph: {
    title: "Browse Uganda's Licensed Health Professionals · Rate Musawo",
    description:
      "Find licensed doctors, nurses, clinical officers, pharmacists and allied health professionals in Uganda by profession.",
    type: "website",
  },
};

export default async function PractitionersHubPage() {
  const counts = await getProfessionCounts();
  const jobProfessions = await getJobProfessions();

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Practitioners" },
    ],
  };

  const listLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Uganda's Licensed Health Professionals by Profession",
    description: metadata.description,
    url: `${SITE_URL}/practitioners`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: counts.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `${c.profession}s in Uganda`,
        url: `${SITE_URL}/practitioners/profession/${slugify(c.profession)}`,
      })),
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="mb-6 text-xs text-slate-400 dark:text-slate-500">
        <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-600 dark:text-slate-400">Practitioners</span>
      </nav>

      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Browse Uganda&apos;s Licensed Health Professionals by Profession
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {SITE_DESCRIPTION} Pick a profession below to see registered, licensed practitioners —
          each with patient ratings, council and licence information.
        </p>
      </header>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {counts.map((c) => (
          <li key={c.profession}>
            <Link
              href={`/practitioners/profession/${slugify(c.profession)}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-500 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-400"
            >
              <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                {c.profession}s in Uganda
              </span>
              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                {c.count.toLocaleString()}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        Looking for an open role instead? See{" "}
        <a href="/professions" className="text-emerald-700 underline dark:text-emerald-400">
          jobs &amp; opportunities by profession
        </a>
        {jobProfessions.length > 0 && (
          <>
            {" "}— currently open for{" "}
            {jobProfessions.slice(0, 5).map((p, i) => (
              <span key={p.slug}>
                {i > 0 && ", "}
                <a
                  href={`/professions/${p.slug}`}
                  className="text-emerald-700 underline dark:text-emerald-400"
                >
                  {p.label}
                </a>
              </span>
            ))}
            .
          </>
        )}
      </p>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumbLd, listLd]) }}
      />
    </div>
  );
}
