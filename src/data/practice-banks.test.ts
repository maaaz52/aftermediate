import { describe, expect, it } from "vitest";
import netBank from "./practice-net.json";
import mdcatBank from "./practice-mdcat.json";
import ecatBank from "./practice-ecat.json";
import comsatsBank from "./practice-comsats.json";
import ntsNatBank from "./practice-nts-nat.json";
import latBank from "./practice-lat.json";
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

const banks: Record<string, Bank> = {
  net: netBank as unknown as Bank,
  mdcat: mdcatBank as unknown as Bank,
  ecat: ecatBank as unknown as Bank,
  comsats: comsatsBank as unknown as Bank,
  "nts-nat": ntsNatBank as unknown as Bank,
  lat: latBank as unknown as Bank,
};

const entryTests = (entryJson as unknown as { tests: { id: string; pattern: { section: string; questions?: number }[] }[] }).tests;

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

// Host families that justify an "official-sample" tag per bank.
const OFFICIAL_DOMAINS: Record<string, string[]> = {
  net: ["nust.edu.pk"],
  mdcat: ["pmdc.pk"],
};

describe.each(Object.entries(banks))("practice-%s bank", (testId, bank) => {
  const official = entryTests.find((t) => t.id === testId);

  it("exists in entry-tests.json and declares full metadata", () => {
    expect(official).toBeDefined();
    expect(bank.testId).toBe(testId);
    expect(bank.schemaVersion).toBe(1);
    expect(bank.durationMinutes).toBeGreaterThan(0);
    expect(bank.provenance.note.length).toBeGreaterThan(30);
    expect(bank.provenance.sources.length).toBeGreaterThan(0);
    for (const url of bank.provenance.sources) expect(url.startsWith("https://")).toBe(true);
  });

  it("section counts replicate the official pattern exactly", () => {
    expect(official).toBeDefined();
    const pattern = new Map(
      (official?.pattern ?? [])
        .filter((p) => typeof p.questions === "number")
        .map((p) => [p.section, p.questions as number])
    );
    const bankCounts = new Map(bank.sections.map((s) => [s.name, s.questionCount]));
    for (const [name, count] of pattern) {
      expect(bankCounts.get(name), `section ${name}`).toBe(count);
    }
    // every bank section is covered by the official pattern
    for (const [name, count] of bankCounts) {
      expect(pattern.get(name), `unexpected section ${name}`).toBe(count);
    }
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

  it("official-sample tags only appear with a conducting-body source URL", () => {
    const allowed = OFFICIAL_DOMAINS[testId];
    for (const q of bank.questions.filter((x) => x.provenance === "official-sample")) {
      expect(
        q.sourceUrls.some((u) => allowed.some((d) => new URL(u).hostname.endsWith(d))),
        `unsourced official-sample on ${q.id}`
      ).toBe(true);
    }
  });
});

describe("bank coverage", () => {
  it("ships both POC banks with the real total question counts", () => {
    expect(banks.net.questions.length).toBe(200);
    expect(banks.mdcat.questions.length).toBe(180);
  });
});
