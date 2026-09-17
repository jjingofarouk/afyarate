import { createServerClient } from "./supabase/server";
import type {
  Broadcast,
  CommunityComment,
  CommunityPost,
  DmMessage,
  DmThread,
  HealthUpdate,
  PlatformFeedback,
} from "./types";

type Row = Record<string, unknown>;

const str = (v: unknown): string | null =>
  typeof v === "string" && v !== "" ? v : null;

// ---------------------------------------------------------------------------
// Community feed.
// ---------------------------------------------------------------------------

export async function getCommunityPosts(
  profileId?: string,
  limit = 30,
): Promise<CommunityPost[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("community_posts")
    .select("id, profile_id, author_name, body, visibility, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  const posts = (data ?? []) as Row[];
  if (posts.length === 0) return [];
  const ids = posts.map((p) => Number(p.id));
  const [{ data: likes }, { data: comments }, myLikes] = await Promise.all([
    supabase.from("community_likes").select("post_id").in("post_id", ids),
    supabase.from("community_comments").select("post_id").eq("status", "published").in("post_id", ids),
    profileId
      ? supabase
          .from("community_likes")
          .select("post_id")
          .eq("profile_id", profileId)
          .in("post_id", ids)
      : Promise.resolve({ data: [] as Row[] }),
  ]);
  const likeCount = new Map<number, number>();
  for (const l of (likes ?? []) as Row[]) {
    const id = Number(l.post_id);
    likeCount.set(id, (likeCount.get(id) ?? 0) + 1);
  }
  const commentCount = new Map<number, number>();
  for (const c of (comments ?? []) as Row[]) {
    const id = Number(c.post_id);
    commentCount.set(id, (commentCount.get(id) ?? 0) + 1);
  }
  const liked = new Set(((myLikes?.data ?? []) as Row[]).map((l) => Number(l.post_id)));
  const handles = new Map<string, string>();
  const authorIds = [...new Set(posts.map((p) => str(p.profile_id)).filter((v): v is string => !!v))];
  if (authorIds.length > 0) {
    const { data: profs } = await supabase.from("profiles").select("id, handle").in("id", authorIds);
    for (const pr of ((profs ?? []) as Row[])) handles.set(String(pr.id), String(pr.handle ?? ""));
  }
  return posts.map((p) => {
    const id = Number(p.id);
    return {
      id,
      profileId: str(p.profile_id),
      authorName: String(p.author_name ?? "Member"),
      authorHandle: str(p.profile_id) ? (handles.get(str(p.profile_id) as string) ?? null) : null,
      body: String(p.body ?? ""),
      visibility: (p.visibility as CommunityPost["visibility"]) ?? "public",
      likeCount: likeCount.get(id) ?? 0,
      commentCount: commentCount.get(id) ?? 0,
      likedByMe: liked.has(id),
      createdAt: String(p.created_at ?? ""),
    };
  });
}

export async function getCommunityComments(postId: number): Promise<CommunityComment[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("community_comments")
    .select("id, post_id, author_name, body, created_at")
    .eq("post_id", postId)
    .eq("status", "published")
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).map((c) => ({
    id: Number(c.id),
    postId: Number(c.post_id),
    authorName: String(c.author_name ?? "Member"),
    body: String(c.body ?? ""),
    createdAt: String(c.created_at ?? ""),
  }));
}

// ---------------------------------------------------------------------------
// Direct messages.
// ---------------------------------------------------------------------------

export async function getDmThreads(profileId: string): Promise<DmThread[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("dm_threads")
    .select("id, participant_a, participant_b, updated_at")
    .or(`participant_a.eq.${profileId},participant_b.eq.${profileId}`)
    .order("updated_at", { ascending: false })
    .limit(30);
  if (error) throw new Error(error.message);
  const threads = (data ?? []) as Row[];
  if (threads.length === 0) return [];
  const otherIds = threads.map((t) =>
    String(t.participant_a === profileId ? t.participant_b : t.participant_a),
  );
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", otherIds);
  const names = new Map(((profiles ?? []) as Row[]).map((p) => [String(p.id), String(p.display_name)]));
  const ids = threads.map((t) => Number(t.id));
  const { data: lastMsgs } = await supabase
    .from("dm_messages")
    .select("thread_id, body, sender_profile_id, read_at")
    .in("thread_id", ids)
    .order("id", { ascending: false })
    .limit(ids.length * 5);
  const last = new Map<number, Row>();
  const unread = new Map<number, number>();
  for (const m of ((lastMsgs ?? []) as Row[]).reverse()) {
    last.set(Number(m.thread_id), m);
  }
  for (const m of (lastMsgs ?? []) as Row[]) {
    if (String(m.sender_profile_id) !== profileId && !m.read_at) {
      const id = Number(m.thread_id);
      unread.set(id, (unread.get(id) ?? 0) + 1);
    }
  }
  return threads.map((t) => {
    const id = Number(t.id);
    const other = String(t.participant_a === profileId ? t.participant_b : t.participant_a);
    return {
      id,
      otherProfileId: other,
      otherName: names.get(other) ?? "Member",
      lastBody: last.has(id) ? String((last.get(id) as Row).body ?? "") : null,
      unread: unread.get(id) ?? 0,
      updatedAt: String(t.updated_at ?? ""),
    };
  });
}

export async function getDmMessages(threadId: number, profileId: string): Promise<DmMessage[]> {
  const supabase = createServerClient();
  const { data: thread } = await supabase
    .from("dm_threads")
    .select("participant_a, participant_b")
    .eq("id", threadId)
    .maybeSingle();
  if (!thread) return [];
  const t = thread as Row;
  if (String(t.participant_a) !== profileId && String(t.participant_b) !== profileId) return [];
  const { data, error } = await supabase
    .from("dm_messages")
    .select("id, thread_id, sender_profile_id, sender_name, body, created_at")
    .eq("thread_id", threadId)
    .order("id", { ascending: true })
    .limit(200);
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).map((m) => ({
    id: Number(m.id),
    threadId: Number(m.thread_id),
    senderProfileId: str(m.sender_profile_id),
    senderName: String(m.sender_name ?? "Member"),
    body: String(m.body ?? ""),
    mine: String(m.sender_profile_id) === profileId,
    createdAt: String(m.created_at ?? ""),
  }));
}

// ---------------------------------------------------------------------------
// Health updates, broadcasts, feedback.
// ---------------------------------------------------------------------------

export async function getHealthUpdates(profileId?: string, limit = 20): Promise<HealthUpdate[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("health_updates")
    .select("id, author_name, title, body, source_url, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  const updates = (data ?? []) as Row[];
  if (updates.length === 0) return [];
  const ids = updates.map((u) => Number(u.id));
  const [{ data: likes }, { data: comments }, myLikes] = await Promise.all([
    supabase.from("health_update_likes").select("update_id").in("update_id", ids),
    supabase.from("health_update_comments").select("update_id").eq("status", "published").in("update_id", ids),
    profileId
      ? supabase.from("health_update_likes").select("update_id").eq("profile_id", profileId).in("update_id", ids)
      : Promise.resolve({ data: [] as Row[] }),
  ]);
  const likeCount = new Map<number, number>();
  for (const l of (likes ?? []) as Row[]) {
    const id = Number(l.update_id);
    likeCount.set(id, (likeCount.get(id) ?? 0) + 1);
  }
  const commentCount = new Map<number, number>();
  for (const c of (comments ?? []) as Row[]) {
    const id = Number(c.update_id);
    commentCount.set(id, (commentCount.get(id) ?? 0) + 1);
  }
  const liked = new Set(((myLikes?.data ?? []) as Row[]).map((l) => Number(l.update_id)));
  return updates.map((u) => {
    const id = Number(u.id);
    return {
      id,
      authorName: String(u.author_name ?? "Member"),
      title: String(u.title ?? ""),
      body: String(u.body ?? ""),
      sourceUrl: str(u.source_url),
      likeCount: likeCount.get(id) ?? 0,
      commentCount: commentCount.get(id) ?? 0,
      likedByMe: liked.has(id),
      createdAt: String(u.created_at ?? ""),
    };
  });
}

export async function getBroadcasts(profileId?: string): Promise<Broadcast[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("broadcasts")
    .select("id, title, message, audience, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Row[];
  let read = new Set<number>();
  if (profileId && rows.length > 0) {
    const { data: reads } = await supabase
      .from("broadcast_reads")
      .select("broadcast_id")
      .eq("profile_id", profileId);
    read = new Set(((reads ?? []) as Row[]).map((r) => Number(r.broadcast_id)));
  }
  return rows.map((b) => ({
    id: Number(b.id),
    title: String(b.title ?? ""),
    message: String(b.message ?? ""),
    audience: String(b.audience ?? "all"),
    read: read.has(Number(b.id)),
    createdAt: String(b.created_at ?? ""),
  }));
}

export async function getFeedback(limit = 10): Promise<PlatformFeedback[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("platform_feedback")
    .select("id, author_name, rating, feedback_text, created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Row[];
  if (rows.length === 0) return [];
  const ids = rows.map((f) => Number(f.id));
  const { data: votes } = await supabase
    .from("feedback_votes")
    .select("feedback_id, vote")
    .in("feedback_id", ids);
  const helpful = new Map<number, number>();
  const notHelpful = new Map<number, number>();
  for (const v of ((votes ?? []) as Row[])) {
    const id = Number(v.feedback_id);
    if (Number(v.vote) === 1) helpful.set(id, (helpful.get(id) ?? 0) + 1);
    else notHelpful.set(id, (notHelpful.get(id) ?? 0) + 1);
  }
  return rows.map((f) => {
    const id = Number(f.id);
    return {
      id,
      authorName: String(f.author_name ?? "Member"),
      rating: Number(f.rating ?? 5),
      feedbackText: String(f.feedback_text ?? ""),
      helpful: helpful.get(id) ?? 0,
      notHelpful: notHelpful.get(id) ?? 0,
      createdAt: String(f.created_at ?? ""),
    };
  });
}
