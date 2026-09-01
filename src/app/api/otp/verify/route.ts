import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

export const runtime = "nodejs";

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OTP_SECRET = process.env.OTP_HMAC_SECRET || "aftermediate-otp";

const MAX_ATTEMPTS = 5;

function hashCode(email: string, code: string): string {
  return createHash("sha256").update(`${OTP_SECRET}:${email.toLowerCase()}:${code}`).digest("hex");
}

export async function POST(req: Request) {
  try {
    if (!SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body?.code === "string" ? body.code.trim() : "";

    if (!email || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "Enter the 6-digit code from your email." }, { status: 400 });
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: rows, error: fetchError } = await admin
      .from("otp_codes")
      .select("id, user_id, code_hash, attempts, expires_at")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchError || !rows?.[0]) {
      console.error("otp verify: fetch error", fetchError?.message);
      return NextResponse.json({ error: "No code found for that email. Request a new one." }, { status: 400 });
    }

    const record = rows[0];

    // Expired?
    if (new Date(record.expires_at).getTime() < Date.now()) {
      await admin.from("otp_codes").delete().eq("id", record.id);
      return NextResponse.json({ error: "That code has expired. Request a new one." }, { status: 400 });
    }

    // Too many attempts?
    if (record.attempts >= MAX_ATTEMPTS) {
      await admin.from("otp_codes").delete().eq("id", record.id);
      return NextResponse.json({ error: "Too many incorrect attempts. Request a new code." }, { status: 400 });
    }

    // Wrong code?
    if (record.code_hash !== hashCode(email, code)) {
      const { error: bumpError } = await admin
        .from("otp_codes")
        .update({ attempts: record.attempts + 1 })
        .eq("id", record.id);
      if (bumpError) console.error("otp verify: attempts bump error", bumpError.message);
      return NextResponse.json({ error: "That code isn't right. Try again." }, { status: 400 });
    }

    // Code is correct — confirm the user's email. Prefer the exact user_id captured
    // at send time; fall back to a live lookup only if it wasn't stored.
    let userId: string | undefined = record.user_id ?? undefined;
    if (!userId) {
      const authUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const userRes = await fetch(
        `${authUrl}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY } }
      );
      if (!userRes.ok) {
        console.error("otp verify: admin users lookup", userRes.status, await userRes.text());
        return NextResponse.json({ error: "Account not found. Sign up again." }, { status: 400 });
      }
      const userData = (await userRes.json()) as { users?: { id: string; email: string }[] };
      const match = (userData.users || []).find((u) => u.email.toLowerCase() === email);
      userId = match?.id;
    }
    if (!userId) {
      return NextResponse.json({ error: "Account not found. Sign up again." }, { status: 400 });
    }

    const { data: confirmedUser, error: confirmError } = await admin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });
    if (confirmError || !confirmedUser.user?.email_confirmed_at) {
      console.error("otp verify: confirm error", confirmError?.message ?? "email not confirmed after update");
      return NextResponse.json({ error: "Could not verify your account. Try again." }, { status: 500 });
    }

    // Burn the code so it can't be reused
    await admin.from("otp_codes").delete().eq("email", email);

    return NextResponse.json({ verified: true });
  } catch (err) {
    console.error("otp verify error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}