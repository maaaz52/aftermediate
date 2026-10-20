import { describe, expect, it } from "vitest";
import { parseWatchlist } from "./watchlist-validation";

const valid = {
  id: "wl_1",
  type: "university",
  universityId: "nust",
  programName: "BS Computer Science",
  capturedMerit: 82,
  capturedYear: "2025",
  capturedAt: "2026-10-20T00:00:00.000Z",
  lastKnownMerit: 82,
  lastCheckedAt: null,
  myMerit: 84,
  myStream: "ics",
  notifyEmail: true,
  lastNotifiedAt: null,
};

describe("parseWatchlist", () => {
  it("copies a valid bounded entry", () => {
    expect(parseWatchlist([valid])).toEqual({ ok: true, value: [valid] });
  });

  it("rejects duplicate IDs and invalid percentages", () => {
    expect(parseWatchlist([valid, valid]).ok).toBe(false);
    expect(parseWatchlist([{ ...valid, myMerit: 101 }]).ok).toBe(false);
  });

  it("drops unknown properties by returning a clean copy", () => {
    const parsed = parseWatchlist([{ ...valid, injected: "value" }]);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value[0]).not.toHaveProperty("injected");
  });
});
