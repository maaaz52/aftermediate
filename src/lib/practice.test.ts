import { describe, expect, it } from "vitest";
import {
  ATTEMPT_CAP,
  banks,
  bestPercent,
  buildCatalog,
  catalog,
  catalogAbroad,
  formatClock,
  fullOrder,
  getBank,
  grade,
  latestAttempt,
  mockAttempts,
  orderFor,
  pushAttempt,
  quickMinutes,
  quickOrder,
  remainingSeconds,
  sprintAttempts,
  entryTests,
} from "./practice";
import type { PracticeAttempt, PracticeBank } from "./practice";

const mdcat = banks.mdcat;

function fakeBank(overrides: Partial<PracticeBank> = {}): PracticeBank {
  const base: PracticeBank = {
    testId: "fake",
    schemaVersion: 1,
    provenance: { note: "test", sources: ["https://example.com"] },
    durationMinutes: 10,
    marking: {
      perQuestionMarks: 1,
      correctMarks: 1,
      negativeMarks: 0,
      totalMarks: 4,
      note: "test",
    },
    benchmarks: [],
    sections: [
      { id: "a", name: "A", questionCount: 2 },
      { id: "b", name: "B", questionCount: 2 },
    ],
    questions: [
      { id: "a1", section: "a", topic: "t", difficulty: "easy", stem: "s1", options: ["1", "2", "3", "4"], correct: 0, explanation: "e", provenance: "practice", sourceUrls: ["https://example.com"] },
      { id: "a2", section: "a", topic: "t", difficulty: "easy", stem: "s2", options: ["1", "2", "3", "4"], correct: 1, explanation: "e", provenance: "practice", sourceUrls: ["https://example.com"] },
      { id: "b1", section: "b", topic: "t", difficulty: "medium", stem: "s3", options: ["1", "2", "3", "4"], correct: 2, explanation: "e", provenance: "practice", sourceUrls: ["https://example.com"] },
      { id: "b2", section: "b", topic: "t", difficulty: "hard", stem: "s4", options: ["1", "2", "3", "4"], correct: 3, explanation: "e", provenance: "practice", sourceUrls: ["https://example.com"] },
    ],
  };
  return { ...base, ...overrides };
}

function attempt(percent: number, testId = "mdcat"): PracticeAttempt {
  return {
    id: `id-${percent}-${Math.random()}`,
    testId,
    mode: "full",
    submittedAt: new Date().toISOString(),
    autoSubmitted: false,
    timeUsedSeconds: 100,
    score: percent,
    maxScore: 100,
    percent,
    sections: [],
  };
}

function makeAttempt(id: string, mode: PracticeAttempt["mode"]): PracticeAttempt {
  return {
    id,
    testId: "t",
    mode,
    submittedAt: "2025-01-01T00:00:00.000Z",
    autoSubmitted: false,
    timeUsedSeconds: 100,
    score: 80,
    maxScore: 100,
    percent: 80,
    sections: [],
  };
}

describe("getBank / catalog", () => {
  it("resolves every registered bank and nothing else", () => {
    for (const [testId, bank] of Object.entries(banks)) {
      expect(getBank(testId)).toBe(bank);
    }
    expect(getBank("nonexistent")).toBeNull();
  });

  it("builds statuses for all 12 entry tests", () => {
    const items = catalog();
    expect(items.length).toBe(entryTests.length);
    expect(items.length).toBe(12);
    expect(items.filter((i) => i.status === "ready").map((i) => i.test.id).sort()).toEqual([
      "aku",
      "comsats",
      "ecat",
      "fungat",
      "giki",
      "iba",
      "lat",
      "lcat",
      "mdcat",
      "net",
      "nts-nat",
      "pieas",
    ]);
    expect(items.every((i) => i.bank !== null)).toBe(true);
  });

  it("builds ready statuses for all 8 abroad tests", () => {
    const items = catalogAbroad();
    expect(items.length).toBe(8);
    expect(items.every((i) => i.status === "ready" && i.bank !== null)).toBe(true);
  });

  it("buildCatalog is pure over its inputs", () => {
    const items = buildCatalog(entryTests, {});
    expect(items.every((i) => i.status === "preparation")).toBe(true);
  });
});

describe("exam construction", () => {
  it("fullOrder returns every id in section order", () => {
    const order = fullOrder(mdcat);
    expect(order.length).toBe(180);
    expect(order[0]).toBe("mdcat-bio-001");
    expect(order[179]).toBe("mdcat-log-009");
  });

  it("quickOrder is deterministic and half-samples each section (stride 2)", () => {
    const first = quickOrder(mdcat);
    const second = quickOrder(mdcat);
    expect(first).toEqual(second);
    // ceil(81/2) + ceil(45/2) + ceil(36/2) + ceil(9/2) + ceil(9/2)
    expect(first.length).toBe(41 + 23 + 18 + 5 + 5);
    const bySection = (id: string) =>
      first.filter((qid) => qid.startsWith(`mdcat-${id}`)).length;
    expect(bySection("bio")).toBe(41);
    expect(bySection("chem")).toBe(23);
    expect(bySection("phy")).toBe(18);
    expect(bySection("eng")).toBe(5);
    expect(bySection("log")).toBe(5);
  });

  it("quickOrder on NET yields exactly 100 of 200", () => {
    expect(quickOrder(banks.net).length).toBe(100);
  });

  it("quickMinutes halves the duration", () => {
    expect(quickMinutes(mdcat)).toBe(90);
    expect(quickMinutes(fakeBank({ durationMinutes: 101 }))).toBe(51);
  });

  it("orderFor picks by mode", () => {
    expect(orderFor(mdcat, "full").length).toBe(180);
    expect(orderFor(mdcat, "quick").length).toBe(92);
  });
});

describe("grade", () => {
  it("scores an all-correct full paper at 100%", () => {
    const answers: Record<string, number> = {};
    for (const q of mdcat.questions) answers[q.id] = q.correct;
    const { attempt: a, perQuestion } = grade(mdcat, "full", fullOrder(mdcat), answers, 3600, false);
    expect(a.score).toBe(180);
    expect(a.maxScore).toBe(180);
    expect(a.percent).toBe(100);
    expect(perQuestion.every((p) => p.correct)).toBe(true);
    expect(a.sections.find((s) => s.id === "biology")?.correct).toBe(81);
  });

  it("counts correct/wrong/skipped per section", () => {
    const bank = fakeBank();
    const answers = { a1: 0, a2: 3, b1: 2 }; // 2 correct, 1 wrong, 1 skipped
    const { attempt: a } = grade(bank, "full", ["a1", "a2", "b1", "b2"], answers, 60, false);
    expect(a.score).toBe(2);
    expect(a.percent).toBe(50);
    expect(a.sections).toEqual([
      { id: "a", name: "A", correct: 1, wrong: 1, skipped: 0 },
      { id: "b", name: "B", correct: 1, wrong: 0, skipped: 1 },
    ]);
  });

  it("applies negative marking and floors the score at 0", () => {
    const bank = fakeBank({
      marking: {
        perQuestionMarks: 1,
        correctMarks: 1,
        negativeMarks: 0.25,
        totalMarks: 4,
        note: "neg",
      },
    });
    const allWrong = { a1: 1, a2: 0, b1: 0, b2: 1 }; // 4 wrong → 1 - 4 = -3 → floor 0
    const { attempt: a } = grade(bank, "full", ["a1", "a2", "b1", "b2"], allWrong, 60, false);
    expect(a.score).toBe(0);
    expect(a.percent).toBe(0);
    const mixed = { a1: 0, a2: 1, b1: 0, b2: 1 }; // 2 correct + 2 wrong → 2 - 0.5
    const { attempt: b } = grade(bank, "full", ["a1", "a2", "b1", "b2"], mixed, 60, false);
    expect(b.score).toBe(1.5);
  });

  it("scales maxScore to the administered paper (quick mode)", () => {
    const quick = quickOrder(mdcat);
    const answers: Record<string, number> = {};
    for (const id of quick) {
      const q = mdcat.questions.find((x) => x.id === id)!;
      answers[id] = q.correct;
    }
    const { attempt: a } = grade(mdcat, "quick", quick, answers, 5400, true);
    expect(a.maxScore).toBe(92);
    expect(a.percent).toBe(100);
    expect(a.mode).toBe("quick");
    expect(a.autoSubmitted).toBe(true);
  });

  it("perQuestion covers exactly the administered ids in order", () => {
    const { perQuestion } = grade(mdcat, "quick", quickOrder(mdcat), {}, 10, false);
    expect(perQuestion.length).toBe(92);
    expect(perQuestion[0].id).toBe(quickOrder(mdcat)[0]);
    expect(perQuestion.every((p) => p.chosen === null && !p.correct)).toBe(true);
  });
});

describe("profile helpers", () => {
  it("pushAttempt prepends and caps at 50", () => {
    let list: PracticeAttempt[] = [];
    for (let i = 1; i <= 60; i++) list = pushAttempt(list, attempt(i));
    expect(list.length).toBe(ATTEMPT_CAP);
    expect(list[0].percent).toBe(60); // newest first
  });

  it("bestPercent and latestAttempt filter by test", () => {
    const list = [attempt(70), attempt(40, "net"), attempt(85), attempt(60)];
    expect(bestPercent(list, "mdcat")).toBe(85);
    expect(latestAttempt(list, "mdcat")?.percent).toBe(70);
    expect(bestPercent(list, "giki")).toBeNull();
    expect(latestAttempt(list, "giki")).toBeNull();
  });
});

describe("clock helpers", () => {
  it("remainingSeconds clamps at zero and counts down from the start stamp", () => {
    const started = 1_000_000;
    expect(remainingSeconds(mdcat, started, started)).toBe(180 * 60);
    expect(remainingSeconds(mdcat, started, started + 60_000)).toBe(179 * 60);
    expect(remainingSeconds(mdcat, started, started + 10 * 3600_000)).toBe(0);
  });

  it("formatClock renders HH:MM:SS and clamps negatives", () => {
    expect(formatClock(0)).toBe("00:00:00");
    expect(formatClock(6425)).toBe("01:47:05");
    expect(formatClock(180 * 60)).toBe("03:00:00");
    expect(formatClock(-5)).toBe("00:00:00");
  });
});

describe("sprintAttempts / mockAttempts", () => {
  it("partitions attempts into exactly one of the two lists", () => {
    const list: PracticeAttempt[] = [
      makeAttempt("a", "full"),
      makeAttempt("b", "quick"),
      makeAttempt("c", "sprint"),
      makeAttempt("d", "sprint"),
    ];
    expect(sprintAttempts(list).map((a) => a.id)).toEqual(["c", "d"]);
    expect(mockAttempts(list).map((a) => a.id)).toEqual(["a", "b"]);
    expect(sprintAttempts(list).length + mockAttempts(list).length).toBe(list.length);
  });

  it("preserves order", () => {
    const list = [makeAttempt("a", "sprint"), makeAttempt("b", "full"), makeAttempt("c", "sprint")];
    expect(mockAttempts(list).map((a) => a.id)).toEqual(["b"]);
    expect(sprintAttempts(list).map((a) => a.id)).toEqual(["a", "c"]);
  });
});
