import { describe, expect, it } from "vitest";
import {
  analyzeDraft,
  buildPrompts,
  collegeEssaysStrategy,
  countWords,
  selectThemes,
  splitSentences,
  type StrategyInput,
} from "./college-essays";

const baseInput: StrategyInput = {
  essayType: "personal",
  universities: ["LUMS"],
  major: "Computer Science",
  extracurriculars: ["Robotics club"],
  profile: { stream: "pre-engineering", interests: ["coding", "robotics"], skills: ["python"], english: 4 },
};

describe("splitSentences", () => {
  it("splits on sentence-ending punctuation", () => {
    expect(splitSentences("Hello world. How are you? Fine!")).toEqual(["Hello world.", "How are you?", "Fine!"]);
  });

  it("returns [] for empty or whitespace text", () => {
    expect(splitSentences("")).toEqual([]);
    expect(splitSentences("   ")).toEqual([]);
  });
});

describe("countWords", () => {
  it("counts words, ignoring extra whitespace", () => {
    expect(countWords("one two   three")).toBe(3);
  });

  it("returns 0 for empty text", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   ")).toBe(0);
  });
});

describe("analyzeDraft", () => {
  it("reports word/sentence counts and average length", () => {
    const r = analyzeDraft("This is a sentence. And another one here.");
    expect(r.wordCount).toBe(8);
    expect(r.sentenceCount).toBe(2);
    expect(r.avgSentenceLength).toBe(4);
  });

  it("flags sentences over 25 words", () => {
    const r = analyzeDraft(
      "This is an extremely long sentence that keeps going and going with many words and clauses without ever taking a breath or stopping for a moment at all. Short."
    );
    expect(r.longSentences.length).toBe(1);
    expect(r.longSentences[0].words).toBeGreaterThan(25);
  });

  it("detects telling words and cliches", () => {
    const r = analyzeDraft("I was very happy and proud. From a young age, I want to help humanity.");
    expect(r.tellingWords).toContain("happy");
    expect(r.tellingWords).toContain("proud");
    expect(r.cliches.length).toBeGreaterThanOrEqual(1);
  });

  it("produces actionable suggestions for long sentences and cliches", () => {
    const r = analyzeDraft(
      "I was very happy. From a young age, I want to help humanity, and this is a very long sentence that goes on and on and on and on and on and on and on and on and on."
    );
    expect(r.suggestions.some((s) => s.includes("25 words"))).toBe(true);
    expect(r.suggestions.some((s) => s.toLowerCase().includes("clich"))).toBe(true);
  });

  it("handles empty text without suggestions", () => {
    const r = analyzeDraft("   ");
    expect(r.wordCount).toBe(0);
    expect(r.suggestions).toEqual([]);
  });

  it("encourages expansion under 250 words", () => {
    const r = analyzeDraft("I like science.");
    expect(r.suggestions.some((s) => s.includes("250"))).toBe(true);
  });
});

describe("collegeEssaysStrategy", () => {
  it("chooses narrative + narrative-arc for low English confidence", () => {
    const s = collegeEssaysStrategy({ ...baseInput, profile: { ...baseInput.profile, english: 2 } });
    expect(s.approach).toBe("narrative");
    expect(s.structureTemplateId).toBe("narrative-arc");
  });

  it("chooses analytical + topic-deep-dive for scholarship + STEM stream", () => {
    const s = collegeEssaysStrategy({ ...baseInput, essayType: "scholarship", profile: { ...baseInput.profile, stream: "pre-engineering" } });
    expect(s.approach).toBe("analytical");
    expect(s.structureTemplateId).toBe("topic-deep-dive");
  });

  it("chooses hybrid + challenge-growth for scholarship + non-STEM", () => {
    const s = collegeEssaysStrategy({ ...baseInput, essayType: "scholarship", profile: { ...baseInput.profile, stream: "icom" } });
    expect(s.approach).toBe("hybrid");
    expect(s.structureTemplateId).toBe("challenge-growth");
  });

  it("chooses narrative for personal + non-STEM", () => {
    const s = collegeEssaysStrategy({ ...baseInput, profile: { ...baseInput.profile, stream: "icom" } });
    expect(s.approach).toBe("narrative");
  });

  it("chooses hybrid for personal + STEM", () => {
    const s = collegeEssaysStrategy({ ...baseInput, profile: { ...baseInput.profile, stream: "pre-engineering" } });
    expect(s.approach).toBe("hybrid");
  });

  it("derives 3-4 themes with no duplicates, including Service for volunteering input", () => {
    const s = collegeEssaysStrategy({ ...baseInput, profile: { ...baseInput.profile, interests: ["volunteering", "community"], skills: ["teaching"] } });
    expect(s.themes.length).toBeGreaterThanOrEqual(3);
    expect(s.themes.length).toBeLessThanOrEqual(4);
    expect(new Set(s.themes.map((t) => t.name)).size).toBe(s.themes.length);
    expect(s.themes.some((t) => t.name === "Service")).toBe(true);
  });

  it("always returns 3-5 non-empty prompts that reference the major", () => {
    const s = collegeEssaysStrategy(baseInput);
    expect(s.prompts.length).toBeGreaterThanOrEqual(3);
    expect(s.prompts.length).toBeLessThanOrEqual(5);
    for (const p of s.prompts) expect(p.trim().length).toBeGreaterThan(10);
    expect(s.prompts.some((p) => p.includes("Computer Science"))).toBe(true);
  });

  it("is deterministic for identical inputs", () => {
    expect(JSON.stringify(collegeEssaysStrategy(baseInput))).toBe(JSON.stringify(collegeEssaysStrategy(baseInput)));
  });
});

describe("buildPrompts", () => {
  it("caps at 5 prompts with no duplicates", () => {
    const prompts = buildPrompts(baseInput, selectThemes(baseInput));
    expect(prompts.length).toBeLessThanOrEqual(5);
    expect(new Set(prompts).size).toBe(prompts.length);
  });
});
