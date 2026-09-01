import type { User } from "@supabase/supabase-js";

type Supabase = Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>;

/**
 * Server-side auth guard for API routes.
 *
 * `getUser()` verifies the JWT with Supabase (and may refresh the session),
 * unlike `getSession()` which trusts the cookie. All protected routes should
 * use this so identity always comes from a verified token.
 *
 * Returns the user, or null when there is no valid session.
 */
export async function requireUser(supabase: Supabase): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}