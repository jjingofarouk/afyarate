"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Non-obstructive toast shown when a visitor tries to copy text.
 * Gently points them to the share links instead. Auto-dismisses.
 * Uses plain CSS transitions so it is deterministic and lightweight.
 */
export default function CopyNotice() {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function show() {
      setVisible(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setVisible(false), 3200);
    }

    document.addEventListener("copy", show);
    document.addEventListener("cut", show);
    document.addEventListener("contextmenu", show);

    return () => {
      document.removeEventListener("copy", show);
      document.removeEventListener("cut", show);
      document.removeEventListener("contextmenu", show);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 transition-all duration-300 ease-out ${
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white/95 py-2 pl-3 pr-4 text-sm font-medium text-slate-700 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200">
        <LockIcon />
        <span>Copying is disabled — use the share links instead.</span>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      className="size-4 shrink-0 text-slate-400 dark:text-slate-500"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
