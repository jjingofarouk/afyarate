"use client";

import { useCallback, useEffect, useState } from "react";
import HandleGate, { useHandle } from "@/components/HandleGate";
import { getDisplayName } from "@/lib/handle";
import type { ConnectionRequest } from "@/lib/types";

interface ThreadMsg {
  id: number;
  sender_name: string;
  body: string;
  created_at: string;
}

function Requests() {
  const { profileId, displayName } = useHandle();
  const [items, setItems] = useState<ConnectionRequest[]>([]);
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [requestType, setRequestType] = useState("other");
  const [active, setActive] = useState<number | null>(null);
  const [msgs, setMsgs] = useState<ThreadMsg[]>([]);
  const [reply, setReply] = useState("");

  const load = useCallback(async () => {
    if (!profileId) return;
    const res = await fetch(`/api/requests?profileId=${profileId}`);
    if (res.ok) {
      const data = (await res.json()) as { items: ConnectionRequest[] };
      setItems(data.items);
    }
  }, [profileId]);

  useEffect(() => {
    void load();
  }, [load]);

  const send = async () => {
    if (!subject.trim() || !details.trim()) return;
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderProfileId: profileId,
        senderName: displayName || getDisplayName(),
        targetType: "member",
        requestType,
        subject: subject.trim(),
        details: details.trim(),
      }),
    });
    if (res.ok) {
      setSubject("");
      setDetails("");
      void load();
    }
  };

  const openThread = async (id: number) => {
    setActive(id);
    const res = await fetch(`/api/requests/messages?requestId=${id}&profileId=${profileId}`);
    if (res.ok) {
      const data = (await res.json()) as { items: ThreadMsg[] };
      setMsgs(data.items);
    }
  };

  const sendReply = async () => {
    if (!reply.trim() || !active) return;
    const res = await fetch("/api/requests/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId: active,
        senderProfileId: profileId,
        senderName: displayName || getDisplayName(),
        body: reply.trim(),
      }),
    });
    if (res.ok) {
      setReply("");
      void openThread(active);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-semibold">New request</h2>
        <p className="text-sm text-slate-500">Ask for a referral, consultation enquiry or appointment.</p>
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              maxLength={180}
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="other">Other</option>
              <option value="message">Message</option>
              <option value="appointment_service">Appointment</option>
              <option value="consultation_enquiry">Consultation</option>
              <option value="referral">Referral</option>
            </select>
          </div>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Details…"
            rows={3}
            maxLength={5000}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <button
            type="button"
            onClick={() => void send()}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Send request
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold">My requests</h2>
        {items.length === 0 && <p className="text-sm text-slate-500">Nothing here yet.</p>}
        {items.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{r.subject}</p>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold dark:bg-slate-800">
                {r.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{r.details}</p>
            <button
              type="button"
              onClick={() => void openThread(r.id)}
              className="mt-2 text-sm font-semibold text-emerald-700 hover:underline"
            >
              {active === r.id ? "Refresh messages" : "View messages"}
            </button>
            {active === r.id && (
              <div className="mt-2 space-y-2 border-t border-slate-100 pt-2 dark:border-slate-800">
                {msgs.map((m) => (
                  <div key={m.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
                    <span className="font-semibold">{m.sender_name}</span>{" "}
                    <span className="text-slate-600 dark:text-slate-400">{m.body}</span>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Reply…"
                    maxLength={3000}
                    className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => void sendReply()}
                    className="rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RequestsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Requests</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Referrals, appointment and consultation requests between members.
      </p>
      <div className="mt-6">
        <HandleGate prompt="Pick a display name to manage requests">
          <Requests />
        </HandleGate>
      </div>
    </div>
  );
}
