"use client";

import { useCallback, useEffect, useState } from "react";
import { adminJson } from "@/lib/admin-client";

type Queue = "community" | "applications" | "reports" | "broadcasts" | "organizations" | "contact";

const QUEUES: { id: Queue; label: string }[] = [
  { id: "community", label: "Community" },
  { id: "applications", label: "Applications" },
  { id: "reports", label: "Reports" },
  { id: "contact", label: "Inbox" },
  { id: "broadcasts", label: "Broadcasts" },
  { id: "organizations", label: "Organizations" },
];

const ACTIONS: Record<Queue, { id: string; label: string }[]> = {
  community: [
    { id: "hide", label: "Hide" },
    { id: "restore", label: "Restore" },
    { id: "delete", label: "Delete" },
  ],
  applications: [
    { id: "reviewing", label: "Reviewing" },
    { id: "shortlisted", label: "Shortlist" },
    { id: "rejected", label: "Reject" },
    { id: "hired", label: "Hired" },
  ],
  reports: [
    { id: "in_progress", label: "In progress" },
    { id: "resolved", label: "Resolve" },
    { id: "open", label: "Reopen" },
  ],
  contact: [],
  broadcasts: [{ id: "deactivate", label: "Deactivate" }],
  organizations: [
    { id: "verify", label: "Verify" },
    { id: "unverify", label: "Unverify" },
  ],
};

export default function ModerationPage() {
  const [queue, setQueue] = useState<Queue>("community");
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async (q: Queue) => {
    setLoading(true);
    try {
      const data = await adminJson<{ items: Record<string, unknown>[] }>(
        `/api/admin/community?queue=${q}`,
      );
      setItems(data.items);
    } catch {
      // 401 handled by adminFetch.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(queue);
  }, [queue, load]);

  const act = async (id: number, action: string) => {
    await adminJson("/api/admin/community", {
      method: "PATCH",
      body: JSON.stringify({ queue, id, action }),
    });
    void load(queue);
  };

  const broadcast = async () => {
    if (!title.trim() || !message.trim()) return;
    await adminJson("/api/admin/community", {
      method: "POST",
      body: JSON.stringify({ title: title.trim(), message: message.trim(), audience: "all" }),
    });
    setTitle("");
    setMessage("");
    void load(queue);
  };

  const headline = (it: Record<string, unknown>): string =>
    String(it.subject ?? it.title ?? it.name ?? it.applicant_name ?? it.reporter_name ?? `#${String(it.id)}`);

  const subline = (it: Record<string, unknown>): string =>
    String(it.details ?? it.body ?? it.message ?? it.cover_note ?? it.description ?? "").slice(0, 200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Community moderation</h1>
        <p className="mt-1 text-sm text-slate-500">
          Posts, applications, reports, inbox, broadcasts and organizations.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUEUES.map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setQueue(q.id)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              queue === q.id ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800"
            }`}
          >
            {q.label}
          </button>
        ))}
      </div>

      {queue === "broadcasts" && (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-semibold">New broadcast</h2>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            maxLength={180}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message…"
            rows={3}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <button
            type="button"
            onClick={() => void broadcast()}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Publish
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          Nothing in this queue.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => {
            const id = Number(it.id);
            return (
              <li key={id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{headline(it)}</p>
                    {subline(it) && (
                      <p className="mt-1 text-sm text-slate-500">{subline(it)}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      {[it.status, it.author_name, it.applicant_email, it.created_at]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {ACTIONS[queue].map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => void act(id, a.id)}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
