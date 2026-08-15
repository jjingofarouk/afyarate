import type { Metadata } from "next";
import Link from "next/link";

// Contact email for the "Contact the developer" section. Kept private - no
// personal name appears anywhere on the site.
const DEVELOPER_EMAIL = "rawvidence@gmail.com";

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
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Contact the developer</h2>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p>
            Rate Musawo is built and maintained by a small independent team in
            Uganda with a background in healthcare. We are not affiliated with
            any council or regulator. Got feedback, a correction, or a
            partnership idea? We&apos;d love to hear from you.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={`mailto:${DEVELOPER_EMAIL}?subject=${encodeURIComponent("Feedback about Rate Musawo")}`}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email the developer
            </a>
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Or use our{" "}
            <Link href="/contact" className="text-emerald-700 underline dark:text-emerald-400">
              contact form
            </Link>
            .
          </p>
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
