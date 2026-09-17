"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, Building2, Search, UserRound, type LucideIcon } from "lucide-react";
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

const KIND_META: Record<
  SearchHit["kind"],
  { icon: LucideIcon; avatarClass: string }
> = {
  post: { icon: Briefcase, avatarClass: "bg-gradient-to-br from-emerald-500 to-teal-600" },
  practitioner: { icon: UserRound, avatarClass: "bg-gradient-to-br from-sky-500 to-blue-600" },
  facility: { icon: Building2, avatarClass: "bg-gradient-to-br from-rose-500 to-orange-500" },
};

const SEE_ALL: Record<SearchHit["kind"], { label: string; href: (q: string) => string }> = {
  post: { label: "jobs & opportunities", href: (q) => `/posts?q=${encodeURIComponent(q)}` },
  practitioner: { label: "practitioners", href: (q) => `/practitioners?q=${encodeURIComponent(q)}` },
  facility: { label: "facilities", href: (q) => `/facilities?q=${encodeURIComponent(q)}` },
};

const INPUT_CLASS: Record<"header" | "hero", string> = {
  header:
    "w-full rounded-full border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/40",
  // Sits inside a light pill on top of the hero photograph.
  hero: "w-full rounded-xl border-0 bg-transparent py-2.5 pl-9 pr-3 text-slate-900 outline-none placeholder:text-slate-500",
};

const ROW_CLASS: Record<"header" | "hero", string> = {
  header: "relative",
  hero: "relative flex flex-col gap-2 rounded-2xl border border-white/20 bg-white/95 p-2 shadow-2xl backdrop-blur sm:flex-row sm:items-center",
};

/**
 * The one search box used by both the header and the home hero, so the two can
 * never drift apart in behaviour: same `/api/search` endpoint, same debounce,
 * same grouped dropdown across jobs & opportunities, licensed practitioners and
 * facilities, and the same keyboard navigation.
 *
 * It is still a plain GET form (`action="/posts"`), so pressing Enter with no
 * option highlighted works without JavaScript, and no result is a dead end.
 *
 * `extraControls` is a slot for filters that only make sense in one place (the
 * hero's location select). Both instances can appear on the same page, so all
 * element ids are namespaced by variant.
 */
export default function SiteSearch({
  variant = "header",
  extraControls,
  placeholder = "Search jobs, doctors, hospitals…",
}: {
  variant?: "header" | "hero";
  extraControls?: React.ReactNode;
  placeholder?: string;
}) {
  const isHero = variant === "hero";
  const idBase = isHero ? "hero-search" : "site-search";
  const router = useRouter();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<SearchHit[]>([]);
  const [totals, setTotals] = useState<Record<SearchHit["kind"], number>>({
    post: 0,
    practitioner: 0,
    facility: 0,
  });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const formRef = useRef<HTMLFormElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Identical queries (backspacing, or retyping what you just searched) come
  // straight back from memory, so the dropdown is already open on the next
  // tick instead of waiting on a round trip.
  const queryCache = useRef(
    new Map<string, { items: SearchHit[]; totals: Record<SearchHit["kind"], number> }>(),
  );

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
    const cached = queryCache.current.get(query);
    if (cached) {
      setItems(cached.items);
      setTotals(cached.totals);
      setOpen(true);
      setActiveIndex(-1);
      setLoading(false);
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
        const nextItems = (data.items ?? []) as SearchHit[];
        const nextTotals = (data.totals ?? {
          post: 0,
          practitioner: 0,
          facility: 0,
        }) as Record<SearchHit["kind"], number>;
        if (queryCache.current.size > 40) {
          const oldest = queryCache.current.keys().next().value;
          if (oldest !== undefined) queryCache.current.delete(oldest);
        }
        queryCache.current.set(query, { items: nextItems, totals: nextTotals });
        setItems(nextItems);
        setTotals(nextTotals);
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
    }, 80);
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
      className={isHero ? "w-full" : "min-w-0 flex-1"}
      onSubmit={() => setOpen(false)}
    >
      <label htmlFor={idBase} className="sr-only">
        Search jobs, practitioners and facilities
      </label>
      <div className={ROW_CLASS[variant]}>
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            strokeWidth={2}
          />
          <input
            id={idBase}
            name="q"
            type="search"
            autoComplete="off"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => {
              if (items.length && q.trim().length >= MIN_CHARS) setOpen(true);
            }}
            placeholder={placeholder}
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={`${idBase}-listbox`}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? `${idBase}-option-${activeIndex}` : undefined}
            className={INPUT_CLASS[variant]}
          />
        </div>

        {extraControls}

        {isHero && (
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500"
          >
            Search
          </button>
        )}

        {showDropdown && (
          <div
            id={`${idBase}-listbox`}
            role="listbox"
            className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-auto rounded-2xl border border-slate-200 bg-white py-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900"
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
                              id={`${idBase}-option-${i}`}
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
                                  <Icon aria-hidden className="size-3.5 shrink-0" />
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
                                id={`${idBase}-option-${i}`}
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
                                See all {totals[g.kind].toLocaleString()} {SEE_ALL[g.kind].label} →
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
