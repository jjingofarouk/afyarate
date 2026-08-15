import Link from "next/link";
import type { Facility, FacilityKind } from "@/lib/types";
import { FACILITY_KIND_LABELS } from "@/lib/types";
import { Stars } from "./Stars";

export function FacilityKindBadge({ kind }: { kind: FacilityKind }) {
  const label = FACILITY_KIND_LABELS[kind].label;
  return (
    <span className="rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
      {label}
    </span>
  );
}

export function FacilityInitials({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
  return (
    <div className="grid size-full place-items-center bg-gradient-to-br from-sky-500 to-indigo-600 text-3xl font-bold text-white">
      {initials}
    </div>
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
          <FacilityInitials name={f.name} />
        )}
        <div className="absolute left-2 top-2">
          <FacilityKindBadge kind={f.kind} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-900 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-400">
          {f.name}
        </h3>
        <p className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
          {f.city ?? f.region ?? f.address}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <Stars value={f.avgRating} count={f.ratingCount} size={14} />
          {f.phone && (
            <span className="truncate text-[11px] text-slate-400 dark:text-slate-500">
              {f.phone}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
