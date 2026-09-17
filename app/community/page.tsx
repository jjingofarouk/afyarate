"use client";

import { useCallback, useEffect, useState } from "react";
import HandleGate, { useHandle } from "@/components/HandleGate";
import BroadcastsStrip from "@/components/BroadcastsStrip";
import { useAuth } from "@/lib/auth-context";
import { getDisplayName, getProfileId } from "@/lib/handle";
import type { CommunityComment, CommunityPost } from "@/lib/types";

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return "";
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

function PostCard({ post, onChanged, following, onToggleFollow }: { post: CommunityPost; onChanged: () => void; following: boolean; onToggleFollow: (profileId: string, next: boolean) => void }) {
  const { profileId, displayName } = useHandle();
  const [comments, setComments] = useState<CommunityComment[] | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const loadComments = useCallback(async () => {
    const res = await fetch(`/api/community/comments?postId=${post.id}`);
    if (res.ok) {
      const data = (await res.json()) as { items: CommunityComment[] };
      setComments(data.items);
    }
  }, [post.id]);

  const toggleLike = async () => {
    if (!profileId) return;
    const liked = post.likedByMe;
    const res = liked
      ? await fetch(
          `/api/community/likes?postId=${post.id}&profileId=${profileId}`,
          { method: "DELETE" },
        )
      : await fetch("/api/community/likes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId: post.id, profileId }),
        });
    if (res.ok) onChanged();
  };

  const sendComment = async () => {
    if (!draft.trim() || !profileId) return;
    setBusy(true);
    const res = await fetch("/api/community/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: post.id,
        profileId,
        authorName: displayName || getDisplayName(),
        body: draft.trim(),
      }),
    });
    setBusy(false);
    if (res.ok) {
      setDraft("");
      onChanged();
      void loadComments();
    }
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
          {post.authorName.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          {post.authorHandle ? (
            <a href={`/members/${post.authorHandle}`} className="text-sm font-semibold text-slate-900 hover:underline dark:text-slate-100">
              {post.authorName}
            </a>
          ) : (
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{post.authorName}</p>
          )}
          <p className="text-xs text-slate-400">{timeAgo(post.createdAt)}</p>
        </div>
        {post.profileId && profileId && post.profileId !== profileId && (
          <button
            type="button"
            onClick={() => onToggleFollow(post.profileId as string, !following)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${following ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" : "bg-emerald-600 text-white"}`}
          >
            {following ? "Following" : "Follow"}
          </button>
        )}
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{post.body}</p>
      <div className="mt-3 flex items-center gap-4 text-sm">
        <button
          type="button"
          onClick={() => void toggleLike()}
          className={`font-semibold ${post.likedByMe ? "text-emerald-600" : "text-slate-400 hover:text-emerald-600"}`}
        >
          ♥ {post.likeCount}
        </button>
        <button
          type="button"
          onClick={() => void (comments ? setComments(null) : loadComments())}
          className="font-semibold text-slate-400 hover:text-emerald-600"
        >
          💬 {post.commentCount}
        </button>
      </div>
      {comments && (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          {comments.map((c) => (
            <div key={c.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
              <span className="font-semibold text-slate-800 dark:text-slate-200">{c.authorName}</span>{" "}
              <span className="text-slate-600 dark:text-slate-400">{c.body}</span>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a comment…"
              maxLength={1200}
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
            <button
              type="button"
              disabled={busy || !draft.trim()}
              onClick={() => void sendComment()}
              className="rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function Feed() {
  const { profileId, displayName } = useHandle();
  const { authFetch } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    const pid = getProfileId();
    const res = await fetch(`/api/community/posts${pid ? `?profileId=${pid}` : ""}`);
    if (res.ok) {
      const data = (await res.json()) as { items: CommunityPost[] };
      setPosts(data.items);
    }
    if (pid) {
      const f = await fetch(`/api/follows?followingOf=${pid}`);
      if (f.ok) {
        const data = (await f.json()) as { ids: string[] };
        setFollowingIds(new Set(data.ids));
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleFollow = async (targetId: string, next: boolean) => {
    const pid = getProfileId();
    if (!pid || pid === targetId) return;
    const res = next
      ? await authFetch("/api/follows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followerProfileId: pid, followedProfileId: targetId }),
        })
      : await authFetch(`/api/follows?followerProfileId=${pid}&followedProfileId=${targetId}`, {
          method: "DELETE",
        });
    if (res.ok) {
      setFollowingIds((s) => {
        const c = new Set(s);
        if (next) c.add(targetId);
        else c.delete(targetId);
        return c;
      });
    }
  };

  const publish = async () => {
    if (!body.trim()) return;
    setPosting(true);
    const res = await fetch("/api/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId,
        authorName: displayName || getDisplayName(),
        body: body.trim(),
      }),
    });
    setPosting(false);
    if (res.ok) {
      setBody("");
      void load();
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share news, ask a question, thank a health worker…"
          rows={3}
          maxLength={2000}
          className="w-full resize-y rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <div className="mt-2 text-right">
          <button
            type="button"
            disabled={posting || !body.trim()}
            onClick={() => void publish()}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {posting ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : posts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          No posts yet — start the conversation above.
        </p>
      ) : (
        posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            onChanged={() => void load()}
            following={!!p.profileId && followingIds.has(p.profileId)}
            onToggleFollow={(targetId, next) => void toggleFollow(targetId, next)}
          />
        ))
      )}
    </div>
  );
}

export default function CommunityPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Community</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Health workers and the public in Uganda — news, questions and shout-outs.
      </p>
      <div className="mt-6 space-y-4">
        <BroadcastsStrip />
        <HandleGate prompt="Pick a display name to join the community">
          <Feed />
        </HandleGate>
      </div>
    </div>
  );
}
