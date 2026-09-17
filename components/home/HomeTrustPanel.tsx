import { BadgeCheck, Bell, Hospital, ShieldCheck, type LucideIcon } from "lucide-react";

const ITEMS: { Icon: LucideIcon; title: string; blurb: string; href?: string }[] = [
  {
    Icon: BadgeCheck,
    title: "Admin-reviewed listings",
    blurb: "Every opportunity is checked before it goes live.",
  },
  {
    Icon: Hospital,
    title: "Organization profiles",
    blurb: "See who is recruiting before you apply.",
    href: "/organizations",
  },
  {
    Icon: Bell,
    title: "Job alerts",
    blurb: "Tell us what you want and we will email new matches.",
    href: "/alerts",
  },
  {
    Icon: ShieldCheck,
    title: "Applicant safety",
    blurb: "Never pay money to apply through Rate My Musawo.",
    href: "/help/guides/safety",
  },
];

/**
 * Trust band, on the brand navy. Four short claims that are all backed by
 * something real: the moderation queues, the organization directory, the alert
 * digests, and the applicant safety guide.
 */
export default function HomeTrustPanel() {
  return (
    <section
      aria-label="Why Rate My Musawo"
      className="border-y border-navy-800 bg-navy-950"
      style={{ colorScheme: "dark" }}
    >
      <ul className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((it) => {
          const body = (
            <>
              <span
                aria-hidden
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300"
              >
                <it.Icon className="size-5" strokeWidth={2} />
              </span>
              <span className="min-w-0">
                <strong className="block text-sm font-bold text-white">{it.title}</strong>
                <small className="mt-0.5 block text-sm leading-snug text-slate-300">
                  {it.blurb}
                </small>
              </span>
            </>
          );
          return (
            <li key={it.title}>
              {it.href ? (
                <a
                  href={it.href}
                  className="flex items-start gap-3 rounded-2xl p-2 transition hover:bg-white/5"
                >
                  {body}
                </a>
              ) : (
                <div className="flex items-start gap-3 p-2">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
