import type { SupabaseClient } from "@supabase/supabase-js";

type OtpRoutineError = { code?: string; message?: string } | null;

interface StoreOtpParams {
  email: string;
  userId: string;
  codeHash: string;
  expiresAt: string;
  cooldownMs: number;
}

export interface ConsumedOtp {
  status: "verified" | "invalid";
  userId: string | null;
}

/**
 * Older Aftermediate databases predate the OTP RPC routines (and some predate
 * otp_codes.user_id). Keep sign-up working while the safe SQL migration is
 * being applied; all current databases continue to use the atomic routines.
 */
export function needsOtpCompatibilityFallback(error: OtpRoutineError): boolean {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.code === "42883" ||
    error?.code === "PGRST202" ||
    error?.code === "42703" ||
    message.includes("store_otp_code") ||
    message.includes("consume_otp_code") ||
    message.includes("user_id")
  );
}

function hasNoUserIdColumn(error: OtpRoutineError): boolean {
  return error?.code === "42703" || error?.code === "PGRST204" || (error?.message?.toLowerCase().includes("user_id") ?? false);
}

export async function storeOtpCodeCompat(client: SupabaseClient, params: StoreOtpParams): Promise<boolean> {
  const { data: recent, error: recentError } = await client
    .from("otp_codes")
    .select("created_at")
    .eq("email", params.email)
    .order("created_at", { ascending: false })
    .limit(1);
  if (recentError) throw recentError;
  if (recent?.[0] && Date.now() - new Date(recent[0].created_at).getTime() < params.cooldownMs) return false;

  const { error: deleteError } = await client.from("otp_codes").delete().eq("email", params.email);
  if (deleteError) throw deleteError;

  const record = {
    email: params.email,
    user_id: params.userId,
    code_hash: params.codeHash,
    attempts: 0,
    expires_at: params.expiresAt,
  };
  let { error: insertError } = await client.from("otp_codes").insert(record);
  if (insertError && hasNoUserIdColumn(insertError)) {
    ({ error: insertError } = await client.from("otp_codes").insert({
      email: params.email,
      code_hash: params.codeHash,
      attempts: 0,
      expires_at: params.expiresAt,
    }));
  }
  if (insertError) throw insertError;
  return true;
}

export async function consumeOtpCodeCompat(
  client: SupabaseClient,
  email: string,
  codeHash: string,
  maxAttempts: number
): Promise<ConsumedOtp> {
  const primary = await client
    .from("otp_codes")
    .select("id, user_id, code_hash, attempts, expires_at")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1);
  let error = primary.error;
  let record: {
    id: string;
    user_id?: unknown;
    code_hash: string;
    attempts: number;
    expires_at: string;
  } | null = primary.data?.[0] ?? null;
  let includesUserId = true;
  if (error && hasNoUserIdColumn(error)) {
    includesUserId = false;
    const legacy = await client
      .from("otp_codes")
      .select("id, code_hash, attempts, expires_at")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1);
    error = legacy.error;
    record = legacy.data?.[0] ?? null;
  }
  if (error) throw error;

  if (!record || new Date(record.expires_at).getTime() <= Date.now() || record.attempts >= maxAttempts) {
    return { status: "invalid", userId: null };
  }
  if (record.code_hash !== codeHash) {
    const { error: updateError } = await client
      .from("otp_codes")
      .update({ attempts: record.attempts + 1 })
      .eq("id", record.id);
    if (updateError) throw updateError;
    return { status: "invalid", userId: null };
  }

  const { error: deleteError } = await client.from("otp_codes").delete().eq("id", record.id);
  if (deleteError) throw deleteError;
  return {
    status: "verified",
    userId: includesUserId && "user_id" in record && typeof record.user_id === "string" ? record.user_id : null,
  };
}
