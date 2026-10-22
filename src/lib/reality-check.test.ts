import { describe, expect, it } from "vitest";
import { REALITY_BENCHMARKS, benchmarksFor, isReviewDue } from "./reality-check";

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

  it("shows the Tech Edition benchmarks only for Computing & AI", () => {
    const tech = benchmarksFor("computing-ai");
    const business = benchmarksFor("business-finance");

    expect(tech.some((benchmark) => benchmark.id === "nsct")).toBe(true);
    expect(tech.some((benchmark) => benchmark.id === "github-activity")).toBe(true);
    expect(business.map((benchmark) => benchmark.id)).toEqual(["skills-shift"]);
  });

  it("flags a benchmark after one year without a source review", () => {
    expect(isReviewDue(REALITY_BENCHMARKS[0], new Date("2027-10-23T00:00:00Z"))).toBe(true);
    expect(isReviewDue(REALITY_BENCHMARKS[0], new Date("2027-10-22T00:00:00Z"))).toBe(false);
  });
});
