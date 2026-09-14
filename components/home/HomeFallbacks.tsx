/**
 * Lightweight streaming placeholders for the home page sections. Each async
 * section below the hero renders inside a <Suspense fallback={...}>, so the
 * hero paints in the first flush while heavier DB reads stream in behind it.
 * Skeletons mimic the section's band tone so there is no colour flash.
 */

function Bars() {
  return (
    <div className="space-y-3" aria-hidden>
      <div className="h-7 w-64 max-w-full animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
      <div className="h-4 w-96 max-w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800/80"
          />
        ))}
      </div>
    </div>
  );
}

export function JobsFallback() {
  return (
    <section
      aria-label="Loading opportunities"
      className="border-y border-emerald-100 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20"
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <Bars />
      </div>
    </section>
  );
}

export function AmberFallback() {
  return (
    <section
      aria-label="Loading"
      className="border-y border-amber-200/70 bg-gradient-to-b from-amber-50 via-orange-50/50 to-amber-50/30 dark:border-amber-900/40 dark:from-amber-950/30 dark:via-orange-950/15 dark:to-amber-950/10"
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <Bars />
      </div>
    </section>
  );
}

export function PlainFallback() {
  return (
    <section aria-label="Loading" className="bg-white dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <Bars />
      </div>
    </section>
  );
}

export function SkyFallback() {
  return (
    <section
      aria-label="Loading"
      className="border-y border-sky-100 bg-sky-50/60 dark:border-sky-900/40 dark:bg-sky-950/20"
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <Bars />
      </div>
    </section>
  );
}

export function EmeraldFallback() {
  return (
    <section
      aria-label="Loading"
      className="border-y border-emerald-100 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20"
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <Bars />
      </div>
    </section>
  );
}
