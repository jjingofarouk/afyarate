"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Post } from "@/lib/types";
import type { PostSort } from "@/lib/posts";
import PostCard from "./PostCard";
import PostCardSkeleton from "./PostCardSkeleton";

const PAGE_SIZE = 12;

export default function PostBoard({
  initialPosts,
  total: initialTotal,
  type,
  profession,
  location,
  organization,
}: {
  initialPosts: Post[];
  total: number;
  type?: string;
  profession?: string;
  location?: string;
  organization?: string;
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<PostSort>("featured");
  const [posts, setPosts] = useState(initialPosts);
  const [total, setTotal] = useState(initialTotal);
  // Two distinct loading states: a fresh search replaces the whole grid, a
  // "load more" appends to it — conflating them made the grid flicker
  // between old and new results while a search was in flight.
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const buildParams = useCallback(
    (offset: number, limit: number, currentQ: string, currentSort: PostSort) => {
      const params = new URLSearchParams({ offset: String(offset), limit: String(limit) });
      if (type) params.set("type", type);
      if (profession) params.set("profession", profession);
      if (location) params.set("location", location);
      if (organization) params.set("organization", organization);
      if (currentQ.trim()) params.set("q", currentQ.trim());
      if (currentSort !== "featured") params.set("sort", currentSort);
      return params;
    },
    [type, profession, location, organization],
  );

  const runSearch = useCallback(
    async (currentQ: string, currentSort: PostSort, signal?: AbortSignal) => {
      setSearching(true);
      setError(null);
      try {
        const params = buildParams(0, PAGE_SIZE, currentQ, currentSort);
        const res = await fetch(`/api/posts?${params.toString()}`, { signal });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data = await res.json();
        setPosts(data.items ?? []);
        setTotal(data.total ?? 0);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError("Couldn't load listings — please try again.");
        }
      } finally {
        setSearching(false);
      }
    },
    [buildParams],
  );

  // Debounced re-search whenever the query or sort changes. Skipped on
  // mount — the server already rendered the first page for that state.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const ctrl = new AbortController();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(q, sort, ctrl.signal);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, sort]);

  const hasMore = posts.length < total;
  const remaining = total - posts.length;

  async function loadMore() {
    setLoadingMore(true);
    setError(null);
    try {
      const params = buildParams(posts.length, PAGE_SIZE, q, sort);
      const res = await fetch(`/api/posts?${params.toString()}`);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setPosts((prev) => [...prev, ...(data.items ?? [])]);
    } catch {
      setError("Couldn't load more listings — please try again.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div>
      {/* Search + sort */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg
            aria-hidden="true"
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
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, organisation or location…"
            aria-label="Search listings"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-base outline-none transition placeholder:text-base placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/40"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as PostSort)}
          aria-label="Sort listings"
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="featured">Featured</option>
          <option value="closingSoon">Closing soon</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      {/* Announced to screen readers on change; visually the grid/skeletons below already show this */}
      <p className="sr-only" role="status" aria-live="polite">
        {searching
          ? "Loading listings…"
          : `${total.toLocaleString()} listing${total === 1 ? "" : "s"} found`}
      </p>

      {searching ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <PostCardSkeleton key={`search-${i}`} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
            {loadingMore &&
              Array.from({ length: Math.min(PAGE_SIZE, remaining) }).map((_, i) => (
                <PostCardSkeleton key={`more-${i}`} />
              ))}
          </div>

          {posts.length === 0 && !loadingMore && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              No listings matched your search. Try a different keyword, or{" "}
              <button
                type="button"
                onClick={() => setQ("")}
                className="text-emerald-700 underline dark:text-emerald-400"
              >
                clear the search
              </button>
              .
            </div>
          )}
        </>
      )}

      {error && (
        <p className="mt-4 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {hasMore && !searching && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-emerald-400"
          >
            {loadingMore ? "Loading…" : `Load more (${remaining} more)`}
          </button>
        </div>
      )}
    </div>
  );
}
