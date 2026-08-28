import { describe, expect, it } from "vitest";
import {
  filterIvyUniversities,
  ivyScholarshipsList,
  ivyStats,
  ivyUniversities,
  TESTING_POLICY_LABELS,
} from "./ivy";

describe("ivy data", () => {
  it("exposes all 8 Ivy League universities", () => {
    expect(ivyUniversities).toHaveLength(8);
  });

  it("exposes Ivy-eligible scholarships with sources", () => {
    expect(ivyScholarshipsList.length).toBeGreaterThanOrEqual(4);
    for (const s of ivyScholarshipsList) {
      expect(s.ivyLeague).toBe(true);
      expect(s.sourceUrls.length).toBeGreaterThanOrEqual(1);
      for (const url of s.sourceUrls) expect(url).toMatch(/^https:\/\//);
    }
  });
});

describe("filterIvyUniversities", () => {
  it("returns all universities with no filters", () => {
    expect(filterIvyUniversities(ivyUniversities)).toHaveLength(8);
  });

  it("filters by testing policy", () => {
    const required = filterIvyUniversities(ivyUniversities, { testingPolicy: "required" });
    expect(required.length).toBeGreaterThan(0);
    for (const u of required) expect(u.testingPolicy).toBe("required");
    expect(filterIvyUniversities(ivyUniversities, { testingPolicy: "all" })).toHaveLength(8);
  });

  it("filters by query across name, location, and programs", () => {
    expect(filterIvyUniversities(ivyUniversities, { query: "harvard" }).map((u) => u.id)).toEqual(["harvard"]);
    expect(filterIvyUniversities(ivyUniversities, { query: "New Haven" }).map((u) => u.id)).toEqual(["yale"]);
    expect(filterIvyUniversities(ivyUniversities, { query: "zzz-nothing" })).toHaveLength(0);
  });

  it("combines query and policy filters", () => {
    const out = filterIvyUniversities(ivyUniversities, { query: "wharton", testingPolicy: "required" });
    expect(out.map((u) => u.id)).toEqual(["upenn"]);
  });
});

describe("ivyStats", () => {
  it("throws on an empty list", () => {
    expect(() => ivyStats([])).toThrow(/non-empty/);
  });

  it("picks the most competitive, most generous, and cheapest schools", () => {
    const s = ivyStats(ivyUniversities);
    const minRate = Math.min(...ivyUniversities.map((u) => u.acceptanceRate));
    const maxAward = Math.max(
      ...ivyUniversities.filter((u) => u.financialAid.avgAwardUsd !== null).map((u) => u.financialAid.avgAwardUsd ?? 0)
    );
    const minCost = Math.min(...ivyUniversities.map((u) => u.cost.totalCostUsd));
    expect(s.mostCompetitive.acceptanceRate).toBe(minRate);
    expect(s.mostGenerousAid?.financialAid.avgAwardUsd).toBe(maxAward);
    expect(s.cheapestSticker.cost.totalCostUsd).toBe(minCost);
  });

  it("counts need-blind schools and computes the average acceptance rate", () => {
    const s = ivyStats(ivyUniversities);
    const needBlind = ivyUniversities.filter((u) => u.financialAid.intlPolicy === "need-blind").length;
    expect(s.needBlindCount).toBe(needBlind);
    const expected = Math.round((ivyUniversities.reduce((sum, u) => sum + u.acceptanceRate, 0) / 8) * 10) / 10;
    expect(s.averageAcceptance).toBe(expected);
  });
});

describe("TESTING_POLICY_LABELS", () => {
  it("labels every policy value", () => {
    expect(TESTING_POLICY_LABELS.required).toBe("SAT/ACT required");
    expect(TESTING_POLICY_LABELS.optional).toBe("Test-optional");
    expect(TESTING_POLICY_LABELS.flexible).toBe("Test-flexible");
  });
});
