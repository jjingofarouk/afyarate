import type { NextRequest } from "next/server";

// Shared in-memory rate limiter for the merged-platform APIs. Same approach as the
// ratings/posts routes (per-IP buckets); a persistent store is the follow-up.

const buckets = new Map<string, number[]>();

export function limited(key: string, max = 10, windowMs = 60 * 60 * 1000): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return true;
  }
  hits.push(now);
  buckets.set(key, hits);
  return false;
}

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd ?? "unknown").split(",")[0].trim();
}

export const str = (v: unknown, max: number): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
