"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { POST_TYPE_LABELS, type Post } from "@/lib/types";

const MIN_CHARS = 2;
const SUGGESTION_LIMIT = 6;

function initials(organization: string): string {
  return (organization || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

export default function HeaderSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const formRef = useRef<HTMLFormElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Debounced live suggestions as the user types, same /api/posts search
  // the board pages already use, just capped to a handful of results.
  useEffect(() => {
    const query = q.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < MIN_CHARS) {
      setResults([]);
      setTotal(0);
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
        const params = new URLSearchParams({ q: query, limit: String(SUGGESTION_LIMIT) });
        const res = await fetch(`/api/posts?${params.toString()}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data = await res.json();
        setResults(data.items ?? []);
        setTotal(data.total ?? 0);
        setOpen(true);
        setActiveIndex(-1);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setResults([]);
          setTotal(0);
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
  const hasMore = total > results.length;
  const optionCount = results.length + (hasMore ? 1 : 0);

  function goToIndex(index: number) {
    if (index < 0 || index >= optionCount) return;
    setOpen(false);
    if (index < results.length) {
      router.push(`/posts/${results[index].slug}`);
    } else {
      router.push(`/posts?q=${encodeURIComponent(q.trim())}`);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || optionCount === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, optionCount - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      // With nothing highlighted, fall through to the form's normal GET
      // submit (?q=...), works the same with JS disabled.
      e.preventDefault();
      goToIndex(activeIndex);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

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
        Search jobs and opportunities
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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
          />
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
            if (results.length && q.trim().length >= MIN_CHARS) setOpen(true);
          }}
          placeholder="Search jobs, grants, etc..."
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
            {results.length === 0 ? (
              <div className="px-3.5 py-3 text-sm text-slate-500 dark:text-slate-400">
                {loading ? "Searching…" : `No listings match "${q.trim()}".`}
              </div>
            ) : (
              <ul>
                {results.map((post, i) => (
                  <li key={post.id} role="presentation">
                    <Link
                      id={`site-search-option-${i}`}
                      role="option"
                      aria-selected={activeIndex === i}
                      href={`/posts/${post.slug}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setOpen(false)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 text-sm transition ${
                        activeIndex === i
                          ? "bg-emerald-50 dark:bg-emerald-950/40"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                        {post.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-white/90">
                            {initials(post.organization)}
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-slate-900 dark:text-slate-100">
                          {post.title}
                        </span>
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                          {POST_TYPE_LABELS[post.type].label} · {post.organization}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
                {hasMore && (
                  <li role="presentation">
                    <Link
                      id={`site-search-option-${results.length}`}
                      role="option"
                      aria-selected={activeIndex === results.length}
                      href={`/posts?q=${encodeURIComponent(q.trim())}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setOpen(false)}
                      onMouseEnter={() => setActiveIndex(results.length)}
                      className={`block border-t border-slate-100 px-3.5 py-2.5 text-sm font-medium text-emerald-700 transition dark:border-slate-800 dark:text-emerald-400 ${
                        activeIndex === results.length
                          ? "bg-emerald-50 dark:bg-emerald-950/40"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      See all {total.toLocaleString()} results for &ldquo;{q.trim()}&rdquo;
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
