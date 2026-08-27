import { describe, expect, it } from "vitest";
import json from "@/data/salary-fields.json";
import type { CareerPath, SalaryField, Stream } from "@/lib/types";

const data = json as unknown as {
  dataYear: number;
  disclaimer: string;
  fields: SalaryField[];
  careerPaths: CareerPath[];
};
const STREAMS: Stream[] = ["pre-medical", "pre-engineering", "ics", "icom", "alevel"];
const LEVELS = ["entry", "mid", "senior"] as const;

describe("salary-fields.json", () => {
  it("has at least 10 fields", () => {
    expect(data.fields.length).toBeGreaterThanOrEqual(10);
  });

  it("has a numeric dataYear of 2026 and a non-empty disclaimer", () => {
    expect(data.dataYear).toBe(2026);
    expect(data.disclaimer.length).toBeGreaterThan(30);
  });

  it("has unique field ids", () => {
    const ids = data.fields.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every field has non-empty name, emoji, and valid streams", () => {
    for (const f of data.fields) {
      expect(f.name.length).toBeGreaterThan(2);
      expect(f.emoji.length).toBeGreaterThan(0);
      expect(f.streams.length).toBeGreaterThan(0);
      for (const s of f.streams) expect(STREAMS).toContain(s);
    }
  });

  it("every field has valid demand and stability enums", () => {
    for (const f of data.fields) {
      expect(["high", "medium", "low"]).toContain(f.demand);
      expect(["high", "medium", "low"]).toContain(f.stability);
    }
  });

  it("every field has monotonic non-decreasing salary ranges across levels", () => {
    for (const f of data.fields) {
      for (const level of LEVELS) {
        const range = f.salaries[level];
        expect(range, `missing salary level ${level} in ${f.id}`).toBeDefined();
        const [min, max] = range!;
        expect(min, f.id).toBeGreaterThan(0);
        expect(max, f.id).toBeGreaterThan(min);
      }
      expect(f.salaries.entry[0]).toBeLessThanOrEqual(f.salaries.mid[0]);
      expect(f.salaries.mid[0]).toBeLessThanOrEqual(f.salaries.senior[0]);
      expect(f.salaries.entry[1]).toBeLessThanOrEqual(f.salaries.mid[1]);
      expect(f.salaries.mid[1]).toBeLessThanOrEqual(f.salaries.senior[1]);
    }
  });

  it("every field has growth between -10 and +50", () => {
    for (const f of data.fields) {
      expect(f.growth).toBeGreaterThanOrEqual(-10);
      expect(f.growth).toBeLessThanOrEqual(50);
    }
  });

  it("every field has https sources", () => {
    for (const f of data.fields) {
      expect(f.sources.length).toBeGreaterThanOrEqual(1);
      for (const url of f.sources) expect(url.startsWith("https://")).toBe(true);
    }
  });

  it("every field has a non-empty notes string", () => {
    for (const f of data.fields) {
      expect((f.notes ?? "").length, f.id).toBeGreaterThan(10);
    }
  });

  it("careerPaths contains exactly freelancing, government, and private", () => {
    const ids = data.careerPaths.map((c) => c.id).sort();
    expect(ids).toEqual(["freelancing", "government", "private"]);
  });

  it("at least one field has stability=high (precondition for mostStableField)", () => {
    expect(data.fields.some((f) => f.stability === "high")).toBe(true);
  });

  it("every career path has non-empty pros, cons, emoji, incomeRange, and bestFor", () => {
    for (const c of data.careerPaths) {
      expect(c.pros.length).toBeGreaterThanOrEqual(2);
      expect(c.cons.length).toBeGreaterThanOrEqual(2);
      expect(c.incomeRange.length).toBeGreaterThan(5);
      expect(c.bestFor.length).toBeGreaterThan(10);
      expect(c.emoji.length).toBeGreaterThan(0);
    }
  });
});
