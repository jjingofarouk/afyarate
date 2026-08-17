import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  deleteAdminPost,
  deleteStorageImage,
  getAdminPost,
  sanitizePostInput,
  updateAdminPost,
  PostApiError,
} from "@/lib/admin-posts";
import { purgePostSlugs } from "@/lib/cache";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function apiError(err: unknown) {
  if (err instanceof PostApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("admin/posts/[id] API error:", err);
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}

type Params = Promise<{ id: string }>;

// Load a single listing (any status) for the admin edit screen.
export async function GET(req: NextRequest, { params }: { params: Params }) {
  if (!isAdminRequest(req)) return unauthorized();
  const { id } = await params;
  try {
    const post = await getAdminPost(id);
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ post });
  } catch (err) {
    return apiError(err);
  }
}

/**
 * PATCH — update content and/or apply a moderation action:
 *   action: "publish" | "reject" | "unpublish" | "archive" | "expire"
 *   + optional content fields (partial), rejection_reason (for reject),
 *     featured (bool), delete_image_path (remove an uploaded photo).
 */
export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  if (!isAdminRequest(req)) return unauthorized();
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const b = (body ?? {}) as Record<string, unknown>;
    const changes: Record<string, unknown> = {};

    // Remove an uploaded photo from storage (client sends the storage path).
    if (typeof b.delete_image_path === "string" && b.delete_image_path.trim()) {
      await deleteStorageImage(`/post-images/${b.delete_image_path.trim()}`);
      changes.image_url = null;
    }

    // Sanitize + merge any content fields present in the body (partial mode —
    // moderation actions don't have to resend the full listing).
    const { delete_image_path: _ignored, action: _action, rejection_reason: _rr, ...content } = b;
    Object.assign(changes, sanitizePostInput(content, { partial: true }));

    // Moderation action takes precedence over a bare status field.
    const action = typeof b.action === "string" ? b.action : "";
    if (action === "reject") {
      changes.status = "rejected";
      const reason = typeof b.rejection_reason === "string" ? b.rejection_reason.trim() : "";
      if (!reason)
        return NextResponse.json(
          { error: "Please provide a reason when rejecting a listing." },
          { status: 400 },
        );
      changes.rejection_reason = reason.slice(0, 1000);
    } else if (action === "publish") {
      changes.status = "published";
    } else if (action === "unpublish") {
      changes.status = "draft";
    } else if (action === "archive") {
      changes.status = "archived";
    } else if (action === "expire") {
      changes.status = "expired";
    }

    const post = await updateAdminPost(id, changes);
    // Evict the Cloudflare edge cache so the updated page is served immediately.
    await purgePostSlugs([post.slug]);
    return NextResponse.json({ post });
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  if (!isAdminRequest(req)) return unauthorized();
  const { id } = await params;
  try {
    // Fetch slug before deletion so we can purge the edge cache.
    const post = await getAdminPost(id);
    await deleteAdminPost(id);
    if (post) await purgePostSlugs([post.slug]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}
