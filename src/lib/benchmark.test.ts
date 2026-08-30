import { describe, expect, it } from "vitest";
import { cohortPercentile, gapToClosing, marksToClose, programCohort, streamCohort } from "./benchmark";

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
