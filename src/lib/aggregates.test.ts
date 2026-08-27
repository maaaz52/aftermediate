import { describe, expect, it } from "vitest";
import { mdcatAggregate, nustAggregate, overallStanding } from "@/lib/aggregates";
import type { Marks } from "@/lib/types";

const base: Marks = {
  matricObtained: 950, matricTotal: 1100,
  fscObtained: 880, fscTotal: 1100,
  fscPart1Obtained: 440, fscPart1Total: 550,
};

describe("nustAggregate", () => {
  it("collapses toward the floor when no entry-test score is supplied", () => {
    // This is the pre-quiz behaviour: entryTestObtained is undefined -> treated as 0,
    // so 75% of the aggregate is thrown away.
    const r = nustAggregate(base);
    expect(r.value).toBeCloseTo(0.15 * 80 + 0.1 * (950 / 1100) * 100, 4);
    expect(r.value).toBeLessThan(25);
  });

  it("uses the real score once the quiz supplies one", () => {
    const r = nustAggregate({ ...base, entryTestObtained: 150, entryTestTotal: 200 });
    // 75% * 75 + 15% * 80 + 10% * 86.36
    expect(r.value).toBeCloseTo(0.75 * 75 + 0.15 * 80 + 0.1 * (950 / 1100) * 100, 4);
    expect(r.value).toBeGreaterThan(75);
  });

  it("keeps the three weights at 75/15/10", () => {
    const r = nustAggregate({ ...base, entryTestObtained: 150, entryTestTotal: 200 });
    expect(r.breakdown.map((b) => b.weight)).toEqual([75, 15, 10]);
  });
});

describe("mdcatAggregate", () => {
  it("uses the real MDCAT score when present", () => {
    const r = mdcatAggregate({ ...base, entryTestObtained: 170, entryTestTotal: 200 });
    expect(r.value).toBeCloseTo(0.5 * 85 + 0.4 * 80 + 0.1 * (950 / 1100) * 100, 4);
  });
});

describe("overallStanding", () => {
  it("weights FSc 60% and Matric 40%", () => {
    const s = overallStanding({
      matricObtained: 900, matricTotal: 1100,
      fscObtained: 880, fscTotal: 1100,
    });
    // FSc 80% · Matric 81.82% → 0.6*80 + 0.4*81.82
    expect(s.value).toBeCloseTo(0.6 * 80 + 0.4 * (900 / 1100) * 100, 4);
  });

  it("labels the percentile band correctly", () => {
    const perfect = overallStanding({
      matricObtained: 1100, matricTotal: 1100,
      fscObtained: 1100, fscTotal: 1100,
    });
    expect(perfect.label).toBe("top 1%");

    const mid = overallStanding({
      matricObtained: 500, matricTotal: 1100,
      fscObtained: 550, fscTotal: 1100,
    });
    // value ≈ 48.2 → below the 60% cutoff → top 80%
    expect(mid.label).toBe("top 80%");
  });

  it("returns 0 when totals are missing", () => {
    const s = overallStanding({
      matricObtained: 0, matricTotal: 0,
      fscObtained: 0, fscTotal: 0,
    });
    expect(s.value).toBe(0);
  });
});
