"use client";

import { useState } from "react";
import { InitialsAvatar } from "./PractitionerCard";

export default function PractitionerPhotoCarousel({
  photos,
  name,
}: {
  photos: string[];
  name: string;
}) {
  const [index, setIndex] = useState(0);
  if (photos.length === 0) {
    return (
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <InitialsAvatar name={name} />
      </div>
    );
  }
  if (photos.length === 1) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={photos[0]}
          alt={name}
          className="h-full w-full object-cover object-top"
        />
      </div>
    );
  }
  const prev = () => setIndex((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setIndex((i) => (i + 1) % photos.length);
  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100 group/carousel dark:bg-slate-800">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={photos[index]}
        src={photos[index]}
        alt={`${name} photo ${index + 1}`}
        className="h-full w-full object-cover object-top"
      />
      <button
        type="button"
        onClick={prev}
        aria-label="Previous photo"
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-2.5 py-1.5 text-lg font-bold text-white opacity-0 transition group-hover/carousel:opacity-100 focus:opacity-100"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next photo"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-2.5 py-1.5 text-lg font-bold text-white opacity-0 transition group-hover/carousel:opacity-100 focus:opacity-100"
      >
        ›
      </button>
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
        {photos.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Photo ${i + 1}`}
            className={`size-2 rounded-full transition ${
              i === index ? "bg-white" : "bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
      {index === 0 && photos.length > 1 && (
        <span className="absolute left-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-950">
          Your photo
        </span>
      )}
    </div>
  );
}
