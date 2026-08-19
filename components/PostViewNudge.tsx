"use client";

import { useEffect, useState } from "react";
import Newsletter from "@/components/Newsletter";

const DISMISS_KEY = "rm-nudge-v1";

const TYPE_LABEL: Record<string, string> = {
  job: "job", internship: "internship", scholarship: "scholarship",
  grant: "grant", fellowship: "fellowship", conference: "conference",
  opportunity: "opportunity",
};

// Map post type → newsletter opportunity_type label
const TYPE_TO_PREF: Record<string, string> = {
  job: "Jobs", internship: "Internships", scholarship: "Scholarships",
  grant: "Grants", fellowship: "Fellowships", conference: "Conferences",
};

// Map profession string → newsletter role label (best-effort pre-fill)
const PROF_TO_ROLE: Record<string, string> = {
  nurse: "Nurse / Midwife", midwife: "Nurse / Midwife",
  doctor: "Doctor", physician: "Doctor", medical: "Doctor",
  "clinical officer": "Clinical Officer", clinical: "Clinical Officer",
  pharmacist: "Pharmacist", pharmacy: "Pharmacist",
  dentist: "Dentist", dental: "Dentist",
  laboratory: "Laboratory", lab: "Laboratory",
};

function profToRole(profession: string | null): string | null {
  if (!profession) return null;
  const p = profession.toLowerCase();
  return Object.entries(PROF_TO_ROLE).find(([k]) => p.includes(k))?.[1] ?? null;
}

export default function PostViewNudge({
  postType,
  profession,
}: {
  postType: string;
  profession: string | null;
}) {
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY)) return;
    const id = setTimeout(() => setShow(true), 30_000);
    return () => clearTimeout(id);
  }, []);

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
    setOpen(false);
  }

  if (!show) return null;

  const typeLabel = TYPE_LABEL[postType] ?? "opportunity";
  const defaultTypes = TYPE_TO_PREF[postType] ? [TYPE_TO_PREF[postType]] : [];
  const role = profToRole(profession);
  const defaultRoles = role ? [role] : [];

  const closeIcon = (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  return (
    <>
      {/* Compact teaser, bottom-right chip */}
      {!open && (
        <div
          className="fixed bottom-20 right-4 z-40 w-[min(300px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900"
          style={{ animation: "fab-pop 0.35s ease-out both" }}
        >
          <div className="flex items-start gap-3 p-4">
            <span className="text-2xl leading-none select-none" aria-hidden>🔔</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                More {typeLabel}s like this?
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Get matched opportunities in your inbox.
              </p>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="mt-2.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
              >
                Subscribe free →
              </button>
            </div>
            <button type="button" onClick={dismiss} aria-label="Dismiss"
              className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
              {closeIcon}
            </button>
          </div>
        </div>
      )}

      {/* Full modal when expanded */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <button type="button" aria-label="Close" onClick={dismiss}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 flex w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl dark:bg-slate-900 sm:rounded-2xl"
            style={{ maxHeight: "min(80vh, 600px)" }}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-50">Subscribe for free</p>
              <button type="button" onClick={dismiss} aria-label="Close"
                className="grid size-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">
                {closeIcon}
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <Newsletter
                title=""
                description=""
                defaultTypes={defaultTypes}
                defaultRoles={defaultRoles}
                onSuccess={dismiss}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
