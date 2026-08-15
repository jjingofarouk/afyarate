"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { adminJson } from "@/lib/admin-client";
import { POST_TYPES, POST_TYPE_LABELS, type Post, type PostType } from "@/lib/types";
import StatusBadge from "@/components/admin/StatusBadge";
import PostActions from "@/components/admin/PostActions";

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "draft", label: "Pending" },
  { key: "published", label: "Published" },
  { key: "expired", label: "Expired" },
  { key: "archived", label: "Archived" },
  { key: "rejected", label: "Rejected" },
] as const;

const PAGE_SIZE = 20;

function Manager() {
  const sp = useSearchParams();
  const [status, setStatus] = useState<string>(sp.get("status") ?? "");
  const [type, setType] = useState<string>("");
  const [q, setQ] = useState<string>("");
  const [debouncedQ, setDebouncedQ] = useState<string>("");

  const [items, setItems] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const offsetRef = useRef(0);

  useEffect(() => {
    setStatus(sp.get("status") ?? "");
  }, [sp]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(
    async (opts: { offset?: number; append?: boolean } = {}) => {
      const offset = opts.offset ?? 0;
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
      if (status) params.set("status", status);
      if (type) params.set("type", type);
      if (debouncedQ) params.set("q", debouncedQ);
      if (opts.append) setLoadingMore(true);
      else setLoading(true);
      try {
        const data = await adminJson<{ items: Post[]; total: number }>(`/api/admin/posts?${params}`);
        setItems((prev) => (opts.append ? [...prev, ...data.items] : data.items));
        setTotal(data.total);
        offsetRef.current = offset + data.items.length;
      } catch {
        // 401 handled in adminFetch
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [status, type, debouncedQ],
  );

  useEffect(() => {
    void load();
  }, [load]);

  function resetAndLoad(next: Partial<{ status: string; type: string; q: string }>) {
    if ("q" in next) setQ(next.q ?? "");
    if ("type" in next) setType(next.type ?? "");
    if ("status" in next) setStatus(next.status ?? "");
    // load() is triggered by the effects on these states.
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Listings
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {total} listing{total === 1 ? "" : "s"} · approve, edit, feature or remove posts.
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          + New listing
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => resetAndLoad({ status: t.key })}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                status === t.key
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <select
          value={type}
          onChange={(e) => resetAndLoad({ type: e.target.value })}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="">All types</option>
          {POST_TYPES.map((t) => (
            <option key={t} value={t}>
              {POST_TYPE_LABELS[t].label}
            </option>
          ))}
        </select>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title, organisation…"
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No listings found</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Try a different filter, or create a new listing.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Listing</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Deadline</th>
                <th className="px-4 py-3 font-semibold">Featured</th>
                <th className="px-4 py-3 font-semibold">Submitted by</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((post) => (
                <tr key={post.id} className="align-top">
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      {post.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.imageUrl}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-lg object-cover object-top"
                        />
                      ) : (
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-800">
                          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{post.title}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{post.organization}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {POST_TYPE_LABELS[post.type as PostType]?.label ?? post.type}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={post.status} />
                    {post.status === "rejected" && post.rejectionReason && (
                      <p className="mt-1 max-w-[180px] truncate text-xs text-red-500" title={post.rejectionReason}>
                        {post.rejectionReason}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{post.deadline ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {post.featured ? "⭐" : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {post.submitterEmail ? (
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        {post.submitterName || "User"}
                        <span className="block text-slate-400 dark:text-slate-500">{post.submitterEmail}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Admin</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex">
                      <PostActions post={post} onChanged={() => void load({ offset: 0 })} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && offsetRef.current < total && (
        <div className="text-center">
          <button
            type="button"
            disabled={loadingMore}
            onClick={() => void load({ offset: offsetRef.current, append: true })}
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {loadingMore ? "Loading…" : `Load more (${total - offsetRef.current} left)`}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminPostsPage() {
  return (
    <Suspense fallback={<p className="py-8 text-center text-sm text-slate-400">Loading…</p>}>
      <Manager />
    </Suspense>
  );
}
