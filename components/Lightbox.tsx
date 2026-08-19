"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Images smaller than this on screen are treated as decorative (icons,
 *  logos, avatars) and won't open the viewer. Opt in/out per-image with
 *  `data-lightbox="on"` / `data-lightbox="off"`. */
const MIN_SIZE = 48;

function isEligible(img: HTMLImageElement): boolean {
  if (img.dataset.lightbox === "off") return false;
  if (img.dataset.lightbox === "on") return true;
  return img.width >= MIN_SIZE && img.height >= MIN_SIZE;
}

function srcOf(img: HTMLImageElement): string {
  return img.currentSrc || img.src;
}

/** Deduped list of every lightbox-eligible image on the page, so the
 *  viewer can navigate between them with the arrow keys. */
function collectImages(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const img of document.querySelectorAll<HTMLImageElement>("img")) {
    if (!isEligible(img)) continue;
    const src = srcOf(img);
    if (src && !seen.has(src)) {
      seen.add(src);
      out.push(src);
    }
  }
  return out;
}

interface LightboxState {
  src: string;
  alt: string;
  images: string[];
}

export default function Lightbox() {
  const [state, setState] = useState<LightboxState | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (overlayRef.current?.contains(e.target as Node)) return;
      const img = (e.target as HTMLElement | null)?.closest("img") as HTMLImageElement | null;
      if (!img || !isEligible(img)) return;
      const src = srcOf(img);
      if (!src) return;
      // Capture phase + stopPropagation keep any wrapping link from navigating.
      e.preventDefault();
      e.stopPropagation();
      setState({ src, alt: img.alt || "", images: collectImages() });
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  const close = useCallback(() => setState(null), []);

  const navigate = useCallback((dir: number) => {
    setState((s) => {
      if (!s || s.images.length < 2) return s;
      const i = s.images.indexOf(s.src);
      const next = (i + dir + s.images.length) % s.images.length;
      return { ...s, src: s.images[next] };
    });
  }, []);

  useEffect(() => {
    if (!state) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") navigate(-1);
      else if (e.key === "ArrowRight") navigate(1);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [state, close, navigate]);

  if (!state) return null;

  const index = state.images.indexOf(state.src);
  const showNav = state.images.length > 1;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-sm"
    >
      <div className="flex shrink-0 items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <span className="min-w-0 truncate text-sm text-slate-300">{state.alt || "\u00a0"}</span>
        <button
          autoFocus
          type="button"
          onClick={close}
          aria-label="Close image viewer"
          className="grid size-9 shrink-0 place-items-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center gap-2 px-3 pb-4 sm:px-16"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        {showNav && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(-1);
            }}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white shadow-lg transition hover:bg-white/20 sm:left-4"
          >
            <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        )}

        <img
          src={state.src}
          alt={state.alt}
          onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full select-none object-contain shadow-2xl"
        />

        {showNav && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(1);
            }}
            aria-label="Next image"
            className="absolute right-2 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white shadow-lg transition hover:bg-white/20 sm:right-4"
          >
            <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}

        {showNav && (
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur">
            {index + 1} / {state.images.length}
          </span>
        )}
      </div>
    </div>
  );
}
