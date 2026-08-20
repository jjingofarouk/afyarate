import type { Metadata } from "next";
import Link from "next/link";
import { searchAmbulances } from "@/lib/ambulances";
import AmbulanceCard from "@/components/AmbulanceCard";
import { FadeIn } from "@/components/motion/FadeIn";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ambulance Services in Uganda",
  description: `Verified ambulance and emergency patient transport services across Uganda, listed on ${SITE_NAME}. Every listing is reviewed before publishing.`,
  alternates: { canonical: "/ambulances" },
  openGraph: {
    title: "Ambulance Services in Uganda · Rate Musawo",
    description: "Verified ambulance and emergency patient transport services across Uganda.",
    type: "website",
  },
};

export default async function AmbulancesPage() {
  const providers = await searchAmbulances();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Ambulance Services in Uganda",
    url: `${SITE_URL}/ambulances`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: providers.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: p.name,
      })),
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-600 dark:text-red-400">
              Emergency transport
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Ambulance Services in Uganda
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Verified ambulance and patient transport providers. Every listing is reviewed by our
              team before it appears here.
            </p>
          </div>
          <Link
            href="/ambulances/new"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Register your service
          </Link>
        </div>
      </FadeIn>

      {providers.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          No ambulance services listed yet. Run one?{" "}
          <Link href="/ambulances/new" className="text-emerald-700 underline dark:text-emerald-400">
            Register it here
          </Link>
          .
        </div>
      ) : (
        <FadeIn delay={0.05}>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {providers.map((p) => (
              <AmbulanceCard key={p.id} provider={p} />
            ))}
          </div>
        </FadeIn>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
