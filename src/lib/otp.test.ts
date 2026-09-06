import { describe, expect, it } from "vitest";
import { hashOtpCode, otpMatches } from "@/lib/otp";

describe("otp codes (reset tokens)", () => {
  it("hashes deterministically and binds the code to the email", () => {
    const a = hashOtpCode("a@b.com", "123456", "secret");
    expect(a).toBe(hashOtpCode("a@b.com", "123456", "secret"));
    expect(a).not.toBe(hashOtpCode("a@b.com", "654321", "secret"));
    // a code for one email cannot verify another
    expect(a).not.toBe(hashOtpCode("b@b.com", "123456", "secret"));
  });

  it("matches only the exact single-use code", () => {
    const h = hashOtpCode("a@b.com", "123456", "secret");
    expect(otpMatches(h, "a@b.com", "123456", "secret")).toBe(true);
    expect(otpMatches(h, "a@b.com", "123457", "secret")).toBe(false);
  });

  it("rejects a malformed stored hash instead of throwing in timingSafeEqual", () => {
    expect(otpMatches("not-hex", "a@b.com", "123456", "secret")).toBe(false);
    expect(otpMatches("", "a@b.com", "123456", "secret")).toBe(false);
  });
});