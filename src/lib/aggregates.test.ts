import { describe, expect, it } from "vitest";
import { mdcatAggregate, nustAggregate } from "@/lib/aggregates";
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
