"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { FacetItem } from "@/lib/posts";

const PAGE_SIZE = 60;

type Sort = "count" | "name";

interface Props {
  facets: FacetItem[];
  base: string;
  title: string;
  blurb: string;
  listLabel: string;
  crumb: string;
}

/**
 * Directory hub with instant search, A–Z filter, sort and pagination.
 * Everything runs client-side on the already-loaded facet list, so it stays
 * snappy even with 1,000+ organisations (no extra API round-trips).
 */
export default function OrganizationDirectory({
  facets,
  base,
  title,
  blurb,
  listLabel,
  crumb,
}: Props) {
  const [q, setQ] = useState("");
  const [letter, setLetter] = useState("");
  const [sort, setSort] = useState<Sort>("count");
  const [page, setPage] = useState(1);

  // Letters that actually have entries (plus "All").
  const letters = useMemo(() => {
    const set = new Set<string>();
    for (const f of facets) {
      const ch = f.label.trim().charAt(0).toUpperCase();
      if (ch && /[A-Z]/.test(ch)) set.add(ch);
    }
    return ["", ...[...set].sort()];
  }, [facets]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = facets;
    if (needle) list = list.filter((f) => f.label.toLowerCase().includes(needle));
    if (letter) list = list.filter((f) => f.label.trim().charAt(0).toUpperCase() === letter);
    if (sort === "name") {
      list = [...list].sort((a, b) => a.label.localeCompare(b.label));
    } else {
      list = [...list].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    }
    return list;
  }, [facets, q, letter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);
  const hasFilters = q.trim() !== "" || letter !== "";

  function resetFilters() {
    setQ("");
    setLetter("");
    setPage(1);
  }

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

      {/* Controls */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
            </svg>
            <label htmlFor="org-search" className="sr-only">
              Search {listLabel.toLowerCase()}s
            </label>
            <input
              id="org-search"
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder={`Search ${listLabel.toLowerCase()}s by name…`}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-base outline-none transition placeholder:text-base placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/40"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as Sort);
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="count">Most listings</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>

        {/* A–Z filter */}
        {letters.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {letters.map((l) => {
              const active = letter === l;
              return (
                <button
                  key={l || "all"}
                  type="button"
                  onClick={() => {
                    setLetter(l);
                    setPage(1);
                  }}
                  aria-pressed={active}
                  className={`h-8 min-w-8 rounded-lg px-2 text-sm font-semibold transition ${
                    active
                      ? "bg-emerald-600 text-white"
                      : "border border-slate-300 text-slate-600 hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-emerald-400"
                  }`}
                >
                  {l || "All"}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Results header */}
      <div className="mt-4 flex items-center justify-between px-1 text-sm text-slate-600 dark:text-slate-400">
        <span>
          {filtered.length === 0
            ? "No results"
            : `Showing ${start + 1}–${start + visible.length} of ${filtered.length.toLocaleString()}`}
        </span>
        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-medium text-emerald-700 underline hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Clear filters
          </button>
        )}
      </div>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((f) => (
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

      {filtered.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          No {listLabel.toLowerCase()}s matched your search. Try a different name or letter.
        </div>
      )}

      {facets.length === 0 && (
        <p className="mt-10 text-sm text-slate-500 dark:text-slate-400">
          No {listLabel.toLowerCase()}s are listed yet. Check back soon.
        </p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            ← Prev
          </button>
          <span className="px-2 text-sm text-slate-600 dark:text-slate-400">
            Page {safePage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage(safePage + 1)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            Next →
          </button>
        </div>
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
