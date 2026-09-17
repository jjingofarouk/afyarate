"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createBrowserClient } from "@/lib/supabase/client";
import { getProfileId, setProfile } from "@/lib/handle";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ needsConfirm: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** fetch with the session access token attached (APIs prefer it over handles). */
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  signUp: async () => ({ needsConfirm: false }),
  signIn: async () => {},
  signOut: async () => {},
  authFetch: (url, init) => fetch(url, init),
});

export function useAuth(): AuthCtx {
  return useContext(Ctx);
}

/** Link the auth user to a profiles row and migrate any legacy handle. */
async function linkProfile(session: Session, fallbackName: string): Promise<void> {
  const token = session.access_token;
  const displayName =
    (session.user.user_metadata?.display_name as string | undefined) ?? fallbackName;
  const ensure = await fetch("/api/profiles/ensure", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ displayName }),
  });
  if (!ensure.ok) return;
  const data = (await ensure.json()) as { profile: { id: string; display_name: string } };
  const legacy = getProfileId();
  if (legacy && legacy !== data.profile.id) {
    await fetch("/api/profiles/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ legacyProfileId: legacy }),
    }).catch(() => {});
  }
  setProfile(data.profile.id, data.profile.display_name);
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = createBrowserClient();
    sb.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (data.session) void linkProfile(data.session, "Member");
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session) void linkProfile(session, "Member");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    const sb = createBrowserClient();
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        // Return to THIS environment after the email link is clicked. Without
        // this, Supabase falls back to the dashboard "Site URL", which is why
        // production links used to land on localhost.
        //
        // Two things must also be true in the Supabase dashboard
        // (Authentication → URL Configuration):
        //   1. "Site URL" is the production domain, not localhost.
        //   2. Every domain you serve from is listed under "Redirect URLs",
        //      e.g. https://<production-domain>/** — Supabase rejects a
        //      redirect target that is not allow-listed and silently falls
        //      back to the Site URL.
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw new Error(error.message);
    // With "Confirm email" on (Supabase default), there is no session yet.
    return { needsConfirm: !data.session };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const sb = createBrowserClient();
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }, []);

  const signOut = useCallback(async () => {
    const sb = createBrowserClient();
    await sb.auth.signOut();
    try {
      localStorage.removeItem("musawo_profile_id");
      localStorage.removeItem("musawo_display_name");
    } catch {
      // Ignore.
    }
  }, []);

  const authFetch = useCallback(async (url: string, init?: RequestInit) => {
    const sb = createBrowserClient();
    const { data } = await sb.auth.getSession();
    const token = data.session?.access_token;
    return fetch(url, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }, []);

  const value = useMemo(
    () => ({ user, loading, signUp, signIn, signOut, authFetch }),
    [user, loading, signUp, signIn, signOut, authFetch],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
