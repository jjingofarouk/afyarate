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
  // 100 additional
  "Your licence is proof. Let patients see it.",
  "Every great doctor deserves a great first impression.",
  "The best practitioners are the ones patients can find.",
  "Your years of training should open doors, not stay hidden.",
  "Patients pick names they recognise. Make yours one of them.",
  "A verified profile is trust you can measure.",
  "Your skills do not advertise themselves.",
  "The patients who need you most are searching right now.",
  "Be the practitioner patients remember, not the one they almost called.",
  "Your name should be the first one they see.",
  "Hard-earned credentials belong on your profile.",
  "Patients will choose someone. Make sure it is you.",
  "Trust is built long before the first appointment.",
  "You spent years earning your licence. Make it visible.",
  "The right patients are looking for someone exactly like you.",
  "Visibility is not vanity. It is how patients find care.",
  "A profile that works overnight so you do not have to.",
  "Your expertise should outlast word of mouth.",
  "Patients cannot choose what they cannot find.",
  "Let your verified badge speak before you say a word.",
  "One profile. Every patient who searches your name.",
  "The patients who chose well chose a verified practitioner.",
  "Make it easy for the right patients to reach you.",
  "You trained for years. Do not stay invisible.",
  "Your profile is your handshake before the appointment.",
  "Great care starts with being findable.",
  "Every search is a patient looking for help. Be their answer.",
  "Verified practitioners get called first.",
  "Your name on a verified profile carries weight.",
  "Patients do not have time to guess. Give them certainty.",
  "The practitioners patients trust are the ones they can verify.",
  "Your work speaks for itself once patients can find you.",
  "Be present where patients search.",
  "A claimed profile is a career that works for itself.",
  "Patients are comparing right now. Make sure you are in the conversation.",
  "One verified profile. A lifetime of patients who chose you.",
  "Your reputation is only as strong as your visibility.",
  "The practitioners patients call are the ones who show up.",
  "Be the name that comes up when it matters most.",
  "Your qualifications are your proof. Show them.",
  "Patients search with intent. Be what they find.",
  "A verified badge is more persuasive than a referral.",
  "You chose this profession to help people. Let them find you.",
  "Your profile should be as professional as you are.",
  "Do not leave patients guessing who to call.",
  "Every search ends somewhere. Make it your profile.",
  "Your name deserves to be known.",
  "Trust starts with a verified licence. Everything else follows.",
  "Patients remember the name they could reach.",
  "Let your licence do the talking.",
  "Be the practitioner patients find on their worst day.",
  "The right profile turns a search into an appointment.",
  "Your work deserves recognition beyond your clinic walls.",
  "Claim your space in every search patients make.",
  "The most successful practitioners are the most visible ones.",
  "Patients trust verified. Be verified.",
  "A single profile. Every patient who needs you.",
  "Make your expertise impossible to overlook.",
  "Your career is already built. Now let patients find it.",
  "A verified profile says: I am here, I am real, I am ready.",
  "Patients choose certainty. Give them yours.",
  "Your profile is the door to your practice. Open it.",
  "Be the practitioner patients are relieved to find.",
  "Patients who can verify you are patients who trust you.",
  "Your licence is your credential. Make it visible.",
  "The difference between booked and overlooked is a verified profile.",
  "Great care begins with being easy to find.",
  "Your name is worth more than an empty profile.",
  "Show up for patients before they even walk in.",
  "A verified badge is quiet confidence patients notice.",
  "Your practice grows one visible profile at a time.",
  "Patients search. Verified practitioners get found.",
  "Your profile is your first conversation with every patient.",
  "Be findable. Be trustworthy. Be chosen.",
  "Your years of service deserve a permanent record.",
  "A claimed profile is the professional you already are, made visible.",
  "Patients remember the practitioners who made it easy.",
  "Your next patient is one search away.",
  "Let verification say what you are too professional to say yourself.",
  "Be the name patients are glad they found.",
  "Verified practitioners are the ones patients come back to.",
  "Your profile can reach more patients than any referral chain.",
  "The most respected names are the most visible ones.",
  "Your career is your proof. Put it where patients can see it.",
  "One profile. Permanent. Yours.",
  "Be visible where trust is built, before the appointment.",
  "Patients who find you easily become patients who stay.",
  "Your expertise is too valuable to stay undiscovered.",
  "Make your name the one patients reach for first.",
  "You deserve patients who chose you on purpose.",
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
