import { describe, expect, it } from "vitest";
import data from "./ivy-league.json";

const d = data as unknown as {
  rateAsOf: string;
  universities: {
    id: string;
    name: string;
    location: string;
    founded: number;
    acceptanceRate: number;
    acceptanceRateCycle: string;
    testingPolicy: string;
    testingPolicyNote: string;
    satMid50: { math: string; ebrw: string } | null;
    actMid50: string | null;
    gpaBenchmark: string;
    english: { toeflMin: number | null; ieltsMin: number | null; duolingoMin: number | null; exceptions: string };
    application: { platform: string; feeUsd: number; feePkr: number; feeWaiver: string; deadlines: { early: string; regular: string; cycleYear: string } };
    cost: { tuitionUsd: number; tuitionPkr: number; totalCostUsd: number; totalCostPkr: number; costCycle: string };
    financialAid: { intlPolicy: string; aidDetail: string; avgAwardUsd: number | null; percentIntlAid: number | null };
    uniquePrograms: string[];
    notableFacts: string[];
    sources: { admissions: string[]; aid: string[]; cost: string[]; english: string[] };
  }[];
};

const EXPECTED_IDS = ["harvard", "yale", "princeton", "columbia", "upenn", "brown", "dartmouth", "cornell"];

const HTTPS = /^https:\/\//;

describe("ivy-league.json", () => {
  it("covers exactly the 8 Ivy League universities", () => {
    expect(d.universities).toHaveLength(8);
    expect(d.universities.map((u) => u.id)).toEqual(EXPECTED_IDS);
  });

  it("uses the shared currency window", () => {
    expect(d.rateAsOf).toBe("2026-08");
  });

  it("every university has a sane acceptance rate with its cycle label", () => {
    for (const u of d.universities) {
      expect(u.acceptanceRate).toBeGreaterThan(0);
      expect(u.acceptanceRate).toBeLessThan(100);
      expect(u.acceptanceRateCycle.length).toBeGreaterThan(0);
    }
  });

  it("every testing policy is a known value with an explanatory note", () => {
    for (const u of d.universities) {
      expect(["required", "optional", "flexible"]).toContain(u.testingPolicy);
      expect(u.testingPolicyNote.length).toBeGreaterThan(0);
    }
  });

  it("every university has non-empty https sources for every stat group", () => {
    for (const u of d.universities) {
      for (const group of Object.values(u.sources)) {
        expect(group.length).toBeGreaterThan(0);
        for (const url of group) expect(url).toMatch(HTTPS);
      }
    }
  });

  it("PKR figures are computed at the shared USD rate (278)", () => {
    for (const u of d.universities) {
      expect(u.application.feePkr).toBe(Math.round(u.application.feeUsd * 278));
      expect(u.cost.tuitionPkr).toBe(u.cost.tuitionUsd * 278);
      expect(u.cost.totalCostPkr).toBe(u.cost.totalCostUsd * 278);
    }
  });

  it("every university has deadlines with a cycle year and content sections", () => {
    for (const u of d.universities) {
      expect(u.application.deadlines.cycleYear.length).toBeGreaterThan(0);
      expect(u.application.deadlines.early.length).toBeGreaterThan(0);
      expect(u.application.deadlines.regular.length).toBeGreaterThan(0);
      expect(u.uniquePrograms.length).toBeGreaterThanOrEqual(3);
      expect(u.notableFacts.length).toBeGreaterThanOrEqual(2);
      expect(u.cost.costCycle.length).toBeGreaterThan(0);
    }
  });

  it("financial aid policy is need-blind or need-aware", () => {
    for (const u of d.universities) {
      expect(["need-blind", "need-aware"]).toContain(u.financialAid.intlPolicy);
      expect(u.financialAid.aidDetail.length).toBeGreaterThan(0);
    }
  });
});
