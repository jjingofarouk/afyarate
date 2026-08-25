import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getLicenses,
  getPractitioner,
  getRatings,
} from "@/lib/practitioners";
import { slugify } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";
import { InitialsAvatar } from "@/components/PractitionerCard";
import { Stars } from "@/components/Stars";
import RatingForm from "@/components/RatingForm";
import ShareButtons from "@/components/ShareButtons";
import { Star } from "@/components/StarIcon";
import { FadeIn } from "@/components/motion/FadeIn";
import { ClaimCard, ClaimStrip } from "@/components/ClaimProfileCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = await getPractitioner(Number(id));
  if (!p) return { title: "Not found" };
  const title = `${p.name}, ${p.council ?? "Health professional"}`;
  const description = `${p.name} (${p.council ?? "registered in Uganda"}). ${
    p.ratingCount > 0
      ? `Rated ${p.avgRating?.toFixed(1)}/5 from ${p.ratingCount} patient rating${p.ratingCount > 1 ? "s" : ""}.`
      : "Patient ratings and licence information."
  } Licence ${p.licenceStatus ?? "status"}, registration no. ${p.registrationNo ?? "n/a"}.`;
  const url = `${SITE_URL}/practitioners/${p.id}`;
  const image = p.imageUrl || `${SITE_URL}/logo.png`;

  return {
    title,
    description,
    keywords: [p.name, p.council, "Uganda", "health worker rating", "licensed practitioner"].filter(
      (v): v is string => Boolean(v),
    ),
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
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

/** Postgres returns timestamptz with an explicit UTC offset already, parse as-is. */
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

/** Doctors and dentists get schema.org's dedicated person types; every other
 *  cadre (nurse, pharmacist, clinical officer, allied health...) has no
 *  matching schema.org type, so it falls back to Person + jobTitle rather
 *  than the inaccurate "everyone is a Physician" markup this used to emit. */
function practitionerSchemaType(profession: string | null): string {
  if (profession === "Doctor") return "Physician";
  if (profession === "Dentist") return "Dentist";
  return "Person";
}

export default async function PractitionerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  // All three are keyed off the same id (no need to wait for practitioner to
  // resolve before starting the other two), fetch in parallel.
  const [practitioner, licenses, ratings] = await Promise.all([
    getPractitioner(numId),
    getLicenses(numId),
    getRatings(numId),
  ]);
  if (!practitioner) notFound();

  const active = practitioner.licenceStatus === "Active";

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Practitioners", item: `${SITE_URL}/practitioners` },
      ...(practitioner.profession
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: `${practitioner.profession}s`,
              item: `${SITE_URL}/practitioners/profession/${slugify(practitioner.profession)}`,
            },
          ]
        : []),
      { "@type": "ListItem", position: practitioner.profession ? 4 : 3, name: practitioner.name },
    ],
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": practitionerSchemaType(practitioner.profession),
    name: practitioner.name,
    url: `${SITE_URL}/practitioners/${practitioner.id}`,
    image: practitioner.imageUrl || `${SITE_URL}/logo.png`,
    ...(practitioner.profession ? { jobTitle: practitioner.profession } : {}),
    ...(practitioner.council
      ? { memberOf: { "@type": "MedicalOrganization", name: practitioner.council } }
      : {}),
    ...(practitioner.registrationNo
      ? {
          identifier: {
            "@type": "PropertyValue",
            name: "Registration No.",
            value: practitioner.registrationNo,
          },
        }
      : {}),
    ...(practitioner.qualifications
      ? {
          hasCredential: {
            "@type": "EducationalOccupationalCredential",
            credentialCategory: practitioner.qualifications,
          },
        }
      : {}),
    ...(practitioner.ratingCount > 0 && practitioner.avgRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: practitioner.avgRating,
            reviewCount: practitioner.ratingCount,
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd([breadcrumbLd, jsonLd]) }}
      />

      <nav className="mb-6 text-xs text-slate-400 dark:text-slate-500">
        <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href="/practitioners" className="hover:text-emerald-700 dark:hover:text-emerald-400">
          Practitioners
        </Link>
        {practitioner.profession && (
          <>
            <span className="mx-1.5">/</span>
            <Link
              href={`/practitioners/profession/${slugify(practitioner.profession)}`}
              className="hover:text-emerald-700 dark:hover:text-emerald-400"
            >
              {practitioner.profession}s
            </Link>
          </>
        )}
        <span className="mx-1.5">/</span>
        <span className="text-slate-600 dark:text-slate-400">{practitioner.name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: photo + summary */}
        <FadeIn className="lg:col-span-1">
          <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="aspect-[3/4] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              {practitioner.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={practitioner.imageUrl}
                  alt={practitioner.name}
                  className="h-full w-full object-contain object-top"
                />
              ) : (
                <InitialsAvatar name={practitioner.name} />
              )}
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    active
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                      : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  Licence {practitioner.licenceStatus ?? "Unknown"}
                </span>
                {practitioner.recordCount > 1 && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {practitioner.recordCount} licence records
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span className="flex text-amber-400">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={18}
                      filled={n <= Math.round(practitioner.avgRating ?? 0)}
                    />
                  ))}
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {practitioner.avgRating ? practitioner.avgRating.toFixed(1) : "No ratings yet"}
                </span>
                {practitioner.ratingCount > 0 && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    ({practitioner.ratingCount} rating
                    {practitioner.ratingCount > 1 ? "s" : ""})
                  </span>
                )}
              </div>
            </div>
          </div>
          {!practitioner.claimed && <ClaimCard name={practitioner.name} />}
          </div>
        </FadeIn>

        {/* Right: details */}
        <FadeIn delay={0.1} className="lg:col-span-2">
          {!practitioner.claimed && <ClaimStrip name={practitioner.name} />}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {practitioner.name}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{practitioner.council}</p>

            <div className="mt-5">
              <ShareButtons title={practitioner.name} url={`${SITE_URL}/practitioners/${practitioner.id}`} />
            </div>

            <dl className="mt-4">
              <Field
                label="Registration status"
                value={practitioner.registrationStatus}
              />
              <Field label="Registration No." value={practitioner.registrationNo} />
              <Field
                label="Registration date"
                value={practitioner.registrationDate}
              />
              <Field label="Licence number" value={practitioner.licenseNumber} />
              <Field
                label="Licence expiry"
                value={practitioner.licenseExpiryDate}
              />
            </dl>

            {practitioner.qualifications && (
              <div className="mt-5">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Qualifications
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {practitioner.qualifications}
                </p>
              </div>
            )}
          </div>

          {/* Licence history */}
          {licenses.length > 1 && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Licence history ({licenses.length})
              </h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      <th className="py-2 pr-3">Licence No.</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Expiry</th>
                      <th className="py-2">Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {licenses.map((l) => (
                      <tr key={l.id} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-2 pr-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                          {l.licenseNumber}
                        </td>
                        <td className="py-2 pr-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              l.licenceStatus === "Active"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                                : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {l.licenceStatus}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-slate-600 dark:text-slate-400">
                          {l.licenseExpiryDate}
                        </td>
                        <td className="py-2 text-slate-600 dark:text-slate-400">
                          {l.registrationDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ratings */}
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <RatingForm practitionerId={practitioner.id} />

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
    </div>
  );
}
