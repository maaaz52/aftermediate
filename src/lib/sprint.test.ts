import { describe, expect, it } from "vitest";
import {
  canonicalSection,
  recipeFor,
  sprintRecipes,
  streamTests,
} from "./sprint";

describe("canonicalSection aliases", () => {
  it("maps direct and aliased ids to canonical slots", () => {
    expect(canonicalSection("math")).toBe("mathematics");
    expect(canonicalSection("mathematics")).toBe("mathematics");
    expect(canonicalSection("physics")).toBe("physics");
    expect(canonicalSection("biology")).toBe("biology");
    expect(canonicalSection("chemistry")).toBe("chemistry");
    expect(canonicalSection("english")).toBe("english");
    expect(canonicalSection("intelligence")).toBe("intelligence");
    expect(canonicalSection("logic")).toBe("intelligence");
    expect(canonicalSection("analytical")).toBe("intelligence");
  });

  it("returns null for unmapped ids", () => {
    expect(canonicalSection("verbal")).toBeNull();
    expect(canonicalSection("quantitative")).toBeNull();
    expect(canonicalSection("subject")).toBeNull();
    expect(canonicalSection("gk")).toBeNull();
  });
});

describe("recipeFor", () => {
  it("serves 2/2/1 recipes summing to 5 for every stream and null", () => {
    for (const stream of ["pre-medical", "pre-engineering", "ics", "icom", "alevel", null] as const) {
      const recipe = recipeFor(stream);
      expect(recipe.reduce((sum, s) => sum + s.count, 0)).toBe(5);
      expect(recipe.every((s) => s.count >= 1)).toBe(true);
    }
  });

  it("pre-medical gets biology/chemistry/intelligence", () => {
    expect(recipeFor("pre-medical").map((s) => s.id)).toEqual([
      "biology", "biology", "chemistry", "chemistry", "intelligence",
    ]);
  });

  it("pre-engineering gets physics/mathematics/intelligence", () => {
    expect(recipeFor("pre-engineering").map((s) => s.id)).toEqual([
      "physics", "physics", "mathematics", "mathematics", "intelligence",
    ]);
  });

  it("null falls back to the generic mix", () => {
    expect(recipeFor(null)).toEqual(sprintRecipes.none);
  });
});

describe("streamTests", () => {
  it("returns every local test id when stream is null", () => {
    const ids = streamTests(null);
    expect(ids.length).toBe(12);
    expect(ids).toContain("mdcat");
    expect(ids).toContain("net");
    expect(ids).toContain("lat");
  });

  it("pre-medical tests include mdcat/aku but exclude ecat/net", () => {
    const ids = streamTests("pre-medical");
    expect(ids).toContain("mdcat");
    expect(ids).toContain("aku");
    expect(ids).not.toContain("ecat");
    expect(ids).not.toContain("net");
  });

  it("pre-engineering tests include ecat/net but exclude mdcat/aku", () => {
    const ids = streamTests("pre-engineering");
    expect(ids).toContain("ecat");
    expect(ids).toContain("net");
    expect(ids).not.toContain("mdcat");
    expect(ids).not.toContain("aku");
  });

  it("respects a custom tests list", () => {
    const fake = [
      { id: "x", streams: ["pre-medical"] },
      { id: "y", streams: ["pre-engineering"] },
    ];
    expect(streamTests("pre-medical", fake as never)).toEqual(["x"]);
  });
});
