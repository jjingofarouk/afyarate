import type { AmbulanceProvider } from "@/lib/ambulances";

function PhoneIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  );
}

export default function AmbulanceCard({ provider }: { provider: AmbulanceProvider }) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">{provider.name}</h3>
        {provider.featured && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
            Featured
          </span>
        )}
      </div>
      {(provider.city || provider.coverageArea) && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {provider.city}
          {provider.coverageArea ? ` · Covers ${provider.coverageArea}` : ""}
        </p>
      )}

      {provider.description && (
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {provider.description}
        </p>
      )}

      {provider.vehicleTypes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {provider.vehicleTypes.map((v) => (
            <span
              key={v}
              className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800 dark:bg-red-950/40 dark:text-red-300"
            >
              {v}
            </span>
          ))}
        </div>
      )}

      {provider.services.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {provider.services.map((s) => (
            <span
              key={s}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
        <a
          href={`tel:${provider.phone.replace(/[^+\d]/g, "")}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
        >
          <PhoneIcon />
          {provider.phone}
        </a>
        {provider.altPhone && (
          <a
            href={`tel:${provider.altPhone.replace(/[^+\d]/g, "")}`}
            className="text-sm text-slate-500 hover:underline dark:text-slate-400"
          >
            {provider.altPhone}
          </a>
        )}
      </div>
    </div>
  );
}
