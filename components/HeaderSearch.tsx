"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SearchHit } from "@/app/api/search/route";

const MIN_CHARS = 2;

function initials(name: string): string {
  return (name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

function BriefcaseIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18a47.99 47.99 0 01-12.756 0c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

const KIND_META = {
  post: { icon: BriefcaseIcon, avatarClass: "bg-gradient-to-br from-emerald-500 to-teal-600" },
  practitioner: { icon: PersonIcon, avatarClass: "bg-gradient-to-br from-sky-500 to-blue-600" },
  facility: { icon: BuildingIcon, avatarClass: "bg-gradient-to-br from-rose-500 to-orange-500" },
} as const;

const SEE_ALL: Record<SearchHit["kind"], { label: string; href: (q: string) => string }> = {
  post: { label: "jobs & opportunities", href: (q) => `/posts?q=${encodeURIComponent(q)}` },
  practitioner: { label: "practitioners", href: (q) => `/practitioners?q=${encodeURIComponent(q)}` },
  facility: { label: "facilities", href: (q) => `/facilities?q=${encodeURIComponent(q)}` },
};

export default function HeaderSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<SearchHit[]>([]);
  const [totals, setTotals] = useState<Record<SearchHit["kind"], number>>({ post: 0, practitioner: 0, facility: 0 });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const formRef = useRef<HTMLFormElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const query = q.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < MIN_CHARS) {
      setItems([]);
      setTotals({ post: 0, practitioner: 0, facility: 0 });
      setLoading(false);
      setOpen(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data = await res.json();
        setItems(data.items ?? []);
        setTotals(data.totals ?? { post: 0, practitioner: 0, facility: 0 });
        setOpen(true);
        setActiveIndex(-1);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setItems([]);
          setTotals({ post: 0, practitioner: 0, facility: 0 });
        }
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const showDropdown = open && q.trim().length >= MIN_CHARS;

  // Groups of items sharing a kind, in the order the API returned them
  // (posts, then practitioners, then facilities), each followed by a
  // "see all" link only when that category has more results than shown.
  const groups = (["post", "practitioner", "facility"] as const)
    .map((kind) => ({
      kind,
      hits: items.filter((h) => h.kind === kind),
      hasMore: totals[kind] > items.filter((h) => h.kind === kind).length,
    }))
    .filter((g) => g.hits.length > 0);

  // Flat option list for keyboard nav: every hit, then every "see all" link.
  const options: Array<{ type: "hit"; hit: SearchHit } | { type: "more"; kind: SearchHit["kind"] }> = [];
  for (const g of groups) {
    for (const hit of g.hits) options.push({ type: "hit", hit });
    if (g.hasMore) options.push({ type: "more", kind: g.kind });
  }

  function goToOption(index: number) {
    const opt = options[index];
    if (!opt) return;
    setOpen(false);
    if (opt.type === "hit") {
      router.push(opt.hit.href);
    } else {
      router.push(SEE_ALL[opt.kind].href(q.trim()));
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || options.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      goToOption(activeIndex);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  let flatIndex = -1;

  return (
    <form
      ref={formRef}
      action="/posts"
      method="get"
      role="search"
      className="min-w-0 flex-1"
      onSubmit={() => setOpen(false)}
    >
      <label htmlFor="site-search" className="sr-only">
        Search jobs, practitioners and facilities
      </label>
      <div className="relative">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
        </svg>
        <input
          id="site-search"
          name="q"
          type="search"
          autoComplete="off"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => {
            if (items.length && q.trim().length >= MIN_CHARS) setOpen(true);
          }}
          placeholder="Search jobs, doctors, hospitals…"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="site-search-listbox"
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `site-search-option-${activeIndex}` : undefined}
          className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/40"
        />

        {showDropdown && (
          <div
            id="site-search-listbox"
            role="listbox"
            className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[70vh] overflow-auto rounded-2xl border border-slate-200 bg-white py-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900"
          >
            {items.length === 0 ? (
              <div className="px-3.5 py-3 text-sm text-slate-500 dark:text-slate-400">
                {loading ? "Searching…" : `Nothing matches "${q.trim()}".`}
              </div>
            ) : (
              groups.map((g, gi) => {
                const Icon = KIND_META[g.kind].icon;
                return (
                  <div key={g.kind} className={gi > 0 ? "border-t border-slate-100 dark:border-slate-800" : ""}>
                    <ul>
                      {g.hits.map((hit) => {
                        flatIndex += 1;
                        const i = flatIndex;
                        return (
                          <li key={hit.id} role="presentation">
                            <Link
                              id={`site-search-option-${i}`}
                              role="option"
                              aria-selected={activeIndex === i}
                              href={hit.href}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => setOpen(false)}
                              onMouseEnter={() => setActiveIndex(i)}
                              className={`flex items-center gap-3 px-3.5 py-2.5 text-sm transition ${
                                activeIndex === i
                                  ? "bg-emerald-50 dark:bg-emerald-950/40"
                                  : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                              }`}
                            >
                              <span className={`flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg text-white/90 ${KIND_META[hit.kind].avatarClass}`}>
                                {hit.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={hit.imageUrl} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <span className="text-xs font-bold">{initials(hit.title)}</span>
                                )}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium text-slate-900 dark:text-slate-100">
                                  {hit.title}
                                </span>
                                <span className="flex items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
                                  <Icon />
                                  {hit.subtitle}
                                </span>
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                      {g.hasMore &&
                        (() => {
                          flatIndex += 1;
                          const i = flatIndex;
                          return (
                            <li role="presentation">
                              <Link
                                id={`site-search-option-${i}`}
                                role="option"
                                aria-selected={activeIndex === i}
                                href={SEE_ALL[g.kind].href(q.trim())}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setOpen(false)}
                                onMouseEnter={() => setActiveIndex(i)}
                                className={`block px-3.5 py-2 text-xs font-medium text-emerald-700 transition dark:text-emerald-400 ${
                                  activeIndex === i
                                    ? "bg-emerald-50 dark:bg-emerald-950/40"
                                    : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                }`}
                              >
                                See all {totals[g.kind].toLocaleString()} {SEE_ALL[g.kind].label}
                              </Link>
                            </li>
                          );
                        })()}
                    </ul>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </form>
  );
}
