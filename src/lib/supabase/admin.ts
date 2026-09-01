import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/server-env";

/**
 * Service-role Supabase client for server-only routes.
 *
 * Throws if the service role key is missing, so a misconfigured environment
 * fails at request time rather than returning confusing auth errors.
 */
export function createAdminClient() {
  const env = getServerEnv();
  return createSupabaseClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}