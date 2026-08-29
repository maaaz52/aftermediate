import type { EntryTest, Stream } from "./types";
import type { PracticeAttempt, PracticeBank, PracticeQuestion } from "./practice";
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

/**
 * One slot per sprint question (each count: 1), ordered by section priority —
 * e.g. pre-engineering = 2 Physics + 2 Mathematics + 1 Intelligence.
 * `recipeFor(stream)` returns these directly, so the recipe length is
 * always SPRINT_SIZE.
 */
export const sprintRecipes: Record<Stream | "none", SprintSlot[]> = {
  "pre-engineering": [
    { id: "physics", label: "Physics", count: 1 },
    { id: "physics", label: "Physics", count: 1 },
    { id: "mathematics", label: "Mathematics", count: 1 },
    { id: "mathematics", label: "Mathematics", count: 1 },
    { id: "intelligence", label: "Intelligence", count: 1 },
  ],
  ics: [
    { id: "physics", label: "Physics", count: 1 },
    { id: "physics", label: "Physics", count: 1 },
    { id: "mathematics", label: "Mathematics", count: 1 },
    { id: "mathematics", label: "Mathematics", count: 1 },
    { id: "intelligence", label: "Intelligence", count: 1 },
  ],
  "pre-medical": [
    { id: "biology", label: "Biology", count: 1 },
    { id: "biology", label: "Biology", count: 1 },
    { id: "chemistry", label: "Chemistry", count: 1 },
    { id: "chemistry", label: "Chemistry", count: 1 },
    { id: "intelligence", label: "Intelligence", count: 1 },
  ],
  icom: [
    { id: "mathematics", label: "Mathematics", count: 1 },
    { id: "mathematics", label: "Mathematics", count: 1 },
    { id: "english", label: "English", count: 1 },
    { id: "english", label: "English", count: 1 },
    { id: "intelligence", label: "Intelligence", count: 1 },
  ],
  alevel: [
    { id: "mathematics", label: "Mathematics", count: 1 },
    { id: "mathematics", label: "Mathematics", count: 1 },
    { id: "physics", label: "Physics", count: 1 },
    { id: "physics", label: "Physics", count: 1 },
    { id: "intelligence", label: "Intelligence", count: 1 },
  ],
  none: [
    { id: "mathematics", label: "Mathematics", count: 1 },
    { id: "mathematics", label: "Mathematics", count: 1 },
    { id: "english", label: "English", count: 1 },
    { id: "english", label: "English", count: 1 },
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
    const canonical = canonicalSection(question.section);
    if (!canonical) continue; // unmapped sections are never in a sprint pool — skip defensively
    const chosen = Number.isInteger(answers[question.id]) ? answers[question.id] : null;
    const isCorrect = chosen !== null && chosen === question.correct;
    const bucket = stats.get(canonical) ?? { correct: 0, wrong: 0, skipped: 0 };
    if (chosen === null) bucket.skipped++;
    else if (isCorrect) {
      bucket.correct++;
      correctCount++;
    } else bucket.wrong++;
    stats.set(canonical, bucket);
  }
  const maxScore = [...stats.values()].reduce(
    (sum, s) => sum + s.correct + s.wrong + s.skipped,
    0
  );
  const percent = maxScore > 0 ? Math.round((correctCount / maxScore) * 1000) / 10 : 0;
  return {
    id: makeId(),
    testId: "sprint",
    mode: "sprint" as const,
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
