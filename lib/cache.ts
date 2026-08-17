/**
 * Cloudflare Cache API helpers.
 *
 * `caches.default` is only available inside a Cloudflare Worker runtime.  In
 * local Next.js dev (`next dev`) or plain Node.js builds the global is absent,
 * so every function here degrades gracefully to a no-op rather than throwing.
 *
 * Usage:
 *   - `cacheGet(url)`    → Response | null
 *   - `cachePut(url, r)` → void  (fire-and-forget, awaited internally)
 *   - `cachePurge(url)`  → void  (fire-and-forget)
 *   - `purgePosts(slugs)`→ void  (purge one or many post detail pages at once)
 */

import { SITE_URL } from "./site";

function cfCache(): Cache | null {
  try {
    // `caches` is a Cloudflare-only global; accessing it throws in Node.js.
    return (globalThis as Record<string, unknown>).caches
      ? ((caches as unknown) as { default: Cache }).default
      : null;
  } catch {
    return null;
  }
}

/** Retrieve a cached Response for the given absolute URL, or null on miss. */
export async function cacheGet(url: string): Promise<Response | null> {
  const cache = cfCache();
  if (!cache) return null;
  try {
    return (await cache.match(url)) ?? null;
  } catch {
    return null;
  }
}

/** Store a Response in the Cloudflare Cache under the given absolute URL.
 *  The response is cloned so the original can still be consumed by the caller. */
export async function cachePut(url: string, response: Response): Promise<void> {
  const cache = cfCache();
  if (!cache) return;
  try {
    await cache.put(url, response.clone());
  } catch {
    // Non-fatal — worst case the next request re-fetches from Supabase.
  }
}

/** Remove a URL from the Cloudflare Cache (best-effort, silent on error). */
export async function cachePurge(url: string): Promise<void> {
  const cache = cfCache();
  if (!cache) return;
  try {
    await cache.delete(url);
  } catch {
    // Ignore — stale content will expire via max-age.
  }
}

/** Purge one or more post detail pages by slug.
 *  Call this after an admin publishes, edits or deletes a post. */
export async function purgePostSlugs(slugs: string[]): Promise<void> {
  await Promise.all(
    slugs.map((slug) => cachePurge(`${SITE_URL}/posts/${slug}`)),
  );
}
