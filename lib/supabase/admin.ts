import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

let _admin: SupabaseClient | null = null;

/**
 * Server-only client with the service-role key. Bypasses RLS so the admin
 * panel can read/update/delete posts regardless of the public (anon) policies.
 * NEVER import this from client components — it must only run on the server.
 * The key is read from SUPABASE_SERVICE_ROLE_KEY (a secret env var / wrangler
 * secret). If the key is missing, calls will fail loudly at request time.
 */
export function createAdminClient(): SupabaseClient {
  if (!_admin) {
    if (!serviceKey) {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY is not set — required for admin operations.",
      );
    }
    _admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}
