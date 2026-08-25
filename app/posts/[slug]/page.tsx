import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, getPosts, slugify } from "@/lib/posts";
import { TypeBadge } from "@/components/PostCard";
import PostGrid from "@/components/PostGrid";
import ShareButtons from "@/components/ShareButtons";
import PostViewNudge from "@/components/PostViewNudge";
import { POST_TYPE_LABELS, type Post, type PostType } from "@/lib/types";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { jobPostingSchema } from "@/lib/jobPosting";

export const dynamic = "force-dynamic";

function deadlineIso(deadline: string | null): string | undefined {
  if (!deadline) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return `${deadline}T00:00:00`;
  const d = new Date(deadline);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** Schema.org entity for a listing, different types get the most relevant schema. */
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

  const jobPosting = jobPostingSchema(post);
  if (jobPosting) return jobPosting;
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
      ...(deadlineIso(post.deadline) ? { validFor: deadlineIso(post.deadline) } : {}),
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
    title: `${post.title}: ${typeLabel} at ${post.organization}`,
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
      title: `${post.title}: ${typeLabel} at ${post.organization}`,
      description: desc.slice(0, 200),
      images: post.imageUrl ? [post.imageUrl] : undefined,
    },
    robots: { index: true, follow: true },
  };
}

function MetaItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "red" | "orange" | "green";
}) {
  const toneClasses =
    tone === "red"
      ? "text-red-600 dark:text-red-400"
      : tone === "orange"
        ? "text-orange-600 dark:text-orange-400"
        : tone === "green"
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-slate-900 dark:text-slate-100";
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className={`mt-1 text-sm font-semibold ${toneClasses}`}>{value}</dd>
    </div>
  );
}

/** Deadline urgency tone: red ≤7 days, orange ≤30 days, green beyond. */
function deadlineTone(deadline: string | null): "red" | "orange" | "green" | undefined {
  if (!deadline) return "green"; // rolling = no pressure
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const days = Math.round(
    (new Date(`${deadline}T00:00:00`).getTime() - now.getTime()) / 86400000,
  );
  if (days <= 7) return "red";
  if (days <= 30) return "orange";
  return "green";
}

function isHeadingLine(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 80) return false;
  if (t.includes("\n")) return false;
  if (/^[-*#\d•·]/.test(t)) return false;
  // Short label ending in a colon, e.g. "Key responsibilities:"
  if (t.length <= 40 && /^[A-Z][A-Za-z0-9 &/()-]+:$/.test(t)) return true;
  if (/[.!?;]$/.test(t)) return false;
  const words = t.split(/\s+/);
  return words.some((w) => /^[A-Z]/.test(w));
}

const INLINE_RE =
  /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\)|https?:\/\/[^\s)\]]+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|\+?256[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{3}|0\d{3}[\s-]?\d{3}[\s-]?\d{3})/g;
const EMAIL_RE = /^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/;
const PHONE_RE = /^\+?256[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{3}$|^0\d{3}[\s-]?\d{3}[\s-]?\d{3}$/;

/** Minimal inline formatting: **bold**, [link](url), bare https:// URLs, emails and phone numbers (made clickable so text can't be copied). */
function inlineFormat(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const linkCls = "font-medium text-emerald-700 underline dark:text-emerald-400";
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = INLINE_RE.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("**")) {
      parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (/^https?:\/\//.test(token)) {
      parts.push(
        <a key={key++} href={token} target="_blank" rel="noopener noreferrer" className={linkCls}>
          {token}
        </a>,
      );
    } else {
      const lm = token.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
      if (lm) {
        parts.push(
          <a key={key++} href={lm[2]} target="_blank" rel="noopener noreferrer" className={linkCls}>
            {lm[1]}
          </a>,
        );
      } else if (EMAIL_RE.test(token)) {
        parts.push(
          <a key={key++} href={`mailto:${token}`} className={linkCls}>
            {token}
          </a>,
        );
      } else if (PHONE_RE.test(token)) {
        parts.push(
          <a key={key++} href={`tel:${token.replace(/[\s-]/g, "")}`} className={linkCls}>
            {token}
          </a>,
        );
      } else {
        parts.push(token);
      }
    }
    last = m.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function isTableSeparator(line: string): boolean {
  const t = line.trim();
  if (!t.startsWith("|")) return false;
  const inner = t.replace(/^\|/, "").replace(/\|$/, "");
  const cells = inner.split("|");
  return cells.length > 0 && cells.every((c) => /^\s*:?-+:?\s*$/.test(c));
}

/** Parse a GFM-style table block into rows of cells, or null if it isn't one. */
function parseTableBlock(lines: string[]): string[][] | null {
  if (lines.length < 3) return null;
  const cells = (l: string): string[] | null => {
    const t = l.trim();
    if (!t.startsWith("|") || !t.endsWith("|")) return null;
    return t
      .slice(1, -1)
      .split("|")
      .map((c) => c.trim());
  };
  const header = cells(lines[0]);
  if (!header || header.length === 0) return null;
  if (!isTableSeparator(lines[1])) return null;
  const rows: string[][] = [];
  for (let i = 2; i < lines.length; i++) {
    const r = cells(lines[i]);
    if (!r) return null;
    rows.push(r);
  }
  return [header, ...rows];
}

function renderTable(header: string[], rows: string[][], key: number) {
  return (
    <div key={key} className="mt-4 overflow-x-auto first:mt-0">
      <table className="w-full min-w-[420px] border-collapse text-left text-[15px] leading-relaxed">
        <thead>
          <tr className="border-b-2 border-slate-200 dark:border-slate-700">
            {header.map((c, j) => (
              <th
                key={j}
                className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
              >
                {inlineFormat(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, j) => (
            <tr key={j} className="border-b border-slate-200 last:border-0 dark:border-slate-800">
              {r.map((c, k) => (
                <td key={k} className="px-3 py-2 align-top text-slate-700 dark:text-slate-300">
                  {inlineFormat(c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderDescription(text: string) {
  const blocks = text.split(/\n\s*\n/);
  return blocks
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, i) => {
      const lines = block
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const all = (re: RegExp) => lines.length > 0 && lines.every((l) => re.test(l));

      const table = parseTableBlock(lines);
      if (table) {
        const [header, ...rows] = table;
        return renderTable(header, rows, i);
      }

      const h = block.match(/^#{1,3}\s+(.+)$/);
      if (h) {
        return (
          <h2
            key={i}
            className="mt-7 text-lg font-bold tracking-tight text-slate-900 first:mt-0 dark:text-slate-100"
          >
            {inlineFormat(h[1])}
          </h2>
        );
      }
      if (all(/^[-*•]\s+/)) {
        return (
          <ul
            key={i}
            className="mt-4 list-disc space-y-1.5 pl-6 text-[15px] leading-relaxed text-slate-700 first:mt-0 dark:text-slate-300"
          >
            {lines.map((l, j) => (
              <li key={j}>{inlineFormat(l.replace(/^[-*•]\s+/, ""))}</li>
            ))}
          </ul>
        );
      }
      if (all(/^\d+[.)]\s+/)) {
        return (
          <ol
            key={i}
            className="mt-4 list-decimal space-y-1.5 pl-6 text-[15px] leading-relaxed text-slate-700 first:mt-0 dark:text-slate-300"
          >
            {lines.map((l, j) => (
              <li key={j}>{inlineFormat(l.replace(/^\d+[.)]\s+/, ""))}</li>
            ))}
          </ol>
        );
      }
      if (isHeadingLine(block)) {
        return (
          <h2
            key={i}
            className="mt-7 text-lg font-bold tracking-tight text-slate-900 first:mt-0 dark:text-slate-100"
          >
            {inlineFormat(block)}
          </h2>
        );
      }
      return (
        <p
          key={i}
          className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-slate-700 first:mt-0 dark:text-slate-300"
        >
          {inlineFormat(block)}
        </p>
      );
    });
}

const segmentIcon = (
  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

function Segment({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          {icon ?? segmentIcon}
        </span>
        <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h2>
      </div>
      <div className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
        {children}
      </div>
    </section>
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
          <div className="mb-8 aspect-[16/9] overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.imageUrl}
              alt={`${post.title} at ${post.organization}`}
              width={1200}
              height={675}
              className="h-full w-full object-contain object-center"
            />
          </div>
        )}

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={post.type as PostType} />
            {post.profession && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                {post.profession}
              </span>
            )}
            {post.featured && (
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                ★ Featured
              </span>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            {post.title}
          </h1>
          <p className="mt-1 text-base text-slate-600 dark:text-slate-400">{post.organization}</p>

          <div className="mt-5">
            <ShareButtons title={post.title} url={`${SITE_URL}/posts/${post.slug}`} />
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-slate-200 py-5 sm:grid-cols-4 dark:border-slate-800">
            {post.location && <MetaItem label="Location" value={post.location} />}
            {post.employmentType && <MetaItem label="Type" value={post.employmentType} />}
            {post.experienceLevel && <MetaItem label="Level" value={post.experienceLevel} />}
            {post.salary && <MetaItem label="Pay" value={post.salary} />}
            <MetaItem label="Deadline" value={deadline ?? "Rolling"} tone={deadlineTone(post.deadline)} />
          </dl>

          {post.summary && (
            <p className="mt-6 text-lg font-medium leading-relaxed text-slate-800 dark:text-slate-100">
              {inlineFormat(post.summary)}
            </p>
          )}

          <div className="mt-4">{renderDescription(post.description)}</div>

          {post.qualification && (
            <Segment
              title="Qualifications"
              icon={
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m6-3.5V14" />
                </svg>
              }
            >
              {inlineFormat(post.qualification)}
            </Segment>
          )}

          {post.eligibility && (
            <Segment
              title="Eligibility"
              icon={
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.36-1.86M17 20H7m10 0v-2c0-.79-.25-1.53-.68-2.13M7 20H2v-2a3 3 0 015.36-1.86M7 20v-2c0-.79.25-1.53.68-2.13m0 0C9.26 14.67 10.58 14 12 14s2.74.67 3.82 1.87M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              }
            >
              {inlineFormat(post.eligibility)}
            </Segment>
          )}

          {post.benefits && (
            <Segment
              title="Benefits & what's on offer"
              icon={
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.05 3.05a1 1 0 011.9 0l1.54 4.78a1 1 0 00.95.69h5.02a1 1 0 01.59 1.8l-4.06 2.95a1 1 0 00-.36 1.12l1.55 4.78a1 1 0 01-1.54 1.12L12.6 16.9a1 1 0 00-1.18 0l-4.06 2.95a1 1 0 01-1.54-1.12l1.55-4.78a1 1 0 00-.36-1.12L2.95 10.32a1 1 0 01.59-1.8h5.02a1 1 0 00.95-.69l1.54-4.78z" />
                </svg>
              }
            >
              {inlineFormat(post.benefits)}
            </Segment>
          )}

          {post.requiredDocuments && (
            <Segment
              title="What to submit"
              icon={
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              }
            >
              {inlineFormat(post.requiredDocuments)}
            </Segment>
          )}

          {post.keyDates && (
            <Segment
              title="Key dates"
              icon={
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            >
              {inlineFormat(post.keyDates)}
            </Segment>
          )}

          <RelatedLinks post={post} />

          {post.howToApply && (
            <div className="mt-8 rounded-2xl bg-emerald-50/70 p-5 dark:bg-emerald-900/20">
              <h2 className="text-sm font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                How to apply
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {inlineFormat(post.howToApply)}
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
                <Link
                  key={t}
                  href={`/posts?tag=${encodeURIComponent(t)}`}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-950 dark:hover:text-emerald-400"
                >
                  #{t}
                </Link>
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
            <PostGrid posts={similar} hideTeaser />
          </div>
        </section>
      )}

      <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
        This listing is provided for information only. {SITE_NAME} does not guarantee
        its accuracy and is not involved in the recruitment or application process.
      </p>

      <PostViewNudge postType={post.type} profession={post.profession} />
    </div>
  );
}
