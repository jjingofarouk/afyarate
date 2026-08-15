import type { Post } from "@/lib/types";

const styles: Record<Post["status"], { label: string; cls: string }> = {
  draft: { label: "Pending", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  published: { label: "Published", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  expired: { label: "Expired", cls: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  archived: { label: "Archived", cls: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  rejected: { label: "Rejected", cls: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
};

export default function StatusBadge({ status }: { status: Post["status"] }) {
  const s = styles[status] ?? styles.draft;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}
