import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomInt } from "node:crypto";

export const runtime = "nodejs";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OTP_SECRET = process.env.OTP_HMAC_SECRET || "aftermediate-otp";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60s between sends per email

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hashCode(email: string, code: string): string {
  return createHash("sha256").update(`${OTP_SECRET}:${email.toLowerCase()}:${code}`).digest("hex");
}

function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function POST(req: Request) {
  try {
    if (!SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }
    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: "Email service not configured." }, { status: 500 });
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Does a user already exist for this email? (GoTrue admin API supports ?filter=)
    const authUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const userRes = await fetch(
      `${authUrl}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY } }
    );
    if (!userRes.ok) {
      console.error("otp send: admin users lookup", userRes.status, await userRes.text());
      return NextResponse.json({ error: "Could not check that email." }, { status: 500 });
    }
    const userData = (await userRes.json()) as { users?: { id: string; email: string; email_confirmed_at: string | null }[] };
    // Match by exact email (filter does a substring search, so pick the exact row).
    const matches = (userData.users || []).filter((u) => u.email.toLowerCase() === email);

    let userId: string | null = null;
    if (matches.length > 0) {
      // If any confirmed account exists, tell the user to log in instead.
      const confirmed = matches.find((u) => u.email_confirmed_at);
      if (confirmed) {
        return NextResponse.json({ error: "That email is already registered. Log in instead." }, { status: 400 });
      }
      // Reuse the first unconfirmed account so the OTP confirms the same one login will use.
      userId = matches[0].id;
      // Reset its password to the one the user just entered, so login works after confirmation.
      const { error: pwError } = await admin.auth.admin.updateUserById(userId, { password });
      if (pwError) {
        console.error("otp send: password reset error", pwError.message);
        return NextResponse.json({ error: "Could not set up your account. Try again." }, { status: 500 });
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
        return NextResponse.json({ error: "Could not create your account. Try again." }, { status: 500 });
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
      return NextResponse.json(
        { error: "Wait a moment before requesting another code." },
        { status: 429 }
      );
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

    const { error: insertError } = await admin.from("otp_codes").insert({
      email,
      user_id: userId,
      code_hash: hashCode(email, code),
      attempts: 0,
      expires_at: expiresAt,
    });
    if (insertError) {
      console.error("otp send: insert error", insertError.message);
      return NextResponse.json({ error: "Could not store the code." }, { status: 500 });
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
      return NextResponse.json({ error: "Could not send the email. Try again." }, { status: 500 });
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("otp send error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}