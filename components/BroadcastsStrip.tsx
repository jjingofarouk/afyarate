"use client";

import { useEffect, useState } from "react";
import { getProfileId } from "@/lib/handle";
import { useAuth } from "@/lib/auth-context";
import type { Broadcast } from "@/lib/types";
import { Megaphone, X } from "lucide-react";

// Active announcements strip (mirrors legacy mohu_broadcasts). Renders
// nothing when there are no unread broadcasts.
export default function BroadcastsStrip() {
  const { authFetch } = useAuth();
  const [items, setItems] = useState<Broadcast[]>([]);
  const [dismissed, setDismissed] = useState<number[]>([]);

  useEffect(() => {
    const pid = getProfileId();
    void authFetch(`/api/broadcasts${pid ? `?profileId=${pid}` : ""}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { items: Broadcast[] } | null) => {
        if (data) setItems(data.items.filter((b) => !b.read));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = async (id: number) => {
    const pid = getProfileId();
    setDismissed((d) => [...d, id]);
    if (!pid) return;
    await authFetch("/api/broadcasts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ broadcastId: id, profileId: pid }),
    }).catch(() => {});
  };

  const visible = items.filter((b) => !dismissed.includes(b.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map((b) => (
        <div
          key={b.id}
          className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20"
        >
          <Megaphone aria-hidden className="size-5 shrink-0 text-amber-700 dark:text-amber-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-amber-900 dark:text-amber-200">{b.title}</p>
            <p className="mt-0.5 whitespace-pre-wrap text-sm text-amber-800 dark:text-amber-300">{b.message}</p>
          </div>
          <button
            type="button"
            onClick={() => void dismiss(b.id)}
            aria-label="Dismiss"
            className="shrink-0 rounded-lg px-2 py-1 text-sm text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/40"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
