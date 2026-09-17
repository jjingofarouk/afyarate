import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Market insights: health jobs in Uganda",
  description: `Which health cadres, locations and employers are hiring right now, salary transparency and the most competitive listings on ${SITE_NAME}.`,
  alternates: { canonical: "/insights" },
};

interface Insights {
  open: number;
  closingSoon: number;
  salaryTransparency: number;
  byProfession: { label: string; count: number }[];
  byLocation: { label: string; count: number }[];
  byType: { label: string; count: number }[];
  byOrganization: { label: string; count: number }[];
  avgApplications: number | null;
  mostApplied: { title: string; slug: string; count: number }[];
}

function Bar({ label, count, max, href }: { label: string; count: number; max: number; href?: string }) {
  const inner = (
    <>
      <span className="truncate text-sm">{label}</span>
      <span className="text-sm font-bold tabular-nums">{count}</span>
    </>
  );
  return (
    <div>
      <div className="flex items-center justify-between gap-2">{href ? <a href={href} className="flex min-w-0 flex-1 items-center justify-between gap-2 hover:underline">{inner}</a> : <span className="flex min-w-0 flex-1 items-center justify-between gap-2">{inner}</span>}</div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${max > 0 ? Math.round((count / max) * 100) : 0}%` }} />
      </div>
    </div>
  );
}

export default async function InsightsPage() {
  // Fetch via the public API route at request time (same origin).
  const { headers } = await import("next/headers");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  let data: Insights | null = null;
  try {
    const res = await fetch(`${proto}://${host}/api/insights`, { cache: "no-store" });
    if (res.ok) data = (await res.json()) as Insights;
  } catch {
    data = null;
  }

  const section = "rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Market insights</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Who&apos;s hiring, where, and how competitive each listing is — computed live from the board.
      </p>
      {!data ? (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          Insights are unavailable right now. Try again shortly.
        </p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { v: String(data.open), l: "Open listings" },
              { v: String(data.closingSoon), l: "Closing in 14 days" },
              { v: `${data.salaryTransparency}%`, l: "Show salary" },
              { v: data.avgApplications == null ? "—" : String(data.avgApplications), l: "Avg applications" },
            ].map((t) => (
              <div key={t.l} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center dark:border-emerald-900/50 dark:bg-emerald-950/30">
                <p className="text-2xl font-black text-emerald-800 dark:text-emerald-300">{t.v}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{t.l}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className={section}>
              <h2 className="font-semibold">Top professions</h2>
              <div className="mt-3 space-y-3">
                {data.byProfession.map((r) => (
                  <Bar key={r.label} label={r.label} count={r.count} max={data.byProfession[0]?.count ?? 1} />
                ))}
              </div>
            </div>
            <div className={section}>
              <h2 className="font-semibold">Top locations</h2>
              <div className="mt-3 space-y-3">
                {data.byLocation.map((r) => (
                  <Bar key={r.label} label={r.label} count={r.count} max={data.byLocation[0]?.count ?? 1} />
                ))}
              </div>
            </div>
            <div className={section}>
              <h2 className="font-semibold">Top employers</h2>
              <div className="mt-3 space-y-3">
                {data.byOrganization.map((r) => (
                  <Bar key={r.label} label={r.label} count={r.count} max={data.byOrganization[0]?.count ?? 1} />
                ))}
              </div>
            </div>
            <div className={section}>
              <h2 className="font-semibold">Most competitive</h2>
              {data.mostApplied.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No on-platform applications yet — be the first.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {data.mostApplied.map((m) => (
                    <li key={m.slug} className="flex items-center justify-between gap-2 text-sm">
                      <Link href={`/posts/${m.slug}`} className="truncate hover:underline">{m.title}</Link>
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">{m.count} apps</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
