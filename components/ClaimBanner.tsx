"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import animationData from "@/components/claim/heartbeat.json";

const Lottie = dynamic(
  () => import("lottie-react").then((m) => m.Lottie),
  {
    ssr: false,
  }
) as React.ComponentType<{
  src: string | object;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
}>;

const DISMISS_KEY = "claimBannerDismissedAt";
const SHOWN_KEY = "claimBannerShown";
const DISMISS_DAYS = 3;
const SHOW_DELAY_MS = 10_000;

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
  "Visibility is the difference between missed and booked.",
  "The most trusted names are the most visible ones.",
  "Patients compare before they call.",
  "Let your qualifications speak to every patient.",
  "Your practice grows when patients can reach you.",
  "Put your practice in front of more patients.",
  "Serious patients look for serious professionals.",
  "Patients choose practitioners they can verify.",
  "Grow your practice from your own profile.",
  "Make every search count for your practice.",
  "Be present at the moment patients decide.",
] as const;

const SUBS = [
  "Get verified, then add your phone, workplace and specialty so patients can reach you directly.",
  "A verified profile shows your licence, your contacts and where you work — all in one place.",
  "Verification confirms your licence publicly and unlocks direct patient contact details.",
  "Verified practitioners appear complete: photo, workplace, specialties and contact information.",
  "Once verified, patients can call or WhatsApp you straight from your profile.",
  "Show patients your licence is genuine, then give them a way to book you.",
  "Complete profiles win more patients than bare listings.",
  "Add your workplace and specialties so the right patients find you.",
  "Your contact details stay yours — patients reach you directly, no middleman.",
  "Verified means checked against the national registry, so patients know you're genuine.",
  "One verification, lasting visibility for your practice.",
  "Patients skip incomplete profiles. Don't be one of them.",
  "Everything a patient needs to choose you, on one page.",
  "Your licence, workplace and phone number — presented professionally.",
  "Help patients move from searching to booking in one step.",
  "A verified badge tells patients you are exactly who you say you are.",
  "More visibility for your practice starts with verifying your profile.",
  "Patients see your credentials and your contacts together — that builds trust.",
  "Claiming your profile takes minutes. The benefit lasts years.",
  "Unverified listings hide behind initials. Verified ones show who you are.",
] as const;

const PERSONAL_TEMPLATES = [
  "Are you {name}? Patients are searching for you right now.",
  "Is this you, {name}? Claim your profile today.",
  "{name}, this profile should be working for you.",
  "Are you {name}? Your patients may already be rating you.",
  "{name}, patients can't reach you if they can't find you.",
  "Yes, {name} — this is your page. Make it yours forever.",
  "{name}, get verified and let patients contact you directly.",
  "Are you {name}? One payment, yours forever.",
] as const;

function titleCaseName(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function firstName(fullName: string): string {
  return fullName.split(/\s+/)[0];
}

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 size-5 shrink-0 text-amber-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SadIcon() {
  return (
    <svg
      className="size-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M9 10h.01M15 10h.01" />
      <path strokeLinecap="round" d="M9 16c.8-1 1.9-1.5 3-1.5s2.2.5 3 1.5" />
    </svg>
  );
}

export default function ClaimBanner() {
  const [visible, setVisible] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [personalName, setPersonalName] = useState<string | null>(null);
  const pathname = usePathname();
  const blocked =
    pathname.startsWith("/admin") || pathname.startsWith("/contact");

  // On a practitioner page we address that practitioner by name; elsewhere we
  // pull a random name from the registry for the "are you …?" hook.
  useEffect(() => {
    if (blocked) return;
    const profileMatch = pathname.match(/^\/practitioners\/(\d+)$/);

    async function fetchName(): Promise<string | null> {
      try {
        if (profileMatch) {
          const res = await fetch(`/api/practitioners/${profileMatch[1]}`);
          if (!res.ok) return null;
          const data = await res.json();
          if (data.claimed) return null; // already theirs — don't pitch
          return data.name ?? null;
        }
        const res = await fetch(
          "/api/practitioners?sort=random&pageSize=1&status=all"
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data.items?.[0]?.name ?? null;
      } catch {
        return null;
      }
    }

    fetchName().then((name) => {
      if (name) setPersonalName(titleCaseName(name));
    });
  }, [pathname, blocked]);

  useEffect(() => {
    if (blocked) return;

    try {
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
      if (dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 86_400_000) {
        return;
      }
      if (sessionStorage.getItem(SHOWN_KEY)) return;
    } catch {}

    const showTimer = setTimeout(() => {
      try {
        sessionStorage.setItem(SHOWN_KEY, "1");
      } catch {}
      setVisible(true);
    }, SHOW_DELAY_MS);
    return () => clearTimeout(showTimer);
  }, [blocked]);

  const messages: string[] = useMemo(() => {
    if (!personalName) return [...HOOKS];
    const first = firstName(personalName);
    // Interleave generic hooks with personalized ones, stable per name so
    // rotation doesn't flicker.
    return HOOKS.flatMap((h, i) => [
      h as string,
      PERSONAL_TEMPLATES[i % PERSONAL_TEMPLATES.length].replace("{name}", first),
    ]);
  }, [personalName]);

  useEffect(() => {
    if (!visible) return;
    setMsgIndex(Math.floor(Math.random() * messages.length));
    const rotateTimer = setInterval(() => {
      setMsgIndex((i) => (i + Math.ceil(messages.length / 2)) % messages.length);
    }, 8000);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      clearInterval(rotateTimer);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [visible, messages.length]);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
  }

  if (!visible || blocked) return null;

  const sub = SUBS[msgIndex % SUBS.length];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={dismiss}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Get verified on Musawo"
        className="relative z-10 w-full max-w-2xl animate-[claimBannerIn_0.5s_cubic-bezier(0.175,0.885,0.32,1.1)_both] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid md:grid-cols-[240px_1fr]">
          {/* Left: heartbeat animation + rotating pitch */}
          <div className="flex flex-col items-center justify-center gap-4 bg-slate-50 px-6 py-8 text-center dark:bg-slate-950/60">
            <div className="size-28">
              <Lottie src={animationData} loop autoplay className="size-full" />
            </div>
            <div key={msgIndex} style={{ animation: "fadeIn 0.35s ease-out both" }}>
              <p className="text-sm font-bold leading-snug text-slate-900 dark:text-slate-50">
                {messages[msgIndex]}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {sub}
              </p>
            </div>
          </div>

          {/* Right: benefits + pricing + CTA */}
          <div className="px-7 py-8 sm:px-9">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
              Get verified
            </p>
            <h2 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-50 sm:text-[1.7rem]">
              What a verified profile does for you
            </h2>

            <ul className="mt-5 space-y-3">
              {[
                "Verified licence badge",
                "Phone & WhatsApp button. Patients call you directly!",
                "Your workplace and specialties. The right patients find you",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm font-medium leading-snug text-slate-700 dark:text-slate-300">
                  <CheckIcon />
                  {b}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex items-center gap-3">
              <span className="animate-[checkPop_0.45s_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)_both] rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                Price reduced
              </span>
              <span className="text-base font-semibold text-slate-400 line-through dark:text-slate-500">
                UGX 9,900
              </span>
              <span className="animate-[claimBannerIn_0.45s_0.55s_cubic-bezier(0.175,0.885,0.32,1.275)_both] text-xl font-extrabold text-slate-900 dark:text-slate-50">
                UGX 5,000
              </span>
            </div>

            <Link
              href="/claim"
              onClick={dismiss}
              className="cta-glow mt-5 block w-full rounded-full bg-amber-500 px-6 py-3.5 text-center text-base font-bold text-white transition hover:bg-amber-600 active:bg-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              Claim my profile — pay once, forever
            </Link>
            <p className="mt-2.5 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
              ~~<span className="line-through">UGX 9,900</span>~~{" "}
              <span className="font-bold text-amber-600 dark:text-amber-400">UGX 5,000</span>{" "}
              one-time payment · MTN &amp; Airtel
            </p>

            <button
              type="button"
              onClick={dismiss}
              className="mx-auto mt-4 flex items-center gap-1.5 font-semibold text-slate-500 underline-offset-4 transition hover:text-slate-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <SadIcon />
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
