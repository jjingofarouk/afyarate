"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItemClass = (active: boolean) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    active
      ? "bg-emerald-600 text-white"
      : "text-slate-600 hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
  }`;

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const items = [
    { href: "/admin", label: "Dashboard", active: pathname === "/admin" },
    {
      href: "/admin/posts",
      label: "Listings",
      active: pathname.startsWith("/admin/posts") && !pathname.endsWith("/new"),
    },
    {
      href: "/admin/posts/new",
      label: "New listing",
      active: pathname.endsWith("/new"),
    },
  ];

  async function logout() {
    try {
      await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
    } catch {
      // ignore — still redirect
    }
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-1">
        <span className="mr-2 hidden text-sm font-bold tracking-tight text-slate-900 sm:inline dark:text-slate-100">
          Admin
        </span>
        {items.map((item) => (
          <Link key={item.href} href={item.href} className={navItemClass(item.active)}>
            {item.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/posts"
          target="_blank"
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
        >
          View site ↗
        </Link>
        <button
          type="button"
          onClick={logout}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-slate-600 dark:text-slate-300 dark:hover:border-red-800 dark:hover:bg-red-950/40 dark:hover:text-red-400"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
