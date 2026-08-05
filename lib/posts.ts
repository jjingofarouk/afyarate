import { createServerClient } from "./supabase/server";
import type { Post } from "./types";

// PostgREST returns snake_case columns; map them to the camelCase UI types.
type Row = Record<string, unknown>;

function asString(v: unknown): string | null {
  return typeof v === "string" && v !== "" ? v : null;
}

function mapPost(row: Row): Post {
  return {
    id: Number(row.id),
    slug: String(row.slug ?? ""),
    type: (row.type as Post["type"]) ?? "job",
    title: String(row.title ?? ""),
    organization: String(row.organization ?? ""),
    category: asString(row.category),
    profession: asString(row.profession),
    location: asString(row.location),
    country: asString(row.country) ?? "Uganda",
    employmentType: asString(row.employment_type),
    experienceLevel: asString(row.experience_level),
    qualification: asString(row.qualification),
    eligibility: asString(row.eligibility),
    salary: asString(row.salary),
    description: String(row.description ?? ""),
    summary: asString(row.summary),
    howToApply: asString(row.how_to_apply),
    applicationUrl: asString(row.application_url),
    applicationEmail: asString(row.application_email),
    deadline: asString(row.deadline),
    sourceName: asString(row.source_name),
    sourceUrl: asString(row.source_url),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    featured: Boolean(row.featured),
    status: (row.status as Post["status"]) ?? "draft",
    publishedAt: asString(row.published_at),
    views: Number(row.views ?? 0),
    imageUrl: asString(row.image_url),
  };
}

export interface PostSearchOptions {
  type?: string;
}

const POST_TYPES = new Set([
  "job",
  "internship",
  "scholarship",
  "grant",
  "fellowship",
  "conference",
  "opportunity",
  "other",
]);

// Module-scoped caches: survive for the lifetime of a warm Worker isolate, so
// the board and detail pages stop hitting Supabase on every request. Reset on
// cold start — fine, this is a best-effort cut in query volume, not a
// guarantee. New/edited listings appear once the TTL elapses.
const POSTS_TTL_MS = 5 * 60 * 1000; // 5 minutes
const POST_TTL_MS = 10 * 60 * 1000; // 10 minutes
let postsCache: { data: Post[]; expires: number } | null = null;
const postCache = new Map<string, { data: Post | null; expires: number }>();

/** All published listings, including ones whose deadline has passed (the card
 *  marks those as "Closed"). Cached in the worker; filtered by type in memory. */
export async function getPosts(opts: PostSearchOptions = {}): Promise<Post[]> {
  const { type } = opts;
  let posts = postsCache && postsCache.expires > Date.now() ? postsCache.data : null;
  if (!posts) {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("status", "published")
      .order("featured", { ascending: false })
      .order("published_at", { ascending: false, nullsFirst: false });
    if (error) throw new Error(error.message);
    posts = ((data ?? []) as Row[]).map(mapPost);
    postsCache = { data: posts, expires: Date.now() + POSTS_TTL_MS };
  }
  if (type && POST_TYPES.has(type)) return posts.filter((p) => p.type === type);
  return posts;
}

export async function getPost(slug: string): Promise<Post | null> {
  const hit = postCache.get(slug);
  if (hit && hit.expires > Date.now()) return hit.data;
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const post: Post | null = data ? mapPost(data as Row) : null;
  // Cache misses briefly too, so a missing slug isn't re-queried on every hit.
  postCache.set(slug, { data: post, expires: Date.now() + POST_TTL_MS });
  return post;
}
