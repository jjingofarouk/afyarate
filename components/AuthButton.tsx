"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getDisplayName } from "@/lib/handle";

// Header login button / account menu. Full-width variant for the sidebar.
export default function AuthButton({ full }: { full?: boolean }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <span
        className={`animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800 ${
          full ? "block px-4 py-2.5 text-sm" : "size-9"
        }`}
      />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className={
          full
            ? "block rounded-xl bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-emerald-700"
            : "rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
        }
      >
        Log in
      </Link>
    );
  }

  const name =
    (user.user_metadata?.display_name as string | undefined) ??
    getDisplayName() ??
    user.email?.split("@")[0] ??
    "Account";

  if (!full) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="grid size-9 place-items-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-700 transition hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300"
        >
          {name.slice(0, 1).toUpperCase()}
        </button>
        {open && (
          <div className="absolute right-0 top-full z-30 mt-1 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <p className="truncate px-3 py-1.5 text-xs text-slate-400">{user.email}</p>
            {[
              { href: "/applications", label: "My applications" },
              { href: "/saved", label: "Saved listings" },
              { href: "/employers", label: "Employer workspace" },
              { href: "/messages", label: "Messages" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {l.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                void signOut().then(() => {
                  setOpen(false);
                  router.refresh();
                });
              }}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
      <p className="truncate text-sm font-semibold">{name}</p>
      <p className="truncate text-xs text-slate-400">{user.email}</p>
      <div className="mt-2 grid grid-cols-2 gap-1.5 text-center text-xs font-semibold">
        <Link href="/applications" className="rounded-lg bg-white px-2 py-1.5 dark:bg-slate-800">
          Applications
        </Link>
        <Link href="/employers" className="rounded-lg bg-white px-2 py-1.5 dark:bg-slate-800">
          Employers
        </Link>
      </div>
      <button
        type="button"
        onClick={() => {
          void signOut().then(() => router.refresh());
        }}
        className="mt-1.5 w-full rounded-lg px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
      >
        Log out
      </button>
    </div>
  );
}
