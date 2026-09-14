import { getClaimedPractitionerCount, getStats } from "./practitioners";
import { getFacilityStats } from "./facilities";

/** Rows per sitemap shard (kept under Supabase's 1,000-row response cap). */
export const SITEMAP_CHUNK = 1000;

export interface ChunkCounts {
  facilityChunks: number;
  claimedChunks: number;
  practitionerChunks: number;
}

// Last-known-good chunk counts. If Supabase hiccups, the sitemap keeps its
// previous shape instead of collapsing to zero shards — a collapsed index
// would silently drop every practitioner URL Google has already discovered.
// (getFacilityStats/getStats also carry their own short TTL caches; this is
// the failure-only layer on top.)
let lastGood: ChunkCounts | null = null;

export async function getChunkCounts(): Promise<ChunkCounts> {
  const [fstatsResult, claimedResult, statsResult] = await Promise.allSettled([
    getFacilityStats(),
    getClaimedPractitionerCount(),
    getStats(),
  ]);
  const counts: ChunkCounts = {
    facilityChunks:
      fstatsResult.status === "fulfilled"
        ? Math.max(0, Math.ceil(fstatsResult.value.total / SITEMAP_CHUNK))
        : (lastGood?.facilityChunks ?? 0),
    claimedChunks:
      claimedResult.status === "fulfilled"
        ? Math.max(0, Math.ceil(claimedResult.value / SITEMAP_CHUNK))
        : (lastGood?.claimedChunks ?? 0),
    practitionerChunks:
      statsResult.status === "fulfilled"
        ? Math.max(0, Math.ceil(statsResult.value.practitioners / SITEMAP_CHUNK))
        : (lastGood?.practitionerChunks ?? 0),
  };
  if (
    fstatsResult.status === "fulfilled" &&
    claimedResult.status === "fulfilled" &&
    statsResult.status === "fulfilled"
  ) {
    lastGood = counts;
  }
  return counts;
}
