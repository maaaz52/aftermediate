import { createHash } from "node:crypto";

/**
 * OTP code hash, shared by /api/otp/send and /api/otp/verify so the scheme
 * (sha256 over `secret:email:code`) cannot drift between the two routes.
 */
export function hashOtpCode(email: string, code: string, secret: string): string {
  return createHash("sha256").update(`${secret}:${email.toLowerCase()}:${code}`).digest("hex");
}