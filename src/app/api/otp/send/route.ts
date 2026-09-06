import { randomInt } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertServerEnv } from "@/lib/server-env";
import { jsonError, jsonOk } from "@/lib/api-response";
import { escapeHtml } from "@/lib/escape-html";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/http";
import { sendEmail } from "@/lib/email";
import { hashOtpCode } from "@/lib/otp";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16 * 1024;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60s between sends per email
/** Per-IP cap: an attacker rotating addresses must not be able to spam Resend. */
const IP_SEND_MAX = 5;
const IP_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function POST(req: Request) {
  try {
    const env = assertServerEnv();
    const OTP_SECRET = env.otpHmacSecret as string;
    const RESEND_API_KEY = env.resendApiKey;

    const bodyResult = await parseJsonBody(req, MAX_BODY_BYTES);
    if (!bodyResult.ok) return bodyResult.error;
    const body = (bodyResult.value ?? {}) as Record<string, unknown>;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!EMAIL_RE.test(email)) {
      return jsonError("Enter a valid email address.", 400);
    }
    if (!password || password.length < 6) {
      return jsonError("Password must be at least 6 characters.", 400);
    }
    if (!RESEND_API_KEY) {
      return jsonError("Email service not configured.", 500);
    }

    const admin = createAdminClient();

    // Per-IP cap first: Vercel overwrites x-forwarded-for at the edge, so the
    // first entry is the client address, not a header the caller controls.
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(`otp-send:${ip}`, IP_SEND_MAX, IP_WINDOW_MS)) {
      return jsonError("Too many requests from this device. Try again later.", 429);
    }

    // No user is created or touched here: for a new email AND an existing one
    // this route does exactly the same work (issue + email a code). That keeps
    // the endpoint timing-uniform, so an observer cannot tell whether an email
    // is already registered. Account provisioning happens at /api/otp/verify
    // after the code proves ownership of the inbox.

    // Rate limit: don't spam the same address
    const { data: recent } = await admin
      .from("otp_codes")
      .select("created_at")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1);
    if (recent?.[0] && Date.now() - new Date(recent[0].created_at).getTime() < RESEND_COOLDOWN_MS) {
      return jsonError("Wait a moment before requesting another code.", 429);
    }

    // Drop any stale rows for this address so old codes can't pile up.
    await admin.from("otp_codes").delete().eq("email", email);

    const code = generateCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

    const { error: insertError } = await admin.from("otp_codes").insert({
      email,
      code_hash: hashOtpCode(email, code, OTP_SECRET),
      attempts: 0,
      expires_at: expiresAt,
    });
    if (insertError) {
      console.error("otp send: insert error", insertError.message);
      return jsonError("Could not store the code.", 500);
    }

    // Email the code via Resend
    const sent = await sendEmail({
      from: "Aftermediate <no-reply@aftermediate.site>",
      to: email,
      subject: "Your Aftermediate verification code",
      html: `
        <div style="font-family:Plus Jakarta Sans,system-ui,sans-serif;max-width:420px;margin:0 auto;">
          <p style="color:#566073;font-size:15px;line-height:1.6;">Hi${escapeHtml(name) ? ` ${escapeHtml(name)}` : ""}, welcome to Aftermediate. Here&apos;s your code to verify your email:</p>
          <div style="margin:24px 0;padding:18px 24px;border:2px solid #191f2c;background:#f4f2eb;text-align:center;font-family:monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#191f2c;">${code}</div>
          <p style="color:#8a93a6;font-size:13px;line-height:1.6;">This code expires in 10 minutes. If you didn&apos;t request it, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (!sent.ok) {
      return jsonError("Could not send the email. Try again.", 500);
    }

    return jsonOk({ sent: true });
  } catch (err) {
    console.error("otp send error", err);
    return jsonError("Internal server error", 500);
  }
}