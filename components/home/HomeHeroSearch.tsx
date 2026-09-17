import Link from "next/link";
import SiteSearch from "@/components/SiteSearch";
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

const SELECT_CLASS =
  "min-w-0 rounded-xl border-0 bg-transparent px-3 py-2.5 text-slate-900 outline-none sm:w-52";

/**
 * Hero search. Renders the same SiteSearch component as the header, so the two
 * behave identically: one live dropdown covering jobs & opportunities,
 * licensed practitioners and facilities. The only additions here are the type
 * chips and a location refinement, which is hero-only.
 *
 * The location list is deduplicated by city: stored locations are free text and
 * routinely repeat the same place ("Kampala" and "Kampala, Uganda"), so
 * counting raw values would offer Kampala three times over.
 */
export default async function HomeHeroSearch() {
  const posts = await getPosts().catch(() => []);

  // Locations are free text, so the same place turns up written several ways
  // ("Kampala", "Kampala, Uganda", "Mbarara", "Mbarara City, Western Uganda").
  // Take the leading city, drop a trailing qualifier, and count the merges, or
  // the picker offers Kampala twice and Mbarara three times.
  const cityOf = (location: string | null | undefined): string | null => {
    const first = location?.split(",")[0]?.trim();
    if (!first) return null;
    // Only strip qualifiers that really are qualifiers. "Town" is deliberately
    // not in this list: it would turn "Cape Town" into "Cape".
    const normalised = first.replace(/\s+(City|Municipality)$/i, "").trim();
    // Skip junk values: a couple of rows carry a stray symbol instead of a
    // place, and the country itself is not a city.
    if (normalised.length < 2 || !/[a-z]/i.test(normalised)) return null;
    if (slugify(normalised) === "uganda") return null;
    return normalised;
  };

  const byCity = new Map<string, number>();
  for (const p of posts) {
    const city = cityOf(p.location);
    if (!city) continue;
    byCity.set(city, (byCity.get(city) ?? 0) + 1);
  }
  const cities = [...byCity.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([city]) => city);

  return (
    <div className="mx-auto mt-8 w-full max-w-3xl">
      <SiteSearch
        variant="hero"
        placeholder="Search opportunities, doctors, hospitals…"
        extraControls={
          <>
            <label className="sr-only" htmlFor="hero-location">
              Location
            </label>
            <select
              id="hero-location"
              name="location"
              defaultValue=""
              className={SELECT_CLASS}
            >
              <option value="">All locations</option>
              {/* Slugs, not labels: the listing filter compares slugs and now
                  also matches the leading city segment. */}
              {cities.map((city) => (
                <option key={city} value={slugify(city)}>
                  {city}
                </option>
              ))}
            </select>
          </>
        }
      />

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
  return (
    <div className="mx-auto mt-8 w-full max-w-3xl">
      <SiteSearch variant="hero" placeholder="Search opportunities, doctors, hospitals…" />
    </div>
  );
}
