import { isDbReady } from "@/lib/practitioners";
import FeaturedVerifiedProfile from "@/components/home/FeaturedVerifiedProfile";

/**
 * The paid featured-verified banner. It sits directly under the hero because
 * claimants paid for that placement, and it streams behind Suspense so the
 * hero never waits on the database.
 *
 * The old jump-to nav that used to live here is gone: the gateway tiles and
 * the hero's type chips now do that job, and the page no longer reorders
 * itself, so there is nothing to mirror.
 */
export default async function HomeFeatured() {
  const ready = await isDbReady().catch(() => false);
  if (!ready) return null;
  return <FeaturedVerifiedProfile />;
}
