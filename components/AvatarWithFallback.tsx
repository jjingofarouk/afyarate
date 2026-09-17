"use client";

import { useState } from "react";

// Photo with initials fallback: shows the image when it loads, otherwise a
// letter avatar (used for team profiles until a photo is added).
export default function AvatarWithFallback({
  src,
  alt,
  letter,
}: {
  src: string;
  alt: string;
  letter: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span aria-hidden className="grid size-full place-items-center text-3xl font-black">
        {letter}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="size-full object-cover object-top"
      onError={() => setFailed(true)}
    />
  );
}
