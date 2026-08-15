"use client";

import Link from "next/link";
import { useState } from "react";
import { adminJson } from "@/lib/admin-client";
import type { Post } from "@/lib/types";

const btnBase =
  "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

export default function PostActions({
  post,
  onChanged,
}: {
  post: Post;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  async function act(action: string, body?: Record<string, unknown>) {
    setBusy(action);
    try {
      await adminJson(`/api/admin/posts/${post.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action, ...body }),
      });
      onChanged();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function reject() {
    const reason = window.prompt("Reason for rejection (shown to no one publicly, but stored for your records):");
    if (reason === null) return; // cancelled
    if (!reason.trim()) {
      alert("Please enter a reason for rejecting.");
      return;
    }
    await act("reject", { rejection_reason: reason.trim() });
  }

  async function toggleFeatured() {
    await act("", { featured: !post.featured });
  }

  async function remove() {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    setBusy("delete");
    try {
      await adminJson(`/api/admin/posts/${post.id}`, { method: "DELETE" });
      onChanged();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const published = post.status === "published";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {!published && (
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => act("publish")}
          className={`${btnBase} bg-emerald-600 text-white hover:bg-emerald-700`}
        >
          {busy === "publish" ? "…" : "Approve"}
        </button>
      )}
      {post.status === "draft" && (
        <button
          type="button"
          disabled={busy !== null}
          onClick={reject}
          className={`${btnBase} bg-red-600 text-white hover:bg-red-700`}
        >
          {busy === "reject" ? "…" : "Reject"}
        </button>
      )}
      {published && (
        <button
          type="button"
          disabled={busy !== null}
          onClick={toggleFeatured}
          className={`${btnBase} border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800`}
        >
          {post.featured ? "Unfeature" : "Feature"}
        </button>
      )}
      <Link
        href={`/admin/posts/${post.id}/edit`}
        className={`${btnBase} border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800`}
      >
        Edit
      </Link>
      <button
        type="button"
        disabled={busy !== null}
        onClick={remove}
        className={`${btnBase} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40`}
      >
        {busy === "delete" ? "…" : "Delete"}
      </button>
    </div>
  );
}
