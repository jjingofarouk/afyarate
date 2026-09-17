"use client";

import { useState } from "react";

const input =
  "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800";

export default function AlertsPage() {
  const [email, setEmail] = useState("");
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [cadre, setCadre] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/job-alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, keyword, location, cadre, frequency }),
    });
    const data = (await res.json().catch(() => null)) as { message?: string; error?: string } | null;
    setBusy(false);
    setMsg(res.ok ? (data?.message ?? "Created") : (data?.error ?? "Failed"));
  };

  const unsubscribe = async () => {
    if (!email) return;
    const res = await fetch(`/api/job-alerts?email=${encodeURIComponent(email)}`, { method: "DELETE" });
    setMsg(res.ok ? "Unsubscribed" : "Failed");
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Job alerts</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Get new matching listings by email. No account needed.
      </p>
      <div className="mt-6 space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" type="email" className={input} />
        <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Keyword e.g. nurse" maxLength={150} className={input} />
        <div className="grid grid-cols-2 gap-2">
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" maxLength={120} className={input} />
          <input value={cadre} onChange={(e) => setCadre(e.target.value)} placeholder="Cadre" maxLength={120} className={input} />
        </div>
        <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className={input}>
          <option value="daily">Daily digest</option>
          <option value="weekly">Weekly digest</option>
        </select>
        <div className="flex gap-2">
          <button type="button" disabled={busy || !email} onClick={() => void create()} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? "…" : "Create alert"}
          </button>
          <button type="button" onClick={() => void unsubscribe()} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold dark:bg-slate-800">
            Unsubscribe
          </button>
        </div>
        {msg && <p className="text-sm text-slate-600 dark:text-slate-400">{msg}</p>}
      </div>
    </div>
  );
}
