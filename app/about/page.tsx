import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "How Rate Musawo verifies Uganda's licensed health professionals and collects patient ratings.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">About Rate Musawo</h1>
      <div className="mt-6 space-y-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <p>
          <strong>Musawo</strong> (Luganda for <em>health worker</em>) helps patients
          in Uganda find licensed health professionals and learn from other
          patients&apos; experiences before choosing where to seek care.
        </p>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Where the data comes from</h2>
        <p>
          The registry of health professionals uses official data provided by the{" "}
          <a
            className="text-emerald-700 underline dark:text-emerald-400"
            href="https://umdpc.com"
            target="_blank"
            rel="noreferrer"
          >
            Uganda Medical &amp; Dental Practitioners Council
          </a>{" "}
          (UMPDC), alongside the Uganda Nurses &amp; Midwives Council and the Allied
          Health Professionals Council. We refresh the registry regularly so you can
          check a practitioner&apos;s licence status and expiry before you book.
        </p>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Ratings</h2>
        <p>
          Anyone can rate a practitioner from 1 to 5 stars and leave a short comment.
          Ratings are community opinions and should be read with that in mind — they
          are not medical advice, not a substitute for professional judgement, and
          not an official endorsement. Offensive or clearly false content may be
          removed by moderators.
        </p>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">About the developer</h2>
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <img
            src="/faroukjjingo.jpg"
            alt="Dr. Jjingo Farouk"
            className="size-20 rounded-full object-cover"
          />
          <div>
            <p>
              Rate Musawo was developed by{" "}
              <strong className="text-slate-900 dark:text-slate-100">Dr. Jjingo Farouk</strong>, a doctor
              committed to improving quality patient care in Uganda
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
              <a
                className="text-emerald-700 underline dark:text-emerald-400"
                href="https://www.linkedin.com/in/farouk-jjingo-0341b01a5/"
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
              <a className="text-emerald-700 underline dark:text-emerald-400" href="tel:+256751360385">
                +256 751 360 385
              </a>
              <Link
                className="text-emerald-700 underline dark:text-emerald-400"
                href="/contact"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Disclaimer</h2>
        <p>
          Licensing information is shown exactly as published by the portal and may
          lag the regulator&apos;s records. Always verify directly with the relevant
          council or the official portal for matters that matter (e.g. emergencies,
          legal or credentialing purposes).
        </p>
      </div>
    </div>
  );
}
