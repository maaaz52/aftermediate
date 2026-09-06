import { afterEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not prune a 1-hour window after a >60s idle gap", () => {
    let now = 1_000_000;
    vi.spyOn(Date, "now").mockImplementation(() => now);

    const key = `test-hour-${Math.random()}`;
    expect(checkRateLimit(key, 2, 60 * 60 * 1000)).toBe(true);
    expect(checkRateLimit(key, 2, 60 * 60 * 1000)).toBe(true);
    expect(checkRateLimit(key, 2, 60 * 60 * 1000)).toBe(false);

    // Idle >60s: prune() would previously wipe the bucket and reset the cap.
    now += 61_000;
    expect(checkRateLimit(key, 2, 60 * 60 * 1000)).toBe(false);
  });

  it("resets a bucket once its own window has passed", () => {
    let now = 2_000_000;
    vi.spyOn(Date, "now").mockImplementation(() => now);

    const key = `test-minute-${Math.random()}`;
    expect(checkRateLimit(key, 1, 60 * 1000)).toBe(true);
    expect(checkRateLimit(key, 1, 60 * 1000)).toBe(false);

    now += 61_000;
    expect(checkRateLimit(key, 1, 60 * 1000)).toBe(true);
  });
});