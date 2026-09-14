import Link from "next/link";
import { getFeaturedVerifiedPractitioner } from "@/lib/practitioners";
import { InitialsAvatar } from "../PractitionerCard";
import { Star } from "../StarIcon";

/**
 * Conspicuous home-page spotlight for one featured verified (claimed)
 * practitioner: photo, verified badge, licence status and rating, with a
 * contact CTA (call/WhatsApp deep links) and a "verify this profile" CTA
 * driving to the rating form. Full-width gradient band, stacked full-width
 * buttons on phones, side-by-side on desktop. Renders nothing when the
 * registry has no spotlightable profile.
 */
export default async function FeaturedVerifiedProfile() {
  const featured = await getFeaturedVerifiedPractitioner().catch(() => null);
  if (!featured) return null;
  const { practitioner: p, details } = featured;

  const firstName = p.name.split(/\s+/)[0] ?? p.name;
  const waDigits = details?.whatsapp?.replace(/\D/g, "");
  const active = p.licenceStatus === "Active";

  return (
    <section
      aria-label="Featured verified health worker"
      className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 dark:from-emerald-900 dark:via-emerald-950 dark:to-teal-950"
    >
      {/* decorative glow orbs */}
      <div aria-hidden className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-amber-400/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 size-80 rounded-full bg-teal-300/20 blur-3xl" />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 text-center sm:py-12 md:flex-row md:gap-10 md:text-left">
        {/* Photo with pulsing live ring */}
        <div className="relative shrink-0">
          <span aria-hidden className="absolute -inset-1.5 animate-ping rounded-full bg-amber-400/40 [animation-duration:2s]" />
          <div className="relative size-32 overflow-hidden rounded-full bg-white/10 ring-4 ring-amber-400 sm:size-36 md:size-44">
            {p.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.imageUrl}
                alt={p.name}
                loading="lazy"
                className="size-full object-cover object-top"
              />
            ) : (
              <InitialsAvatar name={p.name} />
            )}
          </div>
          <span className="badge-dance absolute -bottom-1 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-amber-400 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-emerald-950 shadow-lg">
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Verified
          </span>
        </div>

        {/* Copy + CTAs */}
        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-amber-300">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-amber-400" />
            </span>
            Featured verified profile
          </p>

          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            {p.name}
          </h2>
          <p className="mt-1 text-sm font-medium text-emerald-100">
            {[p.profession, p.council].filter(Boolean).join(" · ")}
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                active ? "bg-emerald-400/20 text-emerald-100 ring-1 ring-emerald-300/40" : "bg-white/10 text-slate-200"
              }`}
            >
              Licence {p.licenceStatus ?? "Unknown"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
              <span className="flex text-amber-300">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={12} filled={n <= Math.round(p.avgRating ?? 0)} />
                ))}
              </span>
              {p.avgRating ? `${p.avgRating.toFixed(1)} (${p.ratingCount})` : "No ratings yet. Be the first"}
            </span>
          </div>

          {p.qualifications && (
            <p className="mx-auto mt-3 line-clamp-2 max-w-xl text-sm leading-relaxed text-emerald-50/90 md:mx-0">
              {p.qualifications}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 md:justify-start">
            {details?.phone && (
              <a
                href={`tel:${details.phone.replace(/\s/g, "")}`}
                className="cta-bob inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-emerald-900 shadow transition hover:bg-emerald-50"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden>
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
                style={{ animationDelay: "0.3s" }}
                className="cta-bob inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white shadow transition hover:brightness-95"
              >
                <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M17.5 14.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.1 4.49.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.04 21.79h-.01a9.87 9.87 0 01-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 01-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.83 9.83 0 019.88 9.89c0 5.45-4.44 9.88-9.89 9.88m8.42-18.3A11.82 11.82 0 0012.04 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.9 11.9 0 005.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.16-3.48-8.41" />
                </svg>
                WhatsApp {firstName}
              </a>
            )}
            <Link
              href="/claim"
              style={{ animationDelay: "0.6s" }}
              className="cta-bob inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-emerald-950 shadow transition hover:bg-amber-300"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M12 21a16.8 16.8 0 01-7.18-3.33A16.1 16.1 0 012.25 6.54l.07-.03A16.1 16.1 0 0112 3c2.7 0 5.2.82 7.18 2.34l.07.03a16.1 16.1 0 01-2.57 11.13A16.8 16.8 0 0112 21z" />
              </svg>
              Verify your own profile
            </Link>
            <Link
              href={`/practitioners/${p.id}#verify`}
              style={{ animationDelay: "0.9s" }}
              className="cta-bob inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-bold text-white shadow transition hover:bg-sky-400"
            >
              <Star size={16} filled />
              Rate {firstName}
            </Link>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 md:justify-start">
            <Link
              href={`/practitioners/${p.id}`}
              className="text-sm font-semibold text-amber-300 underline-offset-4 hover:underline"
            >
              View full profile →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
