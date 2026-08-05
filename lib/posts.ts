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

/** Published listings that are still open (deadline in the future or none). */
export async function getPosts(opts: PostSearchOptions = {}): Promise<Post[]> {
  const supabase = createServerClient();
  const today = new Date().toISOString().slice(0, 10);
  let query = supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .or(`deadline.is.null,deadline.gte.${today}`);
  if (opts.type && POST_TYPES.has(opts.type)) {
    query = query.eq("type", opts.type);
  }
  query = query
    .order("featured", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false });
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).map(mapPost);
}

export async function getPost(slug: string): Promise<Post | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapPost(data as Row) : null;
}
