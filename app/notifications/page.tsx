"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import HandleGate, { useHandle } from "@/components/HandleGate";
import { useAuth } from "@/lib/auth-context";

interface Note {
  id: number;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

function Inbox() {
  const { profileId } = useHandle();
  const { authFetch } = useAuth();
  const [items, setItems] = useState<Note[]>([]);

  const load = useCallback(async () => {
    if (!profileId) return;
    const res = await authFetch(`/api/notifications?profileId=${profileId}`);
    if (res.ok) {
      const data = (await res.json()) as { items: Note[] };
      setItems(data.items);
    }
  }, [profileId, authFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  const markAll = async () => {
    if (!profileId) return;
    await authFetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId }),
    });
    void load();
  };

  if (items.length === 0) {
    return <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No notifications yet.</p>;
  }

  return (
    <div>
      <div className="mb-3 text-right">
        <button type="button" onClick={() => void markAll()} className="text-sm font-semibold text-emerald-700 hover:underline">
          Mark all as read
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((n) => (
          <li
            key={n.id}
            className={`rounded-2xl border p-4 ${n.is_read ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" : "border-emerald-300 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20"}`}
          >
            <p className="text-sm font-semibold">{n.title}</p>
            {n.body && <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{n.body}</p>}
            <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
              <span>{new Date(n.created_at).toLocaleString()}</span>
              {n.link && (
                <Link href={n.link} className="font-semibold text-emerald-700 hover:underline">
                  View →
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
      <div className="mt-6">
        <HandleGate prompt="Pick a display name to see your notifications">
          <Inbox />
        </HandleGate>
      </div>
    </div>
  );
}
