"use client";

import { useState, useEffect } from "react";
import Newsletter from "@/components/Newsletter";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function CloseIcon() {
  return (
    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function SubscribeTeaser() {
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) { setError(true); return; }
    setError(false);
    setOpen(true);
  }

  return (
    <>
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

          <div className="w-full shrink-0 sm:w-auto">
            <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(false); }}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
              />
              <button
                type="submit"
                className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Subscribe free
              </button>
            </form>
            {error && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                Enter a valid email address.
              </p>
            )}
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 flex w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl dark:bg-slate-900 sm:rounded-2xl"
            style={{ maxHeight: "min(80vh, 600px)" }}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-50">Daily job updates</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid size-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <Newsletter title="" description="" defaultEmail={email.trim()} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
