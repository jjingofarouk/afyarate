import Link from "next/link";
import type { FacetItem } from "@/lib/posts";

interface Props {
  facets: FacetItem[];
  base: string;
  title: string;
  blurb: string;
  listLabel: string;
  crumb: string;
}

export default function FacetHub({
  facets,
  base,
  title,
  blurb,
  listLabel,
  crumb,
}: Props) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="mb-6 text-xs text-slate-400 dark:text-slate-500">
        <a href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">Home</a>
        <span className="mx-1.5">/</span>
        <a href="/posts" className="hover:text-emerald-700 dark:hover:text-emerald-400">Jobs &amp; Opportunities</a>
        <span className="mx-1.5">/</span>
        <span className="text-slate-600 dark:text-slate-400">{crumb}</span>
      </nav>

      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {blurb}
        </p>
      </header>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {facets.map((f) => (
          <li key={f.slug}>
            <Link
              href={`${base}/${f.slug}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-500 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-400"
            >
              <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                {f.label}
              </span>
              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                {f.count}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {facets.length === 0 && (
        <p className="mt-10 text-sm text-slate-500 dark:text-slate-400">
          No {listLabel.toLowerCase()} are listed yet. Check back soon.
        </p>
      )}

      <p className="mt-10 border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        Looking for something else? See{" "}
        <a href="/posts" className="text-emerald-700 underline dark:text-emerald-400">
          all {listLabel.toLowerCase()} listings
        </a>{" "}
        or{" "}
        <a href="/posts/new" className="text-emerald-700 underline dark:text-emerald-400">
          post a new listing
        </a>
        .
      </p>
    </div>
  );
}
