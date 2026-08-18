import Link from "next/link";
import type { Practitioner } from "@/lib/types";
import { Stars } from "../Stars";
import { InitialsAvatar } from "../PractitionerCard";

/**
 * Card for the home page's "Top-rated health workers" section. Emphasises the
 * star rating (the whole point of the section) ahead of the licence details
 * shown on the fuller PractitionerCard.
 */
export default function RatedPractitionerCard({ p }: { p: Practitioner }) {
  const active = p.licenceStatus === "Active";
  return (
    <Link
      href={`/practitioners/${p.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-amber-200/70 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md dark:border-amber-900/50 dark:bg-slate-900 dark:hover:border-amber-500"
    >
      <div className="flex items-center gap-4 p-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-2 ring-amber-200 dark:bg-slate-800 dark:ring-amber-900">
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.imageUrl}
              alt={p.name}
              loading="lazy"
              className="size-full object-contain object-top"
            />
          ) : (
            <InitialsAvatar name={p.name} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-sm font-semibold text-slate-900 group-hover:text-amber-700 dark:text-slate-100 dark:group-hover:text-amber-400">
            {p.name}
          </p>
          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
            {p.profession ?? p.council}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
            active
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          {active ? "Licensed" : p.licenceStatus ?? "Unknown"}
        </span>
      </div>

      <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2">
          <Stars value={p.avgRating} count={p.ratingCount} size={16} />
          <span className="text-xs font-medium text-amber-700 group-hover:underline dark:text-amber-400">
            View profile →
          </span>
        </div>
      </div>
    </Link>
  );
}