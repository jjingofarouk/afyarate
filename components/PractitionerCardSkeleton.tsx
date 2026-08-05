export default function PractitionerCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="h-44 animate-pulse bg-slate-200 dark:bg-slate-800" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="h-3 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-10 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
