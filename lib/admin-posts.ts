import { createAdminClient } from "./supabase/admin";
import { mapPost, slugifyListing, type Row } from "./posts";
import { POST_TYPES, type Post, type PostType } from "./types";

/** Moderation states a post can be in. `draft` = pending review. */
export const POST_STATUSES = [
  "draft",
  "published",
  "expired",
  "archived",
  "rejected",
] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

const POST_TYPES_SET = new Set<string>(POST_TYPES);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Error carrying an HTTP status so API routes can map it to a response. */
export class PostApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "PostApiError";
    this.status = status;
  }
}

// Every writable text column. Only keys present in the input are touched, so
// partial updates (PATCH) never clobber fields the client didn't send.
const STR_FIELDS = [
  "category",
  "profession",
  "location",
  "country",
  "employment_type",
  "experience_level",
  "qualification",
  "eligibility",
  "salary",
  "summary",
  "how_to_apply",
  "application_url",
  "application_email",
  "deadline",
  "source_name",
  "source_url",
  "submitter_name",
  "submitter_email",
  "rejection_reason",
] as const;

/**
 * Clean + validate raw JSON into a PostgREST row for insert/update.
 * Non-partial (create): required fields are enforced and search_text rebuilt.
 * Partial (PATCH): only keys present in the input are validated/touched, so
 * moderation actions (publish/reject) never clobber existing content.
 * Throws PostApiError with a user-facing message + HTTP status on bad input.
 */
export function sanitizePostInput(
  b: Record<string, unknown>,
  opts: { partial?: boolean } = {},
): Record<string, unknown> {
  const partial = opts.partial ?? false;
  const has = (k: string) => k in b;

  const str = (k: string, max: number): string =>
    typeof b[k] === "string" ? (b[k] as string).trim().slice(0, max) : "";
  const nullable = (k: string, max: number): string | null => {
    const v = str(k, max);
    return v === "" ? null : v;
  };

  const type = str("type", 30);
  const title = str("title", 200);
  const organization = str("organization", 200);
  const description = str("description", 20000);
  const deadline = str("deadline", 10);
  const submitterEmail = str("submitter_email", 200);

  if (has("type") && !POST_TYPES_SET.has(type))
    throw new PostApiError(400, "Invalid listing type.");
  if (has("title") && !title) throw new PostApiError(400, "Title cannot be empty.");
  if (has("organization") && !organization)
    throw new PostApiError(400, "Organisation cannot be empty.");
  if (has("description") && !description)
    throw new PostApiError(400, "Description cannot be empty.");
  if (!partial) {
    if (!title) throw new PostApiError(400, "Title is required.");
    if (!organization) throw new PostApiError(400, "Organisation is required.");
    if (!description) throw new PostApiError(400, "Description is required.");
  }
  if (deadline && !DATE_RE.test(deadline))
    throw new PostApiError(400, "Deadline must be a YYYY-MM-DD date.");
  if (submitterEmail && !EMAIL_RE.test(submitterEmail))
    throw new PostApiError(400, "Submitter email looks invalid.");

  const row: Record<string, unknown> = {};
  if (has("type")) row.type = type;
  if (has("title")) row.title = title;
  if (has("organization")) row.organization = organization;
  if (has("description")) row.description = description;

  for (const f of STR_FIELDS) {
    if (!(f in b)) continue;
    row[f] = nullable(f, 2000);
  }
  if (submitterEmail) row.submitter_email = submitterEmail;
  if (deadline) row.deadline = deadline;

  if ("tags" in b) {
    row.tags = Array.isArray(b.tags)
      ? (b.tags as unknown[]).filter((t): t is string => typeof t === "string").slice(0, 10)
      : [];
  }
  if (typeof b.featured === "boolean") row.featured = b.featured;
  if ("image_url" in b) {
    row.image_url =
      typeof b.image_url === "string" && b.image_url.trim()
        ? b.image_url.trim().slice(0, 500)
        : null;
  }
  if (typeof b.status === "string" && (POST_STATUSES as readonly string[]).includes(b.status)) {
    row.status = b.status;
  }

  if (!partial) {
    row.search_text = [
      title,
      organization,
      row.category,
      row.profession,
      row.location,
      row.summary,
      description,
      row.salary,
      row.qualification,
      row.eligibility,
    ]
      .filter((v) => typeof v === "string" && (v as string).trim())
      .join(" ")
      .toLowerCase();
  }

  return row;
}

export interface AdminListOptions {
  status?: string;
  type?: string;
  q?: string;
  offset?: number;
  limit?: number;
}

export async function listAllPosts(
  opts: AdminListOptions = {},
): Promise<{ items: Post[]; total: number }> {
  const supabase = createAdminClient();
  let query = supabase.from("posts").select("*", { count: "exact" });

  if (opts.status && (POST_STATUSES as readonly string[]).includes(opts.status)) {
    query = query.eq("status", opts.status);
  }
  if (opts.type && POST_TYPES_SET.has(opts.type)) {
    query = query.eq("type", opts.type);
  }
  const q = (opts.q ?? "").trim();
  if (q) {
    const like = `%${q}%`;
    query = query.or(
      `title.ilike.${like},organization.ilike.${like},search_text.ilike.${like}`,
    );
  }
  query = query.order("created_at", { ascending: false });

  const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
  const offset = Math.max(0, opts.offset ?? 0);
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw new PostApiError(500, error.message);
  return {
    items: ((data ?? []) as unknown as Row[]).map(mapPost),
    total: count ?? 0,
  };
}

export async function getAdminPost(id: number | string): Promise<Post | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", Number(id))
    .maybeSingle();
  if (error) throw new PostApiError(500, error.message);
  return data ? mapPost(data as Row) : null;
}

export async function createAdminPost(
  input: Record<string, unknown>,
): Promise<Post> {
  const supabase = createAdminClient();
  const slug = slugifyListing(
    String(input.title ?? ""),
    typeof input.deadline === "string" && input.deadline ? input.deadline : null,
  );

  const { data: existing } = await supabase
    .from("posts")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) {
    throw new PostApiError(
      409,
      "A listing with this title and deadline already exists.",
    );
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({ ...input, slug })
    .select("*")
    .single();
  if (error) throw new PostApiError(500, error.message);
  return mapPost(data as Row);
}

export async function updateAdminPost(
  id: number | string,
  changes: Record<string, unknown>,
): Promise<Post> {
  const supabase = createAdminClient();
  const numId = Number(id);
  const patch: Record<string, unknown> = {
    ...changes,
    updated_at: new Date().toISOString(),
  };

  if (patch.status === "published") {
    patch.rejection_reason = null;
    const { data: cur } = await supabase
      .from("posts")
      .select("published_at")
      .eq("id", numId)
      .maybeSingle();
    if (!cur?.published_at) patch.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("posts")
    .update(patch)
    .eq("id", numId)
    .select("*")
    .single();
  if (error) throw new PostApiError(500, error.message);
  return mapPost(data as Row);
}

export async function deleteAdminPost(id: number | string): Promise<void> {
  const supabase = createAdminClient();
  const numId = Number(id);
  const { data: post } = await supabase
    .from("posts")
    .select("image_url")
    .eq("id", numId)
    .maybeSingle();
  if (post?.image_url) await deleteStorageImage(post.image_url as string);

  const { error } = await supabase.from("posts").delete().eq("id", numId);
  if (error) throw new PostApiError(500, error.message);
}

/** Best-effort removal of a listing photo from the post-images bucket. */
export async function deleteStorageImage(image: string | null | undefined): Promise<void> {
  if (!image) return;
  const marker = "/post-images/";
  const i = image.indexOf(marker);
  if (i === -1) return;
  const path = image.slice(i + marker.length).split("?")[0];
  if (!path) return;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.storage.from("post-images").remove([path]);
    if (error) throw error;
  } catch {
    // Non-fatal — an orphaned object is harmless; the row is still updated.
  }
}
