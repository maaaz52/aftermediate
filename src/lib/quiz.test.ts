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
    avatarStyle: "adventurer",
    avatarSeed: "",
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
  it("declares the five sections in order", () => {
    expect(QUIZ_SECTIONS.map((s) => s.id)).toEqual([
      "stream", "marks", "pressure", "readiness", "interests",
    ]);
  });
});

describe("visibleQuestions", () => {
  it("returns all questions for a section without showIf/optionsFor", () => {
    const pressure = QUIZ_SECTIONS.find((s) => s.id === "pressure")!;
    expect(visibleQuestions(pressure, blank()).length).toBe(4);
  });

  it("returns the stream options as defined", () => {
    const streamSec = QUIZ_SECTIONS.find((s) => s.id === "stream")!;
    const qs = visibleQuestions(streamSec, blank());
    expect(qs.map((q) => q.id)).toEqual(["stream"]);
    expect(qs[0].options!.map((o) => o.value)).toEqual([
      "pre-medical", "pre-engineering", "ics", "icom", "alevel",
    ]);
  });

  it("returns the interests section with all options", () => {
    const interestsSec = QUIZ_SECTIONS.find((s) => s.id === "interests")!;
    const qs = visibleQuestions(interestsSec, blank());
    expect(qs.length).toBe(1);
    expect(qs[0].options!.length).toBe(12);
  });

  it("marks section has one marksheet question", () => {
    const marks = QUIZ_SECTIONS.find((s) => s.id === "marks")!;
    const qs = visibleQuestions(marks, blank());
    expect(qs.length).toBe(1);
    expect(qs[0].kind).toBe("marksheet");
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
    const streamSec = QUIZ_SECTIONS.find((s) => s.id === "stream")!;
    const p = filled();
    expect(isSectionComplete(streamSec, p)).toBe(true);
    const missing = { ...p, stream: null };
    expect(isSectionComplete(streamSec, missing)).toBe(false);
    expect(isQuizComplete(missing)).toBe(false);
  });

  it("does not count an empty string or empty array as answered", () => {
    const p = { ...filled(), stream: "" } as unknown as StudentProfile;
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
  it("marks section completes even with default marks", () => {
    const marks = QUIZ_SECTIONS.find((s) => s.id === "marks")!;
    // marks section is a marksheet upload with no required questions
    expect(isSectionComplete(marks, blank())).toBe(true);
  });

  it("completes a profile that skipped the marksheet but answered required fields", () => {
    const skipped = {
      ...blank(),
      stream: "pre-engineering" as const,
      interests: ["Technology & Coding"],
    };
    expect(isQuizComplete(skipped)).toBe(true);
    expect(firstIncompleteSection(skipped)).toBe(QUIZ_SECTIONS.length);
  });
});

describe("stale answers are rejected once options change", () => {
  it("rejects a stream value that is not in the options", () => {
    const streamSec = QUIZ_SECTIONS.find((s) => s.id === "stream")!;
    const valid = { ...blank(), stream: "pre-engineering" as const };
    expect(isSectionComplete(streamSec, valid)).toBe(true);
    const invalid = { ...blank(), stream: "invalid-stream" } as unknown as StudentProfile;
    expect(isSectionComplete(streamSec, invalid)).toBe(false);
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
