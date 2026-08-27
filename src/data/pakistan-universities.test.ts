import { describe, expect, it } from "vitest";
import json from "@/data/pakistan-universities.json";
import type { PakistanUniversity, Stream } from "@/lib/types";

const data = json as unknown as { dataYear: number; universities: PakistanUniversity[] };
const STREAMS: Stream[] = ["pre-medical", "pre-engineering", "ics", "icom", "alevel"];
const REQUIRED = ["nust", "fast", "lums", "giki", "iba", "comsats"] as const;

describe("pakistan-universities.json", () => {
  it("has exactly 12 universities", () => {
    expect(data.universities).toHaveLength(12);
  });

  it("has a numeric dataYear of 2026", () => {
    expect(data.dataYear).toBe(2026);
  });

  it("includes the 6 required flagship universities", () => {
    const ids = data.universities.map((u) => u.id);
    for (const id of REQUIRED) expect(ids).toContain(id);
  });

  it("has unique ids", () => {
    const ids = data.universities.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every university has non-empty required string fields", () => {
    for (const u of data.universities) {
      expect(u.name.length, u.id).toBeGreaterThan(2);
      expect(u.short.length, u.id).toBeGreaterThan(1);
      expect(u.city.length, u.id).toBeGreaterThan(1);
      expect(u.intro.length, u.id).toBeGreaterThan(40);
      expect(u.entryTest.length, u.id).toBeGreaterThan(1);
    }
  });

  it("every university has valid type and non-empty valid streams", () => {
    for (const u of data.universities) {
      expect(["public", "private"], u.id).toContain(u.type);
      expect(u.streams.length, u.id).toBeGreaterThan(0);
      for (const s of u.streams) expect(STREAMS, u.id).toContain(s);
    }
  });

  it("every university has 3-6 admission steps with title and detail", () => {
    for (const u of data.universities) {
      expect(u.admissionSteps.length, u.id).toBeGreaterThanOrEqual(3);
      expect(u.admissionSteps.length, u.id).toBeLessThanOrEqual(6);
      for (const step of u.admissionSteps) {
        expect(step.title.length, u.id).toBeGreaterThan(1);
        expect(step.detail.length, u.id).toBeGreaterThan(10);
      }
    }
  });

  it("every university has 3-4 best fields with why", () => {
    for (const u of data.universities) {
      expect(u.bestFields.length, u.id).toBeGreaterThanOrEqual(3);
      expect(u.bestFields.length, u.id).toBeLessThanOrEqual(4);
      for (const bf of u.bestFields) {
        expect(bf.field.length, u.id).toBeGreaterThan(1);
        expect(bf.why.length, u.id).toBeGreaterThan(10);
      }
    }
  });

  it("every university has ranking and fees with https source URLs", () => {
    for (const u of data.universities) {
      expect(u.ranking.label.length, u.id).toBeGreaterThan(1);
      expect(u.ranking.sourceUrl.startsWith("https://"), u.id).toBe(true);
      expect(u.fees.summary.length, u.id).toBeGreaterThan(1);
      expect(u.fees.sourceUrl.startsWith("https://"), u.id).toBe(true);
    }
  });

  it("every sourceUrls entry starts with https://", () => {
    for (const u of data.universities) {
      expect(u.sourceUrls.length, u.id).toBeGreaterThanOrEqual(1);
      for (const url of u.sourceUrls) expect(url.startsWith("https://"), u.id).toBe(true);
    }
  });

  it("programFees entries have positive perYear numbers", () => {
    for (const u of data.universities) {
      for (const pf of u.fees.programFees ?? []) {
        expect(pf.perYear, u.id).toBeGreaterThan(0);
        expect(pf.program.length, u.id).toBeGreaterThan(1);
      }
    }
  });

  it("fee-bearing flagship universities have programFees entries", () => {
    for (const id of ["nust", "fast", "lums", "iba", "comsats", "qau"]) {
      const u = data.universities.find((x) => x.id === id);
      expect(u?.fees.programFees?.length, id).toBeGreaterThanOrEqual(1);
    }
  });
});
