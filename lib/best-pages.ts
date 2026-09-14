/**
 * Registry for the /best "Best X in Uganda" landing pages.
 *
 * Goal: rank for high-intent local-intent queries — "best doctors in Uganda",
 * "best hospitals in Uganda", "best pharmacies in Kampala" — the way users
 * actually type them. Each entry here becomes one indexable, crawlable,
 * internally-linked page that aggregates the site's rating data.
 */

import { pluralProfession } from "./posts";

/** Professions that get a `/best/<slug>` page. */
export const BEST_PROFESSIONS: string[] = [
  "Doctor",
  "Nurse / Midwife",
  "Clinical Officer",
  "Pharmacist",
  "Dentist",
  "Laboratory",
];

/** Facility kinds that get a `/best/<kind>` page. */
export const BEST_FACILITY_KINDS = ["hospital", "pharmacy"] as const;

export type BestFacilityKind = (typeof BEST_FACILITY_KINDS)[number];

/** Uganda's main cities for facility pages. The page 404s a slug that has no
 *  matching facility in the DB, so this is a curated superset. */
export const BEST_CITIES: { slug: string; label: string }[] = [
  { slug: "kampala", label: "Kampala" },
  { slug: "wakiso", label: "Wakiso" },
  { slug: "mukono", label: "Mukono" },
  { slug: "entebbe", label: "Entebbe" },
  { slug: "jinja", label: "Jinja" },
  { slug: "mbale", label: "Mbale" },
  { slug: "mbarara", label: "Mbarara" },
  { slug: "masaka", label: "Masaka" },
  { slug: "gulu", label: "Gulu" },
  { slug: "lira", label: "Lira" },
  { slug: "arua", label: "Arua" },
  { slug: "fort-portal", label: "Fort Portal" },
  { slug: "hoima", label: "Hoima" },
  { slug: "soroti", label: "Soroti" },
  { slug: "kasese", label: "Kasese" },
  { slug: "tororo", label: "Tororo" },
];

/** Plural label used in copy: "Doctors", "Nurses / Midwives", ... */
export { pluralProfession as bestProfessionLabel };

/** Keyword phrase users type: "doctors", "nurses and midwives", ... */
export function bestProfessionKeyword(profession: string): string {
  if (profession === "Nurse / Midwife") return "nurses and midwives";
  if (profession === "Laboratory") return "laboratory professionals";
  return pluralProfession(profession).toLowerCase();
}
