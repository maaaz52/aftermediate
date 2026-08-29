import { describe, expect, it } from "vitest";
import {
  addEntry,
  computeGap,
  findProgram,
  removeEntry,
  updateEntry,
  type WatchlistEntry,
} from "./watchlist";
import type { University } from "./types";

const mockUnis: University[] = [
  {
    id: "nust",
    name: "NUST",
    short: "NUST",
    city: "Islamabad",
    type: "public",
    category: "engineering",
    streams: ["pre-engineering", "ics"],
    programs: [
      { name: "CS", closingMerit: 80, year: "2024" },
      { name: "EE", closingMerit: 77, year: "2024" },
      { name: "NoMerit", year: "2023" },
    ],
    formulas: { note: "", components: [], eligibility: [] },
    entryTest: "NET",
    source_url: "",
  },
];

function makeEntry(overrides: Partial<WatchlistEntry> = {}): WatchlistEntry {
  return {
    id: "wl_test",
    type: "university",
    universityId: "nust",
    programName: "CS",
    capturedMerit: 80,
    capturedYear: "2024",
    capturedAt: "2026-08-01T00:00:00.000Z",
    lastKnownMerit: 80,
    lastCheckedAt: "2026-08-01T00:00:00.000Z",
    myMerit: 78,
    myStream: "pre-engineering",
    notifyEmail: true,
    lastNotifiedAt: null,
    ...overrides,
  };
}

describe("addEntry", () => {
  it("creates an entry with correct snapshot fields", () => {
    const [entry] = addEntry([], { universityId: "nust", programName: "CS", myMerit: 78, myStream: "pre-engineering" }, mockUnis);
    expect(entry.type).toBe("university");
    expect(entry.universityId).toBe("nust");
    expect(entry.programName).toBe("CS");
    expect(entry.capturedMerit).toBe(80);
    expect(entry.capturedYear).toBe("2024");
    expect(entry.myMerit).toBe(78);
    expect(entry.myStream).toBe("pre-engineering");
    expect(entry.notifyEmail).toBe(true);
    expect(entry.lastNotifiedAt).toBeNull();
    expect(entry.id).toMatch(/^wl_/);
    expect(entry.capturedAt).toBeTruthy();
  });

  it("generates a unique id", () => {
    const [a] = addEntry([], { universityId: "nust", programName: "CS", myMerit: 78 }, mockUnis);
    const [b] = addEntry([], { universityId: "nust", programName: "EE", myMerit: 78 }, mockUnis);
    expect(a.id).not.toBe(b.id);
  });

  it("deduplicates — updates existing entry instead of adding a duplicate", () => {
    const existing = makeEntry();
    const [result] = addEntry([existing], { universityId: "nust", programName: "CS", myMerit: 85, myStream: "pre-engineering" }, mockUnis);
    expect(result.id).toBe(existing.id);
    expect(result.myMerit).toBe(85);
    expect(result.capturedAt).not.toBe(existing.capturedAt);
  });

  it("returns original array when program is not found", () => {
    const result = addEntry([], { universityId: "nust", programName: "NONEXISTENT", myMerit: 78 }, mockUnis);
    expect(result).toEqual([]);
  });
});

describe("removeEntry", () => {
  it("removes the entry with matching id", () => {
    const a = makeEntry({ id: "wl_a" });
    const b = makeEntry({ id: "wl_b" });
    expect(removeEntry([a, b], "wl_a")).toEqual([b]);
  });

  it("returns the same array if id not found", () => {
    const a = makeEntry({ id: "wl_a" });
    expect(removeEntry([a], "wl_x")).toEqual([a]);
  });
});

describe("updateEntry", () => {
  it("patches fields on the matching entry", () => {
    const entry = makeEntry();
    const [updated] = updateEntry([entry], "wl_test", { lastKnownMerit: 82, notifyEmail: false });
    expect(updated.lastKnownMerit).toBe(82);
    expect(updated.notifyEmail).toBe(false);
    expect(updated.capturedMerit).toBe(80); // unchanged
  });
});

describe("computeGap", () => {
  it("returns safe when gap >= 0", () => {
    expect(computeGap(85, 80)).toBe("safe");
    expect(computeGap(80, 80)).toBe("safe");
  });

  it("returns tight when -5 <= gap < 0", () => {
    expect(computeGap(76, 80)).toBe("tight");
    expect(computeGap(75, 80)).toBe("tight");
  });

  it("returns reach when gap < -5", () => {
    expect(computeGap(74, 80)).toBe("reach");
    expect(computeGap(0, 80)).toBe("reach");
  });

  it("returns null when either merit is null", () => {
    expect(computeGap(null, 80)).toBeNull();
    expect(computeGap(80, null)).toBeNull();
    expect(computeGap(null, null)).toBeNull();
  });
});

describe("findProgram", () => {
  it("finds a program by id and name and returns merit + year", () => {
    const result = findProgram(mockUnis, "nust", "CS");
    expect(result).toEqual({ closingMerit: 80, year: "2024" });
  });

  it("returns null for unknown university", () => {
    expect(findProgram(mockUnis, "xxx", "CS")).toBeNull();
  });

  it("returns null for unknown program", () => {
    expect(findProgram(mockUnis, "nust", "AI")).toBeNull();
  });

  it("returns null for program with no closingMerit", () => {
    const result = findProgram(mockUnis, "nust", "NoMerit");
    expect(result).toBeNull();
  });
});
