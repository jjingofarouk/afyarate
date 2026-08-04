import Link from "next/link";
import type { Practitioner } from "@/lib/types";
import { Stars } from "./Stars";

function StatusBadge({ status }: { status: string | null }) {
  const active = status === "Active";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        active
          ? "bg-emerald-100 text-emerald-800"
          : "bg-slate-200 text-slate-600"
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
      href={`/practitioners/${p.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-44 overflow-hidden bg-slate-100">
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.imageUrl}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <InitialsAvatar name={p.name} />
        )}
        <div className="absolute right-2 top-2">
          <StatusBadge status={p.licenceStatus} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="text-base font-semibold text-slate-900 group-hover:text-emerald-700">
          {p.name}
        </h3>
        <p className="text-xs text-slate-500">{p.council}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <Stars value={p.avgRating} count={p.ratingCount} size={14} />
          {p.licenseExpiryDate && (
            <span className="text-[11px] text-slate-400">
              Exp {p.licenseExpiryDate}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
