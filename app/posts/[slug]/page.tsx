import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, getPosts, slugify } from "@/lib/posts";
import { TypeBadge } from "@/components/PostCard";
import PostGrid from "@/components/PostGrid";
import { POST_TYPE_LABELS, type Post, type PostType } from "@/lib/types";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

function deadlineIso(post: Post): string | undefined {
  return post.deadline ? `${post.deadline}T00:00:00` : undefined;
}

function employmentSchemaType(raw: string | null): string | undefined {
  if (!raw) return undefined;
  const s = raw.toLowerCase();
  if (s.includes("full")) return "FULL_TIME";
  if (s.includes("part")) return "PART_TIME";
  if (s.includes("contract") || s.includes("consult")) return "CONTRACTUAL";
  if (s.includes("temp") || s.includes("short")) return "TEMPORARY";
  if (s.includes("intern")) return "INTERNSHIP";
  if (s.includes("volunteer")) return "VOLUNTEER";
  if (s.includes("remote")) return "REMOTE";
  return undefined;
}

/**
 * Parse a salary string ("UGX 2M", "600K", "1,500,000") into a numeric
 * MonetaryAmount Google can use for Job rich results. Returns undefined for
 * vague values like "Negotiable" so the field is simply omitted.
 */
function parseBaseSalary(
  raw: string | null,
): { "@type": "MonetaryAmount"; value: number; currency: string } | undefined {
  if (!raw) return undefined;
  const s = raw.replace(/,/g, "").toLowerCase();
  const m = s.match(/(\d+(?:\.\d+)?)\s*(m|k|million)?/);
  if (!m) return undefined;
  let value = parseFloat(m[1]);
  const unit = m[2];
  if (unit === "m" || unit === "million") value *= 1_000_000;
  else if (unit === "k") value *= 1_000;
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return { "@type": "MonetaryAmount", value, currency: "UGX" };
}

/** Schema.org entity for a listing — different types get the most relevant schema. */
function postSchema(post: Post): Record<string, unknown> {
  const location = post.location ?? "Uganda";
  const base: Record<string, unknown> = {
    "@type": "CreativeWork",
    name: post.title,
    headline: post.title,
    description: post.summary ?? `${post.title} at ${post.organization} in ${location}.`,
    author: { "@type": "Organization", name: post.organization },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    datePublished: post.publishedAt ?? new Date().toISOString(),
    image: post.imageUrl ?? undefined,
    url: `${SITE_URL}/posts/${post.slug}`,
  };

  if (post.type === "job" || post.type === "internship") {
    const baseSalary = parseBaseSalary(post.salary);
    return {
      "@type": "JobPosting",
      title: post.title,
      description: post.description || post.summary || post.title,
      datePosted: post.publishedAt ?? new Date().toISOString().slice(0, 10),
      validThrough: deadlineIso(post),
      employmentType: employmentSchemaType(post.employmentType) ?? "OTHER",
      hiringOrganization: {
        "@type": "Organization",
        name: post.organization,
        ...(post.sourceUrl ? { sameAs: post.sourceUrl } : {}),
      },
      jobLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: post.location ?? undefined,
          addressCountry: "UG",
        },
      },
      url: `${SITE_URL}/posts/${post.slug}`,
      directApply: false,
      ...(post.qualification ? { qualifications: post.qualification } : {}),
      ...(baseSalary
        ? { baseSalary: { ...baseSalary, currency: "UGX" } }
        : {}),
    };
  }
  if (post.type === "grant") {
    return { ...base, "@type": "Grant", funder: { "@type": "Organization", name: post.organization } };
  }
  if (post.type === "conference") {
    return { ...base, "@type": "Event", organizer: { "@type": "Organization", name: post.organization } };
  }
  if (post.type === "scholarship" || post.type === "fellowship") {
    return {
      "@type": "EducationalOccupationalCredential",
      name: post.title,
      description: post.summary ?? post.description.slice(0, 500),
      educationalLevel: post.qualification ?? undefined,
      credentialCategory: POST_TYPE_LABELS[post.type].label,
      url: `${SITE_URL}/posts/${post.slug}`,
      ...(deadlineIso(post) ? { validFor: deadlineIso(post) } : {}),
    };
  }
  return base;
}

function breadcrumbSchema(post: Post): Record<string, unknown> {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Jobs & Opportunities", item: `${SITE_URL}/posts` },
      { "@type": "ListItem", position: 3, name: post.title },
    ],
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Listing not found" };
  const typeLabel = POST_TYPE_LABELS[post.type].label;
  const location = post.location ? `${post.location}, ${post.country ?? "Uganda"}` : post.country ?? "Uganda";
  const desc =
    post.summary ??
    `${post.title} at ${post.organization} in ${location}. ${typeLabel} for ${
      post.profession ?? "healthcare professionals"
    }.${post.deadline ? ` Deadline: ${post.deadline}.` : " Rolling deadline."}`;
  return {
    title: `${post.title} — ${typeLabel} at ${post.organization}`,
    description: desc.slice(0, 160),
    alternates: { canonical: `/posts/${post.slug}` },
    openGraph: {
      title: `${post.title} · ${typeLabel} · ${post.organization}`,
      description: desc.slice(0, 200),
      type: "article",
      images: post.imageUrl ? [{ url: post.imageUrl, width: 1200, height: 750, alt: post.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} — ${typeLabel} at ${post.organization}`,
      description: desc.slice(0, 200),
      images: post.imageUrl ? [post.imageUrl] : undefined,
    },
    robots: { index: true, follow: true },
  };
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</dd>
    </div>
  );
}

function isHeadingLine(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 80) return false;
  if (/[.!?;:]$/.test(t)) return false;
  if (/^[-*#\d•·]/.test(t)) return false;
  if (t.includes("\n")) return false;
  const words = t.split(/\s+/);
  return words.some((w) => /^[A-Z]/.test(w));
}

function renderDescription(text: string) {
  const blocks: { kind: "h" | "p"; content: string }[] = [];
  let buf: string[] = [];
  const flush = () => {
    if (buf.length) {
      const joined = buf.join("\n");
      blocks.push({ kind: isHeadingLine(joined) ? "h" : "p", content: joined });
      buf = [];
    }
  };
  for (const line of text.split("\n")) {
    if (line.trim() === "") {
      flush();
    } else {
      buf.push(line);
    }
  }
  flush();
  return blocks.map((b, i) =>
    b.kind === "h" ? (
      <h2
        key={i}
        className="mt-7 text-base font-bold tracking-tight text-slate-900 first:mt-0 dark:text-slate-100"
      >
        {b.content}
      </h2>
    ) : (
      <p
        key={i}
        className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-slate-700 first:mt-0 dark:text-slate-300"
      >
        {b.content}
      </p>
    )
  );
}

function RelatedLinks({ post }: { post: Post }) {
  const links: { href: string; label: string }[] = [];
  if (post.profession) {
    links.push({ href: `/professions/${slugify(post.profession)}`, label: `More ${post.profession} jobs in Uganda` });
  }
  if (post.location) {
    links.push({ href: `/locations/${slugify(post.location)}`, label: `Healthcare jobs in ${post.location}` });
  }
  if (post.organization) {
    links.push({ href: `/organizations/${slugify(post.organization)}`, label: `More from ${post.organization}` });
  }
  if (!links.length) return null;
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const deadline = post.deadline
    ? new Date(`${post.deadline}T00:00:00`).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const applyHref =
    post.applicationUrl ??
    (post.applicationEmail ? `mailto:${post.applicationEmail}` : null);

  let similar: Post[] = [];
  if (post.profession) {
    similar = (await getPosts({ profession: slugify(post.profession) }))
      .filter((p) => p.id !== post.id)
      .slice(0, 3);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [postSchema(post), breadcrumbSchema(post)],
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:max-w-4xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="mb-6 text-xs text-slate-400 dark:text-slate-500">
        <a href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">Home</a>
        <span className="mx-1.5">/</span>
        <a href="/posts" className="hover:text-emerald-700 dark:hover:text-emerald-400">Jobs &amp; Opportunities</a>
        <span className="mx-1.5">/</span>
        <span className="text-slate-600 dark:text-slate-400">{post.title}</span>
      </nav>

      <div>
        {post.imageUrl && (
          <div className="mb-8 aspect-[16/7] overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.imageUrl}
              alt={`${post.title} at ${post.organization}`}
              className="h-full w-full object-cover object-top"
            />
          </div>
        )}

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={post.type as PostType} />
            {post.profession && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                {post.profession}
              </span>
            )}
            {post.featured && (
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                ★ Featured
              </span>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            {post.title}
          </h1>
          <p className="mt-1 text-base text-slate-600 dark:text-slate-400">{post.organization}</p>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-slate-200 py-5 sm:grid-cols-4 dark:border-slate-800">
            {post.location && <MetaItem label="Location" value={post.location} />}
            {post.employmentType && <MetaItem label="Type" value={post.employmentType} />}
            {post.experienceLevel && <MetaItem label="Level" value={post.experienceLevel} />}
            {post.salary && <MetaItem label="Pay" value={post.salary} />}
            <MetaItem label="Deadline" value={deadline ?? "Rolling"} />
          </dl>

          {post.summary && (
            <p className="mt-6 text-lg font-medium leading-relaxed text-slate-800 dark:text-slate-100">
              {post.summary}
            </p>
          )}

          <div className="mt-4">{renderDescription(post.description)}</div>

          <RelatedLinks post={post} />

          {post.howToApply && (
            <div className="mt-8 rounded-2xl bg-emerald-50/70 p-5 dark:bg-emerald-900/20">
              <h2 className="text-sm font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                How to apply
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {post.howToApply}
              </p>
            </div>
          )}

          {applyHref && (
            <a
              href={applyHref}
              target={post.applicationUrl ? "_blank" : undefined}
              rel={post.applicationUrl ? "noopener noreferrer" : undefined}
              className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              {post.applicationUrl ? "Apply now" : "Apply by email"}
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12l-7.5 7.5M21 12H3" />
              </svg>
            </a>
          )}

          {post.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            More {post.profession} opportunities
          </h2>
          <div className="mt-4">
            <PostGrid posts={similar} />
          </div>
        </section>
      )}

      <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
        This listing is provided for information only. {SITE_NAME} does not guarantee
        its accuracy and is not involved in the recruitment or application process.
      </p>
    </div>
  );
}
