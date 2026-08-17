import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isDbReady } from "@/lib/practitioners";
import { getPostsPage, slugifyListing, type PostSort } from "@/lib/posts";
import { POST_TYPES } from "@/lib/types";

export const dynamic = "force-dynamic";

const POST_SORTS = new Set<PostSort>(["featured", "newest", "closingSoon"]);

// Search + "Load more" pagination for the boards on /posts, /[type],
// /professions/[slug], /locations/[slug] and /organizations/[slug] — reuses
// getPosts' in-memory cache under the hood, so this doesn't add new Supabase
// load per keystroke or click.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const sortParam = sp.get("sort");
  const page = await getPostsPage({
    type: sp.get("type") ?? undefined,
    profession: sp.get("profession") ?? undefined,
    location: sp.get("location") ?? undefined,
    organization: sp.get("organization") ?? undefined,
    tag: sp.get("tag") ?? undefined,
    q: sp.get("q") ?? undefined,
    sort: POST_SORTS.has(sortParam as PostSort) ? (sortParam as PostSort) : undefined,
    offset: Number(sp.get("offset") ?? 0) || 0,
    limit: Number(sp.get("limit") ?? 12) || 12,
  });
  return NextResponse.json(page);
}

// Simple in-memory rate limiter, same approach as the ratings API.
const RATE_LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;
const buckets = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const hits = (buckets.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= RATE_LIMIT) {
    buckets.set(ip, hits);
    return true;
  }
  hits.push(now);
  buckets.set(ip, hits);
  return false;
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd ?? "unknown").split(",")[0].trim();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const str = (v: unknown, max: number): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export async function POST(req: NextRequest) {
  if (!(await isDbReady())) {
    return NextResponse.json({ error: "Database not ready" }, { status: 503 });
  }

  const ip = clientIp(req);
  if (limited(ip)) {
    return NextResponse.json(
      { error: "Too many submissions from this device. Please try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const title = str(b.title, 200);
  const organization = str(b.organization, 200);
  const type = str(b.type, 30);
  const description = str(b.description, 20000);
  const deadline = str(b.deadline, 10);
  const submitterEmail = str(b.submitter_email, 200);

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!organization)
    return NextResponse.json({ error: "Organisation is required" }, { status: 400 });
  if (!POST_TYPES.includes(type as (typeof POST_TYPES)[number]))
    return NextResponse.json({ error: "Invalid listing type" }, { status: 400 });
  if (!description)
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline))
    return NextResponse.json({ error: "Deadline must be a YYYY-MM-DD date" }, { status: 400 });
  if (!submitterEmail)
    return NextResponse.json(
      { error: "A contact email is required so we can follow up about your listing" },
      { status: 400 },
    );
  if (!EMAIL_RE.test(submitterEmail))
    return NextResponse.json({ error: "Please enter a valid contact email" }, { status: 400 });

  const slug = slugifyListing(title, deadline || null);

  const supabase = createServerClient();

  // Reject duplicates: same slug already in the queue or live.
  const { data: existing } = await supabase.from("posts").select("id").eq("slug", slug).maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: "This listing has already been submitted." },
      { status: 409 },
    );
  }

  const fields = [
    "type", "title", "organization", "category", "profession", "location",
    "employment_type", "experience_level", "salary", "summary", "description",
    "how_to_apply", "application_url", "application_email", "deadline",
    "benefits", "required_documents", "key_dates",
    "source_name", "source_url", "image_url",
    "submitter_name", "submitter_email",
  ];
  const insert: Record<string, unknown> = {
    slug,
    type,
    title,
    organization,
    description,
    search_text: [
      title, organization, b.category, b.profession, b.location, b.summary,
      description, b.salary,
    ]
      .filter((v) => typeof v === "string" && v.trim())
      .join(" ")
      .toLowerCase(),
  };
  for (const f of fields) {
    if (f === "type" || f === "title" || f === "organization" || f === "description") continue;
    const v = b[f] ?? b[f.replace(/_/g, "")];
    if (typeof v === "string" && v.trim()) insert[f] = v.trim().slice(0, 2000);
  }
  if (b.tags && Array.isArray(b.tags)) {
    insert.tags = (b.tags as unknown[]).filter((t) => typeof t === "string").slice(0, 10);
  }

  // NOTE: no .select()/.single() here. The SELECT RLS policy only exposes
  // status='published' rows, so a RETURNING clause re-checks the fresh draft
  // against that policy and fails with 42501 ("new row violates row-level
  // security policy"). The frontend only needs success/failure, not the row.
  const { error } = await supabase
    .from("posts")
    .insert({ ...insert, status: "draft" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { message: "Thanks! Your listing is submitted for review." },
    { status: 201 },
  );
}
