import Link from "next/link";
import { Timer } from "lucide-react";
import type { Post } from "@/lib/types";

const DAY = 86_400_000;

function daysLeft(deadline: string | null): number | null {
  if (!deadline) return null;
  const end = new Date(`${deadline}T23:59:59Z`).getTime();
  if (Number.isNaN(end)) return null;
  return Math.ceil((end - Date.now()) / DAY);
}

function deadlineLabel(days: number): string {
  if (days <= 0) return "Closes today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

/**
 * Deadlines are the one thing a jobseeker genuinely cannot miss, so the
 * listings closing inside a fortnight get their own band instead of being
 * buried in a list sorted by recency. Mirrors the "Closing Soon" strip on the
 * original platform.
 */
export default function HomeClosingSoon({ posts }: { posts: Post[] }) {
  const closing = posts
    .map((p) => ({ post: p, days: daysLeft(p.deadline) }))
    .filter((x): x is { post: Post; days: number } => x.days !== null && x.days <= 14)
    .sort((a, b) => a.days - b.days)
    .slice(0, 6);

  if (closing.length === 0) return null;

  return (
    <section aria-label="Closing soon" className="mt-6">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
          <Timer aria-hidden className="size-5 text-amber-600" strokeWidth={2} />
          Closing soon
        </h3>
        <Link
          href="/posts?sort=closingSoon"
          className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
        >
          View closing soon →
        </Link>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {closing.map(({ post, days }) => (
          // min-w-0 on the grid ITEM is what stops this overflowing: an auto
          // grid track cannot shrink below its item's min-content, and the
          // two-line card has a min-content wider than a phone screen.
          <li key={post.id} className="min-w-0">
            <Link
              href={`/posts/${post.slug}`}
              // Stacked on phones (the deadline badge otherwise eats half the
              // width), side by side from sm up.
              className="flex h-full min-w-0 flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-amber-400 hover:shadow-md sm:flex-row sm:items-start sm:justify-between sm:gap-3 dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="min-w-0">
                {/* break-words, not truncate: a nowrap line makes the intrinsic
                    min-content as wide as the whole string. */}
                <strong className="block break-words text-sm font-bold text-slate-900 dark:text-slate-50">
                  {post.title}
                </strong>
                <small className="mt-0.5 block break-words text-sm text-slate-500 dark:text-slate-400">
                  {post.organization}
                  {post.location ? ` · ${post.location}` : ""}
                </small>
              </span>
              <span className="shrink-0 self-start whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-1 text-sm font-bold text-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
                {deadlineLabel(days)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
