import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  createAdminPost,
  listAllPosts,
  sanitizePostInput,
  PostApiError,
} from "@/lib/admin-posts";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function apiError(err: unknown) {
  if (err instanceof PostApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("admin/posts API error:", err);
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}

// List all posts (any status) for the admin manager / moderation queue.
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();
  try {
    const sp = req.nextUrl.searchParams;
    const page = await listAllPosts({
      status: sp.get("status") ?? undefined,
      type: sp.get("type") ?? undefined,
      q: sp.get("q") ?? undefined,
      offset: Number(sp.get("offset") ?? 0) || 0,
      limit: Number(sp.get("limit") ?? 20) || 20,
    });
    return NextResponse.json(page);
  } catch (err) {
    return apiError(err);
  }
}

// Create a listing directly as admin. Defaults to published unless the body
// explicitly says status: "draft".
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const row = sanitizePostInput((body ?? {}) as Record<string, unknown>);
    if (!row.status) row.status = "published";
    const post = await createAdminPost(row);
    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    return apiError(err);
  }
}
