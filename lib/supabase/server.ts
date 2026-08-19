import { createClient, SupabaseClient } from "@supabase/supabase-js";

// The publishable key maps to the `anon` role; Row Level Security policies
// in supabase/schema.sql control exactly what anonymous users may do
// (read the public registry, add ratings). No secret keys are used at runtime.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

// A fresh client per call, not a module-level singleton: Cloudflare Workers
// can reuse one JS isolate (and its globals) across concurrent requests, so a
// shared client was being hit by overlapping requests at once, the cause of
// the "garbled results" that used to force sequential (not parallel) queries
// everywhere. supabase-js is just a thin fetch wrapper (no persistent
// connection to open), so this is cheap.
export function createServerClient(): SupabaseClient {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
