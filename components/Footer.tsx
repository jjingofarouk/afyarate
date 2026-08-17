import Image from "next/image";
import Link from "next/link";
import { POST_TYPES, POST_TYPE_LABELS } from "@/lib/types";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

const sectionClass =
  "text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500";

const linkClass =
  "text-sm text-slate-500 transition hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:pr-6">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt={`${SITE_NAME} logo`}
                width={36}
                height={36}
                className="rounded-full object-cover"
              />
              <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {SITE_NAME}
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {SITE_DESCRIPTION}
            </p>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              Questions or corrections?{" "}
              <Link
                href="/contact"
                className="font-medium text-emerald-700 underline dark:text-emerald-400"
              >
                Contact us
              </Link>
              .
            </p>
          </div>

          <div>
            <h3 className={sectionClass}>Help topics</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/help" className={linkClass}>
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/help/what-is-rate-musawo" className={linkClass}>
                  What is Rate Musawo?
                </Link>
              </li>
              <li>
                <Link href="/help/how-do-i-rate-a-health-worker" className={linkClass}>
                  How to leave a review
                </Link>
              </li>
              <li>
                <Link href="/help/who-writes-the-reviews" className={linkClass}>
                  Who writes the reviews
                </Link>
              </li>
              <li>
                <Link href="/help/reviews-faq" className={linkClass}>
                  Reviews FAQ
                </Link>
              </li>
              <li>
                <Link href="/help/how-we-handle-data-and-privacy" className={linkClass}>
                  Data &amp; Privacy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={sectionClass}>Jobs &amp; Opportunities</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/posts" className={linkClass}>
                  All listings
                </Link>
              </li>
              <li>
                <Link href="/professions" className={linkClass}>
                  By profession
                </Link>
              </li>
              <li>
                <Link href="/locations" className={linkClass}>
                  By location
                </Link>
              </li>
              <li>
                <Link href="/organizations" className={linkClass}>
                  By organization
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
            </ul>
          </div>

          <div>
            <h3 className={sectionClass}>For health workers</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/practitioners" className={linkClass}>
                  Browse practitioners
                </Link>
              </li>
              <li>
                <Link href="/stats/uganda" className={linkClass}>
                  Uganda health stats
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
                <Link href="/practitioners/profession/doctor" className={linkClass}>
                  Doctors in Uganda
                </Link>
              </li>
              <li>
                <Link href="/practitioners/profession/nurse-midwife" className={linkClass}>
                  Nurses in Uganda
                </Link>
              </li>
              <li>
                <Link href="/practitioners/profession/clinical-officer" className={linkClass}>
                  Clinical Officers
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkClass}>
                  List your practice
                </Link>
              </li>
              <li>
                <Link href="/posts/new" className={linkClass}>
                  Post a listing
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkClass}>
                  Update your profile
                </Link>
              </li>
              <li>
                <Link href="/about" className={linkClass}>
                  About us
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkClass}>
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Are you a licensed health professional?
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              List your practice on {SITE_NAME} and let patients find you.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Link
              href="/posts/new"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Post a listing
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 dark:border-slate-600 dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-400"
            >
              Contact us
            </Link>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-200 pt-6 dark:border-slate-800">
          <p className="text-xs leading-relaxed text-slate-400 dark:text-slate-500">
            Licensing data is official data provided by the Uganda Medical &amp;
            Dental Practitioners Council (UMPDC) and shows the registered/licence
            status as published. Ratings are community opinions and are not medical
            advice, an endorsement, or a substitute for professional judgement.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                © {year} {SITE_NAME}. All rights reserved. Not affiliated with any
                council or regulator.
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Your privacy is important to us.{" "}
                <Link
                  href="/privacy"
                  className="font-medium text-emerald-700 underline dark:text-emerald-400"
                >
                  Manage your privacy choices
                </Link>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="text-xs text-slate-400 transition hover:text-emerald-700 dark:text-slate-500 dark:hover:text-emerald-400">
                Terms of Use
              </Link>
              <Link href="/privacy" className="text-xs text-slate-400 transition hover:text-emerald-700 dark:text-slate-500 dark:hover:text-emerald-400">
                Privacy
              </Link>
              <Link href="/admin" className="text-xs text-slate-400 transition hover:text-emerald-700 dark:text-slate-500 dark:hover:text-emerald-400">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
