import Link from "next/link";
import type { Facility, FacilityKind } from "@/lib/types";
import { FACILITY_KIND_LABELS } from "@/lib/types";
import { Stars } from "./Stars";

export function FacilityKindBadge({ kind }: { kind: FacilityKind }) {
  const label = FACILITY_KIND_LABELS[kind].label;
  return (
    <span className="rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
      {label}
    </span>
  );
}

// Clean Unsplash placeholders for facilities without their own photo.
// Deterministic per facility (by id) so cards don't all show the same frame.
const HOSPITAL_PHOTOS = [
  "1586773860418-d37222d8fce3", // hospital building exterior
  "1519494026892-80bbd2d6fd0d", // hospital corridor
];
const PHARMACY_PHOTOS = [
  "1631549916768-4119b2e5f926", // pharmacy blister packs
  "1587854692152-cbe660dbde88", // pharmacy shelves
];

export function facilityFallbackUrl(f: Pick<Facility, "id" | "kind">): string {
  const pool = f.kind === "pharmacy" ? PHARMACY_PHOTOS : HOSPITAL_PHOTOS;
  const photo = pool[Math.abs(Number(f.id)) % pool.length];
  return `https://images.unsplash.com/photo-${photo}?w=800&q=70&auto=format&fit=crop`;
}

export function FacilityFallbackPhoto({ facility: f }: { facility: Facility }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={facilityFallbackUrl(f)}
      alt=""
      aria-hidden
      loading="lazy"
      className="h-full w-full object-cover"
    />
  );
}

export default function FacilityCard({ facility: f }: { facility: Facility }) {
  return (
    <Link
      href={`/facilities/${f.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
        {f.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={f.imageUrl}
            alt={f.name}
            loading="lazy"
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <FacilityFallbackPhoto facility={f} />
        )}
        <div className="absolute left-2 top-2 flex gap-1.5">
          <FacilityKindBadge kind={f.kind} />
          {f.claimed && (
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">
              ✓ Verified
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-2 flex items-start gap-1.5 text-base font-semibold leading-snug text-slate-900 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-400">
          <span className="min-w-0">{f.name}</span>
          {f.claimed && (
            <svg className="mt-0.5 size-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-label="Verified facility">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </h3>
        <p className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
          {f.city ?? f.region ?? f.address}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <Stars value={f.avgRating} count={f.ratingCount} size={14} />
          {f.phone && (
            <span className="truncate text-xs text-slate-400 dark:text-slate-500">
              {f.phone}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
