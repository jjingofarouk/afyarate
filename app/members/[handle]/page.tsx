import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import MemberActions from "@/components/MemberActions";
import { SITE_URL } from "@/lib/site";
import { BadgeCheck } from "lucide-react";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  return {
    title: `@${handle} on MOHU`,
    alternates: { canonical: `/members/${handle}` },
  };
}

export default async function MemberPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const supabase = createServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, handle, display_name, role, cadre, location, bio, verified, created_at")
    .eq("handle", handle.toLowerCase())
    .maybeSingle();
  if (!profile) notFound();
  const p = profile as Row;
  const pid = String(p.id);

  const [{ count: followers }, { count: following }, { data: posts }, { data: seeker }] =
    await Promise.all([
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("followed_profile_id", pid),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_profile_id", pid),
      supabase
        .from("community_posts")
        .select("id, body, created_at")
        .eq("profile_id", pid)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase.from("seeker_profiles").select("seeking_title, public_summary, availability").eq("profile_id", pid).eq("active", true).maybeSingle(),
    ]);

  const s = seeker as Row | null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: String(p.display_name ?? handle),
      url: `${SITE_URL}/members/${handle}`,
    },
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <span className="grid size-16 place-items-center rounded-full bg-emerald-100 text-2xl font-black text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
            {String(p.display_name ?? handle).slice(0, 1).toUpperCase()}
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {String(p.display_name ?? handle)}{" "}
              {(p.verified as boolean) && <BadgeCheck className="inline size-5 align-[-0.2em] text-emerald-600" aria-label="Verified" />}
            </h1>
            <p className="text-sm text-slate-500">
              @{String(p.handle)} · {String(p.role ?? "member")}
              {[p.cadre, p.location].filter(Boolean).map(String).join(" · ") && ` · ${[p.cadre, p.location].filter(Boolean).join(" · ")}`}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {followers ?? 0} followers · {following ?? 0} following
            </p>
          </div>
        </div>
        {(p.bio as string) && (
          <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{String(p.bio)}</p>
        )}
        {s && (
          <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm dark:bg-emerald-950/30">
            <p className="font-semibold text-emerald-800 dark:text-emerald-300">
              Open to work{s.seeking_title ? `: ${String(s.seeking_title)}` : ""}
            </p>
            {s.public_summary ? <p className="mt-1 text-slate-600 dark:text-slate-400">{String(s.public_summary)}</p> : null}
            <Link href="/seeking" className="mt-1 inline-block text-emerald-700 underline">
              See all jobseekers →
            </Link>
          </div>
        )}
        <div className="mt-4">
          <MemberActions targetProfileId={pid} />
        </div>
      </div>

      <h2 className="mt-8 font-semibold">Recent posts</h2>
      {((posts ?? []) as Row[]).length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No public posts yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {((posts ?? []) as Row[]).map((post) => (
            <li key={Number(post.id)} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="whitespace-pre-wrap">{String(post.body ?? "")}</p>
              <p className="mt-1 text-xs text-slate-400">
                {new Date(String(post.created_at ?? "")).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
