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
