import { describe, expect, it } from "vitest";
import {
  QUIZ_SECTIONS,
  entryTestTotalFor,
  firstIncompleteSection,
  getAnswer,
  isQuizComplete,
  isSectionComplete,
  setAnswer,
  visibleQuestions,
} from "@/lib/quiz";
import type { QuizSection } from "@/lib/quiz";
import type { StudentProfile } from "@/lib/store";

function blank(): StudentProfile {
  return {
    name: "",
    avatar: "",
    bio: "",
    stream: null,
    marks: { matricObtained: 0, matricTotal: 1100, fscObtained: 0, fscTotal: 1100 },
    interests: [],
    skills: [],
    education: [],
    city: "",
    budget: "",
    quiz: {},
    quizStep: 0,
    quizCompletedAt: null,
    practice: [],
    watchlist: [],
  };
}

function filled(): StudentProfile {
  return {
    ...blank(),
    stream: "pre-engineering",
    marks: {
      matricObtained: 950, matricTotal: 1100,
      fscObtained: 880, fscTotal: 1100,
      entryTestObtained: 150, entryTestTotal: 200,
    },
    interests: ["Technology & Coding"],
    quiz: {
      entryTest: "net",
      city: "Lahore",
      budgetMonthly: 50000,
      parentsExpect: "engineer",
      decisionMaker: "together",
      english: 4,
      consistency: 3,
    },
  };
}

describe("dotted-path answers", () => {
  it("reads through quiz.* and marks.*", () => {
    const p = filled();
    expect(getAnswer(p, "quiz.city")).toBe("Lahore");
    expect(getAnswer(p, "marks.entryTestObtained")).toBe(150);
    expect(getAnswer(p, "stream")).toBe("pre-engineering");
  });

  it("writes immutably through quiz.* and marks.*", () => {
    const p = blank();
    const a = setAnswer(p, "quiz.city", "Karachi");
    expect(a.quiz.city).toBe("Karachi");
    expect(p.quiz.city).toBeUndefined();

    const b = setAnswer(a, "marks.fscObtained", 900);
    expect(b.marks.fscObtained).toBe(900);
    expect(b.quiz.city).toBe("Karachi");
  });
});

describe("sections", () => {
  it("declares the seven sections in order", () => {
    expect(QUIZ_SECTIONS.map((s) => s.id)).toEqual([
      "stream", "marks", "merit", "money", "pressure", "readiness", "interests",
    ]);
  });
});

describe("visibleQuestions", () => {
  const merit = QUIZ_SECTIONS.find((s) => s.id === "merit")!;

  it("hides the entry-test score when no test was taken", () => {
    const p = { ...blank(), quiz: { entryTest: "none" as const } };
    const ids = visibleQuestions(merit, p).map((q) => q.id);
    expect(ids).not.toContain("marks.entryTestObtained");
  });

  it("shows the entry-test score once a test is chosen", () => {
    const p = { ...blank(), quiz: { entryTest: "net" as const } };
    const ids = visibleQuestions(merit, p).map((q) => q.id);
    expect(ids).toContain("marks.entryTestObtained");
  });

  it("offers MDCAT only to pre-medical students", () => {
    const med = { ...blank(), stream: "pre-medical" as const };
    const eng = { ...blank(), stream: "pre-engineering" as const };
    const opts = (p: StudentProfile) =>
      visibleQuestions(merit, p).find((q) => q.id === "quiz.entryTest")!.options!.map((o) => o.value);
    expect(opts(med)).toContain("mdcat");
    expect(opts(med)).not.toContain("ecat");
    expect(opts(eng)).toContain("ecat");
    expect(opts(eng)).not.toContain("mdcat");
  });

  it("shows FSc Part-1 only for the NUST NET path", () => {
    const marks = QUIZ_SECTIONS.find((s) => s.id === "marks")!;
    const net = { ...blank(), quiz: { entryTest: "net" as const } };
    const mdcat = { ...blank(), quiz: { entryTest: "mdcat" as const } };
    expect(visibleQuestions(marks, net).map((q) => q.id)).toContain("marks.fscPart1Obtained");
    expect(visibleQuestions(marks, mdcat).map((q) => q.id)).not.toContain("marks.fscPart1Obtained");
  });
});

describe("completeness", () => {
  it("treats a blank profile as incomplete", () => {
    expect(isQuizComplete(blank())).toBe(false);
  });

  it("treats a fully answered profile as complete", () => {
    expect(isQuizComplete(filled())).toBe(true);
  });

  it("fails a section when one required answer is missing", () => {
    const money = QUIZ_SECTIONS.find((s) => s.id === "money")!;
    const p = filled();
    expect(isSectionComplete(money, p)).toBe(true);
    const missing = { ...p, quiz: { ...p.quiz, city: undefined } };
    expect(isSectionComplete(money, missing)).toBe(false);
    expect(isQuizComplete(missing)).toBe(false);
  });

  it("does not count an empty string or empty array as answered", () => {
    const p = { ...filled(), quiz: { ...filled().quiz, city: "   " } };
    expect(isQuizComplete(p)).toBe(false);
    const q = { ...filled(), interests: [] };
    expect(isQuizComplete(q)).toBe(false);
  });

});

describe("showIf interacts with required", () => {
  const synthetic: QuizSection = {
    id: "synthetic",
    title: "t",
    subtitle: "s",
    questions: [
      { id: "quiz.city", kind: "text", label: "always", required: true },
      {
        id: "quiz.dreamField", kind: "text", label: "conditional", required: true,
        showIf: (p) => p.quiz.entryTest === "net",
      },
    ],
  };

  it("ignores a required question while it is hidden", () => {
    const p = { ...blank(), quiz: { city: "Lahore", entryTest: "none" as const } };
    expect(visibleQuestions(synthetic, p).map((q) => q.id)).not.toContain("quiz.dreamField");
    expect(isSectionComplete(synthetic, p)).toBe(true);
  });

  it("enforces the same question once it becomes visible", () => {
    const p = { ...blank(), quiz: { city: "Lahore", entryTest: "net" as const } };
    expect(visibleQuestions(synthetic, p).map((q) => q.id)).toContain("quiz.dreamField");
    expect(isSectionComplete(synthetic, p)).toBe(false);
    const answered = { ...p, quiz: { ...p.quiz, dreamField: "Robotics" } };
    expect(isSectionComplete(synthetic, answered)).toBe(true);
  });
});

describe("seeded marks defaults are not real answers", () => {
  it("treats a brand-new profile's marks section as incomplete", () => {
    const marks = QUIZ_SECTIONS.find((s) => s.id === "marks")!;
    expect(isSectionComplete(marks, blank())).toBe(false);
  });

  it("does not admit a student who skipped the marksheet screen", () => {
    const skipped = {
      ...blank(),
      stream: "pre-engineering" as const,
      interests: ["Technology & Coding"],
      quiz: {
        entryTest: "none" as const, city: "Lahore", budgetMonthly: 50000,
        parentsExpect: "engineer" as const, decisionMaker: "together" as const,
        english: 4, consistency: 3,
      },
    };
    expect(isQuizComplete(skipped)).toBe(false);
    expect(firstIncompleteSection(skipped)).toBe(1); // the marks section
  });
});

describe("stale answers are rejected once options change", () => {
  it("drops an entry test that the student's stream no longer offers", () => {
    const merit = QUIZ_SECTIONS.find((s) => s.id === "merit")!;
    const med = { ...blank(), stream: "pre-medical" as const, quiz: { entryTest: "mdcat" as const } };
    expect(isSectionComplete(merit, med)).toBe(true);
    const switched = { ...med, stream: "pre-engineering" as const };
    expect(isSectionComplete(merit, switched)).toBe(false);
  });
});

describe("firstIncompleteSection", () => {
  it("returns 0 for a blank profile", () => {
    expect(firstIncompleteSection(blank())).toBe(0);
  });

  it("returns the earliest gap even when a later section is filled", () => {
    const p = { ...filled(), stream: null };
    expect(firstIncompleteSection(p)).toBe(0);
  });

  it("returns the section count when everything is answered", () => {
    expect(firstIncompleteSection(filled())).toBe(QUIZ_SECTIONS.length);
  });
});

describe("entryTestTotalFor", () => {
  it("uses the real totals per test", () => {
    expect(entryTestTotalFor("net")).toBe(200);
    expect(entryTestTotalFor("mdcat")).toBe(200);
    expect(entryTestTotalFor("ecat")).toBe(400);
  });
});
