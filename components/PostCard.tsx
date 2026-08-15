import Link from "next/link";
import { POST_TYPE_LABELS, type Post, type PostType } from "@/lib/types";

function daysUntil(date: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(`${date}T00:00:00`);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

function Deadline({ date }: { date: string | null }) {
  if (!date) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        Rolling
      </span>
    );
  }
  const days = daysUntil(date);
  const closed = days < 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        closed
          ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
          : days <= 7
            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300"
            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
      }`}
    >
      {closed ? "Closed" : days === 0 ? "Closes today" : `${days}d left`}
    </span>
  );
}

export default function PostCard({ post }: { post: Post }) {
  const initials = (post.organization || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      {post.imageUrl ? (
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt={`${post.title} — ${post.organization}`}
            width={1200}
            height={750}
            loading="lazy"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute left-2 top-2">
            <TypeBadge type={post.type} />
          </div>
        </div>
      ) : (
        <div className="relative flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600">
          <span className="text-3xl font-bold text-white/90">{initials}</span>
          <div className="absolute left-2 top-2">
            <TypeBadge type={post.type} />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <Deadline date={post.deadline} />
          {post.featured && (
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              ★ Featured
            </span>
          )}
        </div>
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-900 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-400">
          {post.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">{post.organization}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 text-xs text-slate-500 dark:text-slate-400">
          {post.location && (
            <span className="inline-flex items-center gap-1">
              <svg aria-hidden="true" className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {post.location}
            </span>
          )}
          {post.salary && <span>{post.salary}</span>}
          {post.profession && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              {post.profession}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function TypeBadge({ type }: { type: PostType }) {
  return (
    <span className="rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
      {POST_TYPE_LABELS[type].label}
    </span>
  );
}
