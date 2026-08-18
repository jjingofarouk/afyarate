import Link from "next/link";
import type { ReactNode } from "react";

export type SectionTone = "white" | "slate" | "emerald" | "amber" | "sky";

const TONE_STYLES: Record<SectionTone, { band: string; pill: string; link: string }> = {
  white: {
    band: "bg-white dark:bg-slate-950",
    pill: "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
    link: "text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300",
  },
  slate: {
    band: "border-y border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/40",
    pill: "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
    link: "text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300",
  },
  emerald: {
    band: "border-y border-emerald-100 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20",
    pill: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
    link: "text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300",
  },
  amber: {
    band: "border-y border-amber-200/70 bg-gradient-to-b from-amber-50 via-orange-50/50 to-amber-50/30 dark:border-amber-900/40 dark:from-amber-950/30 dark:via-orange-950/15 dark:to-amber-950/10",
    pill: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
    link: "text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300",
  },
  sky: {
    band: "border-y border-sky-100 bg-sky-50/60 dark:border-sky-900/40 dark:bg-sky-950/20",
    pill: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
    link: "text-sky-700 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300",
  },
};

/**
 * One clearly-demarcated home page section: a full-width tonal band with its
 * own eyebrow, heading and "view all" link. Every major content type on the
 * home page lives inside one of these, so the page reads as a stack of
 * distinct destinations rather than one undifferentiated wall of cards.
 */
export default function HomeSection({
  id,
  tone = "white",
  eyebrow,
  eyebrowIcon,
  title,
  description,
  action,
  children,
  className,
  compact = false,
}: {
  id?: string;
  tone?: SectionTone;
  eyebrow?: string;
  eyebrowIcon?: ReactNode;
  title?: string;
  description?: string;
  action?: { href: string; label: string };
  children: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  const styles = TONE_STYLES[tone];
  const hasHeader = Boolean(eyebrow || title || description || action);
  return (
    <section id={id} className={`scroll-mt-20 ${styles.band} ${className ?? ""}`}>
      <div
        className={`mx-auto max-w-6xl px-4 ${compact ? "py-8 sm:py-10" : "py-12 sm:py-16"}`}
      >
        {hasHeader && (
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              {eyebrow && (
                <p
                  className={`mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${styles.pill}`}
                >
                  {eyebrowIcon}
                  {eyebrow}
                </p>
              )}
              {title && (
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {description}
                </p>
              )}
            </div>
            {action && (
              <Link
                href={action.href}
                className={`shrink-0 text-sm font-semibold underline-offset-4 hover:underline ${styles.link}`}
              >
                {action.label} →
              </Link>
            )}
          </div>
        )}
        {hasHeader && <div className="mt-8" />}
        {children}
      </div>
    </section>
  );
}