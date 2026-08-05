import { getStats, isDbReady } from "@/lib/practitioners";
import PractitionerSearch from "@/components/PractitionerSearch";
import { FadeIn } from "@/components/motion/FadeIn";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const ready = await isDbReady();
  const stats = ready ? await getStats() : null;

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <FadeIn>
        <section className="py-10 text-center sm:py-16">
          <p className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
            🇺🇬 Uganda&apos;s licensed health professionals, rated by patients
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Find a licensed practitioner.{" "}
            <span className="text-emerald-600">See how patients rate them.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
            Search doctors, nurses, pharmacists and allied health professionals with a
            valid licence from the Uganda Health Professionals Portal, read community
            ratings, and leave your own.
          </p>
        </section>
      </FadeIn>

      {/* Stats */}
      {stats && (
        <FadeIn delay={0.1}>
          <section className="mb-8 grid grid-cols-3 gap-3">
            {[
              { label: "Practitioners", value: stats.practitioners.toLocaleString() },
              { label: "Active licences", value: stats.active.toLocaleString() },
              { label: "Patient ratings", value: stats.totalRatings.toLocaleString() },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm"
              >
                <div className="text-2xl font-bold text-emerald-700">{s.value}</div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {s.label}
                </div>
              </div>
            ))}
          </section>
        </FadeIn>
      )}

      {!ready ? (
        <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-amber-900">
            Database not set up yet
          </h2>
          <p className="mt-2 text-sm text-amber-800">
            Run{" "}
            <code className="rounded bg-amber-100 px-1">node scripts/setup_supabase.mjs</code>{" "}
            (with <code className="rounded bg-amber-100 px-1">SUPABASE_DB_URL</code> in{" "}
            <code className="rounded bg-amber-100 px-1">.env.local</code>) to create the
            tables, then{" "}
            <code className="rounded bg-amber-100 px-1">npm run import</code> to load the
            scraped registry. <Link href="/about" className="underline">Learn more</Link>
          </p>
        </div>
      ) : (
        <PractitionerSearch initialQuery={q ?? ""} />
      )}
    </div>
  );
}
