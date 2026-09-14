import Link from "next/link";
import type { Practitioner } from "@/lib/types";
import { practitionerUrl } from "@/lib/practitioner-url";
import { Stars } from "./Stars";

function StatusBadge({ status }: { status: string | null }) {
  const active = status === "Active";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        active
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
          : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`}
      />
      {status ?? "Unknown"}
    </span>
  );
}

export function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
  return (
    <div className="grid size-full place-items-center bg-gradient-to-br from-emerald-500 to-teal-600 text-xl font-bold text-white">
      {initials}
    </div>
  );
}

export default function PractitionerCard({ p }: { p: Practitioner }) {
  return (
    <Link
      href={practitionerUrl(p.id, p.name)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-100 dark:bg-slate-800">
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.imageUrl}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-contain object-top"
          />
        ) : (
          <InitialsAvatar name={p.name} />
        )}
        <div className="absolute right-2 top-2">
          <StatusBadge status={p.licenceStatus} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="flex items-center gap-1.5 text-base font-semibold text-slate-900 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-400">
          <span className="min-w-0 truncate">{p.name}</span>
          {p.claimed && (
            <svg className="size-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <title>Verified profile</title>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">{p.council}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <Stars value={p.avgRating} count={p.ratingCount} size={14} />
          {p.licenseExpiryDate && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Exp {p.licenseExpiryDate}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
