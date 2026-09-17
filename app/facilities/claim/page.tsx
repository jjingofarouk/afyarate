import type { Metadata } from "next";
import FacilityClaimFlow from "@/components/FacilityClaimFlow";
import ClaimReach from "@/components/ClaimReach";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Claim your facility",
  description:
    "Claim your hospital or pharmacy on Rate My Musawo: verified badge, your contacts, services and photo. One payment of UGX 5,000, valid forever.",
  alternates: { canonical: "/facilities/claim" },
};

export default function FacilityClaimPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col px-4 py-10 lg:grid lg:grid-cols-[1fr_420px] lg:gap-16 lg:py-14">
      <div className="order-1 lg:order-2 lg:sticky lg:top-8 lg:self-start">
        <FacilityClaimFlow />
        <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
          Directory facts stay as published; your contacts and services are yours to manage.
        </p>
      </div>
      <div className="order-2 mt-6 lg:order-1 lg:mt-0">
        <span className="inline-block rounded-full border border-emerald-300 px-3 py-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-700 dark:text-emerald-400">
          Get verified
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
          Claim your facility
        </h1>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
          Patients are searching for hospitals and pharmacies. A verified facility
          shows its badge, direct contact options, services and photo.
        </p>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">One-time fee</p>
          <p className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            UGX 5,000
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Pay once. No renewals, no hidden fees.
          </p>
        </div>
        <ul className="mt-8 space-y-4 text-sm text-slate-600 dark:text-slate-400">
          {[
            "Verified badge on your facility page",
            "Phone & WhatsApp buttons patients can tap",
            "Your services, description and photo",
            "Yours forever after one payment",
          ].map((t) => (
            <li key={t} className="flex items-start gap-2">
              <svg className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {t}
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <ClaimReach />
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Need a hand? Message us directly
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Stuck at any step, or prefer we handle it over email? Send your
            facility details and we will verify it and get you set up.
          </p>
          <div className="mt-4">
            <ContactForm initialTopic="facility" />
          </div>
        </div>
      </div>
    </div>
  );
}
