"use client";

import { useState } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SubscribeTeaser() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) { setStatus("error"); return; }
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_address: trimmed }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="col-span-full rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white px-6 py-8 dark:border-emerald-900/40 dark:from-emerald-950/30 dark:to-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Free alerts
          </p>
          <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Don&apos;t miss the right opportunity
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Get matched jobs, scholarships and grants delivered to your inbox — tailored to your role and region.
          </p>
        </div>

        <div className="shrink-0 w-full sm:w-auto">
          {status === "done" ? (
            <p className="rounded-xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              ✓ You&apos;re subscribed!
            </p>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {status === "loading" ? "…" : "Subscribe free"}
              </button>
            </form>
          )}
          {status === "error" && (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
              Enter a valid email address.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
