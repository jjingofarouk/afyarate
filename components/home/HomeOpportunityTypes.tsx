import HomeClosingSoon from "@/components/home/HomeClosingSoon";
import HomeTypeTiles from "@/components/home/HomeTypeTiles";
import { getPosts } from "@/lib/posts";
import { POST_TYPES } from "@/lib/types";

/**
 * Type tiles (with live counts) plus the "closing soon" strip. Both are derived
 * from the same cached listing array, so they share one fetch and stream in
 * together behind a single Suspense boundary.
 */
export default async function HomeOpportunityTypes() {
  const posts = await getPosts().catch(() => []);

  const counts: Record<string, number> = {};
  for (const t of POST_TYPES) counts[t] = 0;
  for (const p of posts) counts[p.type] = (counts[p.type] ?? 0) + 1;

  return (
    <>
      <HomeTypeTiles counts={counts} />
      <HomeClosingSoon posts={posts} />
    </>
  );
}
