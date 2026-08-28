import { describe, expect, it } from "vitest";
import fungatBank from "./practice-fungat.json";
import lcatBank from "./practice-lcat.json";
import ibaBank from "./practice-iba.json";
import gikiBank from "./practice-giki.json";
import pieasBank from "./practice-pieas.json";
import akuBank from "./practice-aku.json";
import entryJson from "./entry-tests.json";

interface BankQuestion {
  id: string;
  section: string;
  topic: string;
  difficulty: string;
  stem: string;
  options: string[];
  correct: number;
  explanation: string;
  provenance: string;
  sourceUrls: string[];
}

interface Bank {
  testId: string;
  schemaVersion: number;
  provenance: { note: string; sources: string[] };
  durationMinutes: number;
  marking: {
    perQuestionMarks: number;
    correctMarks: number;
    negativeMarks: number;
    totalMarks: number;
    note: string;
  };
  benchmarks: { label: string; percent: number }[];
  sections: { id: string; name: string; questionCount: number }[];
  questions: BankQuestion[];
}

// Banks whose official pattern does NOT publish exact question counts.
// Section distributions are practice-bank design choices (documented in the
// provenance note), so the strict "replicates official pattern" check from
// practice-banks.test.ts does not apply — we validate structure instead.
const banks: Record<string, Bank> = {
  fungat: fungatBank as unknown as Bank,
  lcat: lcatBank as unknown as Bank,
  iba: ibaBank as unknown as Bank,
  giki: gikiBank as unknown as Bank,
  pieas: pieasBank as unknown as Bank,
  aku: akuBank as unknown as Bank,
};

const entryTests = (entryJson as unknown as { tests: { id: string; note?: string }[] }).tests;

const PROVENANCE = new Set(["official-sample", "past-paper", "practice"]);
const DIFFICULTY = new Set(["easy", "medium", "hard"]);
const QUESTION_KEYS = [
  "id",
  "section",
  "topic",
  "difficulty",
  "stem",
  "options",
  "correct",
  "explanation",
  "provenance",
  "sourceUrls",
].sort();

describe.each(Object.entries(banks))("practice-%s bank", (testId, bank) => {
  it("exists in entry-tests.json and declares full metadata", () => {
    const official = entryTests.find((t) => t.id === testId);
    expect(official).toBeDefined();
    expect(bank.testId).toBe(testId);
    expect(bank.schemaVersion).toBe(1);
    expect(bank.durationMinutes).toBeGreaterThan(0);
    expect(bank.provenance.note.length).toBeGreaterThan(30);
    expect(bank.provenance.sources.length).toBeGreaterThan(0);
    for (const url of bank.provenance.sources) expect(url.startsWith("https://")).toBe(true);
  });

  it("question arrays match declared section counts", () => {
    const declared = bank.sections.reduce((sum, s) => sum + s.questionCount, 0);
    expect(bank.questions.length).toBe(declared);
    for (const s of bank.sections) {
      const actual = bank.questions.filter((q) => q.section === s.id).length;
      expect(actual, `actual count for ${s.id}`).toBe(s.questionCount);
    }
  });

  it("marking math is internally consistent", () => {
    expect(bank.marking.totalMarks).toBe(bank.marking.perQuestionMarks * bank.questions.length);
    expect(bank.marking.correctMarks).toBeGreaterThanOrEqual(0);
    expect(bank.marking.negativeMarks).toBeGreaterThanOrEqual(0);
    expect(bank.marking.note.length).toBeGreaterThan(0);
  });

  it("benchmarks carry year-hedged labels", () => {
    for (const b of bank.benchmarks) {
      expect(b.label).toMatch(/cycle|year|\d{4}/i);
      expect(b.percent).toBeGreaterThan(0);
      expect(b.percent).toBeLessThanOrEqual(100);
    }
  });

  it("every question is structurally valid", () => {
    const sectionIds = new Set(bank.sections.map((s) => s.id));
    const ids = new Set<string>();
    const stems = new Set<string>();
    for (const q of bank.questions) {
      expect(Object.keys(q).sort(), `keys of ${q.id}`).toEqual(QUESTION_KEYS);
      expect(ids.has(q.id), `duplicate id ${q.id}`).toBe(false);
      ids.add(q.id);
      expect(sectionIds.has(q.section), `bad section on ${q.id}`).toBe(true);
      expect(q.options.length, `options on ${q.id}`).toBe(4);
      for (const opt of q.options) expect(opt.trim().length, `empty option on ${q.id}`).toBeGreaterThan(0);
      expect(new Set(q.options.map((o) => o.trim().toLowerCase())).size, `dupe options on ${q.id}`).toBe(4);
      expect(Number.isInteger(q.correct), `correct index ${q.id}`).toBe(true);
      expect(q.correct).toBeGreaterThanOrEqual(0);
      expect(q.correct).toBeLessThan(4);
      expect(q.stem.trim().length, `empty stem ${q.id}`).toBeGreaterThan(10);
      expect(q.explanation.trim().length, `empty explanation ${q.id}`).toBeGreaterThan(10);
      expect(q.topic.trim().length, `empty topic ${q.id}`).toBeGreaterThan(0);
      expect(PROVENANCE.has(q.provenance), `bad provenance ${q.provenance} on ${q.id}`).toBe(true);
      expect(DIFFICULTY.has(q.difficulty), `bad difficulty on ${q.id}`).toBe(true);
      expect(q.sourceUrls.length, `no sources on ${q.id}`).toBeGreaterThan(0);
      for (const url of q.sourceUrls) expect(url.startsWith("https://"), `bad url on ${q.id}`).toBe(true);
      expect(stems.has(q.stem), `duplicate stem: ${q.id}`).toBe(false);
      stems.add(q.stem);
    }
  });
});

describe("local bank coverage", () => {
  it("ships the six additional local banks with positive question counts", () => {
    expect(banks.fungat.questions.length).toBeGreaterThan(0);
    expect(banks.lcat.questions.length).toBeGreaterThan(0);
    expect(banks.iba.questions.length).toBeGreaterThan(0);
    expect(banks.giki.questions.length).toBeGreaterThan(0);
    expect(banks.pieas.questions.length).toBeGreaterThan(0);
    expect(banks.aku.questions.length).toBeGreaterThan(0);
  });
});
