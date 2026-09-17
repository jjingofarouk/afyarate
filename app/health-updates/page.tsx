"use client";

import { useCallback, useEffect, useState } from "react";
import HandleGate, { useHandle } from "@/components/HandleGate";
import { getDisplayName, getProfileId } from "@/lib/handle";
import type { HealthUpdate } from "@/lib/types";

function Updates() {
  const { profileId, displayName } = useHandle();
  const [items, setItems] = useState<HealthUpdate[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [commentFor, setCommentFor] = useState<number | null>(null);
  const [comment, setComment] = useState("");

  const load = useCallback(async () => {
    const pid = getProfileId();
    const res = await fetch(`/api/health-updates${pid ? `?profileId=${pid}` : ""}`);
    if (res.ok) {
      const data = (await res.json()) as { items: HealthUpdate[] };
      setItems(data.items);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const publish = async () => {
    if (!title.trim() || !body.trim()) return;
    const res = await fetch("/api/health-updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId,
        authorName: displayName || getDisplayName(),
        title: title.trim(),
        body: body.trim(),
      }),
    });
    if (res.ok) {
      setTitle("");
      setBody("");
      void load();
    }
  };

  const react = async (id: number, action: "like" | "unlike" | "comment") => {
    const pid = getProfileId();
    if (!pid) return;
    const res = await fetch("/api/health-updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        updateId: id,
        profileId: pid,
        authorName: displayName || getDisplayName(),
        body: comment.trim(),
      }),
    });
    if (res.ok) {
      setComment("");
      setCommentFor(null);
      void load();
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Headline e.g. Free malaria testing in Gulu this week"
          maxLength={180}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Details, dates, where to go…"
          rows={3}
          maxLength={10000}
          className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <button
          type="button"
          disabled={!title.trim() || !body.trim()}
          onClick={() => void publish()}
          className="mt-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Publish update
        </button>
      </div>
      {items.map((u) => (
        <article key={u.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-400">{u.authorName}</p>
          <h2 className="mt-0.5 font-semibold">{u.title}</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{u.body}</p>
          <div className="mt-2 flex gap-4 text-sm">
            <button
              type="button"
              onClick={() => void react(u.id, u.likedByMe ? "unlike" : "like")}
              className={`font-semibold ${u.likedByMe ? "text-emerald-600" : "text-slate-400 hover:text-emerald-600"}`}
            >
              ♥ {u.likeCount}
            </button>
            <button
              type="button"
              onClick={() => setCommentFor(commentFor === u.id ? null : u.id)}
              className="font-semibold text-slate-400 hover:text-emerald-600"
            >
              💬 {u.commentCount}
            </button>
          </div>
          {commentFor === u.id && (
            <div className="mt-2 flex gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment…"
                maxLength={1200}
                className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
              <button
                type="button"
                onClick={() => void react(u.id, "comment")}
                className="rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white"
              >
                Send
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

export default function HealthUpdatesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Health updates</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Campaigns, outbreaks, vaccination drives and health news across Uganda.
      </p>
      <div className="mt-6">
        <HandleGate prompt="Pick a display name to share health updates">
          <Updates />
        </HandleGate>
      </div>
    </div>
  );
}
