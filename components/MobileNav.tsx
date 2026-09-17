"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Briefcase,
  ChevronDown,
  HeartPulse,
  Home,
  LayoutDashboard,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { POST_TYPES, POST_TYPE_LABELS } from "@/lib/types";
import ThemeToggle from "@/components/ThemeToggle";
import AuthButton from "@/components/AuthButton";

const linkClass =
  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800";

// Sub-items inside a group: indented, no icon, so the eye reads the group
// label first and the destinations second.
const subLinkClass =
  "flex items-center gap-2 rounded-lg py-1.5 pl-9 pr-3 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-emerald-400";

const legalLinkClass =
  "rounded-lg px-2 py-1 text-sm text-slate-500 transition hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400";

function CountBadge({ n }: { n: number | undefined }) {
  if (!n) return null;
  return (
    <span className="ml-auto shrink-0 rounded-full bg-amber-400 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-950">
      {n.toLocaleString("en-US")}
    </span>
  );
}

interface NavCounts {
  byType: Record<string, number>;
  total: number;
  practitioners: number;
  facilities: number;
  ambulances: number;
}

/**
 * One collapsible group. Native <details>, so it works without JavaScript,
 * is keyboard-operable, and keeps every destination in the DOM for crawlers.
 * Groups start collapsed: the drawer opens as a short list of destinations
 * rather than a wall of links.
 */
function NavGroup({
  icon: Icon,
  label,
  badge,
  children,
}: {
  icon: LucideIcon;
  label: string;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <details className="group">
      <summary
        className={`${linkClass} cursor-pointer list-none justify-between marker:content-none`}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <Icon
            aria-hidden
            className="size-4 shrink-0 text-navy-700 dark:text-navy-300"
            strokeWidth={2}
          />
          <span className="truncate">{label}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <CountBadge n={badge} />
          <ChevronDown
            aria-hidden
            className="size-4 text-slate-400 transition-transform group-open:rotate-180"
          />
        </span>
      </summary>
      <div className="mt-0.5 space-y-0.5 pb-1">{children}</div>
    </details>
  );
}

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<NavCounts | null>(null);
  const close = () => setOpen(false);

  // Lazy: only fetch nav counts once the menu is actually opened, and only
  // the first time, no point re-fetching on every open in one session.
  useEffect(() => {
    if (!open || counts) return;
    fetch("/api/nav-counts")
      .then((r) => r.json())
      .then(setCounts)
      .catch(() => {});
  }, [open, counts]);

  // Bottom-anchored widgets (the newsletter pill, the job-alert nudge) are
  // fixed to the viewport, so on a narrow screen the drawer covers them but
  // they still paint over the menu. Flag the state and let CSS hide them.
  useEffect(() => {
    const root = document.documentElement;
    if (open) root.dataset.navOpen = "true";
    else delete root.dataset.navOpen;
    return () => {
      delete root.dataset.navOpen;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-40 h-dvh w-screen bg-black/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={close}
            />
            <motion.div
              key="sidebar"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="fixed inset-y-0 right-0 z-50 flex h-dvh w-[min(88vw,18rem)] flex-col overflow-y-auto border-l border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Menu
                </span>
                <div className="flex items-center gap-1">
                  <ThemeToggle />
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close menu"
                    className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    <X aria-hidden className="size-5" />
                  </button>
                </div>
              </div>

              <nav className="mt-3 flex flex-1 flex-col gap-0.5" aria-label="Sections">
                <div onClick={close}>
                  <AuthButton full />
                </div>
                <Link
                  href="/posts/new"
                  onClick={close}
                  className="mt-3 rounded-xl bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Post a listing
                </Link>

                <div className="my-2 border-t border-slate-100 dark:border-slate-800" />

                <Link href="/" onClick={close} className={linkClass}>
                  <Home
                    aria-hidden
                    className="size-4 shrink-0 text-navy-700 dark:text-navy-300"
                    strokeWidth={2}
                  />
                  Home
                </Link>

                <NavGroup icon={Briefcase} label="Opportunities" badge={counts?.total}>
                  <Link href="/posts" onClick={close} className={subLinkClass}>
                    All listings
                  </Link>
                  {POST_TYPES.map((t) => (
                    <Link
                      key={t}
                      href={`/${POST_TYPE_LABELS[t].plural.toLowerCase()}`}
                      onClick={close}
                      className={subLinkClass}
                    >
                      {POST_TYPE_LABELS[t].plural}
                      <CountBadge n={counts?.byType[t]} />
                    </Link>
                  ))}
                </NavGroup>

                <NavGroup icon={Users} label="Community">
                  <Link href="/community" onClick={close} className={subLinkClass}>
                    Community feed
                  </Link>
                  <Link href="/health-updates" onClick={close} className={subLinkClass}>
                    Health updates
                  </Link>
                  <Link href="/seeking" onClick={close} className={subLinkClass}>
                    Jobseekers
                  </Link>
                </NavGroup>

                <NavGroup icon={HeartPulse} label="Find care">
                  <Link href="/practitioners" onClick={close} className={subLinkClass}>
                    Health professionals
                    <CountBadge n={counts?.practitioners} />
                  </Link>
                  <Link href="/facilities" onClick={close} className={subLinkClass}>
                    Hospitals &amp; pharmacies
                    <CountBadge n={counts?.facilities} />
                  </Link>
                  <Link href="/ambulances" onClick={close} className={subLinkClass}>
                    Ambulance services
                    <CountBadge n={counts?.ambulances} />
                  </Link>
                  <Link href="/organizations" onClick={close} className={subLinkClass}>
                    Organizations
                  </Link>
                </NavGroup>

                <NavGroup icon={LayoutDashboard} label="Workspace">
                  <Link href="/account" onClick={close} className={subLinkClass}>
                    My account
                  </Link>
                  <Link href="/applications" onClick={close} className={subLinkClass}>
                    My applications
                  </Link>
                  <Link href="/saved" onClick={close} className={subLinkClass}>
                    Saved listings
                  </Link>
                  <Link href="/alerts" onClick={close} className={subLinkClass}>
                    Job alerts
                  </Link>
                  <Link href="/employers" onClick={close} className={subLinkClass}>
                    Employer workspace
                  </Link>
                  <Link href="/messages" onClick={close} className={subLinkClass}>
                    Messages
                  </Link>
                  <Link href="/notifications" onClick={close} className={subLinkClass}>
                    Notifications
                  </Link>
                </NavGroup>

                <NavGroup icon={BookOpen} label="Resources">
                  <Link href="/career" onClick={close} className={subLinkClass}>
                    Career resources
                  </Link>
                  <Link href="/insights" onClick={close} className={subLinkClass}>
                    Market insights
                  </Link>
                  <Link href="/stats/uganda" onClick={close} className={subLinkClass}>
                    Uganda health stats
                  </Link>
                  <Link href="/help" onClick={close} className={subLinkClass}>
                    Help center
                  </Link>
                  <Link href="/help/guides" onClick={close} className={subLinkClass}>
                    Guides
                  </Link>
                  <Link href="/about" onClick={close} className={subLinkClass}>
                    About us
                  </Link>
                  <Link href="/contact" onClick={close} className={subLinkClass}>
                    Contact us
                  </Link>
                </NavGroup>

                <div className="mt-3 flex flex-wrap items-center gap-x-1 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <Link href="/terms" onClick={close} className={legalLinkClass}>
                    Terms
                  </Link>
                  <span aria-hidden className="text-slate-300 dark:text-slate-600">
                    ·
                  </span>
                  <Link href="/privacy" onClick={close} className={legalLinkClass}>
                    Privacy
                  </Link>
                  <span aria-hidden className="text-slate-300 dark:text-slate-600">
                    ·
                  </span>
                  <Link href="/disclaimer" onClick={close} className={legalLinkClass}>
                    Disclaimer
                  </Link>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
