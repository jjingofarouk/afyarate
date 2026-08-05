"use client";

import { useState } from "react";
import type { Post } from "@/lib/types";
import PostCard from "./PostCard";
import PostCardSkeleton from "./PostCardSkeleton";

const PAGE_SIZE = 12;

export default function PostBoard({
  initialPosts,
  total,
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
  const [posts, setPosts] = useState(initialPosts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMore = posts.length < total;
  const remaining = total - posts.length;

  async function loadMore() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        offset: String(posts.length),
        limit: String(PAGE_SIZE),
      });
      if (type) params.set("type", type);
      if (profession) params.set("profession", profession);
      if (location) params.set("location", location);
      if (organization) params.set("organization", organization);
      const res = await fetch(`/api/posts?${params.toString()}`);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setPosts((prev) => [...prev, ...(data.items ?? [])]);
    } catch {
      setError("Couldn't load more listings — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
        {loading &&
          Array.from({ length: Math.min(PAGE_SIZE, remaining) }).map((_, i) => (
            <PostCardSkeleton key={`skeleton-${i}`} />
          ))}
      </div>

      {error && (
        <p className="mt-4 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-emerald-400"
          >
            {loading ? "Loading…" : `Load more (${remaining} more)`}
          </button>
        </div>
      )}
    </div>
  );
}
