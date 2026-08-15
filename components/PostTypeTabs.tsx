import Link from "next/link";
import { POST_TYPES, POST_TYPE_LABELS } from "@/lib/types";

const TABS: { value: string; label: string; href: string }[] = [
  { value: "", label: "All", href: "/posts" },
  ...POST_TYPES.map((t) => ({
    value: t,
    label: POST_TYPE_LABELS[t].plural,
    href: `/${POST_TYPE_LABELS[t].plural.toLowerCase()}`,
  })),
];

/** Type switcher used on /posts and every /[type] page, so you can jump
 *  between jobs/internships/scholarships/etc. without going back to /posts. */
export default function PostTypeTabs({ active = "" }: { active?: string }) {
  return (
    <nav aria-label="Filter by listing type" className="flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const isActive = active === tab.value;
        return (
          <Link
            key={tab.value}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              isActive
                ? "bg-emerald-600 text-white"
                : "border border-slate-300 text-slate-600 hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-emerald-400"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
