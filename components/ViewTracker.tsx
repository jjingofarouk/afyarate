"use client";

import { useEffect } from "react";

// Fire-and-forget view counter for listing analytics (one per visitor/day,
// enforced server-side).
export default function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    void fetch("/api/posts/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    }).catch(() => {});
  }, [slug]);
  return null;
}
