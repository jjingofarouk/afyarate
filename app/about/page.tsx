import type { Metadata } from "next";
import Link from "next/link";

// Contact email for the "Contact the developer" section. Kept private — no
// personal name appears anywhere on the site. Set this to your contact email.
const DEVELOPER_EMAIL = "you@example.com"; // ← replace with the developer contact email

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
            <a
              href="https://wa.me/256751360385?text=Hello%20Rate%20Musawo"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M12.04 2a9.9 9.9 0 00-8.46 14.94L2 22l5.2-1.52A9.9 9.9 0 1012.04 2zm5.8 14.05c-.24.68-1.4 1.3-1.93 1.35-.52.05-1.02.24-3.43-.71-2.9-1.16-4.74-4.16-4.88-4.36-.14-.19-1.17-1.55-1.17-2.96 0-1.41.74-2.1 1-2.39.26-.28.57-.35.76-.35.19 0 .38 0 .54.01.18.01.4-.06.63.48.24.56.8 1.95.87 2.09.07.14.12.3.02.49-.09.19-.14.3-.28.47-.14.17-.3.38-.42.51-.14.14-.29.29-.13.57.16.28.72 1.19 1.55 1.93 1.06.95 1.96 1.24 2.24 1.38.28.14.44.12.6-.07.16-.19.69-.8.87-1.08.18-.28.37-.23.62-.14.25.09 1.61.76 1.88.9.28.14.46.21.53.32.07.12.07.68-.17 1.37z" />
              </svg>
              WhatsApp us
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
