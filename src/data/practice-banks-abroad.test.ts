import { describe, expect, it } from "vitest";
import ieltsBank from "./practice-ielts.json";
import satBank from "./practice-sat.json";
import toeflBank from "./practice-toefl.json";
import greBank from "./practice-gre.json";
import gmatBank from "./practice-gmat.json";
import pteBank from "./practice-pte.json";
import duolingoBank from "./practice-duolingo.json";
import actBank from "./practice-act.json";

interface BankQuestion {
  id: string; section: string; topic: string; difficulty: string;
  stem: string; options: string[]; correct: number;
  explanation: string; provenance: string; sourceUrls: string[];
}

interface Bank {
  testId: string; schemaVersion: number;
  provenance: { note: string; sources: string[] };
  durationMinutes: number;
  marking: {
    perQuestionMarks: number; correctMarks: number;
    negativeMarks: number; totalMarks: number; note: string;
  };
  benchmarks: { label: string; percent: number }[];
  sections: { id: string; name: string; questionCount: number }[];
  questions: BankQuestion[];
}

const banks: Record<string, Bank> = {
  ielts: ieltsBank as unknown as Bank,
  sat: satBank as unknown as Bank,
  toefl: toeflBank as unknown as Bank,
  gre: greBank as unknown as Bank,
  gmat: gmatBank as unknown as Bank,
  pte: pteBank as unknown as Bank,
  duolingo: duolingoBank as unknown as Bank,
  act: actBank as unknown as Bank,
};

const SCHEMA: Record<string, { sections: Record<string, number>; duration: number }> = {
  ielts: { sections: { listening: 40, reading: 40 }, duration: 90 },
  sat: { sections: { "reading-writing": 54, math: 44 }, duration: 134 },
  toefl: { sections: { reading: 20, listening: 28 }, duration: 71 },
  gre: { sections: { verbal: 27, quantitative: 27 }, duration: 88 },
  gmat: { sections: { quantitative: 21, verbal: 23, "data-insights": 20 }, duration: 135 },
  pte: { sections: { reading: 20, listening: 20 }, duration: 60 },
  duolingo: { sections: { literacy: 10, comprehension: 10, conversation: 10 }, duration: 60 },
  act: {
    sections: { english: 75, math: 60, reading: 40, science: 40 },
    duration: 175,
  },
};

describe("Abroad practice banks", () => {
  for (const [testId, bank] of Object.entries(banks)) {
    const schema = SCHEMA[testId];

    describe(testId, () => {
      it("has correct total questions", () => {
        const total = Object.values(schema.sections).reduce((a, b) => a + b, 0);
        expect(bank.questions.length).toBe(total);
      });

      it("has correct duration", () => {
        expect(bank.durationMinutes).toBe(schema.duration);
      });

      it("has correct section question counts", () => {
        for (const [secId, count] of Object.entries(schema.sections)) {
          expect(bank.questions.filter((q) => q.section === secId).length).toBe(count);
        }
      });

      it("has valid testId", () => {
        expect(bank.testId).toBe(testId);
      });

      it("has schemaVersion", () => {
        expect(bank.schemaVersion).toBe(1);
      });

      it("has provenance with sources", () => {
        expect(bank.provenance.note).toBeTruthy();
        expect(bank.provenance.sources.length).toBeGreaterThan(0);
      });

      it("has marking with correctMarks and negativeMarks", () => {
        expect(typeof bank.marking.correctMarks).toBe("number");
        expect(typeof bank.marking.negativeMarks).toBe("number");
        expect(bank.marking.perQuestionMarks).toBe(1);
      });

      it("has all sections referenced in questions", () => {
        const sectionIds = new Set(bank.sections.map((s) => s.id));
        for (const q of bank.questions) {
          expect(sectionIds.has(q.section)).toBe(true);
        }
      });

      it("has valid questions", () => {
        const ids = new Set<string>();
        for (const q of bank.questions) {
          expect(q.id).toBeTruthy();
          expect(ids.has(q.id)).toBe(false);
          ids.add(q.id);
          expect(q.stem).toBeTruthy();
          expect(q.options.length).toBe(4);
          expect(q.correct).toBeGreaterThanOrEqual(0);
          expect(q.correct).toBeLessThanOrEqual(3);
          expect(q.explanation).toBeTruthy();
          expect(["easy", "medium", "hard"]).toContain(q.difficulty);
          expect(["official-sample", "past-paper", "practice"]).toContain(q.provenance);
          expect(q.sourceUrls.length).toBeGreaterThan(0);
          for (const url of q.sourceUrls) {
            expect(url.startsWith("https://")).toBe(true);
          }
          expect(q.topic).toBeTruthy();
        }
      });
    });
  }
});