import { describe, expect, it } from "vitest";
import json from "@/data/abroad-tests.json";
import countriesJson from "@/data/abroad-countries.json";
import type { AbroadCountry, AbroadTest, AbroadTestKind } from "@/lib/types";

const data = json as unknown as { dataYear: number; tests: AbroadTest[] };
const countries = (countriesJson as unknown as { countries: AbroadCountry[] }).countries;
const countryIds = countries.map((c) => c.id);
const KINDS: AbroadTestKind[] = ["english", "aptitude", "graduate", "language"];
const REQUIRED = [
  "ielts", "toefl", "pte", "duolingo", "sat", "act", "gre", "gmat", "testdaf",
  "goethe", "osd", "cils", "celi", "topik", "hsk", "tr-yos", "tolc", "nt2", "bipa",
] as const;

describe("abroad-tests.json", () => {
  it("has 18-22 tests", () => {
    expect(data.tests.length).toBeGreaterThanOrEqual(18);
    expect(data.tests.length).toBeLessThanOrEqual(22);
  });

  it("has a numeric dataYear of 2026", () => {
    expect(data.dataYear).toBe(2026);
  });

  it("has unique ids", () => {
    const ids = data.tests.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes the full required test list", () => {
    const ids = data.tests.map((t) => t.id);
    for (const id of REQUIRED) expect(ids, id).toContain(id);
  });

  it("has the expected kind distribution (4 english, 4 aptitude, 2 graduate, 9 language)", () => {
    const counts = { english: 0, aptitude: 0, graduate: 0, language: 0 };
    for (const t of data.tests) counts[t.kind] += 1;
    expect(counts).toEqual({ english: 4, aptitude: 4, graduate: 2, language: 9 });
  });

  it("every test has valid kind, countries, and non-empty text fields", () => {
    for (const t of data.tests) {
      expect(KINDS, t.id).toContain(t.kind);
      expect(t.countries.length, t.id).toBeGreaterThanOrEqual(1);
      for (const c of t.countries) expect(countryIds, `${t.id}:${c}`).toContain(c);
      expect(t.name.length, t.id).toBeGreaterThan(2);
      expect(t.short.length, t.id).toBeGreaterThan(1);
      expect(t.feeNote.length, t.id).toBeGreaterThan(5);
      expect(t.frequency.length, t.id).toBeGreaterThan(1);
      expect(t.validity.length, t.id).toBeGreaterThan(1);
      expect(t.competitiveScore.length, t.id).toBeGreaterThan(2);
    }
  });

  it("every test has a positive fee and a 2-6 section pattern", () => {
    for (const t of data.tests) {
      expect(t.feePkr, t.id).toBeGreaterThan(0);
      expect(t.pattern.length, t.id).toBeGreaterThanOrEqual(2);
      expect(t.pattern.length, t.id).toBeLessThanOrEqual(6);
      for (const p of t.pattern) {
        expect(p.section.length, t.id).toBeGreaterThan(1);
        expect(p.content.length, t.id).toBeGreaterThan(2);
        expect(p.duration.length, t.id).toBeGreaterThan(1);
      }
    }
  });

  it("every test has 3+ prep tips, 2+ https prep resources, and 1+ https source", () => {
    for (const t of data.tests) {
      expect(t.prep.tips.length, t.id).toBeGreaterThanOrEqual(3);
      expect(t.prep.resources.length, t.id).toBeGreaterThanOrEqual(2);
      for (const r of t.prep.resources) {
        expect(r.label.length, t.id).toBeGreaterThan(1);
        expect(r.url.startsWith("https://"), `${t.id}:${r.url}`).toBe(true);
      }
      expect(t.sourceUrls.length, t.id).toBeGreaterThanOrEqual(1);
      for (const url of t.sourceUrls) expect(url.startsWith("https://"), `${t.id}:${url}`).toBe(true);
    }
  });

  it("every country's requiredTests reference real test ids that cover that country", () => {
    const byId = new Map(data.tests.map((t) => [t.id, t]));
    for (const c of countries) {
      for (const testId of c.requiredTests) {
        const test = byId.get(testId);
        expect(test, `${c.id}:${testId}`).toBeDefined();
        expect(test?.countries, `${c.id}:${testId}`).toContain(c.id);
      }
    }
  });
});
