/**
 * Centralized server configuration.
 *
 * Every API route that needs secrets or the Supabase project reads them here.
 * The exported `assertServerEnv()` is called by the admin client factory so a
 * missing required variable fails loudly at request time instead of silently
 * using a default that would weaken auth or emailing.
 */

export interface ServerEnv {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  resendApiKey: string | undefined;
  otpHmacSecret: string | undefined;
  googleModel: string;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function getServerEnv(): ServerEnv {
  return {
    supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
    resendApiKey: process.env.RESEND_API_KEY,
    otpHmacSecret: process.env.OTP_HMAC_SECRET,
    googleModel: process.env.GOOGLE_MODEL || "gemini-flash-latest",
  };
}

/**
 * Fails hard when a required server secret is absent in production.
 * Called from route modules at request time; safe to run repeatedly.
 */
export function assertServerEnv() {
  const env = getServerEnv();
  if (process.env.NODE_ENV === "production" && !env.otpHmacSecret) {
    throw new Error("Missing required env var: OTP_HMAC_SECRET");
  }
  return env;
}