"use client";

import { useMemo, useState } from "react";
import {
  HOSPITAL_SERVICE_GROUPS,
  PHARMACY_SERVICE_GROUPS,
  SERVICE_COLOR_CLASSES,
  type ServiceGroup,
} from "@/lib/facilityServices";

const INITIAL_SHOW = 12;

export default function ServicePicker({
  kind,
  selected,
  onChange,
}: {
  kind: "hospital" | "pharmacy";
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const groups: ServiceGroup[] = kind === "pharmacy" ? PHARMACY_SERVICE_GROUPS : HOSPITAL_SERVICE_GROUPS;

  const colorByService = useMemo(() => {
    const map = new Map<string, ServiceGroup["color"]>();
    for (const g of groups) for (const s of g.services) map.set(s, g.color);
    return map;
  }, [groups]);

  const allServices = useMemo(() => groups.flatMap((g) => g.services), [groups]);

  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [customInput, setCustomInput] = useState("");

  function toggle(service: string) {
    onChange(selected.includes(service) ? selected.filter((s) => s !== service) : [...selected, service]);
  }

  function addCustom() {
    const v = customInput.trim();
    if (!v || selected.includes(v)) return;
    onChange([...selected, v]);
    setCustomInput("");
  }

  const lq = q.trim().toLowerCase();
  const filtered = lq ? allServices.filter((s) => s.toLowerCase().includes(lq)) : allServices;
  const selectedSet = new Set(selected);
  const selectedIn = filtered.filter((s) => selectedSet.has(s));
  const unselectedIn = filtered.filter((s) => !selectedSet.has(s));
  const visible = expanded ? filtered : [...selectedIn, ...unselectedIn.slice(0, Math.max(0, INITIAL_SHOW - selectedIn.length))];
  const hiddenCount = filtered.length - visible.length;
  const customSelected = selected.filter((s) => !colorByService.has(s));

  return (
    <div>
      <div className="relative">
        <svg className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(e) => { setQ(e.target.value); setExpanded(true); }}
          placeholder="Search services…"
          className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {visible.map((s) => {
          const color = colorByService.get(s) ?? "slate";
          const cls = SERVICE_COLOR_CLASSES[color];
          const isSelected = selectedSet.has(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              aria-pressed={isSelected}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${isSelected ? cls.selected : cls.chip}`}
            >
              {s}
            </button>
          );
        })}
        {!expanded && hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-500 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-600 dark:hover:border-emerald-500"
          >
            +{hiddenCount} more
          </button>
        )}
        {expanded && !lq && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-500 transition hover:border-slate-400 dark:border-slate-600"
          >
            Show less
          </button>
        )}
      </div>

      {customSelected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {customSelected.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              {s}
              <button type="button" onClick={() => toggle(s)} aria-label={`Remove ${s}`} className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400">
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
          placeholder="Not on the list? Add it here"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-emerald-900/40"
        />
        <button
          type="button"
          onClick={addCustom}
          className="shrink-0 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300"
        >
          Add
        </button>
      </div>
    </div>
  );
}
