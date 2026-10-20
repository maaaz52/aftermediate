import { createAdminClient } from "@/lib/supabase/admin";
import { assertServerEnv } from "@/lib/server-env";
import { jsonError, jsonOk } from "@/lib/api-response";
import { hashOtpCode } from "@/lib/otp";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/http";
import { logSecurity } from "@/lib/security-log";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16 * 1024;
const MAX_ATTEMPTS = 5;
const IP_VERIFY_MAX = 20;
const IP_WINDOW_MS = 60 * 1000;

export async function POST(req: Request) {
  try {
    const env = assertServerEnv();
    const otpSecret = env.otpHmacSecret;
    if (!otpSecret) return jsonError("Email verification is not configured.", 503);

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!(await checkRateLimit(`otp-verify:${ip}`, IP_VERIFY_MAX, IP_WINDOW_MS))) {
      return jsonError("Too many attempts. Try again later.", 429);
    }

    const bodyResult = await parseJsonBody(req, MAX_BODY_BYTES);
    if (!bodyResult.ok) return bodyResult.error;
    const body = (bodyResult.value ?? {}) as Record<string, unknown>;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";

    if (!email || email.length > 200 || !/^\d{6}$/.test(code)) {
      return jsonError("Enter the 6-digit code from your email.", 400);
    }
    if (!(await checkRateLimit(`otp-verify-email:${email}`, MAX_ATTEMPTS, 10 * 60 * 1000))) {
      return jsonError("That code is invalid or has expired. Request a new one.", 400);
    }

    const admin = createAdminClient();
    const { data, error } = await admin.rpc("consume_otp_code", {
      p_email: email,
      p_code_hash: hashOtpCode(email, code, otpSecret),
      p_max_attempts: MAX_ATTEMPTS,
    });
    const result = Array.isArray(data) ? data[0] : data;
    if (error) {
      console.error("otp verify: atomic consume failed", error.message);
      return jsonError("Could not verify your account. Try again.", 500);
    }
    if (!result || result.status !== "verified" || !result.user_id) {
      return jsonError("That code is invalid or has expired. Request a new one.", 400);
    }

    const { data: confirmed, error: confirmError } = await admin.auth.admin.updateUserById(
      result.user_id,
      { email_confirm: true }
    );
    if (confirmError || !confirmed.user?.email_confirmed_at) {
      console.error("otp verify: confirm error", confirmError?.message ?? "email not confirmed");
      return jsonError("Could not verify your account. Request a new code.", 500);
    }

    logSecurity("otp.signup", { userId: result.user_id });
    return jsonOk({ verified: true });
  } catch (err) {
    console.error("otp verify error", err);
    return jsonError("Internal server error", 500);
  }
}
