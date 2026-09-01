import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertServerEnv } from "@/lib/server-env";
import { jsonError, jsonOk } from "@/lib/api-response";

export const runtime = "nodejs";

const MAX_ATTEMPTS = 5;

function hashCode(email: string, code: string, secret: string): string {
  return createHash("sha256").update(`${secret}:${email.toLowerCase()}:${code}`).digest("hex");
}

export async function POST(req: Request) {
  try {
    const env = assertServerEnv();
    const OTP_SECRET = env.otpHmacSecret as string;
    const SERVICE_ROLE_KEY = env.supabaseServiceRoleKey;

    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body?.code === "string" ? body.code.trim() : "";

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
      return jsonError("No code found for that email. Request a new one.", 400);
    }

    // Housekeeping: remove expired codes so the table can't grow without bound.
    await admin.from("otp_codes").delete().lt("expires_at", new Date().toISOString());

    const record = rows[0];

    // Expired?
    if (new Date(record.expires_at).getTime() < Date.now()) {
      await admin.from("otp_codes").delete().eq("id", record.id);
      return jsonError("That code has expired. Request a new one.", 400);
    }

    // Too many attempts?
    if (record.attempts >= MAX_ATTEMPTS) {
      await admin.from("otp_codes").delete().eq("id", record.id);
      return jsonError("Too many incorrect attempts. Request a new code.", 400);
    }

    // Wrong code?
    if (record.code_hash !== hashCode(email, code, OTP_SECRET)) {
      const { error: bumpError } = await admin
        .from("otp_codes")
        .update({ attempts: record.attempts + 1 })
        .eq("id", record.id);
      if (bumpError) console.error("otp verify: attempts bump error", bumpError.message);
      return jsonError("That code isn't right. Try again.", 400);
    }

    // Code is correct — confirm the user's email. Prefer the exact user_id captured
    // at send time; fall back to a live lookup only if it wasn't stored.
    let userId: string | undefined = record.user_id ?? undefined;
    if (!userId) {
      const authUrl = env.supabaseUrl;
      const userRes = await fetch(
        `${authUrl}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY } }
      );
      if (!userRes.ok) {
        console.error("otp verify: admin users lookup", userRes.status, await userRes.text());
        return jsonError("Account not found. Sign up again.", 400);
      }
      const userData = (await userRes.json()) as { users?: { id: string; email: string }[] };
      const match = (userData.users || []).find((u) => u.email.toLowerCase() === email);
      userId = match?.id;
    }
    if (!userId) {
      return jsonError("Account not found. Sign up again.", 400);
    }

    const { data: confirmedUser, error: confirmError } = await admin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });
    if (confirmError || !confirmedUser.user?.email_confirmed_at) {
      console.error("otp verify: confirm error", confirmError?.message ?? "email not confirmed after update");
      return jsonError("Could not verify your account. Try again.", 500);
    }

    // Burn the code so it can't be reused
    await admin.from("otp_codes").delete().eq("email", email);

    return jsonOk({ verified: true });
  } catch (err) {
    console.error("otp verify error", err);
    return jsonError("Internal server error", 500);
  }
}