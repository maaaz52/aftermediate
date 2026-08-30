import { describe, expect, it } from "vitest";
import {
  benchmarkFor,
  cohortPercentile,
  gapToClosing,
  marksToClose,
  programCohort,
  streamCohort,
  type BenchmarkProfile,
} from "./benchmark";
import type { University } from "./types";
import type { WatchlistEntry } from "./watchlist";

describe("programCohort / streamCohort (distribution core)", () => {
  it("produces 12 bins spanning 40–100 in 5-point steps", () => {
    const bins = programCohort(82);
    expect(bins).toHaveLength(12);
    expect(bins[0].lo).toBe(40);
    expect(bins[0].hi).toBe(44);
    expect(bins[5].lo).toBe(65);
    expect(bins[5].hi).toBe(69);
    expect(bins[11].lo).toBe(95);
    expect(bins[11].hi).toBe(100);
  });

  it("keeps every share in [0, 1] and sums to ≈ 1", () => {
    const bins = programCohort(82);
    const sum = bins.reduce((acc, b) => acc + b.share, 0);
    expect(sum).toBeCloseTo(1, 2);
    for (const bin of bins) {
      expect(bin.share).toBeGreaterThanOrEqual(0);
      expect(bin.share).toBeLessThanOrEqual(1);
    }
  });

  it("anchors the peak near closingMerit − 1 (NUST 82 → bin 80–84)", () => {
    const peak = programCohort(82).reduce((max, b) => (b.share > max.share ? b : max));
    expect(peak.lo).toBe(80);
  });

  it("clips high closing merits into the top bin (KEMC 94.9)", () => {
    const bins = programCohort(94.9);
    const peak = bins.reduce((max, b) => (b.share > max.share ? b : max));
    expect(peak.lo).toBe(95);
    const mid = bins.find((b) => b.lo === 90);
    expect(mid?.share ?? 0).toBeGreaterThan(0.2);
  });

  it("falls back to the stream default when closingMerit is null (AKU)", () => {
    expect(programCohort(null)).toEqual(streamCohort());
  });

  it("is deterministic", () => {
    expect(programCohort(82)).toEqual(programCohort(82));
    expect(streamCohort()).toEqual(streamCohort());
  });
});

describe("cohortPercentile", () => {
  it("is 0 below the track and 1 above it", () => {
    const bins = programCohort(82);
    expect(cohortPercentile(30, bins)).toBe(0);
    expect(cohortPercentile(110, bins)).toBe(1);
  });

  it("sits at ≈ 0.5 at the model mean", () => {
    expect(cohortPercentile(81, programCohort(82))).toBeCloseTo(0.5, 1);
  });

  it("matches the mockup NUST case (78.7 → ≈ 39% below)", () => {
    expect(cohortPercentile(78.7, programCohort(82))).toBeCloseTo(0.39, 1);
  });

  it("is monotonic in userValue", () => {
    const bins = programCohort(82);
    const values = [50, 60, 70, 78.7, 82, 90, 95];
    for (let i = 1; i < values.length; i++) {
      expect(cohortPercentile(values[i], bins)).toBeGreaterThan(
        cohortPercentile(values[i - 1], bins)
      );
    }
  });

  it("reaches ≈ 0.96 at 95 for the NUST model", () => {
    expect(cohortPercentile(95, programCohort(82))).toBeCloseTo(0.96, 2);
  });
});

describe("gapToClosing", () => {
  it("is the signed difference userValue − closingMerit", () => {
    expect(gapToClosing(78.7, 82)).toBeCloseTo(-3.3, 1);
    expect(gapToClosing(85, 82)).toBe(3);
    expect(gapToClosing(80, 80)).toBe(0);
  });
});

describe("marksToClose", () => {
  it("NUST: 3.3-point gap → 9 NET marks", () => {
    expect(marksToClose(-3.3, 0.75, 200)).toBe(9);
  });

  it("FAST: 4-point gap → 8 test marks", () => {
    expect(marksToClose(-4, 0.5, 100)).toBe(8);
  });

  it("MDCAT: 2-point gap → 8 test marks", () => {
    expect(marksToClose(-2, 0.5, 200)).toBe(8);
  });

  it("returns null when the gap is missing, non-negative, or the formula is degenerate", () => {
    expect(marksToClose(null, 0.75, 200)).toBeNull();
    expect(marksToClose(0, 0.75, 200)).toBeNull();
    expect(marksToClose(3.3, 0.75, 200)).toBeNull();
    expect(marksToClose(-3.3, 0, 200)).toBeNull();
    expect(marksToClose(-3.3, 0.75, 0)).toBeNull();
  });
});

// Real closing merits from universities.json (NUST BS CS 82/2025, KEMC MBBS
// 94.9/2025); AKU intentionally has no closingMerit — the null case.
const mockUnis: University[] = [
  {
    id: "nust",
    name: "NUST",
    short: "NUST",
    city: "Islamabad",
    type: "public",
    category: "engineering",
    streams: ["pre-engineering", "ics"],
    programs: [{ name: "BS Computer Science (SEECS)", closingMerit: 82, year: "2025" }],
    formulas: { note: "", components: [], eligibility: [] },
    entryTest: "NET",
    source_url: "",
  },
  {
    id: "fast",
    name: "FAST",
    short: "FAST",
    city: "Islamabad",
    type: "private",
    category: "computing",
    streams: ["pre-engineering", "ics"],
    programs: [{ name: "BS CS", closingMerit: 75, year: "2024" }],
    formulas: { note: "", components: [], eligibility: [] },
    entryTest: "FAST test",
    source_url: "",
  },
  {
    id: "kemc",
    name: "KEMC",
    short: "KEMC",
    city: "Lahore",
    type: "public",
    category: "medical",
    streams: ["pre-medical"],
    programs: [{ name: "MBBS", closingMerit: 94.9, year: "2025" }],
    formulas: { note: "", components: [], eligibility: [] },
    entryTest: "MDCAT",
    source_url: "",
  },
  {
    id: "aku",
    name: "AKU",
    short: "AKU",
    city: "Karachi",
    type: "private",
    category: "medical",
    streams: ["pre-medical"],
    programs: [{ name: "MBBS", year: "2025" }],
    formulas: { note: "", components: [], eligibility: [] },
    entryTest: "AKU test",
    source_url: "",
  },
  {
    id: "uet",
    name: "UET",
    short: "UET",
    city: "Lahore",
    type: "public",
    category: "engineering",
    streams: ["pre-engineering"],
    programs: [{ name: "CS", closingMerit: 82, year: "2024" }],
    formulas: { note: "", components: [], eligibility: [] },
    entryTest: "UET test",
    source_url: "",
  },
];

function makeEntry(overrides: Partial<WatchlistEntry> = {}): WatchlistEntry {
  return {
    id: "wl_test",
    type: "university",
    universityId: "nust",
    programName: "BS Computer Science (SEECS)",
    capturedMerit: 82,
    capturedYear: "2025",
    capturedAt: "2026-08-01T00:00:00.000Z",
    lastKnownMerit: 82,
    lastCheckedAt: "2026-08-01T00:00:00.000Z",
    myMerit: 78.7,
    myStream: "pre-engineering",
    notifyEmail: true,
    lastNotifiedAt: null,
    ...overrides,
  };
}

function makeProfile(overrides: Partial<BenchmarkProfile> = {}): BenchmarkProfile {
  return {
    marks: { matricObtained: 850, matricTotal: 1100, fscObtained: 900, fscTotal: 1100 },
    stream: "pre-engineering",
    watchlist: [makeEntry()],
    ...overrides,
  };
}

describe("benchmarkFor — program mode", () => {
  it("builds the NUST cohort from a watchlist entry", () => {
    const cohort = benchmarkFor(makeProfile(), mockUnis);
    expect(cohort.mode).toBe("program");
    expect(cohort.label).toBe("NUST BS Computer Science (SEECS)");
    expect(cohort.closingMerit).toBe(82);
    expect(cohort.closingYear).toBe("2025");
    expect(cohort.userValue).toBe(78.7);
    expect(cohort.percentile).toBeCloseTo(0.39, 1);
    expect(cohort.gap).toBeCloseTo(-3.3, 1);
    expect(cohort.actionHint).toBe("A 9-mark NET jump closes it.");
    expect(cohort.topQuartile).toBeNull();
  });

  it("prefers the first watchlist entry that has myMerit", () => {
    const noMerit = makeEntry({
      id: "wl_fast",
      universityId: "fast",
      programName: "BS CS",
      capturedMerit: 75,
      myMerit: null,
    });
    const withMerit = makeEntry({ id: "wl_nust" });
    const cohort = benchmarkFor(makeProfile({ watchlist: [noMerit, withMerit] }), mockUnis);
    expect(cohort.label).toBe("NUST BS Computer Science (SEECS)");
    expect(cohort.userValue).toBe(78.7);
  });

  it("honors an explicit entry even when it has no myMerit", () => {
    const noMerit = makeEntry({
      id: "wl_fast",
      universityId: "fast",
      programName: "BS CS",
      capturedMerit: 75,
      myMerit: null,
    });
    const cohort = benchmarkFor(makeProfile(), mockUnis, noMerit);
    expect(cohort.label).toBe("FAST BS CS");
    expect(cohort.userValue).toBeNull();
    expect(cohort.percentile).toBeNull();
    expect(cohort.gap).toBeNull();
  });

  it("falls back to the entry snapshot when the program is unknown", () => {
    const ghost = makeEntry({
      id: "wl_ghost",
      universityId: "xxx",
      programName: "Some Program",
      capturedMerit: 80,
      capturedYear: "2023",
    });
    const cohort = benchmarkFor(makeProfile({ watchlist: [ghost] }), mockUnis);
    expect(cohort.label).toBe("xxx Some Program");
    expect(cohort.closingMerit).toBe(80);
    expect(cohort.closingYear).toBe("2023");
  });

  it("omits the action hint when no formula exists (uet)", () => {
    const uet = makeEntry({
      id: "wl_uet",
      universityId: "uet",
      programName: "CS",
      capturedMerit: 82,
      myMerit: 78,
    });
    const cohort = benchmarkFor(makeProfile({ watchlist: [uet] }), mockUnis);
    expect(cohort.gap).toBeCloseTo(-4, 1);
    expect(cohort.actionHint).toBeNull();
  });

  it("handles a null closingMerit (AKU) with the stream default bins", () => {
    const aku = makeEntry({
      id: "wl_aku",
      universityId: "aku",
      programName: "MBBS",
      capturedMerit: null,
      capturedYear: "2025",
      myMerit: 80,
    });
    const cohort = benchmarkFor(makeProfile({ watchlist: [aku] }), mockUnis);
    expect(cohort.closingMerit).toBeNull();
    expect(cohort.bins).toEqual(streamCohort());
    expect(cohort.gap).toBeNull();
    expect(cohort.actionHint).toBeNull();
    expect(cohort.percentile).toBeCloseTo(0.69, 2);
  });

  it("gates userValue on marks even when myMerit exists", () => {
    const profile = makeProfile({
      marks: { matricObtained: 0, matricTotal: 1100, fscObtained: 0, fscTotal: 1100 },
    });
    const cohort = benchmarkFor(profile, mockUnis);
    expect(cohort.userValue).toBeNull();
    expect(cohort.percentile).toBeNull();
    expect(cohort.gap).toBeNull();
  });
});

describe("benchmarkFor — stream mode", () => {
  it("falls back to the stream when the watchlist is empty", () => {
    const cohort = benchmarkFor(makeProfile({ watchlist: [], stream: "ics" }), mockUnis);
    expect(cohort.mode).toBe("stream");
    expect(cohort.label).toBe("ICS applicants");
    expect(cohort.closingMerit).toBeNull();
    expect(cohort.bins).toEqual(streamCohort());
  });

  it("computes standing as FSc 60% + Matric 40%", () => {
    const cohort = benchmarkFor(makeProfile({ watchlist: [] }), mockUnis);
    expect(cohort.userValue).toBeCloseTo(80, 1);
    expect(cohort.percentile).toBeCloseTo(0.69, 2);
    expect(cohort.topQuartile).toBeCloseTo(81.7, 1);
  });

  it("uses the STREAM_LABEL for the cohort name", () => {
    const cohort = benchmarkFor(makeProfile({ watchlist: [], stream: "pre-medical" }), mockUnis);
    expect(cohort.label).toBe("FSc Pre-Medical applicants");
  });

  it("is deterministic", () => {
    const profile = makeProfile({ watchlist: [] });
    expect(benchmarkFor(profile, mockUnis)).toEqual(benchmarkFor(profile, mockUnis));
  });
});
