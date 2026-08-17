"use client";

import { useState } from "react";
import Link from "next/link";
import { POST_TYPES, POST_TYPE_LABELS } from "@/lib/types";

const itemClass =
  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-emerald-400";

export default function DesktopNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <nav className="hidden text-sm font-medium text-slate-600 sm:flex sm:items-center sm:gap-5 dark:text-slate-300">
      <div
        className="relative"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="inline-flex items-center gap-1 rounded-lg px-1 py-1 transition hover:text-emerald-700 dark:hover:text-emerald-400"
        >
          Jobs &amp; Opportunities
          <svg
            className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute left-0 top-full pt-2">
            <div className="w-60 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900">
              <Link href="/posts" onClick={close} className={itemClass}>
                <span className="grid size-7 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </span>
                All listings
              </Link>
              <div className="mx-2 my-1 border-t border-slate-100 dark:border-slate-800" />
              {POST_TYPES.map((t) => (
                <Link
                  key={t}
                  href={`/${POST_TYPE_LABELS[t].plural.toLowerCase()}`}
                  onClick={close}
                  className={itemClass}
                >
                  <span className="grid size-7 place-items-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2-8H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2z" />
                    </svg>
                  </span>
                  {POST_TYPE_LABELS[t].plural}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Link href="/practitioners" className="rounded-lg px-1 py-1 transition hover:text-emerald-700 dark:hover:text-emerald-400">
        Practitioners
      </Link>
      <Link href="/facilities" className="rounded-lg px-1 py-1 transition hover:text-emerald-700 dark:hover:text-emerald-400">
        Facilities
      </Link>
      <Link href="/umdpc" className="rounded-lg px-1 py-1 transition hover:text-emerald-700 dark:hover:text-emerald-400">
        UMDPC
      </Link>
      <Link href="/stats/uganda" className="rounded-lg px-1 py-1 transition hover:text-emerald-700 dark:hover:text-emerald-400">
        Stats
      </Link>
      <Link href="/news" className="rounded-lg px-1 py-1 transition hover:text-emerald-700 dark:hover:text-emerald-400">
        Guides
      </Link>
      <Link href="/about" className="rounded-lg px-1 py-1 transition hover:text-emerald-700 dark:hover:text-emerald-400">
        About
      </Link>
      <Link href="/help" className="rounded-lg px-1 py-1 transition hover:text-emerald-700 dark:hover:text-emerald-400">
        Help
      </Link>
      <Link href="/contact" className="rounded-lg px-1 py-1 transition hover:text-emerald-700 dark:hover:text-emerald-400">
        Contact
      </Link>
      <Link
        href="/posts/new"
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
      >
        Post a listing
      </Link>
    </nav>
  );
}
