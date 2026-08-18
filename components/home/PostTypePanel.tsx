import Link from "next/link";
import type { Post, PostType } from "@/lib/types";

function daysUntil(date: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(`${date}T00:00:00`);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

function DeadlineChip({ date }: { date: string | null }) {
  if (!date) {
    return (
      <span className="shrink-0 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        Rolling
      </span>
    );
  }
  const days = daysUntil(date);
  if (days < 0) {
    return <span className="shrink-0 text-xs font-medium text-slate-400 dark:text-slate-500">Closed</span>;
  }
  return (
    <span className="shrink-0 text-xs font-medium text-amber-700 dark:text-amber-400">
      {days === 0 ? "Closes today" : `${days} ${days === 1 ? "day" : "days"} left`}
    </span>
  );
}

/**
 * Compact per-type panel for the home page listings section: a small header
 * (type label + "view all") and the two most recent posts as rows. One panel
 * per listing type keeps every category — jobs, scholarships, grants,
 * conferences, fellowships, internships — visible without pushing the page
 * thousands of lines long.
 */
export default function PostTypePanel({
  typeLabel,
  href,
  count,
  posts,
  type,
  tone,
}: {
  typeLabel: string;
  href: string;
  count: number;
  posts: Post[];
  type?: PostType;
  tone?: string;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            tone ??
            "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          }`}
        >
          {typeLabel}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {count.toLocaleString()} listing{count === 1 ? "" : "s"}
        </span>
      </div>
      <ul className="mt-3 flex flex-1 flex-col gap-2">
        {posts.map((p) => (
          <li key={p.id}>
            <Link
              href={`/posts/${p.slug}`}
              className="group flex items-center gap-3 rounded-xl border border-transparent px-2 py-1.5 transition hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800/60"
            >
              <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageUrl || `/opportunities/${p.type}.svg`}
                  alt=""
                  loading="lazy"
                  width={1200}
                  height={750}
                  className="size-full object-cover object-top"
                />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="line-clamp-2 text-sm font-medium leading-snug text-slate-800 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-400">
                  {p.title}
                </span>
                <span className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="line-clamp-1">{p.organization}</span>
                  <DeadlineChip date={p.deadline} />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className="mt-3 border-t border-slate-100 pt-2 text-xs font-semibold text-emerald-700 hover:underline dark:border-slate-800 dark:text-emerald-400"
      >
        View all {typeLabel.toLowerCase()} →
      </Link>
    </div>
  );
}