/**
 * Shared cookie policy for the Supabase auth session cookie, used by both the
 * server client (src/lib/supabase/server.ts) and the browser client
 * (src/lib/supabase/client.ts) so they never disagree.
 *
 * - `sameSite: "lax"` blocks cross-site state-changing requests (CSRF).
 * - `secure` in production so the session is never sent over plain HTTP.
 * - `httpOnly` must stay `false`: the browser client reads the session cookie
 *   via `document.cookie` to detect auth state.
 * - `path: "/"` keeps the cookie available app-wide.
 */
export const authCookieOptions = {
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};