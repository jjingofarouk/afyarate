"use client";

import { useEffect, useState } from "react";
import { ensureProfile, getDisplayName, getProfileId } from "@/lib/handle";
import { useAuth } from "@/lib/auth-context";

// Save/unsave toggle for a listing. Creates a one-click handle on first use.
export default function SaveButton({ postId }: { postId: number }) {
  const { authFetch } = useAuth();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const pid = getProfileId();
    if (!pid) return;
    void authFetch(`/api/saved?profileId=${pid}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { items: { id: number }[] } | null) => {
        if (data) setSaved(data.items.some((p) => p.id === postId));
      })
      .catch(() => {});
  }, [postId]);

  const toggle = async () => {
    setBusy(true);
    try {
      const pid = getProfileId() ?? (await ensureProfile(getDisplayName() || "Member"));
      const res = saved
        ? await authFetch(`/api/saved?profileId=${pid}&postId=${postId}`, { method: "DELETE" })
        : await authFetch("/api/saved", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profileId: pid, postId }),
          });
      if (res.ok) setSaved(!saved);
    } catch {
      // Ignore (private mode etc.).
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void toggle()}
      className={`mt-3 inline-flex items-center gap-1.5 rounded-xl border px-5 py-3 text-sm font-semibold transition ${
        saved
          ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
          : "border-slate-300 text-slate-600 hover:border-emerald-600 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300"
      }`}
    >
      {saved ? "★ Saved" : "☆ Save"}
    </button>
  );
}
