"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminJson } from "@/lib/admin-client";
import { POST_TYPE_LABELS, type Post, type PostType } from "@/lib/types";
import StatusBadge from "@/components/admin/StatusBadge";
import PostActions from "@/components/admin/PostActions";

interface StatCard {
  label: string;
  count: number;
  href: string;
  tone: "amber" | "emerald" | "red" | "slate";
}

const toneClass: Record<StatCard["tone"], string> = {
  amber: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  emerald: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  red: "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300",
  slate: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [queue, setQueue] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [pending, published, rejected, queueRes] = await Promise.all([
        adminJson<{ total: number }>("/api/admin/posts?status=draft&limit=1"),
        adminJson<{ total: number }>("/api/admin/posts?status=published&limit=1"),
        adminJson<{ total: number }>("/api/admin/posts?status=rejected&limit=1"),
        adminJson<{ items: Post[] }>("/api/admin/posts?status=draft&limit=8"),
      ]);
      setStats({
        pending: pending.total,
        published: published.total,
        rejected: rejected.total,
      });
      setQueue(queueRes.items);
    } catch {
      // 401 is handled by adminFetch (redirects to login).
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const cards: StatCard[] = [
    { label: "Pending review", count: stats.pending ?? 0, href: "/admin/posts?status=draft", tone: "amber" },
    { label: "Published", count: stats.published ?? 0, href: "/admin/posts?status=published", tone: "emerald" },
    { label: "Rejected", count: stats.rejected ?? 0, href: "/admin/posts?status=rejected", tone: "red" },
    { label: "All listings", count: (stats.pending ?? 0) + (stats.published ?? 0) + (stats.rejected ?? 0), href: "/admin/posts", tone: "slate" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Review submitted listings and manage the board.
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          + New listing
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`rounded-2xl border border-transparent p-5 shadow-sm transition hover:opacity-90 ${toneClass[c.tone]}`}
          >
            <p className="text-sm font-medium opacity-80">{c.label}</p>
            <p className="mt-1 text-3xl font-bold">
              {loading ? "…" : c.count}
            </p>
          </Link>
        ))}
      </div>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Moderation queue
          </h2>
          <Link
            href="/admin/posts?status=draft"
            className="text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
          >
            View all pending →
          </Link>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-slate-400">Loading…</p>
        ) : queue.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              All caught up 🎉
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              No listings waiting for review right now.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {queue.map((post) => (
              <li
                key={post.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={post.status} />
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        {POST_TYPE_LABELS[post.type as PostType]?.label ?? post.type}
                      </span>
                    </div>
                    <p className="mt-2 truncate font-semibold text-slate-900 dark:text-slate-100">
                      {post.title}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {post.organization}
                      {post.deadline ? ` · deadline ${post.deadline}` : ""}
                    </p>
                    {post.submitterEmail && (
                      <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                        Submitted by {post.submitterName || "someone"} · {post.submitterEmail}
                      </p>
                    )}
                  </div>
                  <PostActions post={post} onChanged={() => void load()} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
