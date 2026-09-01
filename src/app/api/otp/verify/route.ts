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
      .select("id, code_hash, attempts, expires_at")
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

    // Code is correct — confirm the user's email
    const { data: existing, error: lookupError } = await admin
      .from("auth.users")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (lookupError || !existing) {
      console.error("otp verify: user lookup error", lookupError?.message);
      return NextResponse.json({ error: "Account not found. Sign up again." }, { status: 400 });
    }

    const { error: confirmError } = await admin.auth.admin.updateUserById(existing.id, {
      email_confirm: true,
    });
    if (confirmError) {
      console.error("otp verify: confirm error", confirmError.message);
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