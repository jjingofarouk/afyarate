import Link from "next/link";
import { ArrowRight, Briefcase, ClipboardList, Bell, Bookmark } from "lucide-react";

const JOBSEEKER_LINKS: { href: string; label: string; icon: typeof Bell }[] = [
  { href: "/applications", label: "My applications", icon: ClipboardList },
  { href: "/saved", label: "Saved listings", icon: Bookmark },
  { href: "/alerts", label: "Job alerts", icon: Bell },
];

const EMPLOYER_LINKS: { href: string; label: string }[] = [
  { href: "/employers", label: "Employer workspace" },
  { href: "/posts/new", label: "Post a listing" },
];

/**
 * Tells people what is behind the listings. The board only shows the adverts,
 * so without this a visitor has no way to know the site also tracks their
 * applications end to end, or that an employer can run the whole recruitment
 * process here. Both claims are backed by real screens: /applications and
 * /employers.
 */
export default function HomeManageBand() {
  return (
    <section aria-label="What you can manage here" className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <span
            aria-hidden
            className="grid size-10 place-items-center rounded-xl bg-emerald-600 text-white"
          >
            <ClipboardList className="size-5" />
          </span>
          <h2 className="mt-3 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Looking for work? Manage every application here
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            Apply without leaving the site, then follow each application from submitted
            through reviewing, shortlisted and hired. Save listings to come back to, set an
            alert so new matches reach your inbox, and keep your CV and documents ready in
            your vault.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {JOBSEEKER_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3.5 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-500 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300 dark:hover:border-emerald-500"
              >
                <l.icon aria-hidden className="size-4" />
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-navy-200 bg-navy-50 p-5 dark:border-navy-800 dark:bg-navy-950/40">
          <span
            aria-hidden
            className="grid size-10 place-items-center rounded-xl bg-navy-900 text-white"
          >
            <Briefcase className="size-5" />
          </span>
          <h2 className="mt-3 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Hiring? Run the whole recruitment process
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            Post an opportunity, then review everyone who applies, move candidates through
            shortlisting, interview, offer and hire, open the CVs and documents they
            attached, and track how many views each listing gets. Applicants are notified
            automatically whenever their status changes.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {EMPLOYER_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="inline-flex items-center gap-1.5 rounded-xl border border-navy-300 bg-white px-3.5 py-2 text-sm font-semibold text-navy-900 transition hover:border-navy-500 hover:bg-navy-50 dark:border-navy-700 dark:bg-slate-900 dark:text-navy-200 dark:hover:border-navy-500"
              >
                {l.label}
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
