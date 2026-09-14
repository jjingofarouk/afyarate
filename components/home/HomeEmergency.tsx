import Link from "next/link";
import { DISPATCH_PHONE_DISPLAY, DISPATCH_PHONE_LINK } from "@/lib/site";

/**
 * Emergency ambulance strip: fixed near the top of the home page (never
 * shuffled; emergencies don't wait for layout rotation). Urgent red band,
 * pulsing live dot, and a shaking call button wired to the dispatch line.
 */
export default function HomeEmergency() {
  return (
    <section
      id="emergency"
      aria-label="Emergency ambulance in Uganda"
      className="relative scroll-mt-20 overflow-hidden bg-gradient-to-br from-red-700 via-red-800 to-red-950 dark:from-red-900 dark:via-red-950 dark:to-black"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-16 size-64 rounded-full bg-white/10 blur-3xl"
      />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-10 text-center sm:py-12 lg:flex-row lg:gap-10 lg:text-left">
        <div className="relative grid size-16 shrink-0 place-items-center rounded-full bg-white shadow-xl sm:size-20">
          <span
            aria-hidden
            className="absolute inset-0 animate-ping rounded-full bg-white/50 [animation-duration:1.4s]"
          />
          <svg
            className="relative size-8 text-red-700 sm:size-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
            />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-red-100">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-300 opacity-90" />
              <span className="relative inline-flex size-2 rounded-full bg-red-200" />
            </span>
            Emergency · 24/7 · countrywide
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Need an ambulance in Uganda? Don&apos;t wait, call now.
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-red-100 lg:mx-0">
            A medical emergency can&apos;t wait. One call connects you to an
            ambulance near you, anywhere in Uganda, any time of day or night.
            Every minute matters, call now.
          </p>
          <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-center lg:justify-start">
            <a
              href={DISPATCH_PHONE_LINK}
              className="contact-shake inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-extrabold text-red-800 shadow-xl transition hover:bg-red-50 sm:w-auto"
            >
              <svg
                className="size-5"
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
            <Link
              href="/ambulances"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20 sm:w-auto"
            >
              Browse ambulance services →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
