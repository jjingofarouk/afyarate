import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getHelpArticle, getRelatedArticles } from "@/data/help";
import { SITE_NAME } from "@/lib/site";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getHelpArticle(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.summary,
    alternates: { canonical: `/help/${article.slug}` },
  };
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (!match) return part;
    const href = match[2];
    return (
      <Link
        key={i}
        href={href}
        className="font-medium text-emerald-700 underline dark:text-emerald-400"
      >
        {match[1]}
      </Link>
    );
  });
}

function Block({ block }: { block: NonNullable<ReturnType<typeof getHelpArticle>>["blocks"][number] }) {
  if (block.type === "h2") {
    return <h2 className="mt-8 text-lg font-semibold text-slate-900 dark:text-slate-100">{block.text}</h2>;
  }
  if (block.type === "ul") {
    return (
      <ul className="mt-3 list-disc space-y-1.5 pl-5">
        {block.items?.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>
    );
  }
  if (block.type === "note") {
    return (
      <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
        {renderInline(block.text ?? "")}
      </p>
    );
  }
  return <p className="mt-3">{renderInline(block.text ?? "")}</p>;
}

export default async function HelpArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getHelpArticle(slug);
  if (!article) notFound();

  const related = getRelatedArticles(slug);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <nav className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
        <Link href="/help" className="transition hover:text-emerald-700 dark:hover:text-emerald-400">
          Help Center
        </Link>
        <span aria-hidden>/</span>
        <Link
          href={`/help#${article.collection.toLowerCase().replace(/\s+/g, "-")}`}
          className="transition hover:text-emerald-700 dark:hover:text-emerald-400"
        >
          {article.collection}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-slate-600 dark:text-slate-300">{article.title}</span>
      </nav>

      <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        {article.title}
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {article.collection} · Updated {article.updated}
      </p>

      <div className="mt-6 space-y-0 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <p className="text-base font-medium text-slate-800 dark:text-slate-200">{article.summary}</p>
        {article.blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Did this answer your question?
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          If not,{" "}
          <Link href="/contact" className="text-emerald-700 underline dark:text-emerald-400">
            contact us
          </Link>{" "}
          or call{" "}
          <a className="text-emerald-700 underline dark:text-emerald-400" href="tel:+256751360385">
            +256 751 360 385
          </a>
          .
        </p>
      </div>

      {related.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Related articles
          </h2>
          <ul className="mt-3 space-y-2">
            {related.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/help/${a.slug}`}
                  className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-600"
                >
                  <span className="text-sm font-medium text-slate-900 transition group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-400">
                    {a.title}
                  </span>
                  <svg
                    className="size-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
