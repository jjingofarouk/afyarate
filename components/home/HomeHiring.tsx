import Link from "next/link";
import {
  DISPATCH_PHONE_DISPLAY,
  DISPATCH_PHONE_LINK,
  HIRING_EMAIL,
  HIRING_EMAIL_LINK,
  NEWSLETTER_AUDIENCE_SIZE,
} from "@/lib/site";

/**
 * Recruiter strip: fixed below the discovery sections (never shuffled).
 * Sells access to the health-worker audience: pool size up front, then the
 * direct phone + email contact paths.
 */
export default function HomeHiring() {
  return (
    <section
      id="hiring"
      aria-label="Hiring health workers"
      className="scroll-mt-20 border-y border-navy-800 bg-navy-950 dark:border-navy-800"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-12 text-center sm:py-16 lg:flex-row lg:gap-10 lg:text-left">
        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-emerald-300">
            For employers & recruiters
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Are you hiring? Reach {NEWSLETTER_AUDIENCE_SIZE} health workers.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-300 lg:mx-0">
            Our job alerts go straight to a pool of over {NEWSLETTER_AUDIENCE_SIZE}{" "}
            verified Ugandan doctors, nurses, midwives, clinical officers and
            pharmacists. Tell us who you need, we&apos;ll put your opening in
            front of them.
          </p>
          <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center lg:justify-start">
            <a
              href={DISPATCH_PHONE_LINK}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 sm:w-auto"
            >
              <svg
                className="size-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.2"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                />
              </svg>
              Call {DISPATCH_PHONE_DISPLAY}
            </a>
            <a
              href={HIRING_EMAIL_LINK}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20 sm:w-auto"
            >
              Email {HIRING_EMAIL}
            </a>
            <Link
              href="/posts/new"
              className="inline-flex w-full items-center justify-center gap-2 px-2 py-3 text-sm font-semibold text-emerald-300 underline-offset-4 hover:underline sm:w-auto"
            >
              Post a job →
            </Link>
          </div>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-1">
          {[
            { value: NEWSLETTER_AUDIENCE_SIZE, label: "Health workers reached" },
            { value: "24 hrs", label: "Typical response time" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center"
            >
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="mt-1 text-xs text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
