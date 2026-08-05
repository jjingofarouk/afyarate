import { createClient, SupabaseClient } from "@supabase/supabase-js";

// The publishable key maps to the `anon` role; Row Level Security policies
// in supabase/schema.sql control exactly what anonymous users may do
// (read the public registry, add ratings). No secret keys are used at runtime.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

let _client: SupabaseClient | null = null;

export function createServerClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _client;
}
