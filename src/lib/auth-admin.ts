import { getServerEnv } from "@/lib/server-env";
import { logSecurity } from "@/lib/security-log";

/**
 * Best-effort revocation of every session for a user after a password change
 * or reset, so a password reset invalidates tokens that may exist on other
 * devices. Uses the GoTrue admin logout endpoint keyed on the user id. A
 * failure is logged and does not block the password change that already
 * succeeded.
 */
export async function revokeUserSessions(userId: string): Promise<void> {
  const env = getServerEnv();
  const res = await fetch(`${env.supabaseUrl}/auth/v1/admin/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
      apikey: env.supabaseServiceRoleKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uid: userId }),
  });

  if (!res.ok) {
    logSecurity("auth.session_revoke_failed", { userId, status: res.status });
    return;
  }
  logSecurity("auth.sessions_revoked", { userId });
}
