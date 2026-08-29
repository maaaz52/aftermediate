import { describe, expect, it } from "vitest";
import json from "./skills-courses.json";
import { skillPaths, validatePaths, trackCounts } from "@/lib/skills";

const TRACKS = ["web-dev", "design", "data", "ai", "writing", "marketing", "video", "business"] as const;
const LEVELS = ["beginner", "intermediate", "advanced"] as const;

interface Course {
  id: string;
  title: string;
  provider: string;
  track: (typeof TRACKS)[number];
  level: (typeof LEVELS)[number];
  rating: number;
  hours: number;
  costUsd: number;
  certificate: boolean;
  updatedYear: number;
  url: string;
  description: string;
  why: string;
}

const courses = json as unknown as Course[];

describe("skills-courses.json", () => {
  it("has at least 40 courses with unique ids", () => {
    expect(courses.length).toBeGreaterThanOrEqual(40);
    const ids = courses.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every course has valid track and level", () => {
    for (const c of courses) {
      expect(TRACKS, c.id).toContain(c.track);
      expect(LEVELS, c.id).toContain(c.level);
    }
  });

  it("every course has a valid rating, hours, cost, certificate flag, and updatedYear", () => {
    for (const c of courses) {
      expect(typeof c.rating, c.id).toBe("number");
      expect(c.rating, c.id).toBeGreaterThanOrEqual(0);
      expect(c.rating, c.id).toBeLessThanOrEqual(5);
      expect(c.hours, c.id).toBeGreaterThan(0);
      expect(c.costUsd, c.id).toBeGreaterThanOrEqual(0);
      expect(typeof c.certificate, c.id).toBe("boolean");
      expect(c.updatedYear, c.id).toBeGreaterThanOrEqual(2019);
    }
  });

  it("every course has non-empty text fields and an https url", () => {
    for (const c of courses) {
      expect(c.title.length, c.id).toBeGreaterThan(3);
      expect(c.provider.length, c.id).toBeGreaterThan(2);
      expect(c.url.startsWith("https://"), `${c.id}:${c.url}`).toBe(true);
      expect(c.description.length, c.id).toBeGreaterThan(20);
      expect(c.why.length, c.id).toBeGreaterThan(20);
    }
  });

  it("every track has at least 3 courses", () => {
    for (const t of TRACKS) {
      expect(courses.filter((c) => c.track === t).length, t).toBeGreaterThanOrEqual(3);
    }
  });

  it("every level has at least 10 courses", () => {
    for (const l of LEVELS) {
      expect(courses.filter((c) => c.level === l).length, l).toBeGreaterThanOrEqual(10);
    }
  });

  it("contains every course id referenced by the skill paths", () => {
    const { missing, duplicates } = validatePaths(courses);
    expect(missing, "missing path course ids").toEqual([]);
    expect(duplicates, "duplicate course ids").toEqual([]);
  });

  it("skill paths reference only ids that exist in the data", () => {
    const ids = new Set(courses.map((c) => c.id));
    for (const p of skillPaths) {
      for (const cid of p.courseIds) expect(ids, cid).toContain(cid);
    }
  });

  it("trackCounts sums to the total course count", () => {
    const counts = trackCounts(courses);
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(courses.length);
  });
});
