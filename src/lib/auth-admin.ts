import { getServerEnv } from "@/lib/server-env";
import { logSecurity } from "@/lib/security-log";
import { fetchWithTimeout } from "@/lib/fetch-timeout";

export interface AuthUserSummary {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  user_metadata?: Record<string, unknown>;
}

export async function findAuthUserByEmail(email: string): Promise<AuthUserSummary | null> {
  const env = getServerEnv();
  const response = await fetchWithTimeout(
    `${env.supabaseUrl}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`,
    {
      headers: {
        Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
        apikey: env.supabaseServiceRoleKey,
      },
    }
  );
  if (!response.ok) throw new Error(`Auth user lookup failed with status ${response.status}`);
  const payload = (await response.json()) as { users?: AuthUserSummary[] };
  return payload.users?.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

/**
 * Best-effort revocation of every session for a user after a password change
 * or reset, so a password reset invalidates tokens that may exist on other
 * devices. Uses the GoTrue admin logout endpoint keyed on the user id. A
 * failure is logged and does not block the password change that already
 * succeeded.
 */
export async function revokeUserSessions(userId: string): Promise<void> {
  const env = getServerEnv();
  const res = await fetchWithTimeout(`${env.supabaseUrl}/auth/v1/admin/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
      apikey: env.supabaseServiceRoleKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uid: userId }),
  }, 10_000);

  if (!res.ok) {
    logSecurity("auth.session_revoke_failed", { userId, status: res.status });
    return;
  }
  logSecurity("auth.sessions_revoked", { userId });
}
