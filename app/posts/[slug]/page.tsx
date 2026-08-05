import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost } from "@/lib/posts";
import { TypeBadge } from "@/components/PostCard";
import { SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Listing not found" };
  return {
    title: post.title,
    description:
      post.summary ??
      `${post.organization} — ${post.location ?? "Uganda"}. ${post.title}.`,
    alternates: { canonical: `/posts/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.summary ?? `${post.title} at ${post.organization}`,
      images: post.imageUrl ? [{ url: post.imageUrl }] : undefined,
    },
  };
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-200">{value}</dd>
    </div>
  );
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const deadline = post.deadline
    ? new Date(`${post.deadline}T00:00:00`).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const applyHref =
    post.applicationUrl ??
    (post.applicationEmail ? `mailto:${post.applicationEmail}` : null);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/posts"
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400"
      >
        ← All listings
      </Link>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {post.imageUrl && (
          <div className="aspect-[16/7] overflow-hidden bg-slate-100 dark:bg-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.imageUrl}
              alt={post.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={post.type} />
            {post.profession && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                {post.profession}
              </span>
            )}
            {post.featured && (
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                ★ Featured
              </span>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            {post.title}
          </h1>
          <p className="mt-1 text-base text-slate-600 dark:text-slate-400">{post.organization}</p>

          <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-4 dark:bg-slate-950/50">
            {post.location && <MetaItem label="Location" value={post.location} />}
            {post.employmentType && <MetaItem label="Type" value={post.employmentType} />}
            {post.experienceLevel && <MetaItem label="Level" value={post.experienceLevel} />}
            {post.salary && <MetaItem label="Pay" value={post.salary} />}
            <MetaItem label="Deadline" value={deadline ?? "Rolling"} />
          </dl>

          {post.summary && (
            <p className="mt-6 text-base font-medium leading-relaxed text-slate-700 dark:text-slate-200">
              {post.summary}
            </p>
          )}

          <div className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
            {post.description}
          </div>

          {post.howToApply && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/50">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                How to apply
              </h2>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {post.howToApply}
              </p>
            </div>
          )}

          {applyHref && (
            <a
              href={applyHref}
              target={post.applicationUrl ? "_blank" : undefined}
              rel={post.applicationUrl ? "noopener noreferrer" : undefined}
              className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              {post.applicationUrl ? "Apply now" : "Apply by email"}
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12l-7.5 7.5M21 12H3" />
              </svg>
            </a>
          )}

          {post.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {post.sourceName && (
            <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
              Source:{" "}
              {post.sourceUrl ? (
                <a
                  href={post.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 underline dark:text-emerald-400"
                >
                  {post.sourceName}
                </a>
              ) : (
                post.sourceName
              )}
            </p>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
        This listing is provided for information only. {SITE_NAME} does not guarantee
        its accuracy and is not involved in the recruitment or application process.
      </p>
    </div>
  );
}
