import type { Metadata } from "next";
import ClaimFlow from "@/components/ClaimFlow";

export const metadata: Metadata = {
  title: "Claim your profile",
  description:
    "Claim your health worker profile on Musawo: a verified licence badge, your contacts and workplace, visible to patients. One payment of UGX 5,000, valid forever.",
  alternates: { canonical: "/claim" },
};

function ShieldIcon() {
  return (
    <svg className="size-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="size-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 15.75h3" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg className="size-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="size-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="size-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

const benefits = [
  {
    Icon: ShieldIcon,
    title: "Verified licence badge",
    description: "Displayed on your profile so patients know your registration is genuine.",
  },
  {
    Icon: PhoneIcon,
    title: "Phone and WhatsApp button",
    description: "Patients reach you directly, no middleman, no referral queue.",
  },
  {
    Icon: MapPinIcon,
    title: "Workplace and specialties",
    description: "Show where you practise so the right patients find you.",
  },
  {
    Icon: StarIcon,
    title: "Yours forever",
    description: "One payment, no renewals. Your claimed profile never expires.",
  },
];

export default function ClaimPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:grid lg:grid-cols-[1fr_420px] lg:gap-16 lg:py-14">

      {/* Right col on desktop = ClaimFlow. On mobile it comes after the header and pricing. */}

      {/* LEFT: header, pricing, benefits */}
      <div className="lg:order-1">

        {/* Header */}
        <div className="mb-8">
          <span className="inline-block rounded-full border border-amber-300 px-3 py-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700 dark:border-amber-700 dark:text-amber-400">
            Get verified
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
            Claim your profile
          </h1>
          <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
            Patients are searching for you. A claimed profile shows your verified badge,
            direct contact options, and where you work.
          </p>
        </div>

        {/* Pricing block */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            One-time fee
          </p>
          <div className="mt-2 flex items-end gap-3">
            <p className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              UGX 5,000
            </p>
            <p className="mb-1 text-sm text-slate-400 line-through">UGX 9,900</p>
            <span className="mb-1 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              50% off
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Pay once. No renewals, no hidden fees, no annual charge.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-200 pt-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            {["One-time payment", "MTN and Airtel Money", "No subscriptions"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckIcon /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* ClaimFlow on mobile (shows between pricing and benefits) */}
        <div className="mt-8 lg:hidden">
          <ClaimFlow />
          <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
            Registry details (name, licence, status) stay as published by your council.
          </p>
        </div>

        {/* Benefits */}
        <div className="mt-10">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            What is included
          </h2>
          <ul className="mt-5 space-y-6">
            {benefits.map(({ Icon, title, description }) => (
              <li key={title} className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <Icon />
                </div>
                <div className="pt-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Trust tiles */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { label: "Secure", sub: "Mobile money" },
            { label: "Instant", sub: "Prompt on your phone" },
            { label: "Forever", sub: "Never pay again" },
          ].map((t) => (
            <div
              key={t.label}
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{t.label}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{t.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT col on desktop only */}
      <div className="hidden lg:order-2 lg:block lg:sticky lg:top-8 lg:self-start">
        <ClaimFlow />
        <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
          Registry details (name, licence, status) stay as published by your council.
        </p>
      </div>

    </div>
  );
}
