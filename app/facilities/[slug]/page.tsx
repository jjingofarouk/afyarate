import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFacility, getFacilityRatings } from "@/lib/facilities";
import { FACILITY_KIND_LABELS, type Facility } from "@/lib/types";
import { FacilityKindBadge, FacilityInitials } from "@/components/FacilityCard";
import { Stars } from "@/components/Stars";
import FacilityRatingForm from "@/components/FacilityRatingForm";
import ShareButtons from "@/components/ShareButtons";
import { Star } from "@/components/StarIcon";
import { FadeIn } from "@/components/motion/FadeIn";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const f = await getFacility(slug);
  if (!f) return { title: "Not found" };
  const kind = FACILITY_KIND_LABELS[f.kind].label;
  const title = `${f.name} — ${kind} in ${f.city ?? "Uganda"}`;
  const description = `${f.name}, a ${kind.toLowerCase()} ${
    f.city ? `in ${f.city}` : "in Uganda"
  }. ${
    f.ratingCount > 0
      ? `Rated ${f.avgRating?.toFixed(1)}/5 from ${f.ratingCount} patient rating${f.ratingCount > 1 ? "s" : ""}.`
      : "Patient ratings, contact details and location."
  }`;
  const url = `${SITE_URL}/facilities/${f.slug}`;
  const image = f.imageUrl || `${SITE_URL}/logo.png`;

  return {
    title,
    description,
    keywords: [f.name, f.city, f.specialties, "Uganda", "hospital rating", "pharmacy rating"].filter(
      (v): v is string => Boolean(v),
    ),
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [image],
    },
  };
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 text-sm dark:border-slate-800">
      <dt className="shrink-0 text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-right font-medium text-slate-800 dark:text-slate-200">{value}</dd>
    </div>
  );
}

/** Postgres returns timestamptz with an explicit UTC offset already — parse as-is. */
function formatRatingDate(iso: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Escape "<" so user-submitted text can't break out of the JSON-LD <script> tag. */
function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Schema.org type per facility kind — Hospitals and Pharmacies get distinct rich results. */
function facilitySchemaType(f: Facility): string {
  return f.kind === "hospital" ? "Hospital" : "Pharmacy";
}

function facilitySchema(f: Facility, ratings: Awaited<ReturnType<typeof getFacilityRatings>>) {
  const city = f.city ?? undefined;
  const region = f.region ?? undefined;
  const street = f.address ?? undefined;
  return {
    "@context": "https://schema.org",
    "@type": facilitySchemaType(f),
    name: f.name,
    url: `${SITE_URL}/facilities/${f.slug}`,
    image: f.imageUrl || `${SITE_URL}/logo.png`,
    ...(f.address ? { address: { "@type": "PostalAddress", streetAddress: street, addressLocality: city, addressRegion: region, addressCountry: "UG" } } : {}),
    ...(f.phone ? { telephone: f.phone } : {}),
    ...(f.specialties ? { medicalSpecialty: f.specialties } : {}),
    ...(f.sourceUrl ? { sameAs: f.sourceUrl } : {}),
    ...(f.ratingCount > 0 && f.avgRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: f.avgRating,
            reviewCount: f.ratingCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    ...(ratings.length > 0
      ? {
          review: ratings.slice(0, 20).map((r) => ({
            "@type": "Review",
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.rating,
              bestRating: 5,
              worstRating: 1,
            },
            author: { "@type": "Person", name: r.reviewerName || "Anonymous" },
            ...(r.comment ? { reviewBody: r.comment } : {}),
            ...(formatRatingDate(r.createdAt) ? { datePublished: r.createdAt } : {}),
          })),
        }
      : {}),
  };
}

export default async function FacilityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const facility = await getFacility(slug);
  if (!facility) notFound();

  const ratings = await getFacilityRatings(facility.id);
  const kind = FACILITY_KIND_LABELS[facility.kind];

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Facilities", item: `${SITE_URL}/facilities` },
      { "@type": "ListItem", position: 3, name: kind.label, item: `${SITE_URL}/facilities?kind=${facility.kind}` },
      { "@type": "ListItem", position: 4, name: facility.name },
    ],
  };

  const jsonLd = facilitySchema(facility, ratings);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd([breadcrumbLd, jsonLd]) }}
      />

      <nav className="mb-6 text-xs text-slate-400 dark:text-slate-500">
        <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href="/facilities" className="hover:text-emerald-700 dark:hover:text-emerald-400">Facilities</Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-600 dark:text-slate-400">{kind.label}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: photo + summary */}
        <FadeIn className="lg:col-span-1">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              {facility.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={facility.imageUrl}
                  alt={facility.name}
                  className="h-full w-full object-cover object-center"
                />
              ) : (
                <FacilityInitials name={facility.name} />
              )}
              <div className="absolute left-2 top-2">
                <FacilityKindBadge kind={facility.kind} />
              </div>
            </div>
            <div className="p-5">
              <div className="mt-1 flex items-center gap-2">
                <span className="flex text-amber-400">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={18}
                      filled={n <= Math.round(facility.avgRating ?? 0)}
                    />
                  ))}
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {facility.avgRating ? facility.avgRating.toFixed(1) : "No ratings yet"}
                </span>
                {facility.ratingCount > 0 && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    ({facility.ratingCount} rating
                    {facility.ratingCount > 1 ? "s" : ""})
                  </span>
                )}
              </div>

              {facility.phone && (
                <a
                  href={`tel:${facility.phone.replace(/[^+\d]/g, "")}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  {facility.phone}
                </a>
              )}
            </div>
          </div>
        </FadeIn>

        {/* Right: details */}
        <FadeIn delay={0.1} className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {facility.name}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {kind.label}
              {facility.city ? ` · ${facility.city}` : ""}
              {facility.region ? `, ${facility.region}` : ""}
            </p>

            <div className="mt-5">
              <ShareButtons title={facility.name} url={`${SITE_URL}/facilities/${facility.slug}`} />
            </div>

            <dl className="mt-4">
              <Field label="Address" value={facility.address} />
              <Field label="Phone" value={facility.phone} />
              <Field label="Specialties" value={facility.specialties} />
            </dl>

            {facility.description && facility.description !== "N/A" && (
              <div className="mt-5">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  About
                </h2>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {facility.description}
                </p>
              </div>
            )}

            {facility.sourceUrl && (
              <p className="mt-5 text-xs text-slate-400 dark:text-slate-500">
                Source:{" "}
                <a
                  href={facility.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 underline dark:text-emerald-400"
                >
                  Uganda Healthcare Directory
                </a>
              </p>
            )}
          </div>

          {/* Ratings */}
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <FacilityRatingForm facilityId={facility.id} />

            <div>
              <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
                Patient ratings ({ratings.length})
              </h2>
              {ratings.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                  No ratings yet. Be the first to share your experience.
                </p>
              ) : (
                <ul className="space-y-3">
                  {ratings.map((r) => {
                    const dateLabel = formatRatingDate(r.createdAt);
                    return (
                      <li
                        key={r.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="flex items-center justify-between">
                          <Stars value={r.rating} size={14} />
                          {dateLabel && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">{dateLabel}</span>
                          )}
                        </div>
                        {r.comment && (
                          <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                            {r.comment}
                          </p>
                        )}
                        <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                          {r.reviewerName ?? "Anonymous"}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </FadeIn>
      </div>

      <p className="mt-10 text-center text-sm text-slate-500 dark:text-slate-400">
        Looking for more?{" "}
        <Link href="/facilities" className="text-emerald-700 underline dark:text-emerald-400">
          Browse all hospitals &amp; pharmacies
        </Link>{" "}
        or{" "}
        <Link href={`/facilities?kind=${facility.kind}`} className="text-emerald-700 underline dark:text-emerald-400">
          more {kind.plural.toLowerCase()}
        </Link>
        .
      </p>
    </div>
  );
}
