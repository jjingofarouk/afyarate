import type { Post } from "@/lib/types";
import { SITE_URL } from "@/lib/site";

// ---------------------------------------------------------------------------
// JobPosting structured data for Google Job Search.
//
// Keeps the markup spec-compliant:
//   - baseSalary.value is a QuantitativeValue (Google's documented form)
//   - employmentType uses Google's allowed enums (CONTRACTOR, INTERN, ...)
//   - jobLocation.address is broken into streetAddress / addressLocality /
//     addressRegion wherever the stored location string contains that detail.
//   - streetAddress / postalCode are always emitted (Google warns when they
//     are missing); Uganda has no widely used postal codes, so a neutral
//     placeholder is used.
//   - validThrough is always emitted; rolling listings expire 6 months after
//     publication.
// ---------------------------------------------------------------------------

const CURRENCY = "UGX";

/** Ugandan towns/cities/districts → Uganda region. Real, public data, used to
 *  populate `addressRegion` (Google warns when it's missing). */
const TOWN_REGIONS: Record<string, string> = {
  // Central Region
  kampala: "Central Region",
  entebbe: "Central Region",
  wakiso: "Central Region",
  mukono: "Central Region",
  mpigi: "Central Region",
  masaka: "Central Region",
  mityana: "Central Region",
  mubende: "Central Region",
  luwero: "Central Region",
  luweero: "Central Region",
  kayunga: "Central Region",
  kalisizo: "Central Region",
  kyotera: "Central Region",
  rakai: "Central Region",
  sembabule: "Central Region",
  gomba: "Central Region",
  butambala: "Central Region",
  nakaseke: "Central Region",
  nakasongola: "Central Region",
  kiboga: "Central Region",
  lyantonde: "Central Region",
  kalungu: "Central Region",
  buikwe: "Central Region",
  kayabwe: "Central Region",
  bombo: "Central Region",
  busega: "Central Region",
  mifunya: "Central Region",
  kibiri: "Central Region",
  buwambo: "Central Region",
  kibuye: "Central Region",
  matugga: "Central Region",
  mengo: "Central Region",
  // Eastern Region
  jinja: "Eastern Region",
  iganga: "Eastern Region",
  mbale: "Eastern Region",
  kumi: "Eastern Region",
  soroti: "Eastern Region",
  tororo: "Eastern Region",
  busia: "Eastern Region",
  bugiri: "Eastern Region",
  mayuge: "Eastern Region",
  kamuli: "Eastern Region",
  kaliro: "Eastern Region",
  namayingo: "Eastern Region",
  budaka: "Eastern Region",
  kapchorwa: "Eastern Region",
  bukedea: "Eastern Region",
  butaleja: "Eastern Region",
  bududa: "Eastern Region",
  bulambuli: "Eastern Region",
  manafwa: "Eastern Region",
  kween: "Eastern Region",
  pallisa: "Eastern Region",
  kibuku: "Eastern Region",
  butebo: "Eastern Region",
  luuka: "Eastern Region",
  namutumba: "Eastern Region",
  serere: "Eastern Region",
  // Western Region
  mbarara: "Western Region",
  kasese: "Western Region",
  kabale: "Western Region",
  "fort portal": "Western Region",
  bushenyi: "Western Region",
  ibanda: "Western Region",
  hoima: "Western Region",
  masindi: "Western Region",
  kyegegwa: "Western Region",
  kamwenge: "Western Region",
  rukungiri: "Western Region",
  ntungamo: "Western Region",
  kisoro: "Western Region",
  sheema: "Western Region",
  bundibugyo: "Western Region",
  kabarole: "Western Region",
  kyenjojo: "Western Region",
  rubirizi: "Western Region",
  buhweju: "Western Region",
  mitooma: "Western Region",
  kiruhura: "Western Region",
  isingiro: "Western Region",
  kanungu: "Western Region",
  kagadi: "Western Region",
  kakumiro: "Western Region",
  kibaale: "Western Region",
  kiryandongo: "Western Region",
  buliisa: "Western Region",
  kikuube: "Western Region",
  ntoroko: "Western Region",
  // Northern Region
  gulu: "Northern Region",
  amuru: "Northern Region",
  nwoya: "Northern Region",
  omoro: "Northern Region",
  kitgum: "Northern Region",
  lamwo: "Northern Region",
  pader: "Northern Region",
  agago: "Northern Region",
  lira: "Northern Region",
  apac: "Northern Region",
  oyam: "Northern Region",
  kole: "Northern Region",
  dokolo: "Northern Region",
  arua: "Northern Region",
  nebbi: "Northern Region",
  moyo: "Northern Region",
  yumbe: "Northern Region",
  adjumani: "Northern Region",
  zombo: "Northern Region",
  maracha: "Northern Region",
  koboko: "Northern Region",
  terego: "Northern Region",
  // Karamoja Region
  moroto: "Karamoja Region",
  kotido: "Karamoja Region",
  kaabong: "Karamoja Region",
  nakapiripirit: "Karamoja Region",
  amudat: "Karamoja Region",
  abim: "Karamoja Region",
  napak: "Karamoja Region",
  nabilatuk: "Karamoja Region",
  karenga: "Karamoja Region",
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function titleCase(s: string): string {
  return s.trim().replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

/** Leftmost known town/city in the string, with its region. */
function findTown(s: string): { name: string; region: string; index: number } | null {
  const lower = s.toLowerCase();
  let best: { name: string; region: string; index: number } | null = null;
  for (const [name, region] of Object.entries(TOWN_REGIONS)) {
    const m = lower.match(new RegExp(`\\b${escapeRegExp(name)}\\b`));
    if (!m) continue;
    if (!best || m.index! < best.index || (m.index === best.index && name.length > best.name.length)) {
      best = { name, region, index: m.index! };
    }
  }
  return best;
}

export interface JobLocation {
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
}

/**
 * Break a free-text location ("Kawempe-Kazo, Kampala", "Plot 1495, Kira Road,
 * Bukoto, Kampala, Uganda") into structured address parts. Only returns values
 * actually present in the string, never invents an address.
 */
export function parseJobLocation(raw: string | null): JobLocation {
  if (!raw) return {};
  const s = raw.trim().replace(/\s+/g, " ");
  if (!s || s.toLowerCase() === "uganda") return {};

  const lower = s.toLowerCase();
  const out: JobLocation = {};

  // Region: explicit "X District" / "X Region" beats the town map.
  const district = lower.match(/\b([a-z][a-z\-]*)\s+district\b/);
  const explicitRegion = lower.match(/\b([a-z][a-z\-]*)\s+region\b/);
  if (district) out.addressRegion = `${titleCase(district[1])} District`;
  else if (explicitRegion) out.addressRegion = `${titleCase(explicitRegion[1])} Region`;

  // Town-based locality/region fallback.
  const town = findTown(s);
  if (town) {
    out.addressLocality = titleCase(town.name);
    if (!out.addressRegion) out.addressRegion = town.region;
  } else {
    const townCouncil = lower.match(/\b([a-z][a-z \-]*?)\s+town(?:\s+council)?\b/);
    if (townCouncil) out.addressLocality = titleCase(townCouncil[1]);
  }

  // Street-level address: the parts that precede the town, or a road/street name.
  const body = s
    .replace(/,?\s*uganda\b/gi, "")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\b(?:northern|eastern|western|central|karamoja|uganda)\s*$/gi, "")
    .trim();
  const parts = body
    .split(/[,/–]/)
    .map((p) => p.trim())
    .filter((p) => p && !/^(district|region)$/i.test(p) && !/District$/i.test(p) && !/Region$/i.test(p));

  let streetParts: string[] = [];
  if (town) {
    const townIdx = parts.findIndex((p) => p.toLowerCase().includes(town.name));
    if (townIdx > 0) streetParts = parts.slice(0, townIdx);
  } else if (parts.length > 1) {
    streetParts = parts.slice(0, -1);
  }

  // Road/street keyword, e.g. "Jinja-Malaba Highway" or "Masaka-Kyotera Road".
  const streetRe = /\b[\w][\w \-']*\s+(?:road|street|avenue|ave|lane|highway|drive|close|crescent|way|bypass|trading centre)\b[^,;()]*/i;
  const streetMatch = streetRe.exec(body);

  if (streetParts.length) {
    out.streetAddress = streetParts.join(", ");
  } else if (streetMatch) {
    out.streetAddress = streetMatch[0].trim();
  }

  return out;
}

/** Parse a salary string ("UGX 2M", "600K", "1,500,000") into a numeric value
 *  plus pay period. Defaults to MONTH when no period is stated, since a bare
 *  figure in a Uganda job posting is almost always a monthly wage. Returns
 *  undefined for vague values ("Negotiable", "Not disclosed"). */
export function parseSalary(
  raw: string | null,
): { value: number; unitText: string } | undefined {
  if (!raw) return undefined;
  const s = raw.replace(/,/g, "").toLowerCase();
  const m = s.match(/(\d+(?:\.\d+)?)\s*(m|million|k|thousand)?/);
  if (!m) return undefined;
  let value = parseFloat(m[1]);
  const unit = m[2];
  if (unit === "m" || unit === "million") value *= 1_000_000;
  else if (unit === "k" || unit === "thousand") value *= 1_000;
  if (!Number.isFinite(value) || value <= 0) return undefined;

  let unitText: string;
  if (/hourly|per\s+hour|per\s+hr|\/hr|\/hour\b/.test(s)) unitText = "HOUR";
  else if (/weekly|per\s+week|per\s+wk|\/wk|\/week\b/.test(s)) unitText = "WEEK";
  else if (/annually|annual|per\s+(?:year|annum)|\/yr\b|\/year\b/.test(s)) unitText = "YEAR";
  // A bare figure ("UGX 600,000") is, by near universal local convention, a
  // monthly wage; no Uganda posting means that as an annual salary.
  else unitText = "MONTH";
  return { value, unitText };
}

/** Fallback: when the salary field is empty/unparseable, look for a
 *  "Salary: …" line inside the posting's own text (never invented). */
function parseSalaryFromText(text: string | null): { value: number; unitText?: string } | undefined {
  if (!text) return undefined;
  const m = text.match(
    /(?:salary|pay|remuneration|stipend)\s*[:\-–]?\s*(?:ugx\s*)?([\d,]+(?:\.\d+)?)\s*(m|million|k|thousand)?/i,
  );
  if (!m) return undefined;
  return parseSalary(`${m[1]}${m[2] ? ` ${m[2]}` : ""}`);
}

function employmentType(raw: string | null): string {
  if (!raw) return "OTHER";
  const s = raw.toLowerCase();
  if (s.includes("full")) return "FULL_TIME";
  if (s.includes("part")) return "PART_TIME";
  if (s.includes("contract") || s.includes("consult")) return "CONTRACTOR";
  if (s.includes("temp") || s.includes("short")) return "TEMPORARY";
  if (s.includes("intern")) return "INTERN";
  if (s.includes("volunteer")) return "VOLUNTEER";
  if (s.includes("per diem") || s.includes("daily")) return "PER_DIEM";
  return "OTHER";
}

function deadlineIso(deadline: string | null): string | undefined {
  if (!deadline) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return `${deadline}T00:00:00`;
  const d = new Date(deadline);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** Rolling listings get a validThrough 6 months after publication so the
 *  field is never missing (Google warns when it is). */
function rollingValidThrough(publishedAt: string | null): string {
  const d = publishedAt ? new Date(publishedAt) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  d.setUTCMonth(d.getUTCMonth() + 6);
  return d.toISOString();
}

/** Best-effort streetAddress: parsed street detail, else the raw location
 *  text, else the hiring organization's name. */
function streetAddressFor(post: Post, location: JobLocation): string {
  if (location.streetAddress) return location.streetAddress;
  const raw = post.location?.trim().replace(/\s+/g, " ");
  if (raw && raw.toLowerCase() !== "uganda") return raw;
  return post.organization;
}

/** Build the JobPosting JSON-LD entity, or null for non-job listings. */
export function jobPostingSchema(post: Post): Record<string, unknown> | null {
  if (post.type !== "job" && post.type !== "internship") return null;

  const salary =
    parseSalary(post.salary) ??
    parseSalaryFromText([post.benefits, post.summary, post.description].filter(Boolean).join("\n"));
  const location = parseJobLocation(post.location);

  return {
    "@type": "JobPosting",
    title: post.title,
    description: post.description || post.summary || post.title,
    datePosted: post.publishedAt ?? new Date().toISOString(),
    validThrough: deadlineIso(post.deadline) ?? rollingValidThrough(post.publishedAt),
    employmentType: employmentType(post.employmentType),
    hiringOrganization: {
      "@type": "Organization",
      name: post.organization,
      ...(post.sourceUrl && post.sourceUrl !== SITE_URL ? { sameAs: post.sourceUrl } : {}),
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: "UG",
        postalCode: "00000",
        ...(location.addressLocality ? { addressLocality: location.addressLocality } : {}),
        ...(location.addressRegion ? { addressRegion: location.addressRegion } : {}),
        streetAddress: streetAddressFor(post, location),
      },
    },
    url: `${SITE_URL}/posts/${post.slug}`,
    directApply: false,
    ...(post.qualification ? { qualifications: post.qualification } : {}),
    ...(salary
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: CURRENCY,
            value: {
              "@type": "QuantitativeValue",
              value: salary.value,
              ...(salary.unitText ? { unitText: salary.unitText } : {}),
            },
          },
        }
      : {}),
  };
}
