import { describe, expect, it } from "vitest";
import {
  buildPool,
  canonicalSection,
  computeStreak,
  dailyPick,
  dayKey,
  dayNumber,
  isSprintDoneToday,
  recipeFor,
  sprintRecipes,
  SPRINT_SIZE,
  streamTests,
} from "./sprint";
import type { PracticeAttempt, PracticeBank, PracticeQuestion } from "./practice";

function q(id: string, section: string, correct = 0): PracticeQuestion {
  return {
    id,
    section,
    topic: "t",
    difficulty: "easy",
    stem: `stem ${id}`,
    options: ["a", "b", "c", "d"],
    correct,
    explanation: "e",
    provenance: "practice",
    sourceUrls: [],
  };
}

function bank(testId: string, sectionIds: string[], perSection = 3): PracticeBank {
  const questions = sectionIds.flatMap((section) =>
    Array.from({ length: perSection }, (_, i) =>
      q(`${testId}-${section}-${i + 1}`, section)
    )
  );
  return {
    testId,
    schemaVersion: 1,
    provenance: { note: "test", sources: [] },
    durationMinutes: 10,
    marking: {
      perQuestionMarks: 1,
      correctMarks: 1,
      negativeMarks: 0,
      totalMarks: 5,
      note: "test",
    },
    benchmarks: [],
    sections: sectionIds.map((id) => ({ id, name: id, questionCount: perSection })),
    questions,
  };
}

const testBanks: Record<string, PracticeBank> = {
  net: bank("net", ["math", "physics", "intelligence"]),
  ecat: bank("ecat", ["mathematics", "physics", "english"]),
  mdcat: bank("mdcat", ["biology", "chemistry", "logic"]),
  aku: bank("aku", ["biology", "chemistry", "physics"]),
  fungat: bank("fungat", ["advanced-math", "analytical", "english"]),
};
const preEngRecipe = recipeFor("pre-engineering");
const preMedRecipe = recipeFor("pre-medical");

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

describe("buildPool", () => {
  it("collects questions per canonical slot across matched banks", () => {
    const pool = buildPool(testBanks, ["net", "ecat", "fungat"], preEngRecipe);
    expect(Object.keys(pool).sort()).toEqual(["intelligence", "mathematics", "physics"]);
    expect(pool.physics.map((p) => p.id)).toEqual([
      "net-physics-1", "net-physics-2", "net-physics-3",
      "ecat-physics-1", "ecat-physics-2", "ecat-physics-3",
    ]);
    expect(pool.mathematics.length).toBe(6); // net math + ecat mathematics
    expect(pool.intelligence.length).toBe(6); // net intelligence + fungat analytical
  });

  it("aliases mdcat logic into the intelligence slot", () => {
    const pool = buildPool(testBanks, ["mdcat"], preMedRecipe);
    expect(pool.intelligence.map((p) => p.section)).toEqual(["logic", "logic", "logic"]);
    expect(pool.biology.length).toBe(3);
    expect(pool.chemistry.length).toBe(3);
  });

  it("dedupes repeated question ids", () => {
    const dup = bank("dup", ["math"]);
    dup.questions.push({ ...dup.questions[0] });
    const pool = buildPool({ dup }, ["dup"], preEngRecipe);
    expect(pool.mathematics.length).toBe(3);
  });

  it("ignores banks not in testIds and sections not in the recipe", () => {
    const pool = buildPool(testBanks, ["aku"], preEngRecipe);
    expect(pool.physics.length).toBe(3); // aku physics still matches pre-eng recipe
    expect(pool.biology).toBeUndefined(); // biology not in pre-eng recipe
  });
});

describe("dailyPick", () => {
  it("is deterministic for the same day and returns 5 unique questions", () => {
    const pool = buildPool(testBanks, ["net", "ecat", "fungat"], preEngRecipe);
    const first = dailyPick(pool, preEngRecipe, 1000);
    const second = dailyPick(pool, preEngRecipe, 1000);
    expect(first).toEqual(second);
    expect(first.length).toBe(SPRINT_SIZE);
    expect(new Set(first.map((p) => p.id)).size).toBe(5);
  });

  it("rotates across days", () => {
    const pool = buildPool(testBanks, ["net", "ecat", "fungat"], preEngRecipe);
    const a = dailyPick(pool, preEngRecipe, 1000);
    const b = dailyPick(pool, preEngRecipe, 1001);
    expect(a.map((p) => p.id)).not.toEqual(b.map((p) => p.id));
  });

  it("respects the recipe composition", () => {
    const pool = buildPool(testBanks, ["net", "ecat", "fungat"], preEngRecipe);
    const picked = dailyPick(pool, preEngRecipe, 500);
    const sections = picked.map((p) => canonicalSection(p.section));
    expect(sections.filter((s) => s === "physics").length).toBe(2);
    expect(sections.filter((s) => s === "mathematics").length).toBe(2);
    expect(sections.filter((s) => s === "intelligence").length).toBe(1);
  });

  it("tops up from the fullest pool when a slot is empty", () => {
    const pool = buildPool(testBanks, ["ecat"], preEngRecipe); // no intelligence in ecat
    const picked = dailyPick(pool, preEngRecipe, 1000);
    expect(picked.length).toBe(SPRINT_SIZE);
    expect(picked.every((p) => ["physics", "mathematics"].includes(canonicalSection(p.section)!))).toBe(true);
  });

  it("returns fewer than 5 only when the whole pool is smaller", () => {
    const pool = buildPool({ tiny: bank("tiny", ["math"], 2) }, ["tiny"], preEngRecipe);
    const picked = dailyPick(pool, preEngRecipe, 1000);
    expect(picked.length).toBe(2);
  });
});

function sprintAttempt(day: string, mode: PracticeAttempt["mode"] = "sprint"): PracticeAttempt {
  return {
    id: `a-${day}-${Math.random()}`,
    testId: "sprint",
    mode,
    submittedAt: new Date(`${day}T12:00:00+05:00`).toISOString(),
    autoSubmitted: false,
    timeUsedSeconds: 90,
    score: 3,
    maxScore: 5,
    percent: 60,
    sections: [],
  };
}

describe("dayKey / dayNumber", () => {
  it("uses PKT boundaries", () => {
    expect(dayKey(new Date("2026-08-29T10:00:00Z"))).toBe("2026-08-29"); // 15:00 PKT
    expect(dayKey(new Date("2026-08-29T19:30:00Z"))).toBe("2026-08-30"); // 00:30 PKT next day
  });

  it("increments dayNumber across PKT days", () => {
    const d1 = dayNumber(new Date("2026-08-29T10:00:00Z"));
    const d2 = dayNumber(new Date("2026-08-30T10:00:00Z"));
    expect(d2 - d1).toBe(1);
  });
});

describe("isSprintDoneToday", () => {
  it("is true only for a sprint attempt on the same PKT day", () => {
    const now = new Date("2026-08-29T15:00:00Z"); // 20:00 PKT 2026-08-29
    expect(isSprintDoneToday([sprintAttempt("2026-08-29")], now)).toBe(true);
    expect(isSprintDoneToday([sprintAttempt("2026-08-28")], now)).toBe(false);
    expect(isSprintDoneToday([sprintAttempt("2026-08-29", "quick")], now)).toBe(false);
    expect(isSprintDoneToday([], now)).toBe(false);
  });
});

describe("computeStreak", () => {
  const noon = (day: string) => new Date(`${day}T15:00:00Z`); // 20:00 PKT

  it("is 0 with no sprint attempts", () => {
    expect(computeStreak([], noon("2026-08-29"))).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    const attempts = ["2026-08-29", "2026-08-28", "2026-08-27"].map((day) => sprintAttempt(day));
    expect(computeStreak(attempts, noon("2026-08-29"))).toBe(3);
  });

  it("preserves a streak while today is still pending (yesterday counts)", () => {
    const attempts = ["2026-08-28", "2026-08-27"].map((day) => sprintAttempt(day));
    expect(computeStreak(attempts, noon("2026-08-29"))).toBe(2);
  });

  it("resets on a missed full day", () => {
    const attempts = ["2026-08-29", "2026-08-27"].map((day) => sprintAttempt(day)); // skipped the 28th
    expect(computeStreak(attempts, noon("2026-08-29"))).toBe(1);
  });

  it("returns 1 for a fresh start done today", () => {
    expect(computeStreak([sprintAttempt("2026-08-29")], noon("2026-08-29"))).toBe(1);
  });

  it("is 0 when neither today nor yesterday has an attempt", () => {
    expect(computeStreak([sprintAttempt("2026-08-25")], noon("2026-08-29"))).toBe(0);
  });

  it("ignores non-sprint attempts", () => {
    const attempts = [sprintAttempt("2026-08-29", "quick"), sprintAttempt("2026-08-28", "full")];
    expect(computeStreak(attempts, noon("2026-08-29"))).toBe(0);
  });
});
