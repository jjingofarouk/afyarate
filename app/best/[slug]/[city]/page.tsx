import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import FacilityCard from "@/components/FacilityCard";
import { BEST_CITIES, BEST_FACILITY_KINDS } from "@/lib/best-pages";
import { searchFacilities } from "@/lib/facilities";
import { slugify } from "@/lib/posts";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Escape "<" so user-submitted text can't break out of the JSON-LD <script> tag. */
function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

const kindLabel = (kind: "hospital" | "pharmacy") =>
  kind === "hospital" ? "Hospitals" : "Pharmacies";

function faqsFor(kind: "hospital" | "pharmacy", city: string) {
  const plural = kindLabel(kind).toLowerCase();
  return [
    {
      q: `Which are the best ${plural} in ${city}?`,
      a: `The ${plural} on this page are located in or around ${city} and have the most patient ratings and highest average scores on ${SITE_NAME}. Each listing shows its location and rating so you can compare before you visit.`,
    },
    {
      q: `How is "best" decided?`,
      a: `Rankings combine review volume and average star rating from patients who have used the ${kind}. Anyone who has visited can leave a rating, and each review is marked as verified or unverified.`,
    },
    {
      q: `Do these ${plural} have contact numbers?`,
      a: `Where a ${kind} has published a phone number it appears on its detail page, along with address, services and community-submitted photos.`,
    },
    {
      q: `Can I rate a ${kind} in ${city}?`,
      a: `Yes. Open the ${kind}'s page and leave a rating and comment. Patient feedback moves well-rated ${plural} up the ${city} ranking.`,
    },
  ];
}

async function getCityPageData(kind: "hospital" | "pharmacy", city: string) {
  // Accept a slug match on the city names actually present in the DB; this
  // keeps the curated BEST_CITIES list honest (unknown city → 404).
  const probe = await searchFacilities({ kind, sort: "rating", page: 1, pageSize: 1 });
  const cityLabel = probe.cities.find((c) => slugify(c) === city);
  if (!cityLabel) return null;
  const result = await searchFacilities({
    kind,
    city: cityLabel,
    sort: "rating",
    page: 1,
    pageSize: 24,
  });
  return { kind, cityLabel, result };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; city: string }>;
}): Promise<Metadata> {
  const { slug, city } = await params;
  // Only hospital/pharmacy slugs are valid here; profession slugs are handled
  // by the sibling [slug] page, and a two-segment path like /best/doctor/kampala
  // must not render as a city page.
  if (!(BEST_FACILITY_KINDS as readonly string[]).includes(slug)) {
    return { title: "Not found" };
  }
  const kind = slug as "hospital" | "pharmacy";
  const k = kind;
  const cityLabel =
    BEST_CITIES.find((c) => c.slug === city)?.label ??
    city.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const plural = kindLabel(k).toLowerCase();
  const year = new Date().getFullYear();
  const title = `Best ${plural} in ${cityLabel}, Uganda (${year})`;
  const description = `Compare the best ${plural} in ${cityLabel}, Uganda (${year}), ranked by real patient ratings. See top-rated facilities near you, read reviews and get contact details, free on ${SITE_NAME}.`;
  return {
    title,
    description,
    keywords: [
      `best ${plural} in ${cityLabel.toLowerCase()}`,
      `${plural} in ${cityLabel.toLowerCase()} uganda`,
      `top rated ${kind} ${cityLabel.toLowerCase()}`,
      `best ${kind} near me ${cityLabel.toLowerCase()}`,
      `${plural} ratings ${cityLabel.toLowerCase()}`,
    ],
    alternates: { canonical: `/best/${kind}/${city}` },
    openGraph: {
      type: "website",
      title: `${title} · ${SITE_NAME}`,
      description,
      url: `${SITE_URL}/best/${kind}/${city}`,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BestCityPage({
  params,
}: {
  params: Promise<{ slug: string; city: string }>;
}) {
  const { slug, city } = await params;
  if (!(BEST_FACILITY_KINDS as readonly string[]).includes(slug)) notFound();
  const kind = slug as "hospital" | "pharmacy";

  const data = await getCityPageData(kind, city);
  if (!data) notFound();

  const k = kind;
  const { cityLabel, result } = data;
  const plural = kindLabel(k).toLowerCase();
  const year = new Date().getFullYear();
  const title = `Best ${plural} in ${cityLabel} (${year})`;
  const faqs = faqsFor(k, cityLabel);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Best of Uganda", item: `${SITE_URL}/best` },
      {
        "@type": "ListItem",
        position: 3,
        name: `Best ${kindLabel(k)} in Uganda`,
        item: `${SITE_URL}/best/${kind}`,
      },
      { "@type": "ListItem", position: 4, name: title },
    ],
  };

  const itemLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    url: `${SITE_URL}/best/${kind}/${city}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: result.items.map((f, i) => ({
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
        <Link href={`/best/${kind}`} className="hover:text-emerald-700 dark:hover:text-emerald-400">
          Best {kindLabel(k)} in Uganda
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-600 dark:text-slate-400">{cityLabel}</span>
      </nav>

      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-400">
          Local ranking
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          The top-rated {plural} in {cityLabel}, Uganda, ranked by patient ratings and
          review count. Each listing shows its location, patient rating and, where
          available, services and contact details, so you can compare before you visit.
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {result.items.map((f) => (
          <FacilityCard key={f.id} facility={f} />
        ))}
      </div>

      {result.items.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          No rated {plural} in {cityLabel} yet.{" "}
          <Link
            href={`/facilities/${kind}/${city}`}
            className="text-emerald-700 underline dark:text-emerald-400"
          >
            Browse all {plural} in {cityLabel}
          </Link>{" "}
          instead.
        </p>
      ) : (
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          Showing the top {result.items.length} of {result.total.toLocaleString()} {plural} in{" "}
          {cityLabel}.{" "}
          <Link
            href={`/facilities/${kind}/${city}`}
            className="font-medium text-emerald-700 underline dark:text-emerald-400"
          >
            Browse all {plural} in {cityLabel} →
          </Link>
        </p>
      )}

      {/* Cross-links */}
      <section className="mt-10 border-t border-slate-100 pt-6 dark:border-slate-800">
        <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Best {plural} in other cities
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {BEST_CITIES.filter((c) => c.slug !== city).map((c) => (
            <Link
              key={c.slug}
              href={`/best/${kind}/${c.slug}`}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-400 dark:hover:text-emerald-400"
            >
              Best {plural} in {c.label}
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
        opinions and are not medical advice or an endorsement.
      </p>
    </div>
  );
}
