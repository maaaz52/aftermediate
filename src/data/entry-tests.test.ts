import { describe, expect, it } from "vitest";
import json from "@/data/entry-tests.json";
import type { EntryTest, Stream } from "@/lib/types";

const data = json as unknown as { dataYear: number; tests: EntryTest[] };
const STREAMS: Stream[] = ["pre-medical", "pre-engineering", "ics", "icom", "alevel"];
const CORE = ["mdcat", "ecat", "net", "fungat", "lcat", "lat"] as const;

describe("entry-tests.json", () => {
  it("has exactly 12 tests", () => {
    expect(data.tests).toHaveLength(12);
  });

  it("has a numeric dataYear of 2026", () => {
    expect(data.dataYear).toBe(2026);
  });

  it("includes the 6 core tests", () => {
    const ids = data.tests.map((t) => t.id);
    for (const id of CORE) expect(ids).toContain(id);
  });

  it("has unique ids", () => {
    const ids = data.tests.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every test has non-empty required string fields and valid streams", () => {
    for (const t of data.tests) {
      expect(t.name.length, t.id).toBeGreaterThan(5);
      expect(t.short.length, t.id).toBeGreaterThan(1);
      expect(t.conductingBody.length, t.id).toBeGreaterThan(2);
      expect(t.fee.length, t.id).toBeGreaterThan(2);
      expect(t.frequency.length, t.id).toBeGreaterThan(2);
      expect(t.validity.length, t.id).toBeGreaterThan(2);
      expect(t.streams.length, t.id).toBeGreaterThan(0);
      for (const s of t.streams) expect(STREAMS, t.id).toContain(s);
    }
  });

  it("every test has a non-empty acceptedBy list", () => {
    for (const t of data.tests) {
      expect(t.acceptedBy.length, t.id).toBeGreaterThanOrEqual(1);
      for (const a of t.acceptedBy) expect(a.length, t.id).toBeGreaterThan(2);
    }
  });

  it("every test has a non-empty pattern with sections", () => {
    for (const t of data.tests) {
      expect(t.pattern.length, t.id).toBeGreaterThanOrEqual(2);
      for (const p of t.pattern) expect(p.section.length, p.section).toBeGreaterThan(1);
    }
  });

  it("every test has a non-empty syllabus with topics", () => {
    for (const t of data.tests) {
      expect(t.syllabus.length, t.id).toBeGreaterThanOrEqual(1);
      for (const s of t.syllabus) {
        expect(s.subject.length, s.subject).toBeGreaterThan(1);
        expect(s.topics.length, s.subject).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("every test has 3-5 howToApply steps", () => {
    for (const t of data.tests) {
      expect(t.howToApply.length, t.id).toBeGreaterThanOrEqual(3);
      expect(t.howToApply.length, t.id).toBeLessThanOrEqual(5);
      for (const step of t.howToApply) expect(step.length, t.id).toBeGreaterThan(10);
    }
  });

  it("every test has https sourceUrls", () => {
    for (const t of data.tests) {
      expect(t.sourceUrls.length, t.id).toBeGreaterThanOrEqual(1);
      for (const url of t.sourceUrls) {
        expect(url.startsWith("https://"), t.id).toBe(true);
        expect(url.length, t.id).toBeGreaterThan("https://x.xx".length);
      }
    }
  });
});
