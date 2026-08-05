"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SearchResult } from "@/lib/types";
import PractitionerCard from "./PractitionerCard";

const PAGE_SIZE = 12;

interface Filters {
  q: string;
  council: string;
  status: "all" | "active" | "inactive";
  sort: "name" | "rating" | "random";
  page: number;
}

const initialFilters: Filters = {
  q: "",
  council: "",
  status: "active",
  sort: "random",
  page: 1,
};

export default function PractitionerSearch() {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [data, setData] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (f: Filters, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(f.page),
      pageSize: String(PAGE_SIZE),
    });
    if (f.q.trim()) params.set("q", f.q.trim());
    if (f.council) params.set("council", f.council);
    params.set("status", f.status);
    params.set("sort", f.sort);
    try {
      const res = await fetch(`/api/practitioners?${params.toString()}`, {
        signal,
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setData(await res.json());
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError("Something went wrong loading results.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const ctrl = new AbortController();
    runSearch(initialFilters, ctrl.signal);
    return () => ctrl.abort();
  }, [runSearch]);

  // Debounced search on text change
  useEffect(() => {
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
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
              placeholder="Search by name, registration or licence number…"
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <select
            value={filters.council}
            onChange={(e) => update({ council: e.target.value })}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
          >
            <option value="">All councils</option>
            {data?.councils.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div className="flex rounded-xl border border-slate-300 p-0.5 text-sm">
            {(["all", "active", "inactive"] as const).map((s) => (
              <button
                key={s}
                onClick={() => update({ status: s })}
                className={`rounded-lg px-3 py-1.5 font-medium capitalize transition ${
                  filters.status === s
                    ? "bg-emerald-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {s === "active" ? "Active" : s === "inactive" ? "Inactive" : "All"}
              </button>
            ))}
          </div>
          <select
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value as Filters["sort"] })}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
          >
            <option value="random">Random mix</option>
            <option value="rating">Top rated</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </div>

      {/* Results header */}
      <div className="mt-4 flex items-center justify-between px-1 text-sm text-slate-600">
        <span>
          {data
            ? `Showing ${data.items.length ? (data.page - 1) * PAGE_SIZE + 1 : 0}–${
                (data.page - 1) * PAGE_SIZE + data.items.length
              } of ${data.total.toLocaleString()}`
            : "Loading…"}
        </span>
        {loading && <span className="animate-pulse text-emerald-600">Searching…</span>}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Grid */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {(data?.items ?? []).map((p) => (
          <PractitionerCard key={p.id} p={p} />
        ))}
      </div>

      {data && data.items.length === 0 && !loading && (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No practitioners matched your search. Try a different name or council.
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            disabled={filters.page <= 1}
            onClick={() => update({ page: filters.page - 1 })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="px-2 text-sm text-slate-600">
            Page {filters.page} of {totalPages}
          </span>
          <button
            disabled={filters.page >= totalPages}
            onClick={() => update({ page: filters.page + 1 })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </section>
  );
}
