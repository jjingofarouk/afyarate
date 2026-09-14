import type { CSSProperties } from "react";
import Link from "next/link";
import { getPosts } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";
import { POST_TYPES, POST_TYPE_LABELS } from "@/lib/types";
import PostCard from "@/components/PostCard";
import PostTypePanel from "@/components/home/PostTypePanel";
import SpotlightListing from "@/components/home/SpotlightListing";
import { SlideIn } from "@/components/motion/SlideIn";
import { StaggerGrid, StaggerItem } from "@/components/motion/StaggerGrid";

/**
 * Jobs & opportunities discovery block. Fetches its own posts (shared 5-min
 * worker cache with every other consumer) and streams behind a Suspense
 * boundary so it never blocks the hero.
 */
export default async function HomeJobs({ style }: { style?: CSSProperties }) {
  const allPosts = await getPosts().catch(() => []);
  if (allPosts.length === 0) return null;

  // Group listings by type so every category gets a visible slice of the
  // board, jobs lead, then a panel per type (scholarships, grants,
  // conferences, fellowships, internships, opportunities, …).
  const topJobs = allPosts.filter((p) => p.type === "job").slice(0, 4);
  const typePanels = POST_TYPES.filter((t) => t !== "job")
    .map((t) => ({
      type: t,
      posts: allPosts.filter((p) => p.type === t),
    }))
    .filter((g) => g.posts.length > 0);

  // Spotlight: prefer a featured listing, otherwise the newest post overall.
  const spotlight =
    allPosts.find((p) => p.featured) ?? (allPosts.length > 0 ? allPosts[0] : null);

  return (
    <>
      <section
        id="listings"
        style={style}
        className="scroll-mt-20 border-y border-emerald-100 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20"
      >
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">

          {/* Asymmetric section header */}
          <SlideIn from="left">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Opportunities
                </p>
                <h2 className="mt-2 text-4xl font-black leading-[0.95] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-slate-50">
                  Jobs &amp;<br />Opportunities
                </h2>
              </div>
              <div className="sm:text-right">
                <p className="max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Fresh listings for Uganda's health workforce, covering every career stage, every region.
                </p>
                <Link
                  href="/posts"
                  className="mt-2 inline-block text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
                >
                  View all listings →
                </Link>
              </div>
            </div>
          </SlideIn>

          {/* Spotlight (7 cols) + type panels sidebar (5 cols) */}
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {spotlight && (
              <SlideIn from="left" className="lg:col-span-7">
                <SpotlightListing post={spotlight} />
              </SlideIn>
            )}
            {typePanels.length > 0 && (
              <SlideIn from="right" delay={0.1} className="lg:col-span-5 flex flex-col gap-4">
                {typePanels.slice(0, 3).map((g) => (
                  <PostTypePanel
                    key={g.type}
                    typeLabel={POST_TYPE_LABELS[g.type].plural}
                    href={`/${POST_TYPE_LABELS[g.type].plural.toLowerCase()}`}
                    count={g.posts.length}
                    posts={g.posts.slice(0, 2)}
                    type={g.type}
                  />
                ))}
              </SlideIn>
            )}
          </div>

          {/* Latest jobs, staggered cards */}
          {topJobs.length > 0 && (
            <div className="mt-10">
              <SlideIn from="bottom">
                <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Latest jobs
                </p>
              </SlideIn>
              <StaggerGrid className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {topJobs.map((p, i) => (
                  <StaggerItem
                    key={p.id}
                    className={i % 2 === 1 ? "lg:mt-6" : ""}
                  >
                    <PostCard post={p} />
                  </StaggerItem>
                ))}
              </StaggerGrid>
            </div>
          )}

          {/* Remaining type panels */}
          {typePanels.length > 3 && (
            <StaggerGrid className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {typePanels.slice(3).map((g) => (
                <StaggerItem key={g.type}>
                  <PostTypePanel
                    typeLabel={POST_TYPE_LABELS[g.type].plural}
                    href={`/${POST_TYPE_LABELS[g.type].plural.toLowerCase()}`}
                    count={g.posts.length}
                    posts={g.posts.slice(0, 2)}
                    type={g.type}
                  />
                </StaggerItem>
              ))}
            </StaggerGrid>
          )}

          <SlideIn from="bottom" delay={0.1}>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white/70 p-4 dark:border-emerald-900/40 dark:bg-slate-900/60">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Know an opening students or health workers would want to see?
              </p>
              <Link
                href="/posts/new"
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Post a listing
              </Link>
            </div>
          </SlideIn>
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              topJobs.length > 0 && {
                "@type": "ItemList",
                name: "Health jobs in Uganda",
                itemListElement: topJobs.map((p, i) => ({
                  "@type": "ListItem",
                  position: i + 1,
                  name: p.title,
                  url: `${SITE_URL}/posts/${p.slug}`,
                })),
              },
              ...typePanels.map((g) => ({
                "@type": "ItemList",
                name: `${POST_TYPE_LABELS[g.type].plural} for health workers in Uganda`,
                itemListElement: g.posts.slice(0, 6).map((p, i) => ({
                  "@type": "ListItem",
                  position: i + 1,
                  name: p.title,
                  url: `${SITE_URL}/posts/${p.slug}`,
                })),
              })),
            ].filter(Boolean),
          }),
        }}
      />
    </>
  );
}
