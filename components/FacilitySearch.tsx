"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, type Variants } from "framer-motion";
import type { FacilitySearchResult } from "@/lib/types";
import FacilityCard from "./FacilityCard";
import FacilityCardSkeleton from "./FacilityCardSkeleton";

interface Filters {
  q: string;
  kind: string;
  city: string;
  sort: "rating" | "name";
  page: number;
}

const PAGE_SIZE = 12;

const baseFilters: Filters = {
  q: "",
  kind: "",
  city: "",
  sort: "rating",
  page: 1,
};

const gridVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

const KIND_TABS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "hospital", label: "Hospitals" },
  { value: "pharmacy", label: "Pharmacies" },
];

export default function FacilitySearch({
  initialQuery = "",
  initialKind = "",
  initialCity = "",
  initialData,
}: {
  initialQuery?: string;
  initialKind?: string;
  initialCity?: string;
  initialData?: FacilitySearchResult;
}) {
  const [filters, setFilters] = useState<Filters>({
    ...baseFilters,
    q: initialQuery,
    kind: initialKind,
    city: initialCity,
  });
  const [data, setData] = useState<FacilitySearchResult | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const runSearch = useCallback(async (f: Filters, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(f.page),
      pageSize: String(PAGE_SIZE),
    });
    if (f.q.trim()) params.set("q", f.q.trim());
    if (f.kind) params.set("kind", f.kind);
    if (f.city) params.set("city", f.city);
    params.set("sort", f.sort);
    try {
      const res = await fetch(`/api/facilities?${params.toString()}`, { signal });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setData(await res.json());
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError("Something went wrong loading facilities.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialData) return;
    const ctrl = new AbortController();
    runSearch(filters, ctrl.signal);
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runSearch]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(filters);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filters, runSearch]);

  const update = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <section className="pb-8">
      {/* Controls */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
              />
            </svg>
            <input
              type="search"
              value={filters.q}
              onChange={(e) => update({ q: e.target.value })}
              placeholder="Search hospitals and pharmacies by name, city or specialty…"
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-base outline-none transition placeholder:text-base placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/40"
            />
          </div>
          <select
            value={filters.city}
            onChange={(e) => update({ city: e.target.value })}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">All cities</option>
            {data?.cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value as Filters["sort"] })}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="rating">Top rated</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {KIND_TABS.map((tab) => {
            const active = filters.kind === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => update({ kind: tab.value })}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-emerald-600 text-white"
                    : "border border-slate-300 text-slate-600 hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-emerald-400"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results header */}
      <div className="mt-4 px-1 text-sm text-slate-600 dark:text-slate-400">
        {loading ? (
          "Loading…"
        ) : data ? (
          `Showing ${data.items.length ? (data.page - 1) * PAGE_SIZE + 1 : 0}–${
            (data.page - 1) * PAGE_SIZE + data.items.length
          } of ${data.total.toLocaleString()}`
        ) : (
          "Loading…"
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <FacilityCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <motion.div
          key={`${filters.page}-${filters.q}-${filters.kind}-${filters.city}-${filters.sort}`}
          variants={gridVariants}
          initial="hidden"
          animate="show"
          className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        >
          {(data?.items ?? []).map((f) => (
            <motion.div key={f.id} variants={cardVariants}>
              <FacilityCard facility={f} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {data && data.items.length === 0 && !loading && (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          No hospitals or pharmacies matched your search. Try a different name, city or specialty.
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            disabled={filters.page <= 1}
            onClick={() => update({ page: filters.page - 1 })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            ← Prev
          </button>
          <span className="px-2 text-sm text-slate-600 dark:text-slate-400">
            Page {filters.page} of {totalPages}
          </span>
          <button
            disabled={filters.page >= totalPages}
            onClick={() => update({ page: filters.page + 1 })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            Next →
          </button>
        </div>
      )}
    </section>
  );
}
