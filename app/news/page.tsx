import type { Metadata } from "next";
import Link from "next/link";
import { getEditorialArticles } from "@/lib/editorial";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "News, Guides & Health Data",
  description: `Guides, licensing explainers, health directory updates and data pages for Uganda's health workforce on ${SITE_NAME}.`,
  alternates: { canonical: "/news" },
  openGraph: {
    title: `News, Guides & Health Data · ${SITE_NAME}`,
    description: `Guides, licensing explainers and health data pages for Uganda's health workforce.`,
    type: "website",
  },
};

export default function NewsPage() {
  const articles = getEditorialArticles();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "News, Guides & Health Data",
    description: metadata.description,
    url: `${SITE_URL}/news`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: articles.map((article, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: article.title,
        url: `${SITE_URL}/news/${article.slug}`,
      })),
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="mb-6 text-xs text-slate-400 dark:text-slate-500">
        <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">
          Home
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-600 dark:text-slate-400">News &amp; Guides</span>
      </nav>

      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-400">
          Content hub
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          News, guides and data pages for Uganda&apos;s health workforce
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Cornerstone pages for licensing, careers, facilities and market stats. Each piece links
          back to the registry, job board and facility directory so searchers can keep digging.
        </p>
      </header>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/news/${article.slug}`}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-400"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                {article.category}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">{article.readTime}</span>
            </div>
            <h2 className="mt-4 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {article.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {article.summary}
            </p>
            <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
              Updated {article.updated}
            </p>
          </Link>
        ))}
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}

