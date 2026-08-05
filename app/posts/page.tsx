import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import { FadeIn } from "@/components/motion/FadeIn";
import { SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jobs & Opportunities",
  description: `${SITE_NAME} job board — jobs, internships, scholarships, grants and opportunities for healthcare professionals in Uganda.`,
  alternates: { canonical: "/posts" },
};

const TYPE_TABS: { value: string; label: string; href: string }[] = [
  { value: "", label: "All", href: "/posts" },
  { value: "job", label: "Jobs", href: "/jobs" },
  { value: "internship", label: "Internships", href: "/internships" },
  { value: "scholarship", label: "Scholarships", href: "/scholarships" },
  { value: "grant", label: "Grants", href: "/grants" },
  { value: "fellowship", label: "Fellowships", href: "/fellowships" },
  { value: "conference", label: "Conferences", href: "/conferences" },
  { value: "opportunity", label: "Opportunities", href: "/opportunities" },
  { value: "other", label: "Other", href: "/other" },
];

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const posts = await getPosts({ type });

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

      <div className="mt-6 flex flex-wrap gap-2">
        {TYPE_TABS.map((tab) => {
          const active = (type ?? "") === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.href}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-emerald-600 text-white"
                  : "border border-slate-300 text-slate-600 hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-emerald-400"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {posts.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          No listings here yet. Be the first to{" "}
          <Link href="/posts/new" className="text-emerald-700 underline dark:text-emerald-400">
            post one
          </Link>
          .
        </div>
      ) : (
        <FadeIn delay={0.05}>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </FadeIn>
      )}
    </div>
  );
}
