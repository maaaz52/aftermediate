import { randomInt } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertServerEnv } from "@/lib/server-env";
import { jsonError, jsonOk } from "@/lib/api-response";
import { escapeHtml } from "@/lib/escape-html";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/http";
import { sendEmail } from "@/lib/email";
import { hashOtpCode } from "@/lib/otp";
import { findAuthUserByEmail } from "@/lib/auth-admin";
import { needsOtpCompatibilityFallback, storeOtpCodeCompat } from "@/lib/otp-storage";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16 * 1024;
const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const IP_SEND_MAX = 5;
const IP_WINDOW_MS = 60 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function POST(req: Request) {
  try {
    const env = assertServerEnv();
    const otpSecret = env.otpHmacSecret;
    if (!otpSecret) return jsonError("Email verification is not configured.", 503);
    if (!env.resendApiKey) return jsonError("Email service not configured.", 503);

    const bodyResult = await parseJsonBody(req, MAX_BODY_BYTES);
    if (!bodyResult.ok) return bodyResult.error;
    const body = (bodyResult.value ?? {}) as Record<string, unknown>;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";

    if (!EMAIL_RE.test(email) || email.length > 200) {
      return jsonError("Enter a valid email address.", 400);
    }
    if (password && (password.length < 6 || password.length > 128)) {
      return jsonError("Password must be between 6 and 128 characters.", 400);
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!(await checkRateLimit(`otp-send:${ip}`, IP_SEND_MAX, IP_WINDOW_MS))) {
      return jsonError("Too many requests from this device. Try again later.", 429);
    }
    if (!(await checkRateLimit(`otp-send-email:${email}`, 5, IP_WINDOW_MS))) {
      return jsonError("Too many codes requested. Try again later.", 429);
    }

    const admin = createAdminClient();
    let authUser = await findAuthUserByEmail(email);
    let createdUserId: string | null = null;

    if (authUser?.email_confirmed_at) {
      return jsonError("An account already exists for this email. Sign in or reset your password.", 409);
    }

    if (!authUser) {
      if (!password) return jsonError("Restart sign-up to request a new code.", 400);
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: name ? { full_name: name } : undefined,
      });
      if (error || !data.user) {
        console.error("otp send: user create failed", error?.message ?? "no user returned");
        return jsonError("Could not start sign-up. Try again.", 500);
      }
      createdUserId = data.user.id;
      authUser = {
        id: data.user.id,
        email: data.user.email ?? email,
        email_confirmed_at: data.user.email_confirmed_at ?? null,
        user_metadata: data.user.user_metadata,
      };
    } else if (password) {
      const metadata = name ? { ...authUser.user_metadata, full_name: name } : authUser.user_metadata;
      const { error } = await admin.auth.admin.updateUserById(authUser.id, {
        password,
        user_metadata: metadata,
      });
      if (error) {
        console.error("otp send: pending user update failed", error.message);
        return jsonError("Could not restart sign-up. Try again.", 500);
      }
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
    const codeHash = hashOtpCode(email, code, otpSecret);
    let { data: stored, error: insertError } = await admin.rpc("store_otp_code", {
      p_email: email,
      p_user_id: authUser.id,
      p_code_hash: codeHash,
      p_expires_at: expiresAt,
      p_cooldown_seconds: Math.floor(RESEND_COOLDOWN_MS / 1000),
    });
    if (insertError && needsOtpCompatibilityFallback(insertError)) {
      console.warn("otp send: using legacy OTP storage while database migration is pending");
      try {
        stored = await storeOtpCodeCompat(admin, {
          email,
          userId: authUser.id,
          codeHash,
          expiresAt,
          cooldownMs: RESEND_COOLDOWN_MS,
        });
        insertError = null;
      } catch (compatError) {
        console.error("otp send: compatibility storage failed", compatError);
      }
    }
    if (insertError) {
      console.error("otp send: insert error", insertError.message);
      if (createdUserId) await admin.auth.admin.deleteUser(createdUserId);
      return jsonError("Could not store the code.", 500);
    }
    if (stored !== true) {
      if (createdUserId) await admin.auth.admin.deleteUser(createdUserId);
      return jsonError("Wait a moment before requesting another code.", 429);
    }

    const displayName = name || (typeof authUser.user_metadata?.full_name === "string" ? authUser.user_metadata.full_name : "");
    const sent = await sendEmail({
      from: "Aftermediate <no-reply@aftermediate.site>",
      to: email,
      subject: "Your Aftermediate verification code",
      html: `
        <div style="font-family:Plus Jakarta Sans,system-ui,sans-serif;max-width:420px;margin:0 auto;">
          <p style="color:#566073;font-size:15px;line-height:1.6;">Hi${displayName ? ` ${escapeHtml(displayName)}` : ""}, welcome to Aftermediate. Here&apos;s your code to verify your email:</p>
          <div style="margin:24px 0;padding:18px 24px;border:2px solid #191f2c;background:#f4f2eb;text-align:center;font-family:monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#191f2c;">${code}</div>
          <p style="color:#8a93a6;font-size:13px;line-height:1.6;">This code expires in 10 minutes. If you didn&apos;t request it, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (!sent.ok) {
      await admin.from("otp_codes").delete().eq("email", email);
      if (createdUserId) await admin.auth.admin.deleteUser(createdUserId);
      return jsonError("Could not send the email. Try again.", 500);
    }

    return jsonOk({ sent: true });
  } catch (err) {
    console.error("otp send error", err);
    return jsonError("Internal server error", 500);
  }
}
