"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Newsletter from "@/components/Newsletter";

function BellIcon() {
  return (
    <svg
      className="size-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0M3.124 7.5A8.969 8.969 0 015.292 3m13.416 0a8.969 8.969 0 012.168 4.5"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      className="size-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

/**
 * Always-visible floating button ("Daily job updates") that opens a modal with
 * the newsletter signup form. Hidden on the admin panel.
 */
export default function NewsletterFab() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (isAdmin) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Subscribe for daily job updates"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-950/25 transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 sm:px-5"
      >
        <BellIcon />
        <span className="hidden sm:inline">Daily job updates</span>
      </button>

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
            aria-label="Subscribe for daily job updates"
            className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl dark:bg-slate-900"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-3 top-3 grid size-9 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <CloseIcon />
            </button>
            <Newsletter
              title="Daily job updates, straight to your inbox"
              description="Fresh jobs, scholarships, grants and conferences across Uganda delivered every day. Tell us what you want to hear about and we'll tailor it."
            />
          </div>
        </div>
      )}
    </>
  );
}