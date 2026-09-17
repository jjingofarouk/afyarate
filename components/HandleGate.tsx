"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  ensureProfile,
  getDisplayName,
  getProfileId,
} from "@/lib/handle";

interface HandleCtx {
  profileId: string | null;
  displayName: string;
  ready: boolean;
  save: (name: string) => Promise<void>;
}

const Ctx = createContext<HandleCtx>({
  profileId: null,
  displayName: "",
  ready: false,
  save: async () => {},
});

export function useHandle(): HandleCtx {
  return useContext(Ctx);
}

/** One-click identity gate. Children needing an identity render only after
 *  the visitor picks a display name; read-only children can ignore it. */
export default function HandleGate({
  children,
  prompt,
  optional,
}: {
  children: React.ReactNode;
  prompt?: string;
  optional?: boolean;
}) {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setProfileId(getProfileId());
    setDisplayName(getDisplayName());
    setReady(true);
  }, []);

  const save = useCallback(async (n: string) => {
    setSaving(true);
    setError("");
    try {
      const id = await ensureProfile(n);
      setProfileId(id);
      setDisplayName(n.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }, []);

  return (
    <Ctx.Provider value={{ profileId, displayName, ready, save }}>
      {ready && (profileId || optional) ? (
        children
      ) : ready ? (
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="font-semibold text-slate-900 dark:text-slate-100">
            {prompt ?? "Pick a display name to continue"}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            One click, no password. Your name shows next to what you post.
          </p>
          <div className="mt-4 flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah N."
              maxLength={120}
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
            <button
              type="button"
              disabled={saving || !name.trim()}
              onClick={() => void save(name)}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "…" : "Continue"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      ) : null}
    </Ctx.Provider>
  );
}
