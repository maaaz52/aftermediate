import { describe, expect, it } from "vitest";
import { bestFields } from "@/lib/recommend";
import type { Major } from "@/lib/types";

function major(id: string, field: string, demand: Major["demand"], high: number): Major {
  return {
    id, name: id, field, emoji: "", tagline: "", streams: [], demand,
    salaryRange: { low: 0, high, currency: "PKR/mo", note: "" },
    whyNow: { value: "", year: "", source: "", source_url: "" },
    description: "", skillTree: [], dayInLife: [], courses: [], universities: [], realityCheck: "",
  };
}

describe("bestFields", () => {
  it("ranks interest-matched majors first", () => {
    const majors = [
      major("accounting", "Business", "low", 100),
      major("cs", "Technology", "high", 600),
      major("electrical", "Engineering", "medium", 350),
    ];
    const out = bestFields(majors, ["Technology & Coding"], 5);
    expect(out[0].id).toBe("cs");
    expect(out).toHaveLength(3);
  });

  it("breaks ties by salary when interests are empty", () => {
    const majors = [
      major("cs", "Technology", "high", 600),
      major("ai", "Technology", "high", 700),
    ];
    const out = bestFields(majors, [], 5);
    expect(out[0].id).toBe("ai");
  });

  it("respects the limit", () => {
    const majors = [
      major("cs", "Technology", "high", 600),
      major("ai", "Technology", "high", 700),
      major("data-science", "Technology", "medium", 600),
    ];
    expect(bestFields(majors, [], 2)).toHaveLength(2);
  });

  it("never returns more majors than given", () => {
    const majors = [major("cs", "Technology", "high", 600)];
    expect(bestFields(majors, [], 5)).toHaveLength(1);
  });

  it("ranks higher demand above lower demand when interests match equally", () => {
    const majors = [
      major("low-demand", "Technology", "low", 900),
      major("medium-demand", "Technology", "medium", 800),
      major("high-demand", "Technology", "high", 700),
    ];
    const out = bestFields(majors, ["Technology & Coding"], 5);
    expect(out.map((m) => m.id)).toEqual(["high-demand", "medium-demand", "low-demand"]);
  });

  it("does not mutate the input array", () => {
    const majors = [
      major("cs", "Technology", "high", 600),
      major("ai", "Technology", "high", 700),
      major("data-science", "Technology", "medium", 600),
    ];
    const before = majors.map((m) => m.id);
    bestFields(majors, [], 5);
    expect(majors.map((m) => m.id)).toEqual(before);
  });
});
