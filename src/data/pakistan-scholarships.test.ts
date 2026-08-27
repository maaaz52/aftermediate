import { describe, expect, it } from "vitest";
import json from "@/data/pakistan-scholarships.json";
import type { PakistanScholarship, ScholarshipCategory } from "@/lib/types";

const data = json as unknown as { dataYear: number; scholarships: PakistanScholarship[] };
const CATEGORIES: ScholarshipCategory[] = [
  "hec",
  "need-based",
  "merit-based",
  "university-specific",
  "provincial",
];

describe("pakistan-scholarships.json", () => {
  it("has exactly 24 scholarships", () => {
    expect(data.scholarships).toHaveLength(24);
  });

  it("has a numeric dataYear of 2026", () => {
    expect(data.dataYear).toBe(2026);
  });

  it("has unique ids", () => {
    const ids = data.scholarships.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers every category with at least one scholarship", () => {
    const present = new Set(data.scholarships.map((s) => s.category));
    for (const c of CATEGORIES) expect(present.has(c)).toBe(true);
  });

  it("every scholarship has a valid category", () => {
    for (const s of data.scholarships) expect(CATEGORIES, s.id).toContain(s.category);
  });

  it("every scholarship has non-empty required fields", () => {
    for (const s of data.scholarships) {
      expect(s.name.length, s.id).toBeGreaterThan(3);
      expect(s.funder.length, s.id).toBeGreaterThan(2);
      expect(s.level.length, s.id).toBeGreaterThan(2);
      expect(s.coverage.length, s.id).toBeGreaterThan(3);
      expect(s.deadline.length, s.id).toBeGreaterThan(2);
    }
  });

  it("every scholarship has 2-5 eligibility bullets", () => {
    for (const s of data.scholarships) {
      expect(s.eligibility.length, s.id).toBeGreaterThanOrEqual(2);
      expect(s.eligibility.length, s.id).toBeLessThanOrEqual(5);
      for (const e of s.eligibility) expect(e.length, s.id).toBeGreaterThan(5);
    }
  });

  it("every scholarship has an https sourceUrl", () => {
    for (const s of data.scholarships) {
      expect(s.sourceUrl.startsWith("https://"), s.id).toBe(true);
      expect(s.sourceUrl.length, s.id).toBeGreaterThan("https://x.xx".length);
    }
  });
});
