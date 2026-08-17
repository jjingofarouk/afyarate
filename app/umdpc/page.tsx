import type { Metadata } from "next";
import Link from "next/link";
import { slugify } from "@/lib/posts";
import { getProfessionCounts, getStats } from "@/lib/practitioners";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "UMDPC Licence Verification",
  description:
    "Verify a health worker's licence in Uganda using the UMDPC registry and practitioner pages.",
  alternates: { canonical: "/umdpc" },
  openGraph: {
    title: `UMDPC Licence Verification · ${SITE_NAME}`,
    description:
      "Verify a health worker's licence in Uganda using the UMDPC registry and practitioner pages.",
    type: "website",
  },
};

export default async function UmdpcPage() {
  const [stats, professions] = await Promise.all([getStats().catch(() => null), getProfessionCounts()]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <nav className="mb-6 text-xs text-slate-400 dark:text-slate-500">
        <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">
          Home
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-600 dark:text-slate-400">UMDPC</span>
      </nav>

      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-400">
          Verification
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          UMDPC licence verification
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Search the registry by name or licence number, then open the full profile to confirm the
          council, registration details and active licence status.
        </p>
      </header>

      <form action="/practitioners" method="get" className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="q">
          Search by name or licence number
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            id="q"
            name="q"
            type="search"
            placeholder="Example: Amina, 201951940742, 13760"
            className="w-full flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/40"
          />
          <button
            type="submit"
            className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Search registry
          </button>
        </div>
      </form>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {stats ? stats.practitioners.toLocaleString() : "—"}
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Practitioners in registry
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {stats ? stats.active.toLocaleString() : "—"}
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Active licences
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {stats ? stats.totalRatings.toLocaleString() : "—"}
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Patient ratings
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Popular professions
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {professions.slice(0, 8).map((profession) => (
              <Link
                key={profession.profession}
                href={`/practitioners/profession/${slugify(profession.profession)}`}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-800 dark:text-slate-300 dark:hover:text-emerald-400"
              >
                {profession.profession}
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Helpful links
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/practitioners"
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Browse practitioners
            </Link>
            <Link
              href="/news/umdpc-registration-guide"
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300"
            >
              Read the guide
            </Link>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalOrganization",
            name: "Uganda Medical and Dental Practitioners Council",
            url: `${SITE_URL}/umdpc`,
            sameAs: "https://www.ehealthlicense.go.ug/",
          }),
        }}
      />
    </div>
  );
}
