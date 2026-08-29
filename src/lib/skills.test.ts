import { describe, expect, it } from "vitest";
import {
  USD_TO_PKR,
  pkr,
  sortByKey,
  trackCounts,
  skillPaths,
  validatePaths,
  pathProgress,
  readDays,
  wizardScore,
  type WizardAnswers,
} from "./skills";

const sampleCourses = [
  { id: "a", track: "design" },
  { id: "b", track: "design" },
  { id: "c", track: "data" },
];

const samplePlatforms = [
  { id: "upwork", name: "Upwork", niches: ["web", "design", "writing"], newcomerFriendly: 4, minWithdrawalUsd: 1, pkrFriendly: true, fee: 10 },
  { id: "toptal", name: "Toptal", niches: ["software", "design", "finance"], newcomerFriendly: 1, minWithdrawalUsd: 0, pkrFriendly: true, fee: 0 },
  { id: "fiverr", name: "Fiverr", niches: ["design", "video", "writing"], newcomerFriendly: 5, minWithdrawalUsd: 5, pkrFriendly: true, fee: 20 },
];

describe("pkr conversion", () => {
  it("exposes a fixed hedged rate", () => {
    expect(USD_TO_PKR).toBe(280);
  });

  it("formats USD as grouped PKR with no decimals", () => {
    expect(pkr(0)).toBe("Free");
    expect(pkr(49)).toBe("Rs 13,720");
    expect(pkr(500)).toBe("Rs 140,000");
    expect(pkr(1.5)).toBe("Rs 420");
  });
});

describe("sortByKey", () => {
  const items = [
    { name: "bravo", n: 3 },
    { name: "alpha", n: 1 },
    { name: "charlie", n: 2 },
  ];

  it("sorts strings asc and desc", () => {
    expect(sortByKey(items, "name", "asc").map((x) => x.name)).toEqual(["alpha", "bravo", "charlie"]);
    expect(sortByKey(items, "name", "desc").map((x) => x.name)).toEqual(["charlie", "bravo", "alpha"]);
  });

  it("sorts numbers asc and desc", () => {
    expect(sortByKey(items, "n", "asc").map((x) => x.n)).toEqual([1, 2, 3]);
    expect(sortByKey(items, "n", "desc").map((x) => x.n)).toEqual([3, 2, 1]);
  });

  it("does not mutate the input array", () => {
    const copy = [...items];
    sortByKey(items, "name");
    expect(items).toEqual(copy);
  });
});

describe("trackCounts", () => {
  it("counts per track and sums to total", () => {
    const counts = trackCounts(sampleCourses);
    expect(counts).toEqual({ design: 2, data: 1 });
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(sampleCourses.length);
  });

  it("returns empty record for empty input", () => {
    expect(trackCounts([])).toEqual({});
  });
});

describe("skillPaths", () => {
  it("defines exactly 5 paths", () => {
    expect(skillPaths.length).toBe(5);
    const ids = skillPaths.map((p) => p.id);
    expect(new Set(ids).size).toBe(5);
  });

  it("each path has 4-6 courses and required fields", () => {
    for (const p of skillPaths) {
      expect(p.courseIds.length).toBeGreaterThanOrEqual(4);
      expect(p.courseIds.length).toBeLessThanOrEqual(6);
      expect(p.title.length).toBeGreaterThan(0);
      expect(p.subtitle.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate course ids across paths", () => {
    const all = skillPaths.flatMap((p) => p.courseIds);
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("validatePaths", () => {
  it("reports missing ids when courses are absent", () => {
    const { missing } = validatePaths([{ id: "unrelated" }]);
    expect(missing.length).toBe(skillPaths.flatMap((p) => p.courseIds).length);
    expect(missing[0]).toContain(":");
  });

  it("reports duplicates only when an id repeats across paths", () => {
    const dupId = skillPaths[0].courseIds[0];
    const allIds = skillPaths.flatMap((p) => p.courseIds);
    // build a course list that has every id at least once plus one duplicate
    const { duplicates } = validatePaths([...allIds.map((id) => ({ id })), { id: dupId }]);
    expect(duplicates).toContain(dupId);
  });

  it("passes clean when every path id exists", () => {
    const allIds = skillPaths.flatMap((p) => p.courseIds);
    const { missing, duplicates } = validatePaths(allIds.map((id) => ({ id })));
    expect(missing).toEqual([]);
    expect(duplicates).toEqual([]);
  });
});

describe("pathProgress", () => {
  it("computes done/total/percent", () => {
    const first = skillPaths[0];
    const doneOne = pathProgress(first.id, new Set([first.courseIds[0]]));
    expect(doneOne.done).toBe(1);
    expect(doneOne.total).toBe(first.courseIds.length);
    expect(doneOne.pct).toBe(Math.round((1 / first.courseIds.length) * 100));
  });

  it("handles unknown path and empty set", () => {
    expect(pathProgress("nope", new Set())).toEqual({ done: 0, total: 0, pct: 0 });
    expect(pathProgress(skillPaths[0].id, new Set())).toEqual({ done: 0, total: skillPaths[0].courseIds.length, pct: 0 });
  });
});

describe("readDays", () => {
  it("ceil-divides pages by 40/day", () => {
    expect(readDays(300)).toBe(8);
    expect(readDays(40)).toBe(1);
    expect(readDays(1)).toBe(1);
    expect(readDays(0)).toBe(0);
  });
});

describe("wizardScore", () => {
  it("ranks newcomer-friendly + niche-matching platforms first for beginners", () => {
    const answers: WizardAnswers = { skill: "design", experience: "none", budget: "small", payout: "payoneer" };
    const ranked = wizardScore(answers, samplePlatforms);
    expect(ranked[0].id).toBe("fiverr");
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });

  it("prefers premium platforms for pro experience + premium budget", () => {
    const answers: WizardAnswers = { skill: "development", experience: "pro", budget: "premium", payout: "any" };
    const ranked = wizardScore(answers, samplePlatforms);
    expect(ranked[0].id).toBe("toptal");
  });

  it("is deterministic and always returns reasons", () => {
    const answers: WizardAnswers = { skill: "writing", experience: "some", budget: "mid", payout: "any" };
    const first = wizardScore(answers, samplePlatforms);
    const second = wizardScore(answers, samplePlatforms);
    expect(first.map((r) => [r.id, r.score])).toEqual(second.map((r) => [r.id, r.score]));
    for (const r of first) {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.reasons.length).toBeGreaterThan(0);
    }
  });
});
