# Daily 5-Question Sprint (Duolingo Effect) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Daily 5-Question Sprint" widget to the dashboard — stream-tailored MCQs with instant feedback and a 🔥 daily streak counter — that turns a 2-minute daily habit into a retention loop.

**Architecture:** A pure-function core in `src/lib/sprint.ts` (recipes per stream, question pool across all stream-matched banks, deterministic date-seeded daily pick, derived streak, sprint grading) layered under a single inline client component on the dashboard. Sprints are stored as `PracticeAttempt`s with mode `"sprint"` in the existing `profile.practice` — no schema changes, no new sync code; ProfileSync already persists `practice`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind 4, vitest. Reuses `src/lib/practice.ts` (banks, types), `src/lib/store.tsx` (localStorage-first profile), `card-glass` + violet/emerald/saffron/danger design tokens.

**Spec:** `docs/superpowers/specs/2026-08-29-daily-sprint-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/sprint.ts` | Create | Pure functions: recipes, aliases, pool, daily pick, streak, grading |
| `src/lib/sprint.test.ts` | Create | Vitest coverage for all sprint.ts functions |
| `src/lib/types.ts` | Modify | `PracticeMode = "full" \| "quick" \| "sprint"` |
| `src/lib/practice.ts` | Modify | Add `sprintAttempts(list)` helper |
| `src/components/dashboard/daily-sprint.tsx` | Create | Widget: idle / active / summary states |
| `src/components/dashboard/practice-summary.tsx` | Modify | Exclude sprint attempts from mock stats |
| `src/components/practice/practice-catalog.tsx` | Modify | Exclude sprint attempts from "Best %" / attempt counts |
| `src/components/practice/exam-results.tsx` | Modify | Safe mode label for sprint |
| `src/app/(app)/dashboard/page.tsx` | Modify | Render `<DailySprint />` below PracticeSummary |

## Key Data Facts (verified)

- Section ids per bank: **net** = math, physics, chemistry, english, intelligence · **mdcat** = biology, chemistry, physics, english, logic · **ecat** = english, mathematics, physics, chemistry · **fungat** = advanced-math, analytical, basic-math, english · **giki** = mathematics, physics, english · **pieas** = mathematics, physics, chemistry, english · **iba** = english, mathematics · **lat** = english, gk, islamiat, pakstudies, urdu, math · **aku** = biology, chemistry, physics · **lcat** = verbal, quantitative · **comsats/nts-nat** = english, analytical, quantitative, subject.
- `entry-tests.json` streams: mdcat [pre-medical, alevel], ecat/net/fungat/giki/pieas [pre-engineering, ics, alevel], aku [pre-medical, alevel], lcat/iba/comsats/nts-nat/lat [all five].
- `practice.ts` exports `banks` (Record<testId, PracticeBank>), `entryTests` (EntryTest[]), `pushAttempt`, and types `PracticeQuestion`, `PracticeBank`, `PracticeAttempt` (re-exported from types.ts).
- ESLint is strict: no `Date.now()` in render (use the settled-clock pattern from `watchlist-card.tsx`), no setState in effect body (wrap in `setTimeout`), memoize derived arrays.
- PKT = UTC+5. `new Date("2026-08-29T19:30:00Z")` is `2026-08-30 00:30` in Karachi.

---

### Task 1: Sprint lib part 1 — types, aliases, recipes, streamTests

**Files:**
- Create: `src/lib/sprint.ts`
- Create: `src/lib/sprint.test.ts`

- [ ] **Step 1: Write the failing tests** — create `src/lib/sprint.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/sprint.test.ts 2>&1 | tail -5`
Expected: FAIL — module `./sprint` not found / cannot find module.

- [ ] **Step 3: Write the implementation** — create `src/lib/sprint.ts`:

```ts
import type { EntryTest, PracticeAttempt, Stream } from "./types";
import type { PracticeBank, PracticeQuestion } from "./practice";
import { entryTests } from "./practice";

// ---------------------------------------------------------------------------
// Constants & types
// ---------------------------------------------------------------------------

export const SPRINT_SIZE = 5;

export type CanonicalSection =
  | "physics"
  | "mathematics"
  | "biology"
  | "chemistry"
  | "english"
  | "intelligence";

export interface SprintSlot {
  id: CanonicalSection;
  label: string;
  count: number;
}

export const CANONICAL_LABELS: Record<CanonicalSection, string> = {
  physics: "Physics",
  mathematics: "Mathematics",
  biology: "Biology",
  chemistry: "Chemistry",
  english: "English",
  intelligence: "Intelligence",
};

/** Bank section id → canonical recipe slot. Unmapped ids are excluded. */
export const SECTION_ALIASES: Record<string, CanonicalSection> = {
  physics: "physics",
  mathematics: "mathematics",
  math: "mathematics",
  biology: "biology",
  chemistry: "chemistry",
  english: "english",
  intelligence: "intelligence",
  logic: "intelligence", // MDCAT Logical Reasoning
  analytical: "intelligence", // FUNGAT Analytical Skills & IQ; NAT Analytical
};

export function canonicalSection(sectionId: string): CanonicalSection | null {
  return SECTION_ALIASES[sectionId] ?? null;
}

export const sprintRecipes: Record<Stream | "none", SprintSlot[]> = {
  "pre-engineering": [
    { id: "physics", label: "Physics", count: 2 },
    { id: "mathematics", label: "Mathematics", count: 2 },
    { id: "intelligence", label: "Intelligence", count: 1 },
  ],
  ics: [
    { id: "physics", label: "Physics", count: 2 },
    { id: "mathematics", label: "Mathematics", count: 2 },
    { id: "intelligence", label: "Intelligence", count: 1 },
  ],
  "pre-medical": [
    { id: "biology", label: "Biology", count: 2 },
    { id: "chemistry", label: "Chemistry", count: 2 },
    { id: "intelligence", label: "Intelligence", count: 1 },
  ],
  icom: [
    { id: "mathematics", label: "Mathematics", count: 2 },
    { id: "english", label: "English", count: 2 },
    { id: "intelligence", label: "Intelligence", count: 1 },
  ],
  alevel: [
    { id: "mathematics", label: "Mathematics", count: 2 },
    { id: "physics", label: "Physics", count: 2 },
    { id: "intelligence", label: "Intelligence", count: 1 },
  ],
  none: [
    { id: "mathematics", label: "Mathematics", count: 2 },
    { id: "english", label: "English", count: 2 },
    { id: "intelligence", label: "Intelligence", count: 1 },
  ],
};

export function recipeFor(stream: Stream | null): SprintSlot[] {
  return sprintRecipes[stream ?? "none"];
}

export function streamTests(
  stream: Stream | null,
  tests: EntryTest[] = entryTests
): string[] {
  if (stream === null) return tests.map((t) => t.id);
  return tests.filter((t) => t.streams.includes(stream)).map((t) => t.id);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/sprint.test.ts 2>&1 | tail -5`
Expected: PASS — 10 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sprint.ts src/lib/sprint.test.ts
git commit -m "feat(sprint): add recipes, section aliases, and stream test resolution"
```

---

### Task 2: Sprint lib part 2 — pool construction and deterministic daily pick

**Files:**
- Modify: `src/lib/sprint.ts` (append)
- Modify: `src/lib/sprint.test.ts` (append + expand imports)

- [ ] **Step 1: Write the failing tests** — append to `src/lib/sprint.test.ts`, and replace the import block at the top of the file with:

```ts
import { describe, expect, it } from "vitest";
import {
  buildPool,
  canonicalSection,
  dailyPick,
  recipeFor,
  sprintRecipes,
  SPRINT_SIZE,
  streamTests,
} from "./sprint";
import type { PracticeBank, PracticeQuestion } from "./practice";

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
```

Then append these describe blocks:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/sprint.test.ts 2>&1 | tail -8`
Expected: FAIL — `buildPool` / `dailyPick` is not exported (or TypeError: not a function).

- [ ] **Step 3: Write the implementation** — append to `src/lib/sprint.ts`:

```ts
// ---------------------------------------------------------------------------
// Pool construction & daily pick
// ---------------------------------------------------------------------------

export interface SprintPool {
  [slot: string]: PracticeQuestion[];
}

/**
 * Collects every question whose canonical section matches a recipe slot,
 * across all stream-matched banks. Empty slots stay as [] — the top-up
 * happens at pick time so pool sections always stay truthful.
 */
export function buildPool(
  banks: Record<string, PracticeBank>,
  testIds: string[],
  recipe: SprintSlot[]
): SprintPool {
  const pool: SprintPool = {};
  for (const slot of recipe) pool[slot.id] = [];
  for (const testId of testIds) {
    const bank = banks[testId];
    if (!bank) continue;
    for (const question of bank.questions) {
      const canonical = canonicalSection(question.section);
      if (!canonical) continue;
      const list = pool[canonical];
      if (!list) continue;
      if (!list.some((existing) => existing.id === question.id)) list.push(question);
    }
  }
  return pool;
}

/**
 * Deterministic, date-seeded pick: rotates through each slot's candidates
 * day over day, then tops up from the fullest pool if a slot came up short.
 */
export function dailyPick(
  pool: SprintPool,
  recipe: SprintSlot[],
  dayNumber: number
): PracticeQuestion[] {
  const picked: PracticeQuestion[] = [];
  const seen = new Set<string>();
  let offset = 0;
  for (const slot of recipe) {
    const candidates = pool[slot.id] ?? [];
    for (let k = 0; k < slot.count && candidates.length > 0; k++) {
      const question = candidates[(dayNumber + offset + k) % candidates.length];
      if (!seen.has(question.id)) {
        picked.push(question);
        seen.add(question.id);
      }
    }
    offset += slot.count;
  }
  const fullest = recipe
    .map((slot) => ({ slot, list: pool[slot.id] ?? [] }))
    .filter((entry) => entry.list.length > 0)
    .sort((a, b) => b.list.length - a.list.length)[0];
  if (fullest && picked.length < SPRINT_SIZE) {
    let i = 0;
    while (picked.length < SPRINT_SIZE && i < fullest.list.length) {
      const question = fullest.list[(dayNumber + i) % fullest.list.length];
      if (!seen.has(question.id)) {
        picked.push(question);
        seen.add(question.id);
      }
      i++;
    }
  }
  return picked;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/sprint.test.ts 2>&1 | tail -5`
Expected: PASS — 19 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sprint.ts src/lib/sprint.test.ts
git commit -m "feat(sprint): add question pool construction and deterministic daily pick"
```

---

### Task 3: Sprint lib part 3 — PKT day keys, done-today, derived streak

**Files:**
- Modify: `src/lib/sprint.ts` (append)
- Modify: `src/lib/sprint.test.ts` (append + expand imports)

- [ ] **Step 1: Write the failing tests** — expand the import block in `src/lib/sprint.test.ts` to add `computeStreak, dayKey, dayNumber, isSprintDoneToday` and add a helper + describe blocks:

Add `type PracticeAttempt` to the existing type import line (`import type { PracticeBank, PracticeQuestion } from "./practice";` → add a new line `import type { PracticeAttempt } from "./practice";` — note PracticeAttempt is re-exported from practice.ts). Then append:

```ts
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
    const attempts = ["2026-08-29", "2026-08-28", "2026-08-27"].map(sprintAttempt);
    expect(computeStreak(attempts, noon("2026-08-29"))).toBe(3);
  });

  it("preserves a streak while today is still pending (yesterday counts)", () => {
    const attempts = ["2026-08-28", "2026-08-27"].map(sprintAttempt);
    expect(computeStreak(attempts, noon("2026-08-29"))).toBe(2);
  });

  it("resets on a missed full day", () => {
    const attempts = ["2026-08-29", "2026-08-27"].map(sprintAttempt); // skipped the 28th
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/sprint.test.ts 2>&1 | tail -8`
Expected: FAIL — `dayKey` / `dayNumber` / `isSprintDoneToday` / `computeStreak` not exported.

- [ ] **Step 3: Write the implementation** — append to `src/lib/sprint.ts`:

```ts
// ---------------------------------------------------------------------------
// PKT day keys & derived streak
// ---------------------------------------------------------------------------

const SPRINT_TZ = "Asia/Karachi";

export function dayKey(date: Date, tz = SPRINT_TZ): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function dayNumber(date: Date, tz = SPRINT_TZ): number {
  const [y, m, d] = dayKey(date, tz).split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

function shiftDay(key: string, delta: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + delta));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function countBack(days: Set<string>, start: string): number {
  let cursor = start;
  let count = 0;
  while (days.has(cursor)) {
    count++;
    cursor = shiftDay(cursor, -1);
  }
  return count;
}

export function isSprintDoneToday(attempts: PracticeAttempt[], now: Date): boolean {
  const today = dayKey(now);
  return attempts.some(
    (a) => a.mode === "sprint" && dayKey(new Date(a.submittedAt)) === today
  );
}

/**
 * Streak = consecutive PKT days with a sprint attempt, ending today (or
 * yesterday while today is still pending — the streak survives until the
 * day ends).
 */
export function computeStreak(attempts: PracticeAttempt[], now: Date): number {
  const days = new Set(
    attempts
      .filter((a) => a.mode === "sprint")
      .map((a) => dayKey(new Date(a.submittedAt)))
  );
  const today = dayKey(now);
  if (days.has(today)) return countBack(days, today);
  const yesterday = shiftDay(today, -1);
  if (days.has(yesterday)) return countBack(days, yesterday);
  return 0;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/sprint.test.ts 2>&1 | tail -5`
Expected: PASS — 27 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sprint.ts src/lib/sprint.test.ts
git commit -m "feat(sprint): add PKT day keys, done-today check, and derived streak"
```

---

### Task 4: Sprint lib part 4 — gradeSprint, PracticeMode, sprintAttempts helper

**Files:**
- Modify: `src/lib/sprint.ts` (append)
- Modify: `src/lib/sprint.test.ts` (append + expand imports)
- Modify: `src/lib/types.ts:318`
- Modify: `src/lib/practice.ts` (append helper near `pushAttempt`)

- [ ] **Step 1: Extend the type and add the helper first** — in `src/lib/types.ts` change:

```ts
export type PracticeMode = "full" | "quick" | "sprint";
```

In `src/lib/practice.ts`, after the `pushAttempt` function (around line 303), append:

```ts
export function sprintAttempts(list: PracticeAttempt[]): PracticeAttempt[] {
  return list.filter((a) => a.mode === "sprint");
}
```

- [ ] **Step 2: Write the failing tests** — expand the import block in `src/lib/sprint.test.ts` to add `CANONICAL_LABELS, gradeSprint`, then append:

```ts
describe("gradeSprint", () => {
  const sprintQs = [
    q("p1", "physics", 1),
    q("p2", "physics", 0),
    q("m1", "math", 2),
    q("m2", "mathematics", 3),
    q("i1", "intelligence", 0),
  ];

  it("scores an all-correct sprint at 5/5 100%", () => {
    const answers = { p1: 1, p2: 0, m1: 2, m2: 3, i1: 0 };
    const attempt = gradeSprint(sprintQs, answers, 90);
    expect(attempt.mode).toBe("sprint");
    expect(attempt.testId).toBe("sprint");
    expect(attempt.score).toBe(5);
    expect(attempt.maxScore).toBe(5);
    expect(attempt.percent).toBe(100);
    expect(attempt.timeUsedSeconds).toBe(90);
    expect(attempt.autoSubmitted).toBe(false);
  });

  it("counts correct/wrong/skipped per canonical section", () => {
    const answers = { p1: 1, p2: 3, m1: 2 }; // m2 skipped, i1 skipped
    const attempt = gradeSprint(sprintQs, answers, 60);
    expect(attempt.score).toBe(2);
    expect(attempt.percent).toBe(40);
    expect(attempt.sections).toEqual([
      { id: "physics", name: "Physics", correct: 1, wrong: 1, skipped: 0 },
      { id: "mathematics", name: "Mathematics", correct: 1, wrong: 0, skipped: 1 },
      { id: "intelligence", name: "Intelligence", correct: 0, wrong: 0, skipped: 1 },
    ]);
  });

  it("uses canonical labels for aliased section ids", () => {
    const attempt = gradeSprint([q("m1", "math", 0)], { m1: 0 }, 10);
    expect(attempt.sections[0].name).toBe(CANONICAL_LABELS.mathematics);
  });

  it("floors timeUsedSeconds at 0", () => {
    const attempt = gradeSprint([q("p1", "physics", 0)], { p1: 1 }, -5);
    expect(attempt.timeUsedSeconds).toBe(0);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/lib/sprint.test.ts 2>&1 | tail -8`
Expected: FAIL — `gradeSprint` not exported. Also confirm the type change compiles: `npx tsc --noEmit 2>&1 | tail -5` — expected clean (modeLabel ternaries remain valid TypeScript).

- [ ] **Step 4: Write the implementation** — append to `src/lib/sprint.ts`:

```ts
// ---------------------------------------------------------------------------
// Sprint grading
// ---------------------------------------------------------------------------

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `sprint-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Grades a 5-question sprint into a PracticeAttempt. Sprints are always
 * 1 mark per correct answer with no negative marking, regardless of which
 * banks the questions came from.
 */
export function gradeSprint(
  questions: PracticeQuestion[],
  answers: Record<string, number>,
  timeUsedSeconds: number
): PracticeAttempt {
  const stats = new Map<CanonicalSection, { correct: number; wrong: number; skipped: number }>();
  let correctCount = 0;
  for (const question of questions) {
    const chosen = Number.isInteger(answers[question.id]) ? answers[question.id] : null;
    const isCorrect = chosen !== null && chosen === question.correct;
    const bucket = stats.get(canonicalSection(question.section) ?? "english") ?? {
      correct: 0,
      wrong: 0,
      skipped: 0,
    };
    if (chosen === null) bucket.skipped++;
    else if (isCorrect) {
      bucket.correct++;
      correctCount++;
    } else bucket.wrong++;
    stats.set(canonicalSection(question.section) ?? "english", bucket);
  }
  const maxScore = questions.length;
  const percent = maxScore > 0 ? Math.round((correctCount / maxScore) * 1000) / 10 : 0;
  return {
    id: makeId(),
    testId: "sprint",
    mode: "sprint",
    submittedAt: new Date().toISOString(),
    autoSubmitted: false,
    timeUsedSeconds: Math.max(0, Math.round(timeUsedSeconds)),
    score: correctCount,
    maxScore,
    percent,
    sections: [...stats.entries()].map(([id, s]) => ({
      id,
      name: CANONICAL_LABELS[id],
      ...s,
    })),
  };
}
```

Note: `canonicalSection` returns `CanonicalSection | null`; for a sprint question the section is always mapped (pool only contains mapped sections), but the null-coalesce keeps the type safe.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/sprint.test.ts 2>&1 | tail -5`
Expected: PASS — 31 tests. Also `npx tsc --noEmit 2>&1 | tail -5` — exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/lib/sprint.ts src/lib/sprint.test.ts src/lib/types.ts src/lib/practice.ts
git commit -m "feat(sprint): add sprint grading and extend PracticeMode with sprint"
```

---

### Task 5: Exclude sprint attempts from mock-test stats

**Files:**
- Modify: `src/components/dashboard/practice-summary.tsx:11`
- Modify: `src/components/practice/practice-catalog.tsx:51-53`
- Modify: `src/components/practice/exam-results.tsx:133,295`

- [ ] **Step 1: Filter in practice-summary** — in `src/components/dashboard/practice-summary.tsx`, change:

```tsx
const practice = profile.practice;
```

to:

```tsx
// 5-question sprints are habit practice, not readiness mocks — keep the
// mock stats honest.
const practice = profile.practice.filter((a) => a.mode !== "sprint");
```

- [ ] **Step 2: Filter in practice-catalog** — in `src/components/practice/practice-catalog.tsx`, in `ReadyCard` (lines 51-53), change:

```tsx
const { profile } = useStudent();
const best = bestPercent(profile.practice, test.id);
const attempts = attemptsFor(profile.practice, test.id);
```

to:

```tsx
const { profile } = useStudent();
const mockAttempts = profile.practice.filter((a) => a.mode !== "sprint");
const best = bestPercent(mockAttempts, test.id);
const attempts = attemptsFor(mockAttempts, test.id);
```

- [ ] **Step 3: Make the exam-results mode label sprint-safe** — in `src/components/practice/exam-results.tsx`, replace BOTH occurrences of:

```tsx
{attempt.mode === "full" ? "Full" : "Quick"}
```

and

```tsx
{a.mode === "full" ? "Full" : "Quick"}
```

with:

```tsx
{attempt.mode === "full" ? "Full" : attempt.mode === "quick" ? "Quick" : "Sprint"}
```

and

```tsx
{a.mode === "full" ? "Full" : a.mode === "quick" ? "Quick" : "Sprint"}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit 2>&1 | tail -5` — exit 0. Then `npx vitest run 2>&1 | tail -6` — all suites pass (watchlist 15, sprint 31, practice, quiz, banks).

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/practice-summary.tsx src/components/practice/practice-catalog.tsx src/components/practice/exam-results.tsx
git commit -m "refactor(practice): keep sprint attempts out of mock-test stats"
```

---

### Task 6: DailySprint widget and dashboard integration

**Files:**
- Create: `src/components/dashboard/daily-sprint.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Write the widget** — create `src/components/dashboard/daily-sprint.tsx`:

```tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  buildPool,
  canonicalSection,
  computeStreak,
  dailyPick,
  dayNumber,
  gradeSprint,
  isSprintDoneToday,
  recipeFor,
  SPRINT_SIZE,
  streamTests,
} from "@/lib/sprint";
import { banks, pushAttempt, sprintAttempts } from "@/lib/practice";
import type { PracticeQuestion } from "@/lib/practice";
import type { PracticeAttempt } from "@/lib/types";
import { useStudent } from "@/lib/store";
import { cn } from "@/lib/utils";

type Phase = "idle" | "active" | "summary";

export function DailySprint() {
  const { profile, update } = useStudent();
  const stream = profile.stream;

  // Settled clock — Date.now() is impure during render, so keep it in state
  // and refresh on a timer (same pattern as watchlist-card).
  const [now, setNow] = React.useState(0);
  React.useEffect(() => {
    const timer = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      clearTimeout(timer);
      clearInterval(id);
    };
  }, []);

  const recipe = React.useMemo(() => recipeFor(stream), [stream]);
  const testIds = React.useMemo(() => streamTests(stream), [stream]);
  const pool = React.useMemo(() => buildPool(banks, testIds, recipe), [testIds, recipe]);
  const todayQuestions = React.useMemo(
    () => (now === 0 ? [] : dailyPick(pool, recipe, dayNumber(new Date(now)))),
    [pool, recipe, now]
  );

  const sprintHistory = React.useMemo(() => sprintAttempts(profile.practice), [profile.practice]);
  const streak = now === 0 ? 0 : computeStreak(sprintHistory, new Date(now));
  const doneToday = now !== 0 && isSprintDoneToday(sprintHistory, new Date(now));

  const [phase, setPhase] = React.useState<Phase>("idle");
  const [questions, setQuestions] = React.useState<PracticeQuestion[]>([]);
  const [answers, setAnswers] = React.useState<Record<string, number>>({});
  const [current, setCurrent] = React.useState(0);
  const [startedAt, setStartedAt] = React.useState(0);
  const [wasDoneBefore, setWasDoneBefore] = React.useState(false);
  const [streakBefore, setStreakBefore] = React.useState(0);
  const [lastAttempt, setLastAttempt] = React.useState<PracticeAttempt | null>(null);

  const currentQ = questions[current];

  const startSprint = () => {
    if (todayQuestions.length === 0) return;
    setQuestions(todayQuestions);
    setAnswers({});
    setCurrent(0);
    setStartedAt(Date.now());
    setLastAttempt(null);
    setPhase("active");
  };

  const choose = (optionIndex: number) => {
    if (!currentQ || answers[currentQ.id] !== undefined) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: optionIndex }));
  };

  const next = () => {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      return;
    }
    // Event handlers may use Date.now() — only render is purity-checked.
    const attempt = gradeSprint(questions, answers, (Date.now() - startedAt) / 1000);
    setWasDoneBefore(doneToday);
    setStreakBefore(streak);
    setLastAttempt(attempt);
    update({ practice: pushAttempt(profile.practice, attempt) });
    setPhase("summary");
  };

  const cancel = () => setPhase("idle");

  // --- idle ----------------------------------------------------------------
  if (phase === "idle") {
    const canStart = now !== 0 && todayQuestions.length >= SPRINT_SIZE;
    return (
      <div className="card-glass rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-bold text-ink">⚡ Daily Sprint</p>
            <p className="text-xs text-muted">5 questions · 2 minutes</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">🔥</span>
            <span className="font-mono text-lg font-extrabold text-ink">{streak}</span>
            <Badge variant={doneToday ? "emerald" : "saffron"}>
              {doneToday ? "Done today ✓" : "Not done yet"}
            </Badge>
          </div>
        </div>

        <p className="mt-3 text-sm text-muted">
          Today: {recipe.map((s) => `${s.count} × ${s.label}`).join(" · ")}
        </p>

        {stream === null && (
          <Link
            href="/onboard"
            className="mt-2 inline-block text-xs font-medium text-saffron hover:underline"
          >
            Pick your stream to personalize your sprint →
          </Link>
        )}

        <button
          type="button"
          onClick={startSprint}
          disabled={!canStart}
          className="mt-4 w-full rounded-xl bg-violet px-5 py-3 text-sm font-extrabold text-white shadow-[0_4px_0_#5b3fb8] transition-colors hover:brightness-110 disabled:opacity-50"
        >
          {canStart ? "Start today's sprint →" : "Sprints coming soon for your stream"}
        </button>
      </div>
    );
  }

  // --- summary -------------------------------------------------------------
  if (phase === "summary" && lastAttempt) {
    const verdict =
      lastAttempt.percent === 100
        ? { label: "Perfect!", variant: "emerald" as const }
        : lastAttempt.percent >= 60
          ? { label: "Solid", variant: "saffron" as const }
          : { label: "Keep at it", variant: "danger" as const };
    const after = computeStreak(sprintHistory, new Date(now));
    return (
      <div className="card-glass rounded-2xl p-5">
        <p className="text-base font-bold text-ink">Sprint complete!</p>
        <div className="mt-3 flex items-center gap-3">
          <span className="font-mono text-3xl font-extrabold text-ink">
            {lastAttempt.score} / {lastAttempt.maxScore}
          </span>
          <Badge variant={verdict.variant}>{verdict.label}</Badge>
        </div>

        {lastAttempt.sections.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {lastAttempt.sections.map((s) => (
              <span
                key={s.id}
                className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-muted"
              >
                {s.name} {s.correct}/{s.correct + s.wrong + s.skipped} ✓
              </span>
            ))}
          </div>
        )}

        <p className="mt-3 text-sm font-semibold text-ink">
          {wasDoneBefore
            ? `🔥 Streak stays at ${after} (already done today)`
            : `🔥 Streak: ${streakBefore} → ${after}!`}
        </p>

        <button
          type="button"
          onClick={cancel}
          className="mt-4 w-full rounded-xl border-2 border-ink bg-surface px-5 py-3 text-sm font-extrabold text-ink transition-colors hover:bg-surface-2"
        >
          Done — back to dashboard
        </button>
      </div>
    );
  }

  // --- active --------------------------------------------------------------
  if (!currentQ) return null;
  const revealed = answers[currentQ.id] !== undefined;
  const sectionLabel =
    recipe.find((s) => s.id === canonicalSection(currentQ.section))?.label ?? currentQ.section;
  const progress = ((current + (revealed ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="font-bold text-ink">{sectionLabel}</span>
        <span>
          {current + 1} / {questions.length}
        </span>
        <button
          type="button"
          onClick={cancel}
          className="rounded-lg px-2 py-1 text-faint transition-colors hover:bg-surface-2 hover:text-ink"
          aria-label="Exit sprint"
        >
          {'\u2715'}
        </button>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-violet transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-4 text-sm font-semibold leading-relaxed text-ink">{currentQ.stem}</p>

      <div className="mt-3 flex flex-col gap-2">
        {currentQ.options.map((opt, i) => {
          const chosen = answers[currentQ.id];
          const isCorrect = i === currentQ.correct;
          const isChosen = i === chosen;
          return (
            <button
              key={i}
              type="button"
              onClick={() => choose(i)}
              disabled={revealed}
              className={cn(
                "rounded-xl border-2 border-ink bg-surface px-4 py-2.5 text-left text-sm font-medium text-ink transition-colors",
                revealed && isCorrect && "border-emerald bg-emerald/15",
                revealed && isChosen && !isCorrect && "border-danger bg-danger/15",
                !revealed && "hover:bg-surface-2"
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {revealed && (
        <>
          <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-xs text-muted">
            {currentQ.explanation}
          </p>
          <button
            type="button"
            onClick={next}
            className="mt-3 w-full rounded-xl bg-violet px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_4px_0_#5b3fb8] transition-colors hover:brightness-110"
          >
            {current < questions.length - 1 ? "Next →" : "See results →"}
          </button>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Mount it on the dashboard** — in `src/app/(app)/dashboard/page.tsx`, add the import after the WatchlistSection import:

```tsx
import { DailySprint } from "@/components/dashboard/daily-sprint";
```

and insert a new section right after the PracticeSummary block (after line 41, before the `mt-4 grid`):

```tsx
      <div className="mt-4 animate-reveal" style={{ animationDelay: "140ms" }}>
        <DailySprint />
      </div>
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit 2>&1 | tail -5` — exit 0.
Run: `npx eslint src/components/dashboard/daily-sprint.tsx src/app/\(app\)/dashboard/page.tsx 2>&1 | tail -10` — no errors (watch for `react-hooks/purity` and `react-hooks/set-state-in-effect`; if either fires, wrap the impure call in a `setTimeout` in an effect, or move it into an event handler — do not disable the rule).

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/daily-sprint.tsx "src/app/(app)/dashboard/page.tsx"
git commit -m "feat(sprint): add DailySprint widget to dashboard with streak counter"
```

---

### Task 7: Verification pass

**Files:** none — gates only.

- [ ] **Step 1: Run all tests**

Run: `npx vitest run 2>&1 | tail -8`
Expected: all suites pass (sprint 31, watchlist 15, practice, quiz, banks).

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit 2>&1 | tail -5`
Expected: exit 0.

- [ ] **Step 3: Lint**

Run: `npx eslint . 2>&1 | tail -10`
Expected: no errors, no warnings.

- [ ] **Step 4: Production build**

Run: `npx next build 2>&1 | tail -8`
Expected: success, all routes compiled.

- [ ] **Step 5: Commit any stragglers**

```bash
git status --short
```

If clean, skip. Otherwise commit leftover changes with an appropriate message.

---

## Self-Review Notes

- **Spec coverage:** recipes/aliases (Task 1), pool + deterministic pick (Task 2), streak + done-today + PKT (Task 3), grading + mode + helper (Task 4), mock-stats exclusion (Task 5), widget + placement (Task 6), gates (Task 7). The spec's "redistribute empty slots" is implemented at pick time (`dailyPick` top-up) rather than in `buildPool` — keeps pool sections truthful so `gradeSprint` section stats stay accurate.
- **Type consistency:** `sprintAttempts` (Task 4) is consumed by the widget (Task 6); `dayNumber`/`dayKey` (Task 3) consumed by the widget; `SPRINT_SIZE` used in tests and widget. `gradeSprint` returns `PracticeAttempt` with `mode: "sprint"` — matches the extended `PracticeMode`.
- **Known eslint traps handled:** settled-clock pattern instead of `Date.now()` in render; `Date.now()` only inside event handlers; `useMemo` for all derived arrays; `{'\u2715'}` expression wrapper for the close glyph; no setState in effect bodies.
