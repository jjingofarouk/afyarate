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
  profession?: string; // profession slug
  location?: string; // location slug
  organization?: string; // organization slug
}

/** Slugify for facet URLs (/professions/medical-officer etc.). */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export interface FacetItem {
  slug: string;
  label: string;
  count: number;
}

function buildFacet(posts: Post[], pick: (p: Post) => string | null): FacetItem[] {
  const map = new Map<string, FacetItem>();
  for (const p of posts) {
    const raw = pick(p);
    if (!raw) continue;
    const label = raw.trim();
    if (!label) continue;
    const slug = slugify(label);
    const item = map.get(slug);
    if (item) item.count++;
    else map.set(slug, { slug, label, count: 1 });
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export async function getProfessions(): Promise<FacetItem[]> {
  return buildFacet(await getPosts(), (p) => p.profession);
}

export async function getLocations(): Promise<FacetItem[]> {
  return buildFacet(await getPosts(), (p) => p.location);
}

export async function getOrganizations(): Promise<FacetItem[]> {
  return buildFacet(await getPosts(), (p) => p.organization);
}

function slugMatches(slug: string | undefined, value: string | null): boolean {
  return !!slug && !!value && slugify(value) === slug;
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

// Card/list views (and the facet builders above) only ever read these fields —
// never the long detail-only ones (description, eligibility, howToApply...).
// Selecting just this set keeps the cached array — and every page's payload —
// a fraction of the size of a full `select("*")`.
const LIST_COLUMNS =
  "id, slug, type, title, organization, category, profession, location, country, " +
  "deadline, salary, featured, status, published_at, image_url";

/** All published listings, including ones whose deadline has passed (the card
 *  marks those as "Closed"). Cached in the worker; filtered by type in memory. */
export async function getPosts(opts: PostSearchOptions = {}): Promise<Post[]> {
  const { type, profession, location, organization } = opts;
  let posts = postsCache && postsCache.expires > Date.now() ? postsCache.data : null;
  if (!posts) {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("posts")
      .select(LIST_COLUMNS)
      .eq("status", "published")
      .order("featured", { ascending: false })
      .order("published_at", { ascending: false, nullsFirst: false });
    if (error) throw new Error(error.message);
    posts = ((data ?? []) as unknown as Row[]).map(mapPost);
    postsCache = { data: posts, expires: Date.now() + POSTS_TTL_MS };
  }
  if (type && POST_TYPES.has(type)) posts = posts.filter((p) => p.type === type);
  if (profession) posts = posts.filter((p) => slugMatches(profession, p.profession));
  if (location) posts = posts.filter((p) => slugMatches(location, p.location));
  if (organization) posts = posts.filter((p) => slugMatches(organization, p.organization));
  return posts;
}

export interface PagedPosts {
  items: Post[];
  total: number;
}

/** Same filtering as getPosts, sliced server-side for "load more" pagination. */
export async function getPostsPage(
  opts: PostSearchOptions & { offset?: number; limit?: number },
): Promise<PagedPosts> {
  const all = await getPosts(opts);
  const offset = Math.max(0, opts.offset ?? 0);
  const limit = Math.min(50, Math.max(1, opts.limit ?? 12));
  return { items: all.slice(offset, offset + limit), total: all.length };
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
