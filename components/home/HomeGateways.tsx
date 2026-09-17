import Link from "next/link";
import { ArrowRight, Briefcase, Building2, Hospital, Users, type LucideIcon } from "lucide-react";
import { getFacilityStats } from "@/lib/facilities";
import { getPosts } from "@/lib/posts";
import { getStats } from "@/lib/practitioners";

/**
 * Four gateway tiles: the primary way into the site, each with a live count.
 * Replaces the old jump-to nav, which could only list sections — these tell a
 * visitor what is actually here before they tap.
 *
 * Fetches its own counts so it can stream behind Suspense and never delay the
 * hero. All three helpers carry short-TTL worker caches; getPosts is the same
 * cached array the listing sections below read, so this is not an extra round
 * trip on a warm worker. Every call is guarded so a registry outage degrades
 * to a count of zero instead of taking the home page down.
 */
export default async function HomeGateways() {
  const [posts, stats, facilities] = await Promise.all([
    getPosts().catch(() => []),
    getStats().catch(() => null),
    getFacilityStats().catch(() => null),
  ]);

  const hiringOrganizations = new Set(
    posts.map((p) => p.organization).filter(Boolean),
  ).size;

  const gateways: {
    href: string;
    Icon: LucideIcon;
    title: string;
    blurb: string;
    count: number;
    unit: string;
  }[] = [
    {
      href: "/posts",
      Icon: Briefcase,
      title: "Find opportunities",
      blurb: "Jobs, internships, training, grants and more",
      count: posts.length,
      unit: "live listings",
    },
    {
      href: "/practitioners",
      Icon: Users,
      title: "Find health workers",
      blurb: "Licensed professionals you can verify",
      count: stats?.practitioners ?? 0,
      unit: "on the register",
    },
    {
      href: "/facilities",
      Icon: Hospital,
      title: "Hospitals & pharmacies",
      blurb: "Facilities patients can rate and review",
      count: facilities?.total ?? 0,
      unit: "listed",
    },
    {
      href: "/organizations",
      Icon: Building2,
      title: "Recruiting organizations",
      blurb: "See who is hiring before you apply",
      count: hiringOrganizations,
      unit: "hiring now",
    },
  ];

  return (
    <section aria-label="Explore MOHU" className="relative overflow-hidden">
      {/* Brand artwork from the official kit, knocked back under a navy wash so
          the tiles stay readable. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hero-mohu.webp"
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover object-center"
      />
      <div aria-hidden className="absolute inset-0 bg-navy-950/85" />

      <div className="relative mx-auto grid max-w-6xl gap-3 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {gateways.map((g) => (
          <Link
            key={g.href}
            href={g.href}
            className="group flex items-start gap-3 rounded-2xl border border-white/15 bg-white/95 p-4 shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-xl"
          >
            <g.Icon aria-hidden className="size-6 shrink-0 text-navy-800" strokeWidth={2} />
            <span className="min-w-0 flex-1">
              <strong className="block text-sm font-bold text-slate-900">{g.title}</strong>
              <small className="mt-0.5 block text-sm leading-snug text-slate-600">
                {g.blurb}
              </small>
              <b className="mt-2 block text-sm font-extrabold text-navy-900">
                {g.count.toLocaleString()}{" "}
                <em className="font-semibold not-italic text-slate-500">{g.unit}</em>
              </b>
            </span>
            <ArrowRight
              aria-hidden
              className="size-4 shrink-0 self-center text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-600"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
