"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Newsletter from "@/components/Newsletter";

// Cycles through these states, bell icon used when icon is null
const PHASES = [
  { icon: null,          text: "Daily job updates"        },
  { icon: "check",       text: "We found jobs for you"    },
  { icon: null,          text: "Fresh listings today"     },
  { icon: "sparkle",     text: "New opportunities posted" },
  { icon: null,          text: "Daily job updates"        },
  { icon: "users",       text: "Join health workers"      },
  { icon: null,          text: "Get matched alerts"       },
  { icon: "briefcase",   text: "Your next role is here"   },
  { icon: null,          text: "Daily job updates"        },
  { icon: "star",        text: "Opportunities this week"  },
  { icon: null,          text: "Be first to know"         },
  { icon: "trendingUp",  text: "Advance your career"      },
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

function CheckCircleIcon() {
  return (
    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18a47.99 47.99 0 01-12.756 0c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}

function TrendingUpIcon() {
  return (
    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  );
}

const PHASE_ICONS: Record<string, typeof BellIcon> = {
  check: CheckCircleIcon,
  sparkle: SparkleIcon,
  users: UsersIcon,
  briefcase: BriefcaseIcon,
  star: StarIcon,
  trendingUp: TrendingUpIcon,
};

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

  // Cycle phase + fade text + wiggle together, slow enough to actually read
  useEffect(() => {
    function tick() {
      setTextKey((k) => k + 1);
      setPhase((p) => (p + 1) % PHASES.length);
      setWiggle(true);
      setTimeout(() => setWiggle(false), 800);
    }
    const first = setTimeout(tick, 3000);
    const loop  = setInterval(tick, 9000);
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
  const CurrentIcon = current.icon ? PHASE_ICONS[current.icon] : BellIcon;

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
          {/* Icon slot, phase icon or bell */}
          <span className="flex size-4 shrink-0 items-center justify-center leading-none">
            <CurrentIcon />
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
