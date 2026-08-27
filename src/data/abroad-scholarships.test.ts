import { describe, expect, it } from "vitest";
import json from "@/data/abroad-scholarships.json";
import countriesJson from "@/data/abroad-countries.json";
import type { AbroadCountry, AbroadScholarship, AbroadScholarshipCategory } from "@/lib/types";

const data = json as unknown as { dataYear: number; scholarships: AbroadScholarship[] };
const countryIds = (countriesJson as unknown as { countries: AbroadCountry[] }).countries.map((c) => c.id);
const CATEGORIES: AbroadScholarshipCategory[] = [
  "hec", "host-government", "university-specific", "merit-based", "need-based",
];
const LEVELS = ["bachelors", "masters", "phd", "multiple"] as const;
const FLAGSHIPS = [
  "fulbright-pakistan", "chevening", "daad-epos", "gks-korea", "csc-chinese-govt",
  "stipendium-hungaricum", "turkiye-burslari", "hec-foreign-scholarships",
  "commonwealth-masters", "commonwealth-phd", "humphrey-fellowship-pakistan",
  "erasmus-mundus-joint-masters", "government-of-ireland", "nl-scholarship",
  "gks-undergraduate", "knb-indonesia", "italy-maeci-grant",
  "austria-oead-grant", "kaist-international",
] as const;

describe("abroad-scholarships.json", () => {
  it("has 50-70 scholarships", () => {
    expect(data.scholarships.length).toBeGreaterThanOrEqual(50);
    expect(data.scholarships.length).toBeLessThanOrEqual(70);
  });

  it("has a numeric dataYear of 2026", () => {
    expect(data.dataYear).toBe(2026);
  });

  it("has unique ids", () => {
    const ids = data.scholarships.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes the flagship verified programs", () => {
    const ids = new Set(data.scholarships.map((s) => s.id));
    for (const id of FLAGSHIPS) expect(ids, id).toContain(id);
  });

  it("every category has entries and HEC has at least 8", () => {
    for (const cat of CATEGORIES) {
      expect(data.scholarships.filter((s) => s.category === cat).length).toBeGreaterThan(0);
    }
    expect(data.scholarships.filter((s) => s.category === "hec").length).toBeGreaterThanOrEqual(8);
  });

  it("every scholarship has a valid category and level", () => {
    for (const s of data.scholarships) {
      expect(CATEGORIES, s.id).toContain(s.category);
      expect(LEVELS, s.id).toContain(s.level);
      expect(["full", "partial"], s.id).toContain(s.coverage);
    }
  });

  it("every scholarship has countries that are valid ids or the multiple wildcard", () => {
    for (const s of data.scholarships) {
      expect(s.countries.length, s.id).toBeGreaterThanOrEqual(1);
      for (const c of s.countries) {
        if (c === "multiple") continue;
        expect(countryIds, `${s.id}:${c}`).toContain(c);
      }
    }
  });

  it("every scholarship has 3+ eligibility items, a deadline, and 2+ apply steps", () => {
    for (const s of data.scholarships) {
      expect(s.eligibility.length, s.id).toBeGreaterThanOrEqual(3);
      for (const e of s.eligibility) expect(e.length, s.id).toBeGreaterThan(5);
      expect(s.deadline.length, s.id).toBeGreaterThan(2);
      expect(s.howToApply.length, s.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("every scholarship has non-empty text fields and 1+ https source", () => {
    for (const s of data.scholarships) {
      expect(s.name.length, s.id).toBeGreaterThan(3);
      expect(s.funder.length, s.id).toBeGreaterThan(2);
      expect(s.coverageDetail.length, s.id).toBeGreaterThan(10);
      expect(s.sourceUrls.length, s.id).toBeGreaterThanOrEqual(1);
      for (const url of s.sourceUrls) expect(url.startsWith("https://"), `${s.id}:${url}`).toBe(true);
    }
  });
});
