"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Newsletter from "@/components/Newsletter";

// Cycles through these states, bell icon used when emoji is null
const PHASES = [
  { emoji: null,  text: "Daily job updates"        },
  { emoji: "😊", text: "We found jobs for you"    },
  { emoji: null,  text: "Fresh listings today"     },
  { emoji: "✨", text: "New opportunities posted"  },
  { emoji: null,  text: "Daily job updates"        },
  { emoji: "👋", text: "Join health workers"       },
  { emoji: null,  text: "Get matched alerts"       },
  { emoji: "🎯", text: "Your next role is here"    },
  { emoji: null,  text: "Daily job updates"        },
  { emoji: "🌟", text: "Opportunities this week"   },
  { emoji: null,  text: "Be first to know"         },
  { emoji: "💪", text: "Advance your career"       },
] as const;

function BellIcon() {
  return (
    <svg
      className="size-4 shrink-0"
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

export default function NewsletterFab() {
  const [open, setOpen]       = useState(false);
  const [phase, setPhase]     = useState(0);
  const [textKey, setTextKey] = useState(0); // forces re-mount for fade
  const [wiggle, setWiggle]   = useState(false);
  const pathname = usePathname();
  const isAdmin  = pathname.startsWith("/admin");

  // Cycle phase + fade text
  useEffect(() => {
    const id = setInterval(() => {
      setTextKey((k) => k + 1);
      setPhase((p) => (p + 1) % PHASES.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  // Wiggle: first time after 2.5s, then every 9s
  useEffect(() => {
    function doWiggle() {
      setWiggle(true);
      setTimeout(() => setWiggle(false), 800);
    }
    const first = setTimeout(doWiggle, 2500);
    const loop  = setInterval(doWiggle, 9000);
    return () => { clearTimeout(first); clearInterval(loop); };
  }, []);

  // Modal keyboard + scroll-lock
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

  if (isAdmin) return null;

  const current = PHASES[phase];

  return (
    <>
      {/* FAB */}
      <div className="fixed bottom-5 right-5 z-40 fab-pop">
        {/* Ping dot */}
        <span className="pointer-events-none absolute -right-1 -top-1 flex size-3.5">
          <span className="fab-ping absolute inline-flex size-full rounded-full bg-emerald-400" />
          <span className="relative inline-flex size-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950" />
        </span>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Subscribe for daily job updates"
          className={[
            "flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white",
            "shadow-lg shadow-emerald-950/30 transition-colors",
            "hover:bg-emerald-700 active:bg-emerald-800",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
            "dark:focus-visible:ring-offset-slate-950 sm:px-5",
            wiggle ? "fab-wiggle" : "",
          ].join(" ")}
        >
          {/* Icon slot, emoji or bell */}
          <span className="flex size-4 shrink-0 items-center justify-center leading-none">
            {current.emoji ? (
              <span className="text-[15px] leading-none select-none" aria-hidden>
                {current.emoji}
              </span>
            ) : (
              <BellIcon />
            )}
          </span>

          {/* Text with fade on change */}
          <span
            key={textKey}
            className="hidden sm:inline animate-[fadeIn_0.3s_ease-out_both]"
            style={{ animationName: "fadeIn" }}
          >
            {current.text}
          </span>
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          {/* Sheet, fixed height, header sticky, body scrolls */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Subscribe for daily job updates"
            className="relative z-10 flex w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl sm:max-h-[80vh] sm:rounded-2xl dark:bg-slate-900"
            style={{ maxHeight: "min(80vh, 600px)" }}
          >
            {/* Sticky header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-50">
                Daily job updates
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid size-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <CloseIcon />
              </button>
            </div>
            {/* Scrollable body */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <Newsletter
                title=""
                description="Fresh jobs, scholarships, grants, and conferences across Uganda tailored to your preferences."
                onSuccess={() => setOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
