import type { Metadata } from "next";
import Link from "next/link";
import { CAREER_GUIDES } from "@/data/career";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Career Resources",
  description: `Practical career guidance for healthcare professionals in Uganda: CVs, interviews, application strategy and career planning. From ${SITE_NAME}.`,
  alternates: { canonical: "/career" },
};

const itemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Career Resources",
  itemListElement: CAREER_GUIDES.map((g, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: g.title,
    url: `/career/${g.slug}`,
  })),
};

export default function CareerPage() {
  return (
    <>
      {/* Our original home hero lives here now: health workers at work, which
          is exactly what these guides are for. */}
      <section className="relative flex min-h-[240px] items-end overflow-hidden sm:min-h-[300px] lg:min-h-[340px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero.jpg"
          alt="Healthcare workers in a hospital corridor"
          className="absolute inset-0 size-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/50 to-slate-950/25" />
        <div className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-8">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-emerald-300">
            For health workers
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Career Resources
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-200">
            Practical career guidance for healthcare professionals in Uganda.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-12">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {CAREER_GUIDES.map((g) => (
          <Link
            key={g.slug}
            href={`/career/${g.slug}`}
            className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-800"
          >
            <h2 className="font-semibold text-slate-900 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-400">
              {g.title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {g.summary}
            </p>
            <span className="mt-3 inline-block text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              Read guide →
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
        <h2 className="font-semibold text-emerald-900 dark:text-emerald-200">
          Put it into practice
        </h2>
        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
          Browse open roles, set a job alert so new matches reach you, and save the listings you
          want to come back to.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/posts" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
            Browse listings
          </Link>
          <Link
            href="/alerts"
            className="rounded-xl border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-800 dark:border-emerald-800 dark:text-emerald-300"
          >
            Set a job alert
          </Link>
          <Link
            href="/insights"
            className="rounded-xl border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-800 dark:border-emerald-800 dark:text-emerald-300"
          >
            Market insights
          </Link>
        </div>
      </div>
      </div>
    </>
  );
}
