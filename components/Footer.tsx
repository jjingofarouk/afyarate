import Image from "next/image";
import Link from "next/link";
import { POST_TYPES, POST_TYPE_LABELS } from "@/lib/types";
import {
  DISPATCH_PHONE_DISPLAY,
  DISPATCH_PHONE_LINK,
  SITE_DESCRIPTION,
  SITE_NAME,
} from "@/lib/site";
import Newsletter from "@/components/Newsletter";
import { getProfessions, getLocations } from "@/lib/posts";

const headingClass =
  "text-xs font-bold uppercase tracking-widest text-slate-400";

const linkClass =
  "text-sm text-slate-300/80 transition hover:text-emerald-400";

const colClass = "space-y-2.5";

export default async function Footer() {
  const year = new Date().getFullYear();
  const [professions, locations] = await Promise.all([getProfessions(), getLocations()]);
  const roleOptions = professions.map((p) => p.label);
  const locationOptions = locations.map((l) => l.label);

  return (
    <footer
      className="dark relative mt-16 bg-navy-950 text-slate-300"
      style={{ colorScheme: "dark" }}
    >
      {/* Signature emerald glow line: the footer stays dark in every theme. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent"
      />
      {/* Brand navy wash from the official palette, now that the shell is navy
          rather than near-black. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(47,116,163,0.18),transparent)]"
      />
      {/* Job alerts band. The `dark` class on <footer> above forces the dark
          variant for every descendant in BOTH themes, so the shared Newsletter
          component (white inputs by default) renders dark here instead of
          light-mode controls on a navy surface. Do not remove it. */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <Newsletter
            title="New jobs & opportunities, straight to your inbox"
            description="Fresh nursing, midwifery, clinical and allied-health openings across Uganda, plus scholarships, grants and conferences. No spam, unsubscribe anytime."
            roleOptions={roleOptions}
            locationOptions={locationOptions}
          />
        </div>
      </div>

      {/* Link columns */}
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div>
            <Link href="/" className="flex items-center gap-2" aria-label={`${SITE_NAME} home`}>
              {/* The R mark on its own; the wordmark is live text so it stays
                  legible instead of shrinking into the artwork. */}
              <Image
                src="/logo-mark.png"
                alt=""
                width={512}
                height={512}
                className="size-9 shrink-0 object-contain"
              />
              <span className="text-lg font-semibold tracking-tight text-white">
                {SITE_NAME}
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              {SITE_DESCRIPTION}
            </p>
            <a
              href={DISPATCH_PHONE_LINK}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-500"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              {DISPATCH_PHONE_DISPLAY}
            </a>
            <p className="mt-2 text-xs text-slate-500">Emergency? One tap connects you to an ambulance, day or night</p>
          </div>

          <nav aria-label="Best of Uganda">
            <h3 className={headingClass}>Best of Uganda</h3>
            <ul className={`mt-4 ${colClass}`}>
              <li>
                <Link href="/best" className={linkClass}>
                  Best of Uganda (all)
                </Link>
              </li>
              <li>
                <Link href="/best/doctor" className={linkClass}>
                  Best doctors in Uganda
                </Link>
              </li>
              <li>
                <Link href="/best/nurse-midwife" className={linkClass}>
                  Best nurses & midwives
                </Link>
              </li>
              <li>
                <Link href="/best/clinical-officer" className={linkClass}>
                  Best clinical officers
                </Link>
              </li>
              <li>
                <Link href="/best/hospital" className={linkClass}>
                  Best hospitals in Uganda
                </Link>
              </li>
              <li>
                <Link href="/best/pharmacy" className={linkClass}>
                  Best pharmacies in Uganda
                </Link>
              </li>
              <li>
                <Link href="/best/hospital/kampala" className={linkClass}>
                  Best hospitals in Kampala
                </Link>
              </li>
              <li>
                <Link href="/best/pharmacy/kampala" className={linkClass}>
                  Best pharmacies in Kampala
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="For patients">
            <h3 className={headingClass}>For patients</h3>
            <ul className={`mt-4 ${colClass}`}>
              <li>
                <Link href="/practitioners" className={linkClass}>
                  Find a health worker
                </Link>
              </li>
              <li>
                <Link href="/facilities" className={linkClass}>
                  Hospitals &amp; pharmacies
                </Link>
              </li>
              <li>
                <Link href="/facilities?kind=hospital" className={linkClass}>
                  Rate a hospital
                </Link>
              </li>
              <li>
                <Link href="/facilities?kind=pharmacy" className={linkClass}>
                  Rate a pharmacy
                </Link>
              </li>
              <li>
                <Link href="/ambulances" className={linkClass}>
                  Ambulance services
                </Link>
              </li>
              <li>
                <Link href="/help/how-do-i-rate-a-health-worker" className={linkClass}>
                  How to leave a review
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="For health workers">
            <h3 className={headingClass}>For health workers</h3>
            <ul className={`mt-4 ${colClass}`}>
              <li>
                <Link href="/claim" className={linkClass}>
                  Claim your profile
                </Link>
              </li>
              <li>
                <Link href="/practitioners/profession/doctor" className={linkClass}>
                  Doctors in Uganda
                </Link>
              </li>
              <li>
                <Link href="/practitioners/profession/nurse-midwife" className={linkClass}>
                  Nurses &amp; midwives
                </Link>
              </li>
              <li>
                <Link href="/practitioners/profession/clinical-officer" className={linkClass}>
                  Clinical officers
                </Link>
              </li>
              <li>
                <Link href="/posts" className={linkClass}>
                  Find a job
                </Link>
              </li>
              <li>
                <Link href="/stats/uganda" className={linkClass}>
                  Uganda health stats
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Opportunities">
            <h3 className={headingClass}>Opportunities</h3>
            <ul className={`mt-4 ${colClass}`}>
              <li>
                <Link href="/posts" className={linkClass}>
                  All listings
                </Link>
              </li>
              {POST_TYPES.map((t) => (
                <li key={t}>
                  <Link
                    href={`/${POST_TYPE_LABELS[t].plural.toLowerCase()}`}
                    className={linkClass}
                  >
                    {POST_TYPE_LABELS[t].plural}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/posts/new" className={linkClass}>
                  Post a listing
                </Link>
              </li>
              <li>
                <Link href="/seeking" className={linkClass}>
                  Jobseekers
                </Link>
              </li>
              <li>
                <Link href="/alerts" className={linkClass}>
                  Job alerts
                </Link>
              </li>
              <li>
                <Link href="/saved" className={linkClass}>
                  Saved listings
                </Link>
              </li>
              <li>
                <Link href="/applications" className={linkClass}>
                  My applications
                </Link>
              </li>
              <li>
                <Link href="/employers" className={linkClass}>
                  Employer workspace
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Company">
            <h3 className={headingClass}>Company</h3>
            <ul className={`mt-4 ${colClass}`}>
              <li>
                <Link href="/about" className={linkClass}>
                  About us
                </Link>
              </li>
              <li>
                <Link href="/career" className={linkClass}>
                  Career resources
                </Link>
              </li>
              <li>
                <Link href="/insights" className={linkClass}>
                  Market insights
                </Link>
              </li>
              <li>
                <Link href="/account" className={linkClass}>
                  My account
                </Link>
              </li>
              <li>
                <Link href="/help" className={linkClass}>
                  Help center
                </Link>
              </li>
              <li>
                <Link href="/help/guides" className={linkClass}>
                  Guides
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkClass}>
                  Contact us
                </Link>
              </li>
              <li>
                <Link href="/professions" className={linkClass}>
                  Professions
                </Link>
              </li>
              <li>
                <Link href="/locations" className={linkClass}>
                  Locations
                </Link>
              </li>
              <li>
                <Link href="/organizations" className={linkClass}>
                  Organizations
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Claim CTA band */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-white">
              Are you a licensed health professional?
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Claim your profile and let patients find you directly.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Link
              href="/claim"
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
            >
              Claim your profile
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Contact us
            </Link>
          </div>
        </div>

        {/* Fund strip: visible on every page of the site. */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/5 px-6 py-4 text-center sm:flex-row sm:text-left">
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-white">Rate My Musawo is free and has no ads.</span>{" "}
            Reader support keeps the registry fresh.
          </p>
          <a
            href="mailto:ratemusawo@gmail.com?subject=Funding%20Rate%20My%20Musawo"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-extrabold text-emerald-950 transition hover:bg-amber-300"
          >
            Fund this project!
          </a>
        </div>

        {/* Legal bar */}
        <div className="mt-10 border-t border-white/10 pt-6">
          <p className="text-xs leading-relaxed text-slate-500">
            Licensing data is official data provided by the Uganda Medical &amp;
            Dental Practitioners Council (UMDPC) and shows the registered/licence
            status as published. Ratings are community opinions and are not medical
            advice, an endorsement, or a substitute for professional judgement.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-xs text-slate-500">
                © {year} {SITE_NAME}. All rights reserved. Not affiliated with any
                council or regulator.
              </p>
              <p className="text-xs text-slate-500">
                Your privacy is important to us.{" "}
                <Link
                  href="/privacy"
                  className="font-medium text-emerald-400 underline"
                >
                  Manage your privacy choices
                </Link>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="text-xs text-slate-500 transition hover:text-emerald-400">
                Terms of Use
              </Link>
              <Link href="/privacy" className="text-xs text-slate-500 transition hover:text-emerald-400">
                Privacy
              </Link>
              <Link href="/disclaimer" className="text-xs text-slate-500 transition hover:text-emerald-400">
                Disclaimer
              </Link>
              <Link href="/admin" className="text-xs text-slate-500 transition hover:text-emerald-400">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
