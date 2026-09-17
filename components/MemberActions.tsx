"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ensureProfile, getDisplayName, getProfileId } from "@/lib/handle";
import { useAuth } from "@/lib/auth-context";
import { Check } from "lucide-react";

// Follow + Message actions for a member profile. Visitors without an
// identity get a one-line name prompt first (no full gate — the profile
// itself stays publicly readable).
export default function MemberActions({ targetProfileId }: { targetProfileId: string }) {
  const { authFetch } = useAuth();
  const router = useRouter();
  const [following, setFollowing] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [needName, setNeedName] = useState(false);
  const [pending, setPending] = useState<"follow" | "message" | null>(null);

  const me = (): Promise<string> => {
    const existing = getProfileId();
    if (existing) return Promise.resolve(existing);
    const n = name.trim() || getDisplayName();
    if (!n) {
      setNeedName(true);
      return Promise.reject(new Error("name"));
    }
    return ensureProfile(n);
  };

  const toggleFollow = async () => {
    try {
      const myId = await me();
      if (myId === targetProfileId) return;
      const next = !(following ?? false);
      setPending("follow");
      const res = next
        ? await authFetch("/api/follows", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ followerProfileId: myId, followedProfileId: targetProfileId }),
          })
        : await authFetch(
            `/api/follows?followerProfileId=${myId}&followedProfileId=${targetProfileId}`,
            { method: "DELETE" },
          );
      if (res.ok) setFollowing(next);
    } catch {
      // Name still missing: the inline prompt is showing.
    } finally {
      setPending(null);
    }
  };

  const message = async () => {
    try {
      const myId = await me();
      if (myId === targetProfileId) return;
      setPending("message");
      const res = await authFetch("/api/dm/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: myId, otherProfileId: targetProfileId }),
      });
      if (res.ok) router.push("/messages");
    } catch {
      // Name still missing.
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void toggleFollow()}
        disabled={pending === "follow"}
        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {following ? (
          <>
            Following <Check className="size-4" aria-hidden />
          </>
        ) : (
          "Follow"
        )}
      </button>
      <button
        type="button"
        onClick={() => void message()}
        disabled={pending === "message"}
        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-700"
      >
        Message
      </button>
      {needName && (
        <span className="flex items-center gap-2 text-sm">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={120}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <button
            type="button"
            onClick={() => {
              setNeedName(false);
              if (pending === "message") void message();
              else void toggleFollow();
            }}
            className="rounded-xl bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
          >
            Continue
          </button>
        </span>
      )}
    </div>
  );
}
