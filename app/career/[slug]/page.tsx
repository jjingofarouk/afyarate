import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CAREER_GUIDES, getCareerGuide } from "@/data/career";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return CAREER_GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getCareerGuide(slug);
  if (!guide) return { title: "Career Resources" };
  return {
    title: `${guide.title} — Career Resources`,
    description: guide.summary,
    alternates: { canonical: `/career/${guide.slug}` },
  };
}

export default async function CareerGuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getCareerGuide(slug);
  if (!guide) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: guide.title,
        description: guide.summary,
        dateModified: guide.updated,
        publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
        mainEntityOfPage: `${SITE_URL}/career/${guide.slug}`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Career Resources", item: `${SITE_URL}/career` },
          { "@type": "ListItem", position: 3, name: guide.title, item: `${SITE_URL}/career/${guide.slug}` },
        ],
      },
    ],
  };

  const other = CAREER_GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="text-xs text-slate-400 dark:text-slate-500">
        <Link href="/career" className="hover:text-emerald-700 dark:hover:text-emerald-400">
          Career Resources
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-600 dark:text-slate-400">{guide.title}</span>
      </nav>

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        {guide.title}
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{guide.summary}</p>
      <p className="mt-1 text-xs text-slate-400">Updated {guide.updated}</p>

      <div className="mt-8 space-y-8">
        {guide.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {s.heading}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {s.body}
            </p>
            {s.points && s.points.length > 0 && (
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {s.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {other.length > 0 && (
        <div className="mt-10 border-t border-slate-200 pt-6 dark:border-slate-800">
          <h2 className="font-semibold">More career guides</h2>
          <ul className="mt-3 space-y-2">
            {other.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/career/${g.slug}`}
                  className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  {g.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
