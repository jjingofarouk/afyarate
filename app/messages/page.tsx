"use client";

import { useCallback, useEffect, useState } from "react";
import HandleGate, { useHandle } from "@/components/HandleGate";
import { getDisplayName } from "@/lib/handle";
import type { DmMessage, DmThread } from "@/lib/types";

function Inbox() {
  const { profileId, displayName } = useHandle();
  const [threads, setThreads] = useState<DmThread[]>([]);
  const [active, setActive] = useState<DmThread | null>(null);
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [draft, setDraft] = useState("");

  const loadThreads = useCallback(async () => {
    if (!profileId) return;
    const res = await fetch(`/api/dm/threads?profileId=${profileId}`);
    if (res.ok) {
      const data = (await res.json()) as { items: DmThread[] };
      setThreads(data.items);
    }
  }, [profileId]);

  const loadMessages = useCallback(
    async (thread: DmThread) => {
      if (!profileId) return;
      const res = await fetch(`/api/dm/messages?threadId=${thread.id}&profileId=${profileId}`);
      if (res.ok) {
        const data = (await res.json()) as { items: DmMessage[] };
        setMessages(data.items);
      }
    },
    [profileId],
  );

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (active) void loadMessages(active);
  }, [active, loadMessages]);

  const open = (t: DmThread) => {
    setActive(t);
    setMessages([]);
  };

  const send = async () => {
    if (!draft.trim() || !active || !profileId) return;
    const res = await fetch("/api/dm/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId: active.id,
        senderProfileId: profileId,
        senderName: displayName || getDisplayName(),
        body: draft.trim(),
      }),
    });
    if (res.ok) {
      setDraft("");
      void loadMessages(active);
      void loadThreads();
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-[240px_1fr]">
      <div className="space-y-2">
        {threads.length === 0 && (
          <p className="text-sm text-slate-500">
            No conversations yet. Visit a member&apos;s post and message them to start one.
          </p>
        )}
        {threads.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => open(t)}
            className={`w-full rounded-xl border p-3 text-left text-sm ${
              active?.id === t.id
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            }`}
          >
            <span className="font-semibold">{t.otherName}</span>
            {t.unread > 0 && (
              <span className="ml-2 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
                {t.unread}
              </span>
            )}
            {t.lastBody && (
              <span className="block truncate text-slate-500">{t.lastBody}</span>
            )}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        {!active ? (
          <p className="text-sm text-slate-500">Select a conversation.</p>
        ) : (
          <>
            <p className="text-sm font-semibold">{active.otherName}</p>
            <div className="mt-3 max-h-96 space-y-2 overflow-y-auto">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                    m.mine
                      ? "ml-auto bg-emerald-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800"
                  }`}
                >
                  {m.body}
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void send();
                }}
                placeholder="Write a message…"
                maxLength={2000}
                className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
              <button
                type="button"
                onClick={() => void send()}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Private conversations with other members.
      </p>
      <div className="mt-6">
        <HandleGate prompt="Pick a display name to read your messages">
          <Inbox />
        </HandleGate>
      </div>
    </div>
  );
}
