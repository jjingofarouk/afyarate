import Link from "next/link";
import type { Post } from "@/lib/types";

function daysUntil(date: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(`${date}T00:00:00`);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

/**
 * A tall, full-width "spotlight" banner for a single standout listing: the
 * photo fills the whole band (top-anchored so heads are never cropped out)
 * with copy overlaid at the bottom. Gives the listings section a non-card
 * rhythm by featuring the newest/featured post prominently, with a lot of
 * vertical presence on desktop.
 */
export default function SpotlightListing({ post }: { post: Post }) {
  const days = post.deadline ? daysUntil(post.deadline) : null;
  const meta = [post.organization, post.location, post.profession]
    .filter(Boolean)
    .join(" · ");
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group relative flex min-h-[340px] flex-col justify-end overflow-hidden rounded-3xl bg-emerald-950 text-white shadow-xl shadow-emerald-900/10 sm:min-h-[420px] lg:min-h-[480px]"
    >
      <img
        src={post.imageUrl || `/opportunities/${post.type}.svg`}
        alt={`${post.title} at ${post.organization}`}
        width={1200}
        height={750}
        loading="lazy"
        className="absolute inset-0 size-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

      <div className="relative z-10 flex max-w-3xl flex-col gap-3 p-6 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur">
            Featured {post.type}
          </span>
          {days !== null && (
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur">
              {days < 0 ? "Closed" : days === 0 ? "Closes today" : `${days} ${days === 1 ? "day" : "days"} left`}
            </span>
          )}
        </div>
        <h3 className="line-clamp-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {post.title}
        </h3>
        {meta && (
          <p className="text-sm text-white/85">{meta}</p>
        )}
        {post.summary && (
          <p className="line-clamp-2 max-w-2xl text-sm leading-relaxed text-white/75">
            {post.summary}
          </p>
        )}
        <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-300 underline-offset-4 group-hover:underline">
          View listing
          <svg
            aria-hidden
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12l-7.5 7.5M21 12H3" />
          </svg>
        </span>
      </div>
    </Link>
  );
}