"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import HandleGate, { useHandle } from "@/components/HandleGate";
import { useAuth } from "@/lib/auth-context";
import type { Post } from "@/lib/types";

function Saved() {
  const { profileId } = useHandle();
  const { authFetch } = useAuth();
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profileId) return;
    const res = await authFetch(`/api/saved?profileId=${profileId}`);
    if (res.ok) {
      const data = (await res.json()) as { items: Post[] };
      setItems(data.items);
    }
    setLoading(false);
  }, [profileId]);

  useEffect(() => {
    void load();
  }, [load]);

  const unsave = async (postId: number) => {
    if (!profileId) return;
    const res = await authFetch(`/api/saved?profileId=${profileId}&postId=${postId}`, { method: "DELETE" });
    if (res.ok) void load();
  };

  if (loading) return <p className="text-sm text-slate-400">Loading…</p>;
  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        Nothing saved yet. Browse <Link href="/posts" className="text-emerald-700 underline">listings</Link> and tap Save.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((p) => (
        <li key={p.id} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <Link href={`/posts/${p.slug}`} className="font-semibold hover:underline">
              {p.title}
            </Link>
            <p className="text-sm text-slate-500">{p.organization}</p>
          </div>
          <button
            type="button"
            onClick={() => void unsave(p.id)}
            className="text-sm font-semibold text-slate-400 hover:text-red-600"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function SavedPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Saved listings</h1>
      <div className="mt-6">
        <HandleGate prompt="Pick a display name to see your saved listings">
          <Saved />
        </HandleGate>
      </div>
    </div>
  );
}
