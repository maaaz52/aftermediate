import { createHash, timingSafeEqual } from "node:crypto";

/**
 * OTP code hash, shared by /api/otp/send and /api/otp/verify so the scheme
 * (sha256 over `secret:email:code`) cannot drift between the two routes.
 */
export function hashOtpCode(email: string, code: string, secret: string): string {
  return createHash("sha256").update(`${secret}:${email.toLowerCase()}:${code}`).digest("hex");
}

/**
 * Constant-time comparison of a stored hash against a fresh one, so response
 * timing cannot leak how many prefix bytes of a guessed code are right.
 */
export function otpMatches(storedHash: string, email: string, code: string, secret: string): boolean {
  const a = Buffer.from(storedHash, "hex");
  const b = Buffer.from(hashOtpCode(email, code, secret), "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}