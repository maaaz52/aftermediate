import { describe, expect, it } from "vitest";
import json from "@/data/ivy-stories.json";

interface IvyStory {
  id: string;
  type: "real" | "illustrative";
  name: string;
  school: string;
  year: string;
  background: string;
  challenges: string[];
  keyFactors: string[];
  sourceUrl: string | null;
}

const data = json as unknown as { stories: IvyStory[] };

const VALID_SCHOOLS = [
  "Harvard",
  "Yale",
  "Princeton",
  "Columbia",
  "University of Pennsylvania",
  "Brown",
  "Dartmouth",
  "Cornell",
] as const;

describe("ivy-stories.json", () => {
  it("has at least 4 total stories", () => {
    expect(data.stories.length).toBeGreaterThanOrEqual(4);
  });

  it("has at least 2 stories with type 'real' and a non-empty https sourceUrl", () => {
    const realStories = data.stories.filter(
      (s) => s.type === "real" && typeof s.sourceUrl === "string" && s.sourceUrl.startsWith("https://")
    );
    expect(realStories.length).toBeGreaterThanOrEqual(2);
  });

  it("has unique ids", () => {
    const ids = data.stories.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every story has a valid school", () => {
    for (const s of data.stories) {
      expect(VALID_SCHOOLS, s.id).toContain(s.school);
    }
  });

  it("every story has required non-empty fields", () => {
    for (const s of data.stories) {
      expect(s.id.length, s.id).toBeGreaterThan(0);
      expect(s.name.length, s.id).toBeGreaterThan(0);
      expect(s.background.length, s.id).toBeGreaterThan(20);
      expect(s.challenges.length, s.id).toBeGreaterThanOrEqual(1);
      expect(s.keyFactors.length, s.id).toBeGreaterThanOrEqual(1);
      for (const c of s.challenges) expect(c.length, s.id).toBeGreaterThan(5);
      for (const k of s.keyFactors) expect(k.length, s.id).toBeGreaterThan(5);
    }
  });

  it("every illustrative story has sourceUrl === null", () => {
    for (const s of data.stories) {
      if (s.type === "illustrative") {
        expect(s.sourceUrl, s.id).toBeNull();
      }
    }
  });

  it("every real story has a non-empty https sourceUrl", () => {
    for (const s of data.stories) {
      if (s.type === "real") {
        expect(typeof s.sourceUrl, s.id).toBe("string");
        expect(s.sourceUrl!.startsWith("https://"), s.id).toBe(true);
      }
    }
  });

  it("illustrative stories have type 'illustrative' and year 'illustrative'", () => {
    for (const s of data.stories) {
      if (s.type === "illustrative") {
        expect(s.year, s.id).toBe("illustrative");
        expect(s.type, s.id).toBe("illustrative");
      }
    }
  });

  it("real stories have a non-'illustrative' year", () => {
    for (const s of data.stories) {
      if (s.type === "real") {
        expect(s.year, s.id).not.toBe("illustrative");
        expect(s.year.length, s.id).toBeGreaterThanOrEqual(4);
      }
    }
  });
});