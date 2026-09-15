import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getLicenses,
  getPractitioner,
  getProfileDetails,
  getRatings,
  parsePractitionerIdParam,
  practitionerUrl,
} from "@/lib/practitioners";
import { slugify } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";
import PractitionerPhotoCarousel from "@/components/PractitionerPhotoCarousel";
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
  const numId = parsePractitionerIdParam(id);
  if (numId == null) return { title: "Not found" };
  const p = await getPractitioner(numId);
  if (!p) return { title: "Not found" };
  const title = `${p.name}, ${p.council ?? "Health professional"}`;
  const description = `${p.name} (${p.council ?? "registered in Uganda"}). ${
    p.ratingCount > 0
      ? `Rated ${p.avgRating?.toFixed(1)}/5 from ${p.ratingCount} patient rating${p.ratingCount > 1 ? "s" : ""}.`
      : "Patient ratings and licence information."
  } Licence ${p.licenceStatus ?? "status"}, registration no. ${p.registrationNo ?? "n/a"}.`;
  const url = `${SITE_URL}${practitionerUrl(p.id, p.name)}`;
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

/** Placeholder shown for profile slots the practitioner hasn't filled in yet. */
function Missing() {
  return <span className="italic text-slate-400">Not shared yet</span>;
}

/** Turn a pasted social value into a link: full URLs pass through, @handles
 *  resolve against the network base, bare domains get https://. */
function normalizeHandle(value: string | null, base: string): string | null {
  if (!value) return null;
  const t = value.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith("@")) return `${base}${t.slice(1)}`;
  if (t.includes("/") || t.includes(".")) return `https://${t}`;
  return `${base}${t}`;
}

function normalizeUrl(value: string | null): string | null {
  if (!value) return null;
  const t = value.trim();
  if (!t) return null;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

function FacebookIcon() {
  return (
    <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8V11H8v3h2.5v7h3z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M17.8 4h2.7l-6 6.8L21.5 20h-5.6l-4.3-5.6L6.6 20H3.9l6.4-7.3L3.6 4h5.7l3.9 5.1L17.8 4zm-1 14.3h1.5L8.1 5.5H6.5l10.3 12.8z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M16.5 3c.4 2.3 1.9 3.8 4.2 4v3c-1.6 0-3-.5-4.2-1.3v6.1c0 3.4-2.6 6.2-6 6.2-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c.3 0 .7 0 1 .1v3.2c-.3-.1-.7-.2-1-.2-1.6 0-2.9 1.3-2.9 2.9s1.3 2.9 2.9 2.9 2.9-1.3 2.9-2.9V3h3.1z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="16.8" cy="7.2" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default async function PractitionerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = parsePractitionerIdParam(id);
  if (numId == null) notFound();
  // All four are keyed off the same id (no need to wait for practitioner to
  // resolve before starting the others), fetch in parallel.
  const [practitioner, licenses, ratings, details] = await Promise.all([
    getPractitioner(numId),
    getLicenses(numId),
    getRatings(numId),
    getProfileDetails(numId),
  ]);
  if (!practitioner) notFound();

  const active = practitioner.licenceStatus === "Active";
  const waDigits = details?.whatsapp?.replace(/\D/g, "");
  const firstName = practitioner.name.split(/\s+/)[0] ?? practitioner.name;
  const telHref = details?.phone ? `tel:${details.phone.replace(/\s/g, "")}` : null;
  const specialties = details?.specialties ?? [];
  const languages = details?.languages ?? [];
  // Carousel: claimant-uploaded photo first, then registry / licence photos.
  // getPractitioner() already prefers the claimed photo in imageUrl, so dedupe
  // to avoid showing the same face twice.
  const carouselPhotos = [
    details?.photoUrl,
    practitioner.imageUrl,
    ...licenses.map((l) => l.imageUrl),
  ].filter((u): u is string => Boolean(u));
  const photoList = [...new Set(carouselPhotos)];
  const socials = [
    { label: "Facebook", href: normalizeUrl(details?.facebook ?? null), Icon: FacebookIcon },
    { label: "X", href: normalizeHandle(details?.xHandle ?? null, "https://x.com/"), Icon: XIcon },
    { label: "TikTok", href: normalizeUrl(details?.tiktok ?? null), Icon: TikTokIcon },
    { label: "Instagram", href: normalizeUrl(details?.instagram ?? null), Icon: InstagramIcon },
  ];

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
    url: `${SITE_URL}${practitionerUrl(practitioner.id, practitioner.name)}`,
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
            <div
              className={
                practitioner.claimed
                  ? "bg-[repeating-linear-gradient(45deg,#fbbf24_0_8px,#022c22_8px_16px)] p-1"
                  : ""
              }
            >
              <div className="relative w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              <PractitionerPhotoCarousel photos={photoList} name={practitioner.name} />
              {practitioner.claimed && (
                <span
                  title="Verified profile"
                  aria-label="Verified profile"
                  className="contact-shake absolute bottom-3 right-3 drop-shadow-xl"
                >
                  <svg viewBox="0 0 100 100" className="size-20" role="img" aria-label="Verified stamp">
                    <defs>
                      <path
                        id="verified-stamp-circle"
                        d="M50,50 m-35,0 a35,35 0 1,1 70,0 a35,35 0 1,1 -70,0"
                        fill="none"
                      />
                      <clipPath id="verified-logo-clip">
                        <circle cx="50" cy="50" r="15" />
                      </clipPath>
                    </defs>
                    <circle cx="50" cy="50" r="48" fill="#fbbf24" />
                    <circle
                      cx="50"
                      cy="50"
                      r="48"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="27"
                      fill="none"
                      stroke="#064e3b"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />
                    <text
                      fontSize="14"
                      fontWeight="900"
                      fill="#064e3b"
                      letterSpacing="3"
                      style={{ textTransform: "uppercase" }}
                    >
                      <textPath href="#verified-stamp-circle" textLength="218">
                        VERIFIED • VERIFIED •
                      </textPath>
                    </text>
                    <circle cx="50" cy="50" r="16" fill="#ffffff" />
                    <g clipPath="url(#verified-logo-clip)">
                      <svg x="35" y="35" width="30" height="30" viewBox="360 250 560 660">
                        <image
                          href="/logo.png"
                          x="0"
                          y="0"
                          width="1280"
                          height="1280"
                          preserveAspectRatio="xMidYMid meet"
                        />
                      </svg>
                    </g>
                    <circle
                      cx="50"
                      cy="50"
                      r="16"
                      fill="none"
                      stroke="#064e3b"
                      strokeWidth="2.5"
                    />
                  </svg>
                </span>
              )}
              </div>
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
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {practitioner.name}
              </h1>
              {practitioner.claimed && (
                <span className="badge-dance inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-emerald-950 shadow">
                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Verified profile
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{practitioner.council}</p>

            <div className="mt-5">
              <ShareButtons title={practitioner.name} url={`${SITE_URL}${practitionerUrl(practitioner.id, practitioner.name)}`} />
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

          {/* Visit & fees — booking actions first, then the practical rows.
              Every slot always visible; paid values appear automatically. */}
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/30">
            <h2 className="text-sm font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
              Visit & fees
            </h2>
            {details?.phone || waDigits ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {telHref && (
                    <a
                      href={telHref}
                      className="cta-bob inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-3.5 text-base font-extrabold text-emerald-950 shadow-lg transition hover:bg-amber-300 sm:w-auto"
                    >
                      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h4.125a2.25 2.25 0 012.25 2.25v1.5M12 6.75V5.25A2.25 2.25 0 009.75 3h-1.5A2.25 2.25 0 006 5.25v13.5A2.25 2.25 0 008.25 21h4.125a2.25 2.25 0 002.25-2.25v-1.5m0-10.5h4.125c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125H14.25m-6 0V6.75" />
                      </svg>
                      Book {firstName}
                    </a>
                  )}
                  {details?.phone && (
                    <a
                      href={telHref ?? undefined}
                      className="contact-shake inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                    >
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                      Call {details.phone}
                    </a>
                  )}
                  {waDigits && (
                    <a
                      href={`https://wa.me/${waDigits}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ animationDelay: "0.45s" }}
                      className="contact-shake inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-95"
                    >
                      <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path d="M17.5 14.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.1 4.49.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.04 21.79h-.01a9.87 9.87 0 01-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 01-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.83 9.83 0 019.88 9.89c0 5.45-4.44 9.88-9.89 9.88m8.42-18.3A11.82 11.82 0 0012.04 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.9 11.9 0 005.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.16-3.48-8.41" />
                      </svg>
                      WhatsApp
                    </a>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-sm italic text-slate-500 dark:text-slate-400">
                  No contact details shared yet.
                </p>
              )}
              <dl className="mt-4 space-y-2.5">
                <div className="flex justify-between gap-4 border-b border-emerald-100 py-2 text-sm dark:border-emerald-900/40">
                  <dt className="shrink-0 text-slate-500 dark:text-slate-400">Consultation fee</dt>
                  <dd className="text-right font-medium text-slate-800 dark:text-slate-200">
                    {details?.consultationFee ?? <Missing />}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-emerald-100 py-2 text-sm dark:border-emerald-900/40">
                  <dt className="shrink-0 text-slate-500 dark:text-slate-400">Availability</dt>
                  <dd className="text-right font-medium text-slate-800 dark:text-slate-200">
                    {details?.availability ?? <Missing />}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-emerald-100 py-2 text-sm dark:border-emerald-900/40">
                  <dt className="shrink-0 text-slate-500 dark:text-slate-400">Workplace</dt>
                  <dd className="text-right font-medium text-slate-800 dark:text-slate-200">
                    {details?.workplace ?? <Missing />}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-2 text-sm">
                  <dt className="shrink-0 text-slate-500 dark:text-slate-400">Address</dt>
                  <dd className="text-right font-medium text-slate-800 dark:text-slate-200">
                    {details?.workAddress ?? <Missing />}
                  </dd>
                </div>
              </dl>
            </div>

          {/* About — bio, specialties, languages. */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-50">
              About {firstName}
            </h2>
            {details?.bio ? (
              <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {details.bio}
              </p>
            ) : (
              <p className="mt-3 text-sm italic text-slate-400">No bio shared yet.</p>
            )}
            <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Specialties
            </h3>
            {specialties.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {specialties.map((s) => (
                  <span key={s} className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm italic text-slate-400">Not shared yet</p>
            )}
            <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Languages
            </h3>
            {languages.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {languages.map((s) => (
                  <span key={s} className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-800 dark:bg-sky-900/50 dark:text-sky-300">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm italic text-slate-400">Not shared yet</p>
            )}
          </div>

          {/* Online — website plus every social slot, present or not. */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Online
            </h2>
            <div className="mt-3 flex justify-between gap-4 border-b border-slate-100 py-2 text-sm dark:border-slate-800">
              <span className="shrink-0 text-slate-500 dark:text-slate-400">Website</span>
              {details?.website ? (
                <a href={normalizeUrl(details.website) ?? details.website} target="_blank" rel="noopener noreferrer" className="truncate text-right font-medium text-emerald-700 underline dark:text-emerald-400">
                  {details.website}
                </a>
              ) : (
                <Missing />
              )}
            </div>
            {socials.map(({ label, href, Icon }) => (
              <div key={label} className="flex items-center justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-0 dark:border-slate-800">
                <span className="inline-flex shrink-0 items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Icon />
                  {label}
                </span>
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="truncate font-medium text-emerald-700 underline dark:text-emerald-400">
                    {href.replace(/^https?:\/\//, "").slice(0, 32)}
                  </a>
                ) : (
                  <Missing />
                )}
              </div>
            ))}
            {!practitioner.claimed && (
              <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
                Is this you, {firstName}?{" "}
                <Link href="/claim" className="font-semibold text-emerald-700 underline dark:text-emerald-400">
                  Claim this profile
                </Link>{" "}
                to add your photo, fees, availability, specialties and socials.
              </p>
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
