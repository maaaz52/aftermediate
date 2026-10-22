import { describe, expect, it } from "vitest";
import { REALITY_BENCHMARKS, benchmarksFor, isReviewDue, realityTrackFor } from "./reality-check";

describe("Reality Check benchmark catalogue", () => {
  it("keeps every displayed benchmark traceable and dated", () => {
    for (const benchmark of REALITY_BENCHMARKS) {
      expect(benchmark.metric).not.toHaveLength(0);
      expect(benchmark.source).not.toHaveLength(0);
      expect(benchmark.sourceUrl).toMatch(/^https:\/\//);
      expect(benchmark.published).toMatch(/^20\d{2}$/);
      expect(benchmark.reviewedAt).toMatch(/^20\d{2}-\d{2}-\d{2}$/);
      expect(benchmark.scope).not.toHaveLength(0);
      expect(benchmark.methodology).not.toHaveLength(0);
    }
  });

  it("shows pursuit-specific benchmarks alongside shared context", () => {
    const tech = benchmarksFor("computing-ai");
    const business = benchmarksFor("business-finance");

    expect(tech.some((benchmark) => benchmark.id === "nsct")).toBe(true);
    expect(tech.some((benchmark) => benchmark.id === "github-activity")).toBe(true);
    expect(business.some((benchmark) => benchmark.id === "youth-business-loans")).toBe(true);
    expect(business.some((benchmark) => benchmark.id === "freelance-exports")).toBe(true);
    expect(business.some((benchmark) => benchmark.id === "skills-shift")).toBe(true);
  });

  it("selects the reality track from a student's intended pursuit, not their prior stream", () => {
    expect(realityTrackFor("computing-ai").id).toBe("tech");
    expect(realityTrackFor("medicine-healthcare").id).toBe("health");
    expect(realityTrackFor("engineering").id).toBe("engineering");
    expect(realityTrackFor("business-finance").id).toBe("business");
    expect(realityTrackFor("arts-design").id).toBe("society");
    expect(realityTrackFor("undecided").id).toBe("explore");
  });

  it("flags a benchmark after one year without a source review", () => {
    expect(isReviewDue(REALITY_BENCHMARKS[0], new Date("2027-10-23T00:00:00Z"))).toBe(true);
    expect(isReviewDue(REALITY_BENCHMARKS[0], new Date("2027-10-22T00:00:00Z"))).toBe(false);
  });
});
