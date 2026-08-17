import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEditorialArticle, getEditorialArticles } from "@/lib/editorial";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getEditorialArticle(slug);
  if (!article) return { title: "Not found" };
  return {
    title: article.title,
    description: article.summary,
    alternates: { canonical: `/news/${article.slug}` },
    openGraph: {
      title: `${article.title} · ${SITE_NAME}`,
      description: article.summary,
      url: `${SITE_URL}/news/${article.slug}`,
      type: "article",
    },
  };
}

function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getEditorialArticle(slug);
  if (!article) notFound();

  const related = getEditorialArticles().filter((item) => item.slug !== article.slug).slice(0, 3);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.summary,
    datePublished: "2026-08-17",
    dateModified: "2026-08-17",
    author: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: `${SITE_URL}/news/${article.slug}`,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <nav className="mb-6 text-xs text-slate-400 dark:text-slate-500">
        <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">
          Home
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/news" className="hover:text-emerald-700 dark:hover:text-emerald-400">
          News &amp; Guides
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-600 dark:text-slate-400">{article.title}</span>
      </nav>

      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            {article.category}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">{article.readTime}</span>
          <span className="text-xs text-slate-400 dark:text-slate-500">Updated {article.updated}</span>
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {article.title}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-400">
          {article.summary}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {article.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="mt-8 space-y-8">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {section.heading}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400"
                >
                  {paragraph}
                </p>
              ))}
              {section.bullets && (
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </article>

      <section className="mt-8">
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
          More guides
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {related.map((item) => (
            <Link
              key={item.slug}
              href={`/news/${item.slug}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm transition hover:border-emerald-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-400"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                {item.category}
              </p>
              <p className="mt-2 font-medium text-slate-900 dark:text-slate-50">{item.title}</p>
            </Link>
          ))}
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
    </div>
  );
}
