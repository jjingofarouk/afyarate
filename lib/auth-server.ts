import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Verifies the Supabase Auth Bearer token (sent by useAuth().authFetch) and
// returns the authenticated user id. Null = anonymous/legacy-handle request.
// Workspace APIs prefer this over the client-supplied profileId, which any
// visitor could otherwise spoof.
export async function getAuthUserId(req: NextRequest): Promise<string | null> {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!token) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  if (!url || !key) return null;
  try {
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const { data } = await sb.auth.getUser(token);
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

/** Authoritative identity: verified login wins, legacy handle is fallback. */
export function effectiveId(authId: string | null, legacy: string): string {
  return authId ?? legacy;
}
