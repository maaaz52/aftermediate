import { describe, expect, it } from "vitest";
import json from "@/data/abroad-countries.json";
import type { AbroadCountry, AbroadRegion } from "@/lib/types";

const data = json as unknown as { dataYear: number; countries: AbroadCountry[] };
const REGIONS: AbroadRegion[] = ["europe", "asia", "north-america"];
const REQUIRED = [
  "germany", "austria", "italy", "south-korea", "turkey", "china", "indonesia",
  "usa", "uk", "ireland", "lithuania", "netherlands", "hungary",
] as const;

describe("abroad-countries.json", () => {
  it("has exactly 13 countries", () => {
    expect(data.countries).toHaveLength(13);
  });

  it("has a numeric dataYear of 2026", () => {
    expect(data.dataYear).toBe(2026);
  });

  it("includes all 13 required countries", () => {
    const ids = data.countries.map((c) => c.id);
    for (const id of REQUIRED) expect(ids, id).toContain(id);
  });

  it("has the expected region distribution (8 europe, 4 asia, 1 north-america)", () => {
    const counts = { europe: 0, asia: 0, "north-america": 0 };
    for (const c of data.countries) counts[c.region] += 1;
    expect(counts).toEqual({ europe: 8, asia: 4, "north-america": 1 });
  });

  it("has unique ids", () => {
    const ids = data.countries.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every country has a valid region and non-empty profile fields", () => {
    for (const c of data.countries) {
      expect(REGIONS, c.id).toContain(c.region);
      expect(c.name.length, c.id).toBeGreaterThan(2);
      expect(c.flag.length, c.id).toBeGreaterThan(0);
      expect(c.intro.length, c.id).toBeGreaterThan(40);
      expect(c.capital.length, c.id).toBeGreaterThan(1);
      expect(c.language.length, c.id).toBeGreaterThan(1);
    }
  });

  it("every currency has a positive rate and a YYYY-MM rateAsOf", () => {
    for (const c of data.countries) {
      expect(c.currency.code.length, c.id).toBeGreaterThanOrEqual(3);
      expect(c.currency.toPkr, c.id).toBeGreaterThan(0);
      expect(c.currency.rateAsOf, c.id).toMatch(/^\d{4}-\d{2}$/);
      expect(c.currency.rateAsOf, c.id).toBe("2026-08");
    }
  });

  it("every visa has a positive fee, processing time, and 3+ key points", () => {
    for (const c of data.countries) {
      expect(c.visa.type.length, c.id).toBeGreaterThan(2);
      expect(c.visa.feePkr, c.id).toBeGreaterThan(0);
      expect(c.visa.processingTime.length, c.id).toBeGreaterThan(1);
      expect(c.visa.keyPoints.length, c.id).toBeGreaterThanOrEqual(3);
      for (const kp of c.visa.keyPoints) expect(kp.length, c.id).toBeGreaterThan(5);
    }
  });

  it("every country has at least one intake and a non-negative postStudyWorkMonths", () => {
    for (const c of data.countries) {
      expect(c.intakes.length, c.id).toBeGreaterThanOrEqual(1);
      expect(c.postStudyWork.length, c.id).toBeGreaterThan(5);
      expect(c.postStudyWorkMonths, c.id).toBeGreaterThanOrEqual(0);
    }
  });

  it("every tuition level has a positive min and max >= min", () => {
    for (const c of data.countries) {
      for (const level of ["ug", "masters", "phd"] as const) {
        const t = c.tuition[level];
        expect(t.min, `${c.id}:${level}`).toBeGreaterThanOrEqual(0);
        expect(t.max, `${c.id}:${level}`).toBeGreaterThanOrEqual(t.min);
      }
      expect(c.tuition.masters.max, c.id).toBeGreaterThan(0); // at least one level must be non-zero
    }
  });

  it("every living component is positive in both city tiers", () => {
    for (const c of data.countries) {
      for (const tier of ["bigCity", "smallCity"] as const) {
        const m = c.living[tier];
        for (const key of ["rent", "food", "transport", "utilities", "misc"] as const) {
          expect(m[key], `${c.id}:${tier}:${key}`).toBeGreaterThan(0);
        }
      }
      // small city must be cheaper than big city overall
      const big = c.living.bigCity.rent + c.living.bigCity.food + c.living.bigCity.transport + c.living.bigCity.utilities + c.living.bigCity.misc;
      const small = c.living.smallCity.rent + c.living.smallCity.food + c.living.smallCity.transport + c.living.smallCity.utilities + c.living.smallCity.misc;
      expect(small, c.id).toBeLessThan(big);
    }
  });

  it("one-time costs are non-negative and visaFee matches visa.feePkr", () => {
    for (const c of data.countries) {
      expect(c.oneTime.applicationFee, c.id).toBeGreaterThanOrEqual(0);
      expect(c.oneTime.insurance, c.id).toBeGreaterThanOrEqual(0);
      expect(c.oneTime.flight, c.id).toBeGreaterThan(0);
      expect(c.oneTime.visaFee, c.id).toBe(c.visa.feePkr);
    }
  });

  it("every country has 4-8 pathway steps with title and detail", () => {
    for (const c of data.countries) {
      expect(c.pathway.length, c.id).toBeGreaterThanOrEqual(4);
      expect(c.pathway.length, c.id).toBeLessThanOrEqual(8);
      for (const step of c.pathway) {
        expect(step.title.length, c.id).toBeGreaterThan(1);
        expect(step.detail.length, c.id).toBeGreaterThan(10);
      }
    }
  });

  it("every country has 5+ documents and 1+ required test ids (lowercase, no spaces)", () => {
    for (const c of data.countries) {
      expect(c.documents.length, c.id).toBeGreaterThanOrEqual(5);
      for (const d of c.documents) expect(d.length, c.id).toBeGreaterThan(2);
      expect(c.requiredTests.length, c.id).toBeGreaterThanOrEqual(1);
      for (const t of c.requiredTests) {
        expect(t, c.id).toMatch(/^[a-z0-9-]+$/);
      }
    }
  });

  it("every country has 3+ top fields, 3+ pros, 2+ cons", () => {
    for (const c of data.countries) {
      expect(c.topFields.length, c.id).toBeGreaterThanOrEqual(3);
      expect(c.pros.length, c.id).toBeGreaterThanOrEqual(3);
      expect(c.cons.length, c.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("every country has 2+ labeled https sources", () => {
    for (const c of data.countries) {
      expect(c.sources.length, c.id).toBeGreaterThanOrEqual(2);
      for (const s of c.sources) {
        expect(s.label.length, c.id).toBeGreaterThan(1);
        expect(s.url.startsWith("https://"), `${c.id}:${s.url}`).toBe(true);
      }
    }
  });
});
