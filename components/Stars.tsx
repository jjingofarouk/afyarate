"use client";

/** Read-only star display with fractional fill. */
export function Stars({
  value,
  size = 16,
  count,
}: {
  value: number | null;
  size?: number;
  count?: number;
}) {
  const v = value ?? 0;
  const pct = Math.max(0, Math.min(100, (v / 5) * 100));
  return (
    <span className="inline-flex items-center gap-1">
      <span className="relative inline-block" style={{ width: size * 5, height: size }}>
        <span className="absolute inset-0 flex text-slate-300 dark:text-slate-700">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} size={size} filled={false} />
          ))}
        </span>
        <span
          className="absolute inset-y-0 left-0 flex overflow-hidden text-amber-400"
          style={{ width: `${pct}%` }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} size={size} filled />
          ))}
        </span>
      </span>
      {count !== undefined && (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {value ? value.toFixed(1) : "-"} ({count})
        </span>
      )}
    </span>
  );
}

function Star({ size, filled }: { size: number; filled: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <path d="M12 2.5l2.95 5.98 6.6.96-4.78 4.66 1.13 6.58L12 17.58l-5.9 3.1 1.13-6.58L2.45 9.44l6.6-.96L12 2.5z" />
    </svg>
  );
}
