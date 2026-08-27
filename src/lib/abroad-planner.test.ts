import { describe, expect, it } from "vitest";
import {
  firstYearCost,
  formatPkr,
  LIFESTYLE_MULTIPLIERS,
  savingsTimeline,
  yearlyProjection,
} from "@/lib/abroad-planner";
import type { AbroadCountry, AbroadTest } from "@/lib/types";

function country(over: Partial<AbroadCountry> = {}): AbroadCountry {
  return {
    id: "germany",
    name: "Germany",
    flag: "🇩🇪",
    intro: "A popular study destination for Pakistani students.",
    region: "europe",
    capital: "Berlin",
    language: "German",
    currency: { code: "EUR", name: "Euro", symbol: "€", toPkr: 300, rateAsOf: "2026-08" },
    visa: {
      type: "National D Student Visa",
      feePkr: 25000,
      processingTime: "4-8 weeks",
      keyPoints: ["Blocked account", "Health insurance"],
    },
    intakes: ["October", "April"],
    tuition: { ug: { min: 0, max: 0 }, masters: { min: 2000000, max: 4000000 }, phd: { min: 0, max: 0 } },
    living: {
      bigCity: { rent: 80000, food: 40000, transport: 12000, utilities: 12000, misc: 12000 },
      smallCity: { rent: 55000, food: 32000, transport: 9000, utilities: 10000, misc: 9000 },
    },
    oneTime: { applicationFee: 10000, visaFee: 25000, insurance: 30000, flight: 140000 },
    postStudyWork: "18-month job-seeking visa",
    postStudyWorkMonths: 18,
    pathway: [{ title: "Apply", detail: "Apply to the university online." }],
    documents: ["Passport", "Offer letter"],
    requiredTests: ["ielts"],
    topFields: ["Engineering"],
    pros: ["Tuition-free public universities"],
    cons: ["German needed for many jobs"],
    sources: [{ label: "Make it in Germany", url: "https://www.make-it-in-germany.com" }],
    ...over,
  };
}

const ielts: AbroadTest = {
  id: "ielts",
  name: "IELTS Academic",
  short: "IELTS",
  kind: "english",
  countries: ["germany"],
  pattern: [{ section: "Listening", content: "4 recordings", duration: "30 min" }],
  feePkr: 59000,
  feeNote: "Varies by centre",
  frequency: "Monthly",
  validity: "2 years",
  competitiveScore: "7.0+",
  prep: { tips: ["Practice"], resources: [{ label: "IELTS.org", url: "https://ielts.org" }] },
  sourceUrls: ["https://ielts.org"],
};

const c = country();
const baseline = {
  tuition: 3000000, // masters midpoint at tuitionT 0.5
  living: 156000 * 12, // big city moderate
  visaFee: 25000,
  applicationFee: 10000,
  insurance: 30000,
  flight: 140000,
  testFees: 59000,
  total: 5136000,
};

describe("LIFESTYLE_MULTIPLIERS", () => {
  it("has the three lifestyle keys with expected multipliers", () => {
    expect(LIFESTYLE_MULTIPLIERS).toEqual({ frugal: 0.85, moderate: 1, comfortable: 1.25 });
  });
});

describe("firstYearCost", () => {
  it("computes the full breakdown at the midpoint of the tuition range", () => {
    const b = firstYearCost(c, "masters", "big", "moderate", 0.5, [ielts]);
    expect(b).toEqual(baseline);
  });

  it("clamps tuitionT below 0 and above 1", () => {
    const low = firstYearCost(c, "masters", "big", "moderate", -1, [ielts]);
    expect(low.tuition).toBe(2000000);
    const high = firstYearCost(c, "masters", "big", "moderate", 2, [ielts]);
    expect(high.tuition).toBe(4000000);
  });

  it("yields exactly range.min at tuitionT 0 and range.max at tuitionT 1", () => {
    const atMin = firstYearCost(c, "masters", "big", "moderate", 0, [ielts]);
    expect(atMin.tuition).toBe(2000000);
    const atMax = firstYearCost(c, "masters", "big", "moderate", 1, [ielts]);
    expect(atMax.tuition).toBe(4000000);
  });

  it("applies the lifestyle multiplier to living only", () => {
    const frugal = firstYearCost(c, "masters", "big", "frugal", 0.5, [ielts]);
    expect(frugal.living).toBe(Math.round(156000 * 12 * 0.85));
    expect(frugal.tuition).toBe(3000000);
    expect(frugal.total).toBe(3000000 + Math.round(156000 * 12 * 0.85) + 264000);
  });

  it("uses the small-city living costs for tier small", () => {
    const b = firstYearCost(c, "masters", "small", "moderate", 0.5, [ielts]);
    expect(b.living).toBe(115000 * 12);
    expect(b.total).toBe(3000000 + 115000 * 12 + 264000);
  });

  it("only sums test fees for tests listed in requiredTests", () => {
    const extra: AbroadTest = { ...ielts, id: "gre", feePkr: 65000 };
    const b = firstYearCost(c, "masters", "big", "moderate", 0.5, [ielts, extra]);
    expect(b.testFees).toBe(59000);
  });
});

describe("yearlyProjection", () => {
  it("projects 4 years by default with 6% tuition inflation and flat non-tuition costs", () => {
    const b = firstYearCost(c, "masters", "big", "moderate", 0.5, [ielts]);
    expect(yearlyProjection(b)).toEqual([
      5136000, // year 1 = total
      3000000 * 1.06 + 2136000,
      3000000 * 1.06 ** 2 + 2136000,
      3000000 * 1.06 ** 3 + 2136000,
    ].map((n) => Math.round(n)));
  });

  it("honors a custom year count", () => {
    const b = firstYearCost(c, "masters", "big", "moderate", 0.5, [ielts]);
    expect(yearlyProjection(b, 2)).toHaveLength(2);
  });

  it("respects a custom tuitionInflation value", () => {
    const b = firstYearCost(c, "masters", "big", "moderate", 0.5, [ielts]);
    const nonTuition = b.total - b.tuition;
    const proj = yearlyProjection(b, 4, 0.1);
    expect(proj[0]).toBe(b.total);
    expect(proj[1]).toBe(Math.round(b.tuition * 1.1 + nonTuition));
    expect(proj[2]).toBe(Math.round(b.tuition * 1.21 + nonTuition));
  });
});

describe("savingsTimeline", () => {
  it("returns null for zero or negative monthly savings", () => {
    expect(savingsTimeline(0, 5000000)).toBeNull();
    expect(savingsTimeline(-500, 5000000)).toBeNull();
  });

  it("returns an already-saved result for a non-positive target", () => {
    expect(savingsTimeline(100000, 0)).toEqual({ months: 0, yearsMonths: "already saved" });
  });

  it("rounds up months and formats under one year", () => {
    expect(savingsTimeline(25000, 100000)).toEqual({ months: 4, yearsMonths: "4 months" });
  });

  it("formats whole years", () => {
    expect(savingsTimeline(100000, 6000000)).toEqual({ months: 60, yearsMonths: "5 years" });
  });

  it("formats years plus months", () => {
    expect(savingsTimeline(100000, 1300000)).toEqual({ months: 13, yearsMonths: "1 year 1 month" });
  });
});

describe("formatPkr", () => {
  it("formats millions with M", () => {
    expect(formatPkr(6000000)).toBe("PKR 6M");
    expect(formatPkr(6500000)).toBe("PKR 6.5M");
    expect(formatPkr(5136000)).toBe("PKR 5.1M");
    expect(formatPkr(1500000)).toBe("PKR 1.5M");
  });

  it("formats thousands with k", () => {
    expect(formatPkr(850000)).toBe("PKR 850k");
    expect(formatPkr(59000)).toBe("PKR 59k");
  });

  it("formats small amounts with separators", () => {
    expect(formatPkr(850)).toBe("PKR 850");
    expect(formatPkr(999)).toBe("PKR 999");
  });

  it("handles negatives", () => {
    expect(formatPkr(-850000)).toBe("-PKR 850k");
  });

  it("upgrades 1000k to 1M at the rounding boundary", () => {
    expect(formatPkr(999950)).toBe("PKR 1M");
    expect(formatPkr(999999)).toBe("PKR 1M");
    expect(formatPkr(1000000)).toBe("PKR 1M");
  });
});
