import type { Metadata } from "next";
import Link from "next/link";
import { getPosts, facetOptions } from "@/lib/posts";
import PostBoard from "@/components/PostBoard";
import PostTypeTabs from "@/components/PostTypeTabs";
import { FadeIn } from "@/components/motion/FadeIn";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const INITIAL_COUNT = 12;

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jobs & Opportunities for Health Workers in Uganda",
  description: `${SITE_NAME} job board — jobs, internships, scholarships, grants, fellowships and opportunities for doctors, nurses, midwives, clinical officers and allied health professionals in Uganda. Updated daily.`,
  alternates: {
    canonical: "/posts",
    types: { "application/rss+xml": "/posts/feed.xml" },
  },
  openGraph: {
    title: "Jobs & Opportunities for Health Workers in Uganda · Rate Musawo",
    description:
      "Jobs, internships, scholarships, grants and fellowships for healthcare professionals in Uganda — updated daily.",
    type: "website",
  },
};

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; tag?: string; q?: string }>;
}) {
  const { type, tag, q } = await searchParams;
  const posts = await getPosts({ type, tag, q });

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Jobs & Opportunities" },
        ],
      },
      {
        "@type": "CollectionPage",
        name: "Jobs & Opportunities for Health Workers in Uganda",
        description: metadata.description,
        url: `${SITE_URL}/posts`,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: posts.slice(0, 30).map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: p.title,
            url: `${SITE_URL}/posts/${p.slug}`,
          })),
        },
      },
    ],
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Jobs &amp; Opportunities
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Jobs, internships, scholarships, grants and fellowships for healthcare
              professionals in Uganda. New listings are reviewed before publication.
            </p>
          </div>
          <Link
            href="/posts/new"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Post a listing
          </Link>
        </div>
      </FadeIn>

      <div className="mt-6">
        <PostTypeTabs active={type ?? ""} />
      </div>

      {posts.length === 0 && !q ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          No listings here yet. Be the first to{" "}
          <Link href="/posts/new" className="text-emerald-700 underline dark:text-emerald-400">
            post one
          </Link>
          .
        </div>
      ) : (
        <FadeIn delay={0.05}>
          <div className="mt-8">
            <PostBoard
              initialPosts={posts.slice(0, INITIAL_COUNT)}
              total={posts.length}
              type={type}
              tag={tag}
              initialQuery={q}
              professions={facetOptions(posts, (p) => p.profession)}
              locations={facetOptions(posts, (p) => p.location)}
            />
          </div>
        </FadeIn>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
