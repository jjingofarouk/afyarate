import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "How Rate Musawo verifies Uganda's licensed health professionals and collects patient ratings.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">About Rate Musawo</h1>
      <div className="mt-6 space-y-5 text-sm leading-relaxed text-slate-700">
        <p>
          <strong>Musawo</strong> (Luganda for <em>health worker</em>) helps patients
          in Uganda find licensed health professionals and learn from other
          patients&apos; experiences before choosing where to seek care.
        </p>
        <h2 className="text-lg font-semibold text-slate-900">Where the data comes from</h2>
        <p>
          The registry of health professionals uses official data provided by the{" "}
          <a
            className="text-emerald-700 underline"
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
        <h2 className="text-lg font-semibold text-slate-900">Ratings</h2>
        <p>
          Anyone can rate a practitioner from 1 to 5 stars and leave a short comment.
          Ratings are community opinions and should be read with that in mind — they
          are not medical advice, not a substitute for professional judgement, and
          not an official endorsement. Offensive or clearly false content may be
          removed by moderators.
        </p>
        <h2 className="text-lg font-semibold text-slate-900">About the developer</h2>
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <img
            src="/faroukjjingo.jpg"
            alt="Dr. Jjingofarouk"
            className="size-20 rounded-full object-cover"
          />
          <div>
            <p>
              Rate Musawo was developed by{" "}
              <strong className="text-slate-900">Dr. Jjingofarouk</strong>, a doctor
              committed to helping patients in Uganda find and verify licensed
              health professionals before seeking care.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
              <a
                className="text-emerald-700 underline"
                href="https://www.linkedin.com/in/farouk-jjingo-0341b01a5/"
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
              <a className="text-emerald-700 underline" href="tel:+256751360385">
                +256 751 360 385
              </a>
              <a
                className="text-emerald-700 underline"
                href="mailto:jjingofaroukk@gmail.com"
              >
                jjingofaroukk@gmail.com
              </a>
            </div>
          </div>
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Disclaimer</h2>
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
