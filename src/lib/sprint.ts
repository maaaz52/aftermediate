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
