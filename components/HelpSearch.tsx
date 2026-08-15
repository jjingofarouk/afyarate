"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HELP_ARTICLES, HELP_COLLECTIONS } from "@/data/help";

export default function HelpSearch() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return HELP_ARTICLES.filter((a) =>
      `${a.title} ${a.summary} ${a.collection}`.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div>
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for articles…"
          className="w-full rounded-2xl border border-slate-300 bg-white py-3.5 pl-12 pr-4 text-base shadow-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-emerald-900/40"
        />
      </div>

      {results && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No articles match &quot;{query}&quot;. Try a different search.
            </p>
          ) : (
            <ul>
              {results.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/help/${a.slug}`}
                    className="block rounded-xl px-4 py-3 transition hover:bg-emerald-50 dark:hover:bg-slate-800"
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{a.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{a.collection}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!results && (
        <div className="mt-10 space-y-10">
          {HELP_COLLECTIONS.map((collection) => {
            const articles = HELP_ARTICLES.filter((a) => a.collection === collection);
            if (articles.length === 0) return null;
            return (
              <section key={collection}>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {collection}
                </h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {articles.map((a) => (
                    <Link
                      key={a.slug}
                      href={`/help/${a.slug}`}
                      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-600"
                    >
                      <h3 className="text-sm font-semibold text-slate-900 transition group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-400">
                        {a.title}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {a.summary}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
