import { describe, expect, it } from "vitest";
import demand from "@/data/demand.json";
import type { DemandCountry, Stream } from "@/lib/types";

const streams: Stream[] = ["pre-medical", "pre-engineering", "ics", "icom", "alevel"];

describe("demand data", () => {
  it("covers every stream with exactly 3 countries", () => {
    expect(Object.keys(demand).sort()).toEqual([...streams].sort());
    for (const s of streams) {
      const list = (demand as Record<Stream, DemandCountry[]>)[s];
      expect(list, `missing stream ${s}`).toBeDefined();
      expect(list).toHaveLength(3);
    }
  });

  it("scores are 0-100 and every country has a flag and reason", () => {
    for (const s of streams) {
      const list = (demand as Record<Stream, DemandCountry[]>)[s];
      expect(new Set(list.map((c) => c.country)).size).toBe(list.length);
      for (const c of list) {
        expect(c.country).not.toBe("");
        expect(c.score).toBeGreaterThanOrEqual(0);
        expect(c.score).toBeLessThanOrEqual(100);
        expect(c.flag).not.toBe("");
        expect(c.reason.length).toBeGreaterThan(10);
        expect(c.focus).not.toBe("");
      }
    }
  });
});
