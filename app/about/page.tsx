import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@/lib/posts";
import { getStats } from "@/lib/practitioners";
import { SITE_URL } from "@/lib/site";

// Contact paths for the founder section.
const DEVELOPER_EMAIL = "ratemusawo@gmail.com";
const FOUNDER_NAME = "Dr. Farouk Jjingo";
const FOUNDER_LINKEDIN = "https://www.linkedin.com/in/farouk-jjingo-0341b01a5/";
const FOUNDER_PHONE_DISPLAY = "+256 751 360385";
const FOUNDER_PHONE_LINK = "tel:+256751360385";
const FOUNDER_WHATSAPP_LINK = "https://wa.me/256751360385";

export const metadata: Metadata = {
  title: "About",
  description:
    "Rate My Musawo was built by Dr. Farouk Jjingo, a Ugandan doctor. Verified practitioners, patient ratings, health jobs and facilities across Uganda.",
  alternates: { canonical: "/about" },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: FOUNDER_NAME,
  jobTitle: "Founder, Rate My Musawo",
  description:
    "Ugandan medical doctor building Rate My Musawo: verified practitioner profiles, patient ratings, and health jobs across Uganda.",
  image: `${SITE_URL}/founder.jpg`,
  url: FOUNDER_LINKEDIN,
  sameAs: [FOUNDER_LINKEDIN],
  worksFor: { "@type": "Organization", name: "Rate My Musawo", url: SITE_URL },
};

export default async function AboutPage() {
  // Live traction for funders and partners; the strip hides itself if the
  // registry isn't reachable so the page never breaks.
  const [stats, posts] = await Promise.all([
    getStats().catch(() => null),
    getPosts().catch(() => []),
  ]);
  const tiles = stats
    ? [
        { value: stats.practitioners.toLocaleString(), label: "Practitioners indexed" },
        { value: stats.active.toLocaleString(), label: "Active licences" },
        { value: posts.length.toLocaleString(), label: "Live opportunities" },
        { value: stats.totalRatings.toLocaleString(), label: "Patient ratings" },
      ]
    : [];
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">About Rate My Musawo</h1>
      <div className="mt-6 space-y-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <p>
          <strong>Rate My Musawo</strong> (Luganda for <em>health worker</em>) is the
          home for Uganda&apos;s health workers and the patients they serve.
          Patients can verify a practitioner&apos;s licence, read ratings from
          other patients, find hospitals, pharmacies and ambulance services.
          Health workers can claim their verified profile, get rated, find
          jobs, scholarships, grants, fellowships and conferences, and get
          hired by recruiters.
        </p>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">What you can do here</h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Search every licensed health professional in Uganda and check their registration and licence status.</li>
          <li>Rate doctors, nurses, midwives and clinical officers, and read what other patients say.</li>
          <li>Find hospitals, pharmacies and 24/7 ambulance services near you.</li>
          <li>Browse current health jobs, scholarships, grants, fellowships and conferences.</li>
          <li>Claim your practitioner profile to add your photo, fees, availability and contact details.</li>
        </ul>
        {tiles.length > 0 && (
          <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
            {tiles.map((t) => (
              <div
                key={t.label}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center dark:border-emerald-900/50 dark:bg-emerald-950/30"
              >
                <p className="text-2xl font-black tracking-tight text-emerald-800 dark:text-emerald-300">
                  {t.value}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {t.label}
                </p>
              </div>
            ))}
          </div>
        )}
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
          alongside the Uganda Nurses &amp; Midwives Council and the Allied
          Health Professionals Council. We refresh the registry regularly so you can
          check a practitioner&apos;s licence status and expiry before you book.
        </p>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Ratings</h2>
        <p>
          Anyone can rate a practitioner from 1 to 5 stars and leave a short comment.
          Ratings are community opinions and should be read with that in mind, and they
          are not medical advice, not a substitute for professional judgement, and
          not an official endorsement. Offensive or clearly false content may be
          removed by moderators.
        </p>

        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Who built this</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            <div className="size-24 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-4 ring-emerald-100 dark:bg-slate-800 dark:ring-emerald-900/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/founder.jpg"
                alt="Dr. Farouk Jjingo"
                loading="lazy"
                className="size-full object-cover object-top"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-slate-900 dark:text-slate-50">
                {FOUNDER_NAME}
              </p>
              <p className="mt-0.5 text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Founder · Medical Doctor
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Rate My Musawo is a small, growing project I built and still maintain
                myself, alongside my clinical work. I started it so that any
                patient in Uganda can check who is treating them, and so that
                good clinicians get found. And it works the other way too:
                health workers can find jobs, scholarships and grants to grow
                their careers, while claiming their profiles to attract
                patients. It is
                free for patients, and your support keeps it that way.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
            <a
              href={FOUNDER_PHONE_LINK}
              className="contact-shake inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-emerald-950 transition hover:bg-amber-300"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              {FOUNDER_PHONE_DISPLAY}
            </a>
            <a
              href={FOUNDER_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              style={{ animationDelay: "0.2s" }}
              className="contact-shake inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
            >
              <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M17.5 14.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.1 4.49.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.04 21.79h-.01a9.87 9.87 0 01-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 01-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.83 9.83 0 019.88 9.89c0 5.45-4.44 9.88-9.89 9.88m8.42-18.3A11.82 11.82 0 0012.04 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.9 11.9 0 005.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.16-3.48-8.41" />
              </svg>
              WhatsApp
            </a>
            <a
              href={FOUNDER_LINKEDIN}
              target="_blank"
              rel="noopener noreferrer"
              style={{ animationDelay: "0.4s" }}
              className="contact-shake inline-flex items-center gap-1.5 rounded-full bg-[#0077B5]/10 px-4 py-2 text-sm font-bold text-[#0077B5] transition hover:bg-[#0077B5] hover:text-white"
            >
              <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.12 2.06 2.06 0 010 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
              </svg>
              LinkedIn
            </a>
            <a
              href={`mailto:${DEVELOPER_EMAIL}?subject=${encodeURIComponent("Feedback about Rate My Musawo")}`}
              style={{ animationDelay: "0.6s" }}
              className="contact-shake inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </a>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            For anything, from a wrong listing to a question about a claim, a
            partnership, or just to tell me that the site helped you, reach out on any
            channel above, or use our{" "}
            <Link href="/contact" className="text-emerald-700 underline dark:text-emerald-400">
              contact form
            </Link>
            . I read everything myself.
          </p>
        </div>

        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Support the project</h2>
        <p>
          Rate My Musawo is free for patients and has no ads. It is kept alive by
          claimed-profile fees from practitioners, plus contributions from
          readers who chip in.
          If the site helped you verify a doctor, find a job, or reach a
          hospital,{" "}
          <Link href="/contact" className="text-emerald-700 underline dark:text-emerald-400">
            get in touch
          </Link>{" "}
          to support it. Every contribution goes straight back into keeping the
          registry fresh and the site free.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={`mailto:${DEVELOPER_EMAIL}?subject=${encodeURIComponent("Funding Rate My Musawo")}`}
            className="cta-bob inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-sm font-extrabold text-emerald-950 shadow-lg transition hover:bg-amber-300"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9.757V6.012c0-.266.113-.52.312-.707l4.5-4.242A1.125 1.125 0 019.757 1.5h4.486c.214 0 .42.08.575.225l4.5 4.242c.199.187.312.441.312.707V9.757M18 9.757V21M3 9.757h18" />
            </svg>
            Fund this project!
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            Partner with us
          </Link>
        </div>

        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Disclaimer</h2>
        <p>
          Licensing information is shown exactly as published by the portal and may
          lag the regulator&apos;s records. Rate My Musawo is not affiliated with any
          council or regulator. Always verify directly with the relevant
          council or the official portal for matters that matter (e.g. emergencies,
          legal or credentialing purposes).
        </p>
        {/* Spacer so the sticky fund pill never covers the last paragraph. */}
        <div className="h-16" aria-hidden />
      </div>

      {/* Sticky fund CTA: floats at the bottom while reading this page only. */}
      <a
        href={`mailto:${DEVELOPER_EMAIL}?subject=${encodeURIComponent("Funding Rate My Musawo")}`}
        className="fixed bottom-4 left-1/2 z-40 inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-amber-400 px-6 py-3 text-sm font-extrabold text-emerald-950 shadow-2xl transition hover:bg-amber-300"
      >
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9.757V6.012c0-.266.113-.52.312-.707l4.5-4.242A1.125 1.125 0 019.757 1.5h4.486c.214 0 .42.08.575.225l4.5 4.242c.199.187.312.441.312.707V9.757M18 9.757V21M3 9.757h18" />
        </svg>
        Fund this project!
      </a>
    </div>
  );
}
