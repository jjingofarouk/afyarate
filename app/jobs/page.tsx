import type { Metadata } from "next";
import Link from "next/link";
import { getPosts, facetOptions } from "@/lib/posts";
import PostBoard from "@/components/PostBoard";
import PostTypeTabs from "@/components/PostTypeTabs";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const INITIAL_COUNT = 12;

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Medical & Health Jobs in Uganda (${new Date().getFullYear()})`,
  description: `Browse current medical and health job vacancies in Uganda, newest first: doctors, nurses, clinical officers, midwives, lab technicians and more. Updated daily on ${SITE_NAME}.`,
  alternates: { canonical: "/jobs" },
  openGraph: {
    title: `Health Jobs in Uganda · ${SITE_NAME}`,
    description:
      "Find the newest health sector job openings in Uganda: doctors, nurses, lab techs, midwives and more.",
    type: "website",
  },
};

export default async function JobsPage() {
  // Newest first — the board default.
  const posts = await getPosts({ type: "job", sort: "newest" });
  const professions = facetOptions(posts, (p) => p.profession);
  const locations = facetOptions(posts, (p) => p.location);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Jobs" },
        ],
      },
      {
        "@type": "CollectionPage",
        name: `Medical & Health Jobs in Uganda`,
        description: metadata.description,
        url: `${SITE_URL}/jobs`,
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Medical &amp; Health Jobs in Uganda
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            {posts.length > 0
              ? `${posts.length} open ${posts.length === 1 ? "vacancy" : "vacancies"}, newest first.`
              : "New vacancies are added as soon as they are approved."}{" "}
            Doctors, nurses, midwives, clinical officers and allied health professionals.
          </p>
        </div>
        <Link
          href="/posts/new"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Post a job
        </Link>
      </div>

      <div className="mt-6">
        <PostTypeTabs active="job" />
      </div>

      {posts.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          No jobs here yet. Be the first to{" "}
          <Link href="/posts/new" className="text-emerald-700 underline dark:text-emerald-400">
            post one
          </Link>
          .
        </div>
      ) : (
        <div className="mt-8">
          <PostBoard
            initialPosts={posts.slice(0, INITIAL_COUNT)}
            total={posts.length}
            type="job"
            initialSort="newest"
            professions={professions}
            locations={locations}
          />
        </div>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
