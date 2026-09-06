import { createAdminClient } from "@/lib/supabase/admin";
import { assertServerEnv } from "@/lib/server-env";
import { jsonError, jsonOk } from "@/lib/api-response";
import { otpMatches } from "@/lib/otp";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/http";
import { revokeUserSessions } from "@/lib/auth-admin";
import { logSecurity } from "@/lib/security-log";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16 * 1024;
const MAX_ATTEMPTS = 5;
/** Per-IP cap: verifying is the brute-force surface, so it is limited like send. */
const IP_VERIFY_MAX = 20;
const IP_WINDOW_MS = 60 * 1000;

export async function POST(req: Request) {
  try {
    const env = assertServerEnv();
    const OTP_SECRET = env.otpHmacSecret as string;
    const SERVICE_ROLE_KEY = env.supabaseServiceRoleKey;

    // Vercel overwrites x-forwarded-for at the edge, so the first entry is the
    // client address, not a header the caller controls.
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(`otp-verify:${ip}`, IP_VERIFY_MAX, IP_WINDOW_MS)) {
      return jsonError("Too many attempts. Try again later.", 429);
    }

    const bodyResult = await parseJsonBody(req, MAX_BODY_BYTES);
    if (!bodyResult.ok) return bodyResult.error;
    const body = (bodyResult.value ?? {}) as Record<string, unknown>;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !/^\d{6}$/.test(code)) {
      return jsonError("Enter the 6-digit code from your email.", 400);
    }

    const admin = createAdminClient();

    const { data: rows, error: fetchError } = await admin
      .from("otp_codes")
      .select("id, user_id, code_hash, attempts, expires_at")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchError || !rows?.[0]) {
      console.error("otp verify: fetch error", fetchError?.message);
      return jsonError("That code is invalid or has expired. Request a new one.", 400);
    }

    // Housekeeping: remove expired codes so the table can't grow without bound.
    await admin.from("otp_codes").delete().lt("expires_at", new Date().toISOString());

    const record = rows[0];

    // Expired? The row is left in place so /api/otp/send's resend cooldown
    // still sees a recent code and cannot be used to bypass the 60s brake.
    if (new Date(record.expires_at).getTime() < Date.now()) {
      return jsonError("That code is invalid or has expired. Request a new one.", 400);
    }

    // Too many attempts? Same as above: keep the row so the send cooldown still
    // applies, otherwise burning a code's 5 guesses would clear the cooldown
    // and let an attacker re-issue codes instantly.
    if (record.attempts >= MAX_ATTEMPTS) {
      logSecurity("otp.attempts_exhausted", { userId: record.user_id ?? undefined });
      return jsonError("That code is invalid or has expired. Request a new one.", 400);
    }

    // Wrong code? Responses are intentionally uniform so the endpoint does not
    // reveal whether an email has an active code, an expired one, or none.
    if (!otpMatches(record.code_hash, email, code, OTP_SECRET)) {
      const { error: bumpError } = await admin
        .from("otp_codes")
        .update({ attempts: record.attempts + 1 })
        .eq("id", record.id);
      if (bumpError) console.error("otp verify: attempts bump error", bumpError.message);
      return jsonError("That code is invalid or has expired. Request a new one.", 400);
    }

    // Code is correct — provision the account. The send route deliberately does
    // NOT create users (so it cannot leak whether an email exists), so we find
    // the user here and create them if needed. Confirming the email and setting
    // the password the user typed is gated on this verified code.
    const authUrl = env.supabaseUrl;
    const userRes = await fetch(
      `${authUrl}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY } }
    );
    if (!userRes.ok) {
      console.error("otp verify: admin users lookup", userRes.status, await userRes.text());
      return jsonError("Could not verify your account. Try again.", 500);
    }
    const userData = (await userRes.json()) as { users?: { id: string; email: string; email_confirmed_at: string | null }[] };
    const match = (userData.users || []).find((u) => u.email.toLowerCase() === email);

    let userId: string;
    if (match) {
      // Existing account: confirm it and (re)set the password to what the user typed.
      userId = match.id;
      const updates: Record<string, unknown> = { email_confirm: true };
      if (password && password.length >= 6) updates.password = password;

      const { data: confirmedUser, error: confirmError } = await admin.auth.admin.updateUserById(userId, updates);
      if (confirmError || !confirmedUser.user?.email_confirmed_at) {
        console.error("otp verify: confirm error", confirmError?.message ?? "email not confirmed after update");
        return jsonError("Could not verify your account. Try again.", 500);
      }

      // Session reset after a password change: revoke any sessions that may
      // exist on other devices so a reset invalidates stolen tokens. Best
      // effort — a failure is logged and does not undo the password change.
      logSecurity("otp.password_reset", { userId });
      await revokeUserSessions(userId);
    } else {
      // New account: create it already-confirmed with the typed password.
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createError || !created?.user) {
        console.error("otp verify: create error", createError?.message ?? "no user returned");
        return jsonError("Could not create your account. Try again.", 500);
      }
      userId = created.user.id;
      logSecurity("otp.signup", { userId });
    }

    // Burn the code so it can't be reused
    await admin.from("otp_codes").delete().eq("email", email);

    return jsonOk({ verified: true });
  } catch (err) {
    console.error("otp verify error", err);
    return jsonError("Internal server error", 500);
  }
}