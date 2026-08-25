"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import animationData from "@/components/claim/heartbeat.json";

const Lottie = dynamic(
  () => import("lottie-react").then((m) => m.Lottie),
  { ssr: false }
) as React.ComponentType<{
  src: string | object;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
}>;

const DISMISS_KEY = "claimBannerDismissedAt";
const SHOWN_KEY = "claimBannerShown";
const DISMISS_DAYS = 7;

const HOOKS = [
  "Patients are searching for you right now.",
  "Your next patient is looking for a verified specialist.",
  "Patients trust what they can verify.",
  "Make it simple for patients to choose you.",
  "Your profile should work as hard as you do.",
  "Be the first name patients find.",
  "A verified profile gets chosen first.",
  "Give patients a reason to pick you.",
  "Patients remember practitioners they can contact.",
  "Stand out where patients are searching.",
  "Your reputation deserves to be seen.",
  "Turn searches into appointments.",
  "Be found. Be contacted. Be chosen.",
  "Every patient starts with a search.",
  "The most trusted names are the most visible ones.",
  "Patients compare before they call.",
  "Let your qualifications speak to every patient.",
  "Your practice grows when patients can reach you.",
  "Serious patients look for serious professionals.",
  "Patients choose practitioners they can verify.",
] as const;

const SUBS = [
  "Get verified, then add your phone, workplace and specialty so patients can reach you directly.",
  "A verified profile shows your licence, your contacts and where you work, all in one place.",
  "Verification confirms your licence publicly and unlocks direct patient contact details.",
  "Verified practitioners appear complete: photo, workplace, specialties and contact information.",
  "Once verified, patients can call or WhatsApp you straight from your profile.",
  "Show patients your licence is genuine, then give them a way to book you.",
  "Complete profiles win more patients than bare listings.",
  "Add your workplace and specialties so the right patients find you.",
  "Your contact details stay yours. Patients reach you directly, no middleman.",
  "Verified means checked against the national registry, so patients know you are genuine.",
] as const;

const PERSONAL_TEMPLATES = [
  "Is this your profile? Claim it before someone else does.",
  "This profile could be working for you right now.",
  "Patients cannot reach you if they cannot find you.",
  "One payment, yours forever. Claim this profile today.",
  "Get verified and let patients contact you directly.",
  "Are you this practitioner? Make this page yours.",
] as const;

function titleCaseName(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function CheckIcon() {
  return (
    <svg className="mt-0.5 size-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SadIcon() {
  return (
    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M9 10h.01M15 10h.01" />
      <path strokeLinecap="round" d="M9 16c.8-1 1.9-1.5 3-1.5s2.2.5 3 1.5" />
    </svg>
  );
}

export default function ClaimBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [practitionerName, setPractitionerName] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => { setMounted(true); }, []);

  const blocked =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/claim");

  const profileMatch = pathname.match(/^\/practitioners\/(\d+)$/);

  useEffect(() => {
    if (blocked || !profileMatch) return;
    fetch(`/api/practitioners/${profileMatch[1]}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && !data.claimed && data.name) {
          setPractitionerName(titleCaseName(data.name));
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, blocked]);

  const showDelay = profileMatch ? 6_000 : 18_000;

  useEffect(() => {
    if (blocked) return;
    const isDev = process.env.NODE_ENV === "development";
    if (!isDev) {
      try {
        const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
        if (dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 86_400_000) return;
        if (sessionStorage.getItem(SHOWN_KEY)) return;
      } catch {}
    }
    const t = setTimeout(() => {
      if (!isDev) {
        try { sessionStorage.setItem(SHOWN_KEY, "1"); } catch {}
      }
      setVisible(true);
    }, isDev ? 1_500 : showDelay);
    return () => clearTimeout(t);
  }, [blocked, showDelay]);

  const messages = useMemo<string[]>(() => {
    if (!practitionerName) return [...HOOKS];
    return HOOKS.flatMap((h, i) => [
      h as string,
      PERSONAL_TEMPLATES[i % PERSONAL_TEMPLATES.length],
    ]);
  }, [practitionerName]);

  useEffect(() => {
    if (!visible) return;
    setMsgIndex(Math.floor(Math.random() * messages.length));
    const t = setInterval(() => {
      setMsgIndex((i) => (i + Math.ceil(messages.length / 2)) % messages.length);
    }, 8000);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") dismiss(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      clearInterval(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, messages.length]);

  function dismiss() {
    setVisible(false);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
  }

  if (!mounted || !visible || blocked) return null;

  const hook = messages[msgIndex];
  const sub = SUBS[msgIndex % SUBS.length];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={dismiss}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Claim your Musawo profile"
        className="relative z-10 w-full animate-[claimBannerIn_0.4s_cubic-bezier(0.175,0.885,0.32,1.1)_both] overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:max-w-xl sm:rounded-3xl"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Mobile-only top strip: small Lottie + rotating hook */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3 dark:border-slate-800 md:hidden">
          <div className="size-12 shrink-0">
            <Lottie src={animationData} loop autoplay className="size-full" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-snug text-slate-900 dark:text-slate-50">
              {hook}
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {sub}
            </p>
          </div>
        </div>

        <div className="md:grid md:grid-cols-[200px_1fr]">
          {/* Desktop-only left panel */}
          <div className="hidden flex-col items-center justify-center gap-4 bg-slate-50 px-5 py-8 text-center dark:bg-slate-950/60 md:flex">
            <div className="size-24">
              <Lottie src={animationData} loop autoplay className="size-full" />
            </div>
            <div>
              <p className="text-sm font-bold leading-snug text-slate-900 dark:text-slate-50">
                {hook}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {sub}
              </p>
            </div>
          </div>

          {/* Right panel — full width on mobile */}
          <div className="px-5 pb-7 pt-5 sm:px-7 sm:pb-8 sm:pt-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
              Get verified
            </p>
            <h2 className="mt-1.5 text-xl font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-50 sm:text-2xl">
              What a verified profile does for you
            </h2>

            <ul className="mt-4 space-y-2.5">
              {[
                "Verified licence badge patients can trust",
                "Phone and WhatsApp button. Patients call you directly",
                "Your workplace and specialties. The right patients find you",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm font-medium leading-snug text-slate-700 dark:text-slate-300">
                  <CheckIcon />
                  {b}
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-center gap-3">
              <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                50% off
              </span>
              <span className="text-sm font-semibold text-slate-400 line-through dark:text-slate-500">
                UGX 9,900
              </span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-slate-50">
                UGX 5,000
              </span>
            </div>

            <Link
              href="/claim"
              onClick={dismiss}
              className="cta-glow mt-4 block w-full rounded-full bg-amber-500 px-6 py-3.5 text-center text-base font-bold text-white transition hover:bg-amber-600 active:bg-amber-700"
            >
              Claim my profile. Pay once, forever.
            </Link>

            <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
              One-time payment via MTN or Airtel Money
            </p>

            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={dismiss}
                className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-red-600 active:bg-red-700"
              >
                <SadIcon />
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
