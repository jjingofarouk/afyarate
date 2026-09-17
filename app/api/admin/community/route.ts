import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Unified moderation for the MOHU-merge tables (service role, bypasses RLS).
// GET ?queue=community|applications|reports|broadcasts|organizations|contact
//            |credentials|listing-reports
// PATCH { queue, id, action } — hide|delete, status updates, verify, resolve.
const QUEUES = new Set([
  "community",
  "applications",
  "reports",
  "broadcasts",
  "organizations",
  "contact",
  "credentials",
  "listing-reports",
]);

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();
  const sp = req.nextUrl.searchParams;
  const queue = sp.get("queue") ?? "community";
  if (!QUEUES.has(queue)) {
    return NextResponse.json({ error: "Unknown queue" }, { status: 400 });
  }
  const admin = createAdminClient();
  try {
    switch (queue) {
      case "community": {
        const { data } = await admin
          .from("community_posts")
          .select("id, author_name, body, status, created_at")
          .order("created_at", { ascending: false })
          .limit(30);
        return NextResponse.json({ items: data ?? [] });
      }
      case "applications": {
        const { data } = await admin
          .from("applications")
          .select("id, post_id, applicant_name, applicant_email, cover_note, status, created_at")
          .order("created_at", { ascending: false })
          .limit(30);
        return NextResponse.json({ items: data ?? [] });
      }
      case "reports": {
        const { data } = await admin
          .from("problem_reports")
          .select("id, reporter_name, subject, details, status, created_at")
          .order("created_at", { ascending: false })
          .limit(30);
        return NextResponse.json({ items: data ?? [] });
      }
      case "contact": {
        const { data } = await admin
          .from("contact_messages")
          .select("id, name, email, subject, message, created_at")
          .order("created_at", { ascending: false })
          .limit(30);
        return NextResponse.json({ items: data ?? [] });
      }
      case "broadcasts": {
        const { data } = await admin
          .from("broadcasts")
          .select("id, title, message, audience, is_active, created_at")
          .order("created_at", { ascending: false })
          .limit(20);
        return NextResponse.json({ items: data ?? [] });
      }
      case "credentials": {
        // Reviewer sees the numbers; they are never exposed publicly.
        const { data } = await admin
          .from("professional_credentials")
          .select("id, profile_id, credential_type, credential_name, issuing_body, credential_number, issued_year, status, created_at")
          .order("created_at", { ascending: false })
          .limit(30);
        return NextResponse.json({ items: data ?? [] });
      }
      case "listing-reports": {
        const { data } = await admin
          .from("listing_reports")
          .select("id, post_id, reason, details, status, created_at")
          .order("created_at", { ascending: false })
          .limit(30);
        return NextResponse.json({ items: data ?? [] });
      }
      default: {
        const { data } = await admin
          .from("organizations")
          .select("id, name, website, description, verified, created_at")
          .order("created_at", { ascending: false })
          .limit(30);
        return NextResponse.json({ items: data ?? [] });
      }
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const queue = String(b.queue ?? "");
  const id = Number(b.id);
  const action = String(b.action ?? "");
  if (!QUEUES.has(queue) || !Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const admin = createAdminClient();
  try {
    if (queue === "community") {
      if (action === "hide") {
        await admin.from("community_posts").update({ status: "hidden" }).eq("id", id);
      } else if (action === "restore") {
        await admin.from("community_posts").update({ status: "published" }).eq("id", id);
      } else if (action === "delete") {
        await admin.from("community_posts").delete().eq("id", id);
      } else return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } else if (queue === "applications") {
      const ok = ["reviewing", "shortlisted", "rejected", "hired"].includes(action);
      if (!ok) return NextResponse.json({ error: "Unknown action" }, { status: 400 });
      const { data: appRow } = await admin
        .from("applications")
        .select("id, post_id, profile_id")
        .eq("id", id)
        .maybeSingle();
      await admin.from("applications").update({ status: action }).eq("id", id);
      const ar = appRow as { post_id: number; profile_id: string | null } | null;
      if (ar?.profile_id) {
        const { data: postRow } = await admin
          .from("posts")
          .select("title")
          .eq("id", ar.post_id)
          .maybeSingle();
        const title = (postRow as { title: string } | null)?.title ?? "a listing";
        await admin.from("notifications").insert({
          profile_id: ar.profile_id,
          type: "application_status",
          title: `Your application for “${title}” is now ${action}`,
          body: null,
          link: "/applications",
        });
      }
    } else if (queue === "reports") {
      const ok = ["in_progress", "resolved", "open"].includes(action);
      if (!ok) return NextResponse.json({ error: "Unknown action" }, { status: 400 });
      await admin.from("problem_reports").update({ status: action }).eq("id", id);
    } else if (queue === "organizations") {
      if (action === "verify") {
        await admin.from("organizations").update({ verified: true }).eq("id", id);
      } else if (action === "unverify") {
        await admin.from("organizations").update({ verified: false }).eq("id", id);
      } else return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } else if (queue === "broadcasts") {
      if (action === "deactivate") {
        await admin.from("broadcasts").update({ is_active: false }).eq("id", id);
      } else return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } else if (queue === "credentials") {
      if (!["verified", "rejected", "pending"].includes(action)) {
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
      }
      const { data: cred } = await admin
        .from("professional_credentials")
        .select("profile_id, credential_name")
        .eq("id", id)
        .maybeSingle();
      await admin.from("professional_credentials").update({ status: action }).eq("id", id);
      const cr = cred as { profile_id: string; credential_name: string } | null;
      if (cr) {
        if (action === "verified") {
          // A verified credential earns the reviewed-credentials badge.
          await admin.from("profiles").update({ verified: true }).eq("id", cr.profile_id);
        }
        await admin.from("notifications").insert({
          profile_id: cr.profile_id,
          type: "credential_status",
          title:
            action === "verified"
              ? `Your credential “${cr.credential_name}” was verified`
              : action === "rejected"
                ? `Your credential “${cr.credential_name}” was not accepted`
                : `Your credential “${cr.credential_name}” is back under review`,
          body: null,
          link: "/account",
        });
      }
    } else if (queue === "listing-reports") {
      if (!["reviewing", "resolved", "dismissed", "open"].includes(action)) {
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
      }
      await admin.from("listing_reports").update({ status: action }).eq("id", id);
    } else {
      return NextResponse.json({ error: "Read-only queue" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}

// Admin creates a broadcast announcement.
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const title = typeof b.title === "string" ? b.title.trim().slice(0, 180) : "";
  const message = typeof b.message === "string" ? b.message.trim().slice(0, 10000) : "";
  const audience = typeof b.audience === "string" ? b.audience.trim() : "all";
  if (!title || !message) {
    return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
  }
  if (!["all", "member", "jobseeker", "employer"].includes(audience)) {
    return NextResponse.json({ error: "Invalid audience" }, { status: 400 });
  }
  const admin = createAdminClient();
  const { error } = await admin.from("broadcasts").insert({ title, message, audience });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Broadcast published" }, { status: 201 });
}
