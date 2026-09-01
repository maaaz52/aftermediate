import { createHash, randomInt } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertServerEnv } from "@/lib/server-env";
import { jsonError, jsonOk } from "@/lib/api-response";

export const runtime = "nodejs";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60s between sends per email

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hashCode(email: string, code: string, secret: string): string {
  return createHash("sha256").update(`${secret}:${email.toLowerCase()}:${code}`).digest("hex");
}

function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function POST(req: Request) {
  try {
    const env = assertServerEnv();
    const OTP_SECRET = env.otpHmacSecret as string;
    const SERVICE_ROLE_KEY = env.supabaseServiceRoleKey;
    const RESEND_API_KEY = env.resendApiKey;

    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";

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
    const authUrl = env.supabaseUrl;

    // Does a user already exist for this email? (GoTrue admin API supports ?filter=)
    const userRes = await fetch(
      `${authUrl}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY } }
    );
    if (!userRes.ok) {
      console.error("otp send: admin users lookup", userRes.status, await userRes.text());
      return jsonError("Could not check that email.", 500);
    }
    const userData = (await userRes.json()) as { users?: { id: string; email: string; email_confirmed_at: string | null; user_metadata?: Record<string, unknown> }[] };
    // Match by exact email (filter does a substring search, so pick the exact row).
    const matches = (userData.users || []).filter((u) => u.email.toLowerCase() === email);

    let userId: string | null = null;
    if (matches.length > 0) {
      // Email already exists (confirmed or not). We still send an OTP: verifying it
      // proves ownership, and the verify step sets the password the user typed, so
      // signup doubles as an OTP-backed password reset for existing accounts.
      userId = matches[0].id;
      // Keep the profile name in sync when the user types a new one at signup.
      if (name) {
        const { error: metaError } = await admin.auth.admin.updateUserById(userId, {
          user_metadata: { ...(matches[0].user_metadata || {}), full_name: name },
        });
        if (metaError) console.error("otp send: metadata name update error", metaError.message);
        const { error: profileError } = await admin.from("profiles").update({ name }).eq("id", userId);
        if (profileError) console.error("otp send: profile name update error", profileError.message);
      }
    } else {
      // Create the user (unconfirmed) so we can confirm them after OTP check.
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: name ? { full_name: name } : undefined,
      });
      if (createError) {
        console.error("otp send: createUser error", createError.message);
        return jsonError("Could not create your account. Try again.", 500);
      }
      userId = created.user?.id ?? null;
    }

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
      user_id: userId,
      code_hash: hashCode(email, code, OTP_SECRET),
      attempts: 0,
      expires_at: expiresAt,
    });
    if (insertError) {
      console.error("otp send: insert error", insertError.message);
      return jsonError("Could not store the code.", 500);
    }

    // Email the code via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Aftermediate <no-reply@aftermediate.site>",
        to: email,
        subject: "Your Aftermediate verification code",
        html: `
          <div style="font-family:Plus Jakarta Sans,system-ui,sans-serif;max-width:420px;margin:0 auto;">
            <p style="color:#566073;font-size:15px;line-height:1.6;">Hi${name ? ` ${name}` : ""}, welcome to Aftermediate. Here&apos;s your code to verify your email:</p>
            <div style="margin:24px 0;padding:18px 24px;border:2px solid #191f2c;background:#f4f2eb;text-align:center;font-family:monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#191f2c;">${code}</div>
            <p style="color:#8a93a6;font-size:13px;line-height:1.6;">This code expires in 10 minutes. If you didn&apos;t request it, you can safely ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error("otp send: resend error", errText);
      return jsonError("Could not send the email. Try again.", 500);
    }

    return jsonOk({ sent: true });
  } catch (err) {
    console.error("otp send error", err);
    return jsonError("Internal server error", 500);
  }
}