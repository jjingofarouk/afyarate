import Link from "next/link";
import { getPosts } from "@/lib/posts";
import { slugify } from "@/lib/practitioner-url";

// Type shortcuts under the hero search. Same order as the type tiles further
// down the page, so the two read as one system.
const CHIPS: { label: string; href: string }[] = [
  { label: "Jobs", href: "/jobs" },
  { label: "Internships", href: "/internships" },
  { label: "Scholarships", href: "/scholarships" },
  { label: "Grants", href: "/grants" },
  { label: "Fellowships", href: "/fellowships" },
  { label: "Conferences", href: "/conferences" },
  { label: "All", href: "/posts" },
];

const FIELD =
  "min-w-0 rounded-xl border-0 bg-transparent px-3 py-2.5 text-slate-900 outline-none placeholder:text-slate-500";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto mt-8 w-full max-w-3xl">
      <form action="/posts" method="get" className="w-full">
        <div className="flex flex-col gap-2 rounded-2xl border border-white/20 bg-white/95 p-2 shadow-2xl backdrop-blur sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor="hero-q">
            Search opportunities
          </label>
          <input
            id="hero-q"
            name="q"
            type="search"
            placeholder="Search opportunities (nurse, internship, Mbarara…)"
            className={`${FIELD} flex-1`}
          />
          {children}
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500"
          >
            Search
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {CHIPS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            {c.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Rendered while the location list resolves, so the hero never waits on it. */
export function HeroSearchFallback() {
  return <Shell>{null}</Shell>;
}

/**
 * Hero search: keyword + location, straight to the listing results, with the
 * busiest boards one tap below. A plain GET form, so it works without
 * JavaScript and ships no client bundle. Mirrors the search in the hero of the
 * original MOHU platform.
 *
 * The location list is the twelve most-used locations across live listings,
 * submitted as slugs: the listing filter splits its value on commas and
 * compares slugs, so a raw "Mbarara, Uganda" would never have matched.
 */
export default async function HomeHeroSearch() {
  const posts = await getPosts().catch(() => []);
  const counts = new Map<string, number>();
  for (const p of posts) {
    if (p.location) counts.set(p.location, (counts.get(p.location) ?? 0) + 1);
  }
  const locations = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([label]) => label);

  return (
    <Shell>
      <label className="sr-only" htmlFor="hero-location">
        Location
      </label>
      <select
        id="hero-location"
        name="location"
        defaultValue=""
        className={`${FIELD} sm:w-52`}
      >
        <option value="">All Uganda</option>
        {locations.map((l) => (
          <option key={l} value={slugify(l)}>
            {l}
          </option>
        ))}
      </select>
    </Shell>
  );
}
