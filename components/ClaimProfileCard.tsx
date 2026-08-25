"use client";

import Link from "next/link";
import { Frown } from "lucide-react";

function titleCaseName(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Always-visible claim pitch for unclaimed practitioner profiles. Two
 * variants: "strip" sits above the profile details, "card" lives in the
 * sidebar. Both drive to /claim where payment happens.
 */
export function ClaimStrip({ name }: { name: string }) {
  return (
    <div className="mb-5 flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-amber-800 dark:bg-amber-950/40">
      <p className="flex items-start gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
        <Frown className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        <span>
          Are you <span className="text-amber-700 dark:text-amber-400">{titleCaseName(name)}</span>?
          This profile is unclaimed — patients can&apos;t reach you through it yet.
        </span>
      </p>
      <Link
        href="/claim"
        className="shrink-0 rounded-full bg-amber-500 px-4 py-2 text-center text-sm font-bold text-white transition hover:bg-amber-600 active:bg-amber-700"
      >
        Claim it · UGX 5,000 once
      </Link>
    </div>
  );
}

const CARD_BENEFITS = [
  "Verified licence badge",
  "Phone & WhatsApp button for patients",
  "Your workplace and specialties",
] as const;

export function ClaimCard({ name }: { name: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-amber-300 shadow-sm dark:border-amber-800">
      <div className="bg-amber-500 px-5 py-3">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-white">
          Is this you?
        </p>
        <p className="text-base font-bold leading-snug text-white">
          Are you {titleCaseName(name)}?
        </p>
      </div>
      <div className="bg-white p-5 dark:bg-slate-900">
        <ul className="space-y-2.5">
          {CARD_BENEFITS.map((b, i) => (
            <li
              key={b}
              className="flex items-start gap-2 text-sm font-medium text-slate-700"
              style={{
                animation: `fadeIn 0.4s ease-out ${0.25 + i * 0.45}s both`,
              }}
            >
              <svg className="mt-0.5 size-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {b}
            </li>
          ))}
        </ul>

        <p
          className="mt-4 text-center"
          style={{ animation: "fadeIn 0.4s ease-out 1.7s both" }}
        >
          <span className="mr-2 text-xs font-semibold text-slate-400 line-through">UGX 9,900</span>
          <span className="text-lg font-extrabold text-slate-900 dark:text-slate-50">UGX 5,000</span>
          <span className="block text-[11px] font-medium text-slate-400 dark:text-slate-500">
            One-time payment · Yours forever · Never pay again
          </span>
        </p>

        <Link
          href="/claim"
          className="cta-glow mt-4 block w-full rounded-xl bg-amber-500 px-4 py-2.5 text-center text-sm font-bold text-white transition hover:bg-amber-600 active:bg-amber-700"
          style={{ animation: "fadeIn 0.4s ease-out 2s both" }}
        >
          Claim this profile
        </Link>
      </div>
    </div>
  );
}
