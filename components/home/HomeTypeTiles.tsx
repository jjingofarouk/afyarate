import Link from "next/link";
import {
  Banknote,
  BookOpen,
  Briefcase,
  FolderOpen,
  GraduationCap,
  Megaphone,
  Mic,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { POST_TYPE_LABELS, POST_TYPES, type PostType } from "@/lib/types";

const ICONS: Record<PostType, LucideIcon> = {
  job: Briefcase,
  internship: GraduationCap,
  scholarship: BookOpen,
  grant: Banknote,
  fellowship: UserRound,
  conference: Mic,
  opportunity: Megaphone,
  other: FolderOpen,
};

const BLURBS: Record<PostType, string> = {
  job: "Healthcare jobs across Uganda",
  internship: "Clinical and allied health internships",
  scholarship: "Undergraduate and postgraduate study",
  grant: "Research and health-sector funding",
  fellowship: "Clinical and research fellowships",
  conference: "Conferences, symposia and CME",
  opportunity: "Open calls and other openings",
  other: "Everything else worth knowing about",
};

/**
 * "Explore opportunities by type" tiles, each with a live count, mirroring the
 * category strip on the original platform. Driven by POST_TYPES so the tiles
 * cannot drift from the routes that actually exist.
 */
export default function HomeTypeTiles({ counts }: { counts: Record<string, number> }) {
  return (
    <section
      aria-label="Explore opportunities by type"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
    >
      {POST_TYPES.map((t) => {
        const count = counts[t] ?? 0;
        const Icon = ICONS[t];
        return (
          <Link
            key={t}
            href={`/${POST_TYPE_LABELS[t].plural.toLowerCase()}`}
            className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500"
          >
            <Icon
              aria-hidden
              className="size-6 text-navy-800 dark:text-navy-200"
              strokeWidth={2}
            />
            <strong className="mt-2 block text-sm font-bold text-slate-900 dark:text-slate-50">
              {POST_TYPE_LABELS[t].plural}
            </strong>
            <small className="mt-0.5 block text-sm leading-snug text-slate-500 dark:text-slate-400">
              {BLURBS[t]}
            </small>
            <em className="mt-2 block text-sm font-semibold not-italic text-emerald-700 dark:text-emerald-400">
              {count.toLocaleString()} {count === 1 ? "listing" : "listings"}
            </em>
          </Link>
        );
      })}
    </section>
  );
}
