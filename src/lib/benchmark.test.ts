import { describe, expect, it } from "vitest";
import { programCohort, streamCohort } from "./benchmark";

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
