import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfessionCounts, getProfessions, searchPractitioners } from "@/lib/practitioners";
import { getPosts, slugify } from "@/lib/posts";
import PractitionerSearch from "@/components/PractitionerSearch";
import { PAGE_SIZE, SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Escape "<" so user-submitted text can't break out of the JSON-LD <script> tag. */
function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function faqsFor(profession: string, count: number) {
  return [
    {
      q: `How do I find a licensed ${profession} in Uganda?`,
      a: `Browse the ${count.toLocaleString()} registered ${profession}s listed on ${SITE_NAME}. Each profile shows the practitioner's council, registration number, licence status and expiry date so you can confirm they are currently licensed to practise in Uganda.`,
    },
    {
      q: `Can I check a ${profession}'s licence before visiting?`,
      a: `Yes. Every ${profession} profile on ${SITE_NAME} shows their registration number and licence status, so you can verify they hold a valid practising licence before your visit.`,
    },
    {
      q: `Can I rate or review a ${profession} on ${SITE_NAME}?`,
      a: `Yes. Patients, families and colleagues can leave a rating and review for any ${profession}. Each review is reviewed and clearly marked as verified or unverified.`,
    },
    {
      q: `Are there ${profession} jobs and opportunities in Uganda?`,
      a: `Yes — hospitals, clinics, universities, NGOs and government regularly advertise ${profession} roles in Uganda. Browse the current ${profession} jobs and opportunities section to see what is open now.`,
    },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const counts = await getProfessionCounts();
  const prof = counts.find((c) => slugify(c.profession) === slug);
  if (!prof) return { title: "Profession not found" };
  const year = new Date().getFullYear();
  const title = `${prof.profession}s in Uganda — Licensed ${prof.profession}s (${year})`;
  const description = `Find ${prof.count.toLocaleString()} registered ${prof.profession}s in Uganda with patient ratings and licence details. Verify their licence, read reviews and see ${prof.profession} jobs.`;
  return {
    title,
    description,
    keywords: [
      `${professionKeyword(prof.profession)} in Uganda`,
      `licensed ${professionKeyword(prof.profession)}`,
      `find a ${professionKeyword(prof.profession)} Uganda`,
      `${professionKeyword(prof.profession)} registration`,
    ],
    alternates: { canonical: `/practitioners/profession/${slug}` },
    openGraph: {
      type: "website",
      title: `${prof.profession}s in Uganda · ${SITE_NAME}`,
      description,
      url: `${SITE_URL}/practitioners/profession/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${prof.profession}s in Uganda · ${SITE_NAME}`,
      description,
    },
  };
}

/** A lowercase search-friendly keyword for the cadre ("Doctor", "Nurse / Midwife" → "nurses and midwives"). */
function professionKeyword(profession: string): string {
  return profession.toLowerCase();
}

export default async function ProfessionPractitionersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const counts = await getProfessionCounts();
  const prof = counts.find((c) => slugify(c.profession) === slug);
  if (!prof) notFound();

  const [result, jobProfessions, jobs] = await Promise.all([
    searchPractitioners({
      profession: prof.profession,
      status: "all",
      sort: "rating",
      page: 1,
      pageSize: PAGE_SIZE,
    }),
    getProfessions(),
    getPosts({ profession: slug }).catch(() => []),
  ]);

  const year = new Date().getFullYear();
  const faqs = faqsFor(prof.profession, prof.count);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Practitioners",
        item: `${SITE_URL}/practitioners`,
      },
      { "@type": "ListItem", position: 3, name: `${prof.profession}s in Uganda` },
    ],
  };

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${prof.profession}s in Uganda`,
    description: `Registered, licensed ${prof.profession}s in Uganda with patient ratings.`,
    url: `${SITE_URL}/practitioners/profession/${slug}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: result.items.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/practitioners/${p.id}`,
      })),
    },
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="mb-6 text-xs text-slate-400 dark:text-slate-500">
        <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href="/practitioners" className="hover:text-emerald-700 dark:hover:text-emerald-400">Practitioners</Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-600 dark:text-slate-400">{prof.profession}s in Uganda</span>
      </nav>

      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {prof.profession}s in Uganda ({year})
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          There are{" "}
          <strong className="font-semibold text-slate-800 dark:text-slate-200">
            {prof.count.toLocaleString()} registered {prof.profession}s
          </strong>{" "}
          in Uganda on {SITE_NAME}. Use the search below to find, filter and sort
          them. Every profile shows the practitioner&apos;s council, registration and
          licence status so you can verify they are currently licensed.{" "}
          {result.total > 0 ? `${result.total.toLocaleString()} matched this profession.` : ""}
        </p>
      </header>

      <div className="mt-8">
        <PractitionerSearch
          initialProfession={prof.profession}
          lockProfession
          initialSort="rating"
          initialData={result}
        />
      </div>

      {/* Cross-links: same profession in the jobs directory */}
      {jobs.length > 0 && (
        <section className="mt-12 border-t border-slate-100 pt-6 dark:border-slate-800">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {prof.profession} jobs &amp; opportunities in Uganda
          </h2>
          <ul className="mt-3 space-y-2">
            {jobs.slice(0, 6).map((j) => (
              <li key={j.slug}>
                <Link
                  href={`/posts/${j.slug}`}
                  className="text-sm text-emerald-700 underline hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  {j.title} — {j.organization}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3">
            <Link
              href={`/professions/${slug}`}
              className="text-sm font-medium text-emerald-700 underline dark:text-emerald-400"
            >
              See all {prof.profession} jobs in Uganda →
            </Link>
          </p>
        </section>
      )}

      {/* FAQ */}
      <section className="mx-auto mt-12 max-w-3xl border-t border-slate-100 pt-6 dark:border-slate-800">
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Frequently asked questions about {prof.profession}s in Uganda
        </h2>
        <div className="mt-4 space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900 marker:content-none dark:text-slate-100">
                {f.q}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <p className="mt-10 border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        Explore more professions:{" "}
        {jobProfessions
          .filter((p) => slugify(p) !== slug)
          .slice(0, 8)
          .map((p, i) => (
            <span key={p}>
              {i > 0 && " · "}
              <Link
                href={`/practitioners/profession/${slugify(p)}`}
                className="text-emerald-700 underline dark:text-emerald-400"
              >
                {p}s
              </Link>
            </span>
          ))}
      </p>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd([breadcrumbLd, collectionLd, faqLd]) }}
      />
    </div>
  );
}
