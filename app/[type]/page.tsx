import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPosts } from "@/lib/posts";
import { POST_TYPE_LABELS, POST_TYPES, type PostType } from "@/lib/types";
import PostBoard from "@/components/PostBoard";
import { SITE_NAME } from "@/lib/site";

const INITIAL_COUNT = 12;

export const dynamic = "force-dynamic";

// Map plural URL slugs ("jobs", "scholarships") -> PostType.
const SLUG_TO_TYPE = Object.fromEntries(
  POST_TYPES.map((t) => [POST_TYPE_LABELS[t].plural.toLowerCase(), t]),
) as Record<string, PostType>;

const META: Record<PostType, { short: string; blurb: string }> = {
  job: {
    short: "Jobs",
    blurb:
      "Jobs in hospitals, clinics, universities, NGOs and government in Uganda — for doctors, nurses, clinical officers, midwives, lab technicians and allied health professionals.",
  },
  internship: {
    short: "Internships",
    blurb:
      "Internships for medical, nursing and allied health students and fresh graduates in Uganda, including hospital rotations and research placements.",
  },
  scholarship: {
    short: "Scholarships",
    blurb:
      "Undergraduate, master's and PhD scholarships open to Ugandans — local and abroad, including Commonwealth, Chevening, Fulbright and Makerere-based schemes.",
  },
  grant: {
    short: "Grants",
    blurb:
      "Research and implementation grants for Ugandan health scientists, institutions and innovators — from global health security to AI and family planning.",
  },
  fellowship: {
    short: "Fellowships",
    blurb:
      "Master's, PhD and post-doctoral fellowships for Ugandan and African health researchers — including CARTA, SANTHE, Fogarty and Makerere programmes.",
  },
  conference: {
    short: "Conferences",
    blurb:
      "Conferences, workshops and continuing professional development events for healthcare professionals in Uganda and East Africa.",
  },
  opportunity: {
    short: "Opportunities",
    blurb:
      "Calls for papers, proposals, training and exchange programmes for Ugandan health workers and researchers.",
  },
  other: {
    short: "Other",
    blurb:
      "Additional training, workshops and opportunities for the Ugandan health workforce — including CPD series and manuscript-writing support.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  const t = SLUG_TO_TYPE[type];
  if (!t) return {};
  const meta = META[t];
  return {
    title: `${t === "job" ? "Medical & Health Jobs in Uganda" : `${meta.short} in Uganda`} (${new Date().getFullYear()})`,
    description: `Browse the latest ${meta.short.toLowerCase()} in Uganda on ${SITE_NAME}. ${meta.blurb}`,
    alternates: {
      canonical: `/${type}`,
      types: { "application/rss+xml": "/posts/feed.xml" },
    },
    openGraph: {
      title: `${t === "job" ? "Medical & Health Jobs in Uganda" : `${meta.short} in Uganda`} · ${SITE_NAME}`,
      description: meta.blurb,
      type: "website",
    },
  };
}

export default async function TypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const t = SLUG_TO_TYPE[type];
  if (!t) notFound();
  const meta = META[t];
  const posts = await getPosts({ type: t });
  const h1 =
    t === "job" ? "Medical & Health Jobs in Uganda" : `${meta.short} in Uganda`;
  const count = posts.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="mb-6 text-xs text-slate-400 dark:text-slate-500">
        <a href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">Home</a>
        <span className="mx-1.5">/</span>
        <a href="/posts" className="hover:text-emerald-700 dark:hover:text-emerald-400">Jobs &amp; Opportunities</a>
        <span className="mx-1.5">/</span>
        <span className="text-slate-600 dark:text-slate-400">{meta.short}</span>
      </nav>

      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {h1}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {meta.blurb} Below {count === 1 ? "is the current listing" : `are the ${count} current ${meta.short.toLowerCase()}`}{" "}
          we&apos;ve found. Check back soon — we update daily.
        </p>
      </header>

      {count === 0 ? (
        <p className="mt-10 text-sm text-slate-500 dark:text-slate-400">
          No {meta.short.toLowerCase()} are open right now. Browse{" "}
          <a href="/posts" className="text-emerald-700 underline dark:text-emerald-400">
            all listings
          </a>
          .
        </p>
      ) : (
        <div className="mt-8">
          <PostBoard initialPosts={posts.slice(0, INITIAL_COUNT)} total={posts.length} type={t} />
        </div>
      )}

      <p className="mt-10 border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        Looking for more? See{" "}
        <a href="/posts" className="text-emerald-700 underline dark:text-emerald-400">
          all {SITE_NAME} listings
        </a>
        , or{" "}
        <a href="/posts/new" className="text-emerald-700 underline dark:text-emerald-400">
          post a new {t === "job" ? "job" : meta.short.toLowerCase().replace(/s$/, "")}
        </a>
        .
      </p>
    </div>
  );
}
