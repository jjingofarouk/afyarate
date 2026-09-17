import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUserId } from "@/lib/auth-server";
import { str, UUID_RE } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// One-time upgrade: move everything from a legacy handle (localStorage uuid)
// onto the logged-in user's id, then delete the old profile row.
export async function POST(req: NextRequest) {
  const userId = await getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const legacy = str((body as Record<string, unknown>).legacyProfileId, 40);
  if (!UUID_RE.test(legacy) || legacy === userId) {
    return NextResponse.json({ error: "Invalid handle" }, { status: 400 });
  }

  let admin: SupabaseClient;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const moved: Record<string, number> = {};
  // Simple foreign keys: re-point.
  const simple: [string, string][] = [
    ["seeker_profiles", "profile_id"],
    ["applications", "profile_id"],
    ["documents", "profile_id"],
    ["community_posts", "profile_id"],
    ["community_comments", "profile_id"],
    ["health_updates", "profile_id"],
    ["health_update_comments", "profile_id"],
    ["platform_feedback", "profile_id"],
    ["problem_reports", "profile_id"],
    ["notifications", "profile_id"],
    ["connection_requests", "sender_profile_id"],
    ["connection_requests", "recipient_profile_id"],
    ["request_messages", "sender_profile_id"],
    ["dm_messages", "sender_profile_id"],
    ["organizations", "owner_profile_id"],
    ["posts", "owner_profile_id"],
  ];
  for (const [table, col] of simple) {
    try {
      if (table === "seeker_profiles") {
        // Single row per profile: keep the account's row if both exist.
        const { data: target } = await admin
          .from(table)
          .select("profile_id")
          .eq("profile_id", userId)
          .maybeSingle();
        if (target) {
          await admin.from(table).delete().eq("profile_id", legacy);
          continue;
        }
      }
      const { data } = await admin.from(table).update({ [col]: userId }).eq(col, legacy).select("id");
      // seeker_profiles has no id column; count via a second query fallback.
      moved[table] = Array.isArray(data) ? data.length : (moved[table] ?? 0);
    } catch {
      // Best effort per table.
    }
  }
  // Pair keys (likes/follows/saved/reads/votes): insert-ignore then delete, so
  // double-actions with both identities collapse instead of conflicting.
  const pairs: [string, string, string][] = [
    ["saved_listings", "profile_id", "post_id"],
    ["community_likes", "profile_id", "post_id"],
    ["health_update_likes", "profile_id", "update_id"],
    ["broadcast_reads", "profile_id", "broadcast_id"],
    ["feedback_votes", "profile_id", "feedback_id"],
  ];
  for (const [table, me, other] of pairs) {
    try {
      const cols = `${me}, ${other}`;
      const { data: rows } = await admin.from(table).select(cols).eq(me, legacy);
      const list = ((rows ?? []) as unknown) as Record<string, unknown>[];
      for (const r of list) {
        await admin
          .from(table)
          .upsert({ [me]: userId, [other]: r[other] }, { onConflict: `${me},${other}`, ignoreDuplicates: true });
      }
      await admin.from(table).delete().eq(me, legacy);
      moved[table] = list.length;
    } catch {
      // Best effort.
    }
  }
  // Follows touch two columns.
  try {
    const { data: rows } = await admin
      .from("follows")
      .select("follower_profile_id, followed_profile_id")
      .or(`follower_profile_id.eq.${legacy},followed_profile_id.eq.${legacy}`);
    for (const r of ((rows ?? []) as Record<string, unknown>[])) {
      const f = String(r.follower_profile_id) === legacy ? userId : String(r.follower_profile_id);
      const t = String(r.followed_profile_id) === legacy ? userId : String(r.followed_profile_id);
      if (f === t) continue;
      await admin.from("follows").upsert(
        { follower_profile_id: f, followed_profile_id: t },
        { onConflict: "follower_profile_id,followed_profile_id", ignoreDuplicates: true },
      );
    }
    await admin.from("follows").delete().eq("follower_profile_id", legacy);
    await admin.from("follows").delete().eq("followed_profile_id", legacy);
  } catch {
    // Best effort.
  }
  // Drop the legacy profile row itself.
  try {
    await admin.from("profiles").delete().eq("id", legacy);
  } catch {
    // Best effort.
  }
  return NextResponse.json({ moved });
}
