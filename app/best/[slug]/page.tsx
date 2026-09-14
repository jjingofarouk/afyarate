import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PractitionerCard from "@/components/PractitionerCard";
import FacilityCard from "@/components/FacilityCard";
import { slugify } from "@/lib/posts";
import {
  BEST_FACILITY_KINDS,
  BEST_PROFESSIONS,
  bestProfessionKeyword,
} from "@/lib/best-pages";
import { getProfessionCounts, searchPractitioners } from "@/lib/practitioners";
import { searchFacilities } from "@/lib/facilities";
import type { Practitioner } from "@/lib/types";
import type { Facility } from "@/lib/types";
import { practitionerUrl } from "@/lib/practitioner-url";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Escape "<" so user-submitted text can't break out of the JSON-LD <script> tag. */
function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

const kindLabel = (kind: "hospital" | "pharmacy") =>
  kind === "hospital" ? "Hospitals" : "Pharmacies";

interface BestPageData {
  /** Practitioner ranking vs facility ranking. */
  isProfession: boolean;
  /** Keyword-style label: "doctors", "nurses and midwives", "hospitals", ... */
  label: string;
  /** H1 suffix word: "Doctors", "Hospitals", ... */
  heading: string;
  practitioners: Practitioner[];
  facilities: Facility[];
  total: number;
  professionSlug?: string;
  facilityKind?: "hospital" | "pharmacy";
}

async function getProfessionData(slug: string): Promise<BestPageData | null> {
  const counts = await getProfessionCounts();
  const prof = counts.find((c) => slugify(c.profession) === slug);
  if (!prof || !BEST_PROFESSIONS.includes(prof.profession)) return null;
  // Rank by rating; if no one in this cadre has been rated yet, fall back to
  // the default photo-first browse order so the page is never an empty shell.
  const rated = await searchPractitioners({
    profession: prof.profession,
    status: "all",
    sort: "rating",
    page: 1,
    pageSize: 24,
  }).catch(() => null);
  const items =
    rated && rated.total > 0
      ? rated
      : await searchPractitioners({
          profession: prof.profession,
          status: "all",
          sort: "name",
          page: 1,
          pageSize: 24,
        });
  return {
    isProfession: true,
    label: bestProfessionKeyword(prof.profession),
    heading: bestProfessionKeyword(prof.profession).replace(/^\w/, (c) => c.toUpperCase()),
    practitioners: items.items,
    facilities: [],
    total: items.total,
    professionSlug: slug,
  };
}

async function getFacilityData(kind: "hospital" | "pharmacy"): Promise<BestPageData> {
  const result = await searchFacilities({
    kind,
    sort: "rating",
    page: 1,
    pageSize: 24,
  });
  return {
    isProfession: false,
    label: kindLabel(kind).toLowerCase(),
    heading: kindLabel(kind),
    practitioners: [],
    facilities: result.items,
    total: result.total,
    facilityKind: kind,
  };
}

function faqsFor(label: string, isProfession: boolean) {
  const single = label.replace(/s$/, "");
  if (isProfession) {
    return [
      {
        q: `Who are the best ${label} in Uganda?`,
        a: `The ${label} listed here have the most patient ratings and the highest average scores on ${SITE_NAME}. Every profile also shows their council, registration number and licence status, so you can confirm they are currently licensed before you book.`,
      },
      {
        q: `How is "best" decided?`,
        a: `Rankings combine how many patients have rated a ${single} with their average star rating. Reviews are community opinions; licensing details come from the official Uganda registers.`,
      },
      {
        q: `Can I book an appointment directly?`,
        a: `Many profiles show a phone number and WhatsApp link added by the practitioner after verifying their profile. Open a profile to see the contact options available.`,
      },
      {
        q: `Are these ${label} licensed?`,
        a: `Yes. Every ${single} on ${SITE_NAME} comes from the official public register, and each profile displays registration and licence status so you can verify it yourself.`,
      },
    ];
  }
  return [
    {
      q: `Which are the best ${label} in Uganda?`,
      a: `The ${label} on this page have the most patient ratings and the highest average scores on ${SITE_NAME}. Each listing shows its location and patient rating so you can compare before you visit.`,
    },
    {
      q: `How is "best" decided?`,
      a: `Rankings combine review volume and average star rating from patients who have used the ${single}. Anyone who has visited can leave a rating, and each review is marked as verified or unverified.`,
    },
    {
      q: `Do these ${label} have contact numbers?`,
      a: `Where a ${single} has published a phone number it appears on its detail page, along with address, services and photos submitted by the community.`,
    },
    {
      q: `Can I rate a ${single} myself?`,
      a: `Yes. Open any ${single}'s page and leave a rating and comment. Your feedback helps other patients choose well and moves the ${single} up this ranking.`,
    },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const year = new Date().getFullYear();

  if ((BEST_FACILITY_KINDS as readonly string[]).includes(slug)) {
    const kind = slug as "hospital" | "pharmacy";
    const label = kindLabel(kind).toLowerCase();
    const title = `Best ${kindLabel(kind)} in Uganda (${year}): Top-Rated & Verified`;
    const description = `Discover the best ${label} in Uganda (${year}), ranked by real patient ratings. Compare top-rated facilities, read reviews and find contact details, free on ${SITE_NAME}.`;
    return {
      title,
      description,
      keywords: [
        `best ${label} in uganda`,
        `top ${label} uganda`,
        `${label} ratings uganda`,
        `best ${kind} in kampala`,
        `private ${label} in uganda`,
      ],
      alternates: { canonical: `/best/${kind}` },
      openGraph: {
        type: "website",
        title: `${title} · ${SITE_NAME}`,
        description,
        url: `${SITE_URL}/best/${kind}`,
      },
      twitter: { card: "summary_large_image", title, description },
    };
  }

  const counts = await getProfessionCounts();
  const prof = counts.find((c) => slugify(c.profession) === slug);
  if (!prof || !BEST_PROFESSIONS.includes(prof.profession)) {
    return { title: "Not found" };
  }
  const keyword = bestProfessionKeyword(prof.profession);
  const title = `Best ${keyword} in Uganda (${year}): Top-Rated & Licensed`;
  const description = `Meet the best ${keyword} in Uganda (${year}), ranked by verified patient ratings. Every profile shows council, registration number and licence status so you can book with confidence.`;
  return {
    title,
    description,
    keywords: [
      `best ${keyword} in uganda`,
      `top ${keyword} uganda`,
      `${keyword} ratings uganda`,
      `find a ${keyword.replace(/s$/, "")} uganda`,
      `licensed ${keyword} uganda`,
    ],
    alternates: { canonical: `/best/${slug}` },
    openGraph: {
      type: "website",
      title: `${title} · ${SITE_NAME}`,
      description,
      url: `${SITE_URL}/best/${slug}`,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BestSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const year = new Date().getFullYear();

  const data = (BEST_FACILITY_KINDS as readonly string[]).includes(slug)
    ? await getFacilityData(slug as "hospital" | "pharmacy")
    : await getProfessionData(slug);
  if (!data) notFound();

  const { isProfession, label, heading, practitioners, facilities, total } = data;
  const title = `Best ${heading} in Uganda (${year})`;
  const faqs = faqsFor(label, isProfession);
  const single = label.replace(/s$/, "");

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Best of Uganda", item: `${SITE_URL}/best` },
      { "@type": "ListItem", position: 3, name: title },
    ],
  };

  const itemLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    url: `${SITE_URL}/best/${slug}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: isProfession
        ? practitioners.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_URL}${practitionerUrl(p.id, p.name)}`,
          }))
        : facilities.map((f, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_URL}/facilities/${f.slug}`,
          })),
    },
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const intro = isProfession
    ? `Ranked by patient ratings and review count, these are the top-rated ${label} in Uganda right now. Every listing is drawn from the official register, and each profile shows the practitioner's council, registration number and licence status alongside their patient feedback.`
    : `Ranked by patient ratings and review count, these are the top-rated ${label} in Uganda right now. Each listing shows its location, patient rating and, where available, services and contact details, so you can compare before you visit.`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd([breadcrumbLd, itemLd, faqLd]) }}
      />

      <nav className="mb-6 text-xs text-slate-400 dark:text-slate-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href="/best" className="hover:text-emerald-700 dark:hover:text-emerald-400">Best of Uganda</Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-600 dark:text-slate-400">{title}</span>
      </nav>

      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-400">
          Patient-rated ranking
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{intro}</p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isProfession
          ? practitioners.map((p) => <PractitionerCard key={p.id} p={p} />)
          : facilities.map((f) => <FacilityCard key={f.id} facility={f} />)}
      </div>

      <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
        Showing the top {isProfession ? practitioners.length : facilities.length} of{" "}
        {total.toLocaleString()} ranked {label}.{" "}
        {isProfession ? (
          <Link
            href={`/practitioners/profession/${data.professionSlug}`}
            className="font-medium text-emerald-700 underline dark:text-emerald-400"
          >
            Browse all {label} in Uganda →
          </Link>
        ) : (
          <Link
            href={`/facilities?kind=${data.facilityKind}`}
            className="font-medium text-emerald-700 underline dark:text-emerald-400"
          >
            Browse all {label} in Uganda →
          </Link>
        )}
      </p>

      {/* Cross-links: city pages for facilities, sibling categories for professions */}
      <section className="mt-10 border-t border-slate-100 pt-6 dark:border-slate-800">
        <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {isProfession ? "Other categories" : `Best ${label} by city`}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {isProfession
            ? BEST_PROFESSIONS.filter((p) => slugify(p) !== slug).map((p) => (
                <Link
                  key={p}
                  href={`/best/${slugify(p)}`}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-400 dark:hover:text-emerald-400"
                >
                  Best {bestProfessionKeyword(p)} in Uganda
                </Link>
              ))
            : ["hospital", "pharmacy"]
                .filter((k) => k !== data.facilityKind)
                .map((k) => (
                  <Link
                    key={k}
                    href={`/best/${k}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-400 dark:hover:text-emerald-400"
                  >
                    Best {k === "hospital" ? "hospitals" : "pharmacies"} in Uganda
                  </Link>
                ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto mt-12 max-w-3xl border-t border-slate-100 pt-6 dark:border-slate-800">
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Frequently asked questions
        </h2>
        <div className="mt-4 space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900 marker:content-none dark:text-slate-100">
                {f.q}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <p className="mt-10 border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        Licensing data comes from the official Uganda registers. Ratings are community
        opinions and are not medical advice or an endorsement of any {single}.
      </p>
    </div>
  );
}
