"use client";

import { useCallback, useEffect, useState } from "react";
import HandleGate, { useHandle } from "@/components/HandleGate";
import { getDisplayName, getProfileId } from "@/lib/handle";
import type { PlatformFeedback } from "@/lib/types";
import { Star, ThumbsUp, ThumbsDown } from "lucide-react";

function Stars({ value, onPick }: { value: number; onPick: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onPick(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={`text-2xl ${n <= value ? "text-amber-400" : "text-slate-300"}`}
        >
          <Star className="size-6" aria-hidden />
        </button>
      ))}
    </div>
  );
}

function Board() {
  const { profileId, displayName } = useHandle();
  const [items, setItems] = useState<PlatformFeedback[]>([]);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/feedback");
    if (res.ok) {
      const data = (await res.json()) as { items: PlatformFeedback[] };
      setItems(data.items);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    if (!text.trim()) return;
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId,
        authorName: displayName || getDisplayName(),
        rating,
        feedbackText: text.trim(),
      }),
    });
    if (res.ok) {
      setText("");
      void load();
    }
  };

  const vote = async (id: number, v: 1 | -1) => {
    const pid = getProfileId();
    if (!pid) return;
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "vote", feedbackId: id, profileId: pid, vote: v }),
    });
    if (res.ok) void load();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <Stars value={rating} onPick={setRating} />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="How is the platform working for you?"
          rows={3}
          maxLength={2000}
          className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <button
          type="button"
          disabled={!text.trim()}
          onClick={() => void submit()}
          className="mt-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Submit feedback
        </button>
      </div>
      {items.map((f) => (
        <div key={f.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm">
            <span className="font-semibold">{f.authorName}</span>{" "}
            <span className="text-amber-500">{Array.from({ length: f.rating }).map((_, i) => (
              <Star key={i} className="inline size-4 align-[-0.125em] fill-amber-500 text-amber-500" aria-hidden />
            ))}</span>
          </p>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{f.feedbackText}</p>
          <div className="mt-2 flex gap-3 text-sm">
            <button type="button" onClick={() => void vote(f.id, 1)} className="text-slate-400 hover:text-emerald-600">
              <ThumbsUp className="inline size-4 align-[-0.125em]" aria-hidden /> Helpful ({f.helpful})
            </button>
            <button type="button" onClick={() => void vote(f.id, -1)} className="text-slate-400 hover:text-red-600">
              <ThumbsDown className="inline size-4 align-[-0.125em]" aria-hidden /> ({f.notHelpful})
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Platform feedback</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Rate the platform and tell us what to improve.
      </p>
      <div className="mt-6">
        <HandleGate prompt="Pick a display name to leave feedback">
          <Board />
        </HandleGate>
      </div>
    </div>
  );
}
