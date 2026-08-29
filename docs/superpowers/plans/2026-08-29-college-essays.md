# College Essays Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/college-essays` single-page module with 4 interactive subsections (explainer + inspiration gallery, step-by-step writing guide, Qalam A.I draft rating chat, deterministic approach builder) per the approved spec.

**Architecture:** Server component page wrapper (`src/app/(app)/college-essays/page.tsx`) + client shell (`CollegeEssaysApp`) with hash-synced module tabs. Four client components import content from `src/data/college-essays.json` (every block carries real `sources` URLs) and pure logic from `src/lib/college-essays.ts`. New `qalam` persona in `src/lib/ai.ts` + `/api/chat` route. Sidebar group "College Essays".

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind 4, vitest, lucide-react, existing design tokens (violet accent for this feature), IntersectionObserver + native HTML5 DnD (no new deps).

**Spec:** `docs/superpowers/specs/2026-08-29-college-essays-design.md`

---

## File Structure

- Create `src/lib/college-essays.ts` — pure functions: `splitSentences`, `countWords`, `analyzeDraft`, `selectThemes`, `buildPrompts`, `collegeEssaysStrategy` + types.
- Create `src/lib/college-essays.test.ts` — unit tests.
- Create `src/data/college-essays.json` — all content with `sources` on every block.
- Create `src/data/college-essays.test.ts` — contract tests.
- Modify `src/lib/ai.ts` — add `"qalam"` persona (union + `PERSONA_PROMPTS.qalam`).
- Modify `src/app/api/chat/route.ts:10` — extend persona cast with `"qalam"`.
- Create `src/components/college-essays/college-essays-app.tsx` — shell (tabs + hash sync + completion ✓).
- Create `src/components/college-essays/essay-explainer.tsx` — Module 1.
- Create `src/components/college-essays/writing-guide.tsx` — Module 2.
- Create `src/components/college-essays/essay-rater.tsx` — Module 3.
- Create `src/components/college-essays/approach-builder.tsx` — Module 4.
- Create `src/app/(app)/college-essays/page.tsx` — server wrapper.
- Modify `src/components/sidebar.tsx` — "College Essays" group.

**Shared helpers:** `useLocalStorage` and `copyText` already exist in `src/lib/skills.ts` — reuse them. `useStudent()` from `src/lib/store.tsx` (StudentProvider is mounted in root `layout.tsx`).

**ESLint rule to respect:** `react/no-unescaped-entities` — never put a raw apostrophe in JSX text; use `&apos;` or rephrase.

---

### Task 1: Foundation — `src/lib/college-essays.ts` (TDD)

**Files:**
- Create: `src/lib/college-essays.ts`
- Test: `src/lib/college-essays.test.ts`

- [ ] **Step 1: Write the failing test file** `src/lib/college-essays.test.ts`

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/college-essays.test.ts`
Expected: FAIL — module `./college-essays` not found.

- [ ] **Step 3: Write the implementation** `src/lib/college-essays.ts`

```ts
export type EssayType = "personal" | "scholarship" | "both";

export interface StrategyInput {
  essayType: EssayType;
  universities: string[];
  major: string;
  extracurriculars: string[];
  profile: {
    stream: string | null;
    interests: string[];
    skills: string[];
    english?: number;
  };
}

export interface Theme {
  name: string;
  why: string;
}

export interface Strategy {
  approach: "narrative" | "analytical" | "hybrid";
  approachReason: string;
  themes: Theme[];
  structureTemplateId: "narrative-arc" | "challenge-growth" | "topic-deep-dive";
  prompts: string[];
}

export interface DraftAnalysis {
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  longSentences: { text: string; words: number }[];
  tellingWords: string[];
  cliches: string[];
  suggestions: string[];
}

const CLICHES = [
  "from a young age",
  "in today's world",
  "life-changing",
  "opened my eyes",
  "think outside the box",
  "the sky is the limit",
  "reach for the stars",
  "against all odds",
  "turning point in my life",
  "made me who I am today",
  "i want to help humanity",
  "wanted to help humanity",
  "my passion for",
  "never gave up",
];

const TELLING_WORDS = [
  "happy", "sad", "nice", "good", "bad", "amazing", "awesome", "terrible",
  "wonderful", "great", "excited", "frustrated", "angry", "bored", "proud",
  "lonely", "scared",
];

export function splitSentences(text: string): string[] {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return [];
  return t.split(/(?<=[.!?])\s+/).filter(Boolean);
}

export function countWords(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

export function analyzeDraft(text: string): DraftAnalysis {
  const sentences = splitSentences(text);
  const wordCount = countWords(text);
  if (wordCount === 0) {
    return { wordCount: 0, sentenceCount: 0, avgSentenceLength: 0, longSentences: [], tellingWords: [], cliches: [], suggestions: [] };
  }
  const longSentences = sentences.map((s) => ({ text: s, words: countWords(s) })).filter((s) => s.words > 25);
  const lower = text.toLowerCase();
  const tellingWords = TELLING_WORDS.filter((w) => new RegExp(`\\b${w}\\b`).test(lower));
  const cliches = CLICHES.filter((c) => lower.includes(c));
  const suggestions: string[] = [];
  if (longSentences.length > 0) {
    suggestions.push(`${longSentences.length} sentence${longSentences.length > 1 ? "s" : ""} over 25 words — vary your rhythm by splitting them.`);
  }
  if (tellingWords.length > 0) {
    suggestions.push(`You tell feelings with words (${tellingWords.join(", ")}) — replace them with one concrete moment that shows the feeling.`);
  }
  if (cliches.length > 0) {
    suggestions.push(`Cliché${cliches.length > 1 ? "s" : ""} found: "${cliches.join('", "')}" — cut it or make it specific to you.`);
  }
  if (wordCount < 250) {
    suggestions.push("Under 250 words — strong essays run 400-650; add one specific scene.");
  }
  if (wordCount > 700) {
    suggestions.push("Over 700 words — tighten by cutting your weakest paragraph.");
  }
  if (suggestions.length === 0) {
    suggestions.push("Solid structure signals — now sharpen your best sentence and cut the rest.");
  }
  return {
    wordCount,
    sentenceCount: sentences.length,
    avgSentenceLength: sentences.length > 0 ? Math.round(wordCount / sentences.length) : 0,
    longSentences,
    tellingWords,
    cliches,
    suggestions,
  };
}

const THEME_BANK: { theme: string; keywords: string[]; why: string }[] = [
  { theme: "Curiosity", keywords: ["science", "math", "physics", "chemistry", "coding", "research", "question", "curious"], why: "A mind that asks its own questions stands out to admissions officers." },
  { theme: "Resilience", keywords: ["struggle", "failure", "overcome", "challenge", "effort", "determined", "setback"], why: "A specific setback overcome shows maturity and grit." },
  { theme: "Service", keywords: ["volunteer", "community", "help", "teach", "social", "ngo", "service"], why: "Service shows you will contribute to campus life, not just attend it." },
  { theme: "Leadership", keywords: ["lead", "president", "captain", "organise", "organize", "team", "mentor", "initiative"], why: "Leadership signals you will create things, not just consume them." },
  { theme: "Identity", keywords: ["culture", "urdu", "pakistan", "family", "tradition", "heritage", "background"], why: "A grounded sense of identity makes your story yours alone." },
  { theme: "Innovation", keywords: ["build", "create", "design", "startup", "idea", "invent", "app", "robot"], why: "Building things shows initiative and applied thinking." },
  { theme: "Ambition", keywords: ["dream", "goal", "future", "aspire", "career", "doctor", "engineer"], why: "Clear direction helps officers picture you on their campus." },
];

export function selectThemes(input: StrategyInput): Theme[] {
  const haystack = [...input.profile.interests, ...input.profile.skills, input.major, ...input.extracurriculars].join(" ").toLowerCase();
  const scored = THEME_BANK
    .map((b) => ({ theme: b, score: b.keywords.reduce((n, k) => n + (haystack.includes(k) ? 1 : 0), 0) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((s) => ({ name: s.theme.theme, why: s.theme.why }));
  const fallback = ["Resilience", "Identity", "Curiosity"]
    .filter((d) => !scored.some((m) => m.name === d))
    .map((d) => ({ name: d, why: THEME_BANK.find((b) => b.theme === d)!.why }));
  return [...scored, ...fallback].slice(0, 4);
}

const STEM_MAJORS = ["engineering", "computer", "medicine", "medical", "physics", "math", "chemistry", "biology", "data science", "architecture"];

function isStem(input: StrategyInput): boolean {
  if (input.profile.stream === "pre-medical" || input.profile.stream === "pre-engineering" || input.profile.stream === "ics") return true;
  return STEM_MAJORS.some((m) => input.major.toLowerCase().includes(m));
}

function pickApproach(input: StrategyInput): { approach: Strategy["approach"]; reason: string } {
  if ((input.profile.english ?? 5) < 3) {
    return { approach: "narrative", reason: "Your English self-rating is low — a clear chronological story is the safest structure to write with confidence." };
  }
  const stem = isStem(input);
  if (input.essayType === "scholarship") {
    return stem
      ? { approach: "analytical", reason: "Scholarship committees reward clear outcomes — lead with what you did, learned, and plan to do." }
      : { approach: "hybrid", reason: "Scholarship essays need outcomes, but your strengths are personal — open with a story, then connect it to results." };
  }
  return stem
    ? { approach: "hybrid", reason: "You have technical depth worth showing — open with a specific moment, then analyze what it taught you." }
    : { approach: "narrative", reason: "Personal statements reward a story only you could tell — start with a scene and let the insight emerge." };
}

export function buildPrompts(input: StrategyInput, themes: Theme[]): string[] {
  const major = input.major.trim() || "your chosen field";
  const themeNames = themes.map((t) => t.name);
  const prompts: string[] = [
    `Tell the exact moment you first felt drawn to ${major} — a scene, not a summary.`,
    `Describe one time you struggled with ${major} or a project, and what you changed because of it.`,
    "Zoom out: what should the reader remember about you after one read?",
  ];
  if (input.extracurriculars.length > 0) {
    prompts.push(`Pick one extracurricular (${input.extracurriculars[0]}) and show a single moment inside it that reveals who you are.`);
  }
  if (input.essayType !== "personal") {
    prompts.push("Connect one of your achievements to a specific problem you want to solve after your degree — name the problem.");
  }
  if (themeNames.includes("Service")) prompts.push("Show a time you helped someone without being asked — what did you notice, and what did you do?");
  if (themeNames.includes("Leadership")) prompts.push("Tell a story of organising something small — what did you decide, and who pushed back?");
  if (themeNames.includes("Identity")) prompts.push("Describe one detail of your family, city, or culture that shaped how you see the world — why does it matter now?");
  if (themeNames.includes("Resilience")) prompts.push("Write about a failure that embarrassed you and what you did next — include what you lost.");
  if (themeNames.includes("Innovation") || themeNames.includes("Curiosity")) prompts.push("Show a question you kept asking until you found the answer — what did finding it feel like?");
  if (input.universities.length > 0) prompts.push(`Imagine your first month at ${input.universities[0]} — which club, class, or conversation do you seek out, and why?`);
  return [...new Set(prompts)].slice(0, 5);
}

export function collegeEssaysStrategy(input: StrategyInput): Strategy {
  const { approach, reason } = pickApproach(input);
  const themes = selectThemes(input);
  const structureTemplateId = approach === "narrative" ? "narrative-arc" : approach === "analytical" ? "topic-deep-dive" : "challenge-growth";
  return { approach, approachReason: reason, themes, structureTemplateId, prompts: buildPrompts(input, themes) };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/college-essays.test.ts`
Expected: PASS — 19 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/college-essays.ts src/lib/college-essays.test.ts
git commit -m "feat(college-essays): add tone analyzer and strategy engine with tests"
```

---

### Task 2: Data contract tests (red)

**Files:**
- Test: `src/data/college-essays.test.ts`

- [ ] **Step 1: Write the failing contract test** `src/data/college-essays.test.ts`

```ts
import { describe, expect, it } from "vitest";
import json from "./college-essays.json";

interface Source {
  label: string;
  url: string;
}
interface Sourced {
  sources: Source[];
}

const data = json as unknown as {
  explainer: {
    sections: (Sourced & { id: string; title: string; body: string })[];
    criteria: (Sourced & { id: string; title: string; weight: "high" | "medium"; detail: string })[];
    beforeAfter: { weak: { title: string; paragraphs: string[] }; strong: { title: string; paragraphs: string[] }; notes: { label: string; detail: string }[] };
    myths: (Sourced & { id: string; myth: string; fact: string })[];
  };
  quiz: { id: string; question: string; options: { label: string; correct: boolean }[]; explanation: string; source: Source }[];
  dragDrop: { zones: { id: string; label: string }[]; items: { id: string; text: string; zone: string; explanation: string }[] };
  inspiration: { id: string; title: string; program: string; backstory: string; excerpt: string; whyItWorks: string; sourceLabel: string; sourceUrl: string }[];
  guide: {
    steps: (Sourced & { id: "brainstorm" | "outline" | "draft" | "revise"; title: string; summary: string; tools: string[] })[];
    starters: (Sourced & { id: string; part: "hook" | "transition" | "reflection" | "closing"; text: string })[];
    templates: (Sourced & { id: "narrative-arc" | "challenge-growth" | "topic-deep-dive"; name: string; bestFor: string; skeleton: string[] })[];
    ideaPrompts: (Sourced & { id: string; text: string })[];
  };
  builderPresets: { universities: string[]; majors: string[]; extracurriculars: string[] };
};

const isHttps = (u: string) => u.startsWith("https://");

describe("college-essays.json", () => {
  it("explainer has >=4 sections, 5 criteria, >=4 myths, and before/after content", () => {
    expect(data.explainer.sections.length).toBeGreaterThanOrEqual(4);
    expect(data.explainer.criteria).toHaveLength(5);
    expect(data.explainer.myths.length).toBeGreaterThanOrEqual(4);
    expect(data.explainer.beforeAfter.weak.paragraphs.length).toBeGreaterThanOrEqual(2);
    expect(data.explainer.beforeAfter.strong.paragraphs.length).toBeGreaterThanOrEqual(2);
    expect(data.explainer.beforeAfter.notes.length).toBeGreaterThanOrEqual(3);
  });

  it("quiz has exactly 5 questions with 4 options and a correct answer each", () => {
    expect(data.quiz).toHaveLength(5);
    for (const q of data.quiz) {
      expect(q.options).toHaveLength(4);
      expect(q.options.some((o) => o.correct)).toBe(true);
      expect(q.question.trim().length).toBeGreaterThan(10);
      expect(q.explanation.trim().length).toBeGreaterThan(10);
      expect(isHttps(q.source.url)).toBe(true);
    }
  });

  it("dragDrop has exactly 2 zones and >=6 items referencing valid zones", () => {
    expect(data.dragDrop.zones.map((z) => z.id)).toEqual(["strong-hook", "weak-hook"]);
    expect(data.dragDrop.items.length).toBeGreaterThanOrEqual(6);
    const zoneIds = new Set(data.dragDrop.zones.map((z) => z.id));
    for (const item of data.dragDrop.items) {
      expect(zoneIds.has(item.zone), item.id).toBe(true);
      expect(item.explanation.trim().length).toBeGreaterThan(10);
    }
    expect(data.dragDrop.items.some((i) => i.zone === "strong-hook")).toBe(true);
    expect(data.dragDrop.items.some((i) => i.zone === "weak-hook")).toBe(true);
  });

  it("inspiration has 6-8 entries with https links and full content", () => {
    expect(data.inspiration.length).toBeGreaterThanOrEqual(6);
    expect(data.inspiration.length).toBeLessThanOrEqual(8);
    for (const e of data.inspiration) {
      expect(isHttps(e.sourceUrl), e.id).toBe(true);
      expect(e.backstory.trim().length).toBeGreaterThan(30);
      expect(e.excerpt.trim().length).toBeGreaterThan(50);
      expect(e.whyItWorks.trim().length).toBeGreaterThan(30);
      expect(e.sourceLabel.trim().length).toBeGreaterThan(3);
    }
  });

  it("guide has exactly 4 steps in order with valid tools", () => {
    expect(data.guide.steps.map((s) => s.id)).toEqual(["brainstorm", "outline", "draft", "revise"]);
    const TOOLS = ["idea-generator", "inventory", "templates", "starters", "analyzer"];
    for (const s of data.guide.steps) {
      for (const t of s.tools) expect(TOOLS).toContain(t);
    }
  });

  it("guide has exactly 3 templates with >=4 skeleton slots", () => {
    expect(data.guide.templates.map((t) => t.id)).toEqual(["narrative-arc", "challenge-growth", "topic-deep-dive"]);
    for (const t of data.guide.templates) {
      expect(t.skeleton.length).toBeGreaterThanOrEqual(4);
      expect(t.bestFor.trim().length).toBeGreaterThan(10);
    }
  });

  it("guide has >=10 starters covering all 4 parts and >=8 idea prompts", () => {
    expect(data.guide.starters.length).toBeGreaterThanOrEqual(10);
    expect(new Set(data.guide.starters.map((s) => s.part))).toEqual(new Set(["hook", "transition", "reflection", "closing"]));
    expect(data.guide.ideaPrompts.length).toBeGreaterThanOrEqual(8);
  });

  it("every sourced block has at least one https source", () => {
    const blocks: (Sourced & { id: string })[] = [
      ...data.explainer.sections,
      ...data.explainer.criteria,
      ...data.explainer.myths,
      ...data.guide.steps,
      ...data.guide.starters,
      ...data.guide.templates,
      ...data.guide.ideaPrompts,
    ];
    for (const b of blocks) {
      expect(b.sources.length, b.id).toBeGreaterThanOrEqual(1);
      for (const s of b.sources) {
        expect(s.label.trim().length).toBeGreaterThan(3);
        expect(isHttps(s.url), b.id).toBe(true);
      }
    }
  });

  it("builderPresets meet minimum sizes", () => {
    expect(data.builderPresets.universities.length).toBeGreaterThanOrEqual(8);
    expect(data.builderPresets.majors.length).toBeGreaterThanOrEqual(5);
    expect(data.builderPresets.extracurriculars.length).toBeGreaterThanOrEqual(5);
  });

  it("has no duplicate ids across all blocks", () => {
    const ids = [
      ...data.explainer.sections.map((x) => x.id),
      ...data.explainer.criteria.map((x) => x.id),
      ...data.explainer.myths.map((x) => x.id),
      ...data.quiz.map((x) => x.id),
      ...data.dragDrop.items.map((x) => x.id),
      ...data.inspiration.map((x) => x.id),
      ...data.guide.steps.map((x) => x.id),
      ...data.guide.starters.map((x) => x.id),
      ...data.guide.templates.map((x) => x.id),
      ...data.guide.ideaPrompts.map((x) => x.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

Note: this adds `guide.ideaPrompts` to the spec's data model — the idea generator needs prompt text data (spec's `tools` already include `idea-generator`).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/college-essays.test.ts`
Expected: FAIL — `./college-essays.json` not found.

- [ ] **Step 3: Commit**

```bash
git add src/data/college-essays.test.ts
git commit -m "test(college-essays): add data contract tests"
```

---

### Task 3: Content generation with real sources (parallel agents)

**Files:**
- Create: `src/data/college-essays.json`

- [ ] **Step 1: Dispatch 3 content agents in parallel** (GeneralPurpose subagents; they must NOT inherit this session's context). Each agent gets the exact schema slice, the sourcing rules, and the verification command below.

**Shared rules for ALL agents:**
- Real sources only. Research via WebSearch + WebFetch. **Every URL must be verified** — fetch it and confirm it loads before including. Never invent a URL, statistic, quote, or essay.
- `sources` entries: `{ "label": "Site name — page title", "url": "https://…" }`. Use varied sites (university admissions blogs, Purdue OWL, College Essay Guy, Common App, NYT, etc.).
- Plain English, no markdown in strings, JSON-valid (escape quotes), tab-indent 2 spaces. Text content should be written for Pakistani students (FSc/A-Level context, local + abroad targets).
- Hedge time-varying claims ("as of 2026", "most admissions officers advise…").
- Do not write the file — return the full JSON object(s) in your final message.

**Agent A — explainer + quiz + drag-drop.** Schema:
```jsonc
{
  "explainer": {
    "sections": [{ "id": "what|role|audience|craft", "title": "", "body": "", "sources": [{}] }],      // 4, each 80-150 words
    "criteria": [{ "id": "voice|specifics|growth|stakes|structure", "title": "", "weight": "high|medium", "detail": "", "sources": [{}] }], // exactly 5 — note: "structure" not "craft" to avoid id collision with explainer.sections["craft"] (no-duplicate-ids contract test)
    "beforeAfter": {
      "weak": { "title": "Before", "paragraphs": ["", ""] },
      "strong": { "title": "After", "paragraphs": ["", ""] },
      "notes": [{ "label": "What changed", "detail": "" }] // 3-4 notes
    },
    "myths": [{ "id": "", "myth": "", "fact": "", "sources": [{}] }] // 4, e.g. trauma requirement, big vocabulary, thesaurus, saving-the-world
  },
  "quiz": [{ "id": "q1"…"q5", "question": "", "options": [{ "label": "", "correct": false }], "explanation": "", "source": {} }], // exactly 5, exactly 4 options each, strong-vs-weak element style
  "dragDrop": {
    "zones": [{ "id": "strong-hook", "label": "Strong hook" }, { "id": "weak-hook", "label": "Weak hook" }],
    "items": [{ "id": "dd1"…"dd6", "text": "", "zone": "strong-hook|weak-hook", "explanation": "" }] // 6, 3 strong + 3 weak
  }
}
```
Research targets: MIT admissions blog ("what we look for" essays guidance), Harvard College admissions "Tips for writing", Common App essay prompts + advice, College Essay Guy blog, Purdue OWL personal statements, UC admissions insights, Stanford admissions essays advice, NYT college essay column.

**Agent B — inspiration gallery.** Schema:
```jsonc
{
  "inspiration": [{ "id": "essay-1"…"essay-6", "title": "", "program": "e.g. MIT / Johns Hopkins / NYT / QuestBridge", "backstory": "", "excerpt": "", "whyItWorks": "", "sourceLabel": "", "sourceUrl": "" }] // exactly 6
}
```
- `backstory`: 2-3 sentences about the applicant/essay context (as published by the source).
- `excerpt`: 2-4 sentences **verbatim** from the published essay (short excerpt only — copyright-safe).
- `whyItWorks`: 1-2 sentences on craft.
- Exactly 6 entries across **at least 4 different source sites**. Candidate sources (verify each loads): MIT "Essays That Worked" (mitadmissions.org), Johns Hopkins "Essays That Worked" (apply.jhu.edu), NYT college essay column (nytimes.com — prefer free essays; if paywalled, use another verified source), College Essay Guy example essays (collegeessayguy.com), Hamilton College "Essay That Worked" (hamilton.edu), Bowdoin (bowdoin.edu), Tufts (tufts.edu), UChicago Uncommon Essays (uchicago.edu), QuestBridge essay examples (questbridge.org). Prioritize essays by students with non-Western/international backgrounds where available.

**Agent C — guide + presets.** Schema:
```jsonc
{
  "guide": {
    "steps": [{ "id": "brainstorm", "title": "", "summary": "", "tools": ["idea-generator", "inventory"], "sources": [{}] },
              { "id": "outline", "title": "", "summary": "", "tools": ["templates"], "sources": [{}] },
              { "id": "draft", "title": "", "summary": "", "tools": ["starters"], "sources": [{}] },
              { "id": "revise", "title": "", "summary": "", "tools": ["analyzer"], "sources": [{}] }], // summaries 40-70 words each
    "starters": [{ "id": "", "part": "hook|transition|reflection|closing", "text": "", "sources": [{}] }], // 12, 3 per part, realistic sentence openers
    "templates": [{ "id": "narrative-arc", "name": "Narrative Arc", "bestFor": "", "skeleton": ["Opening scene", "…", "…"], "sources": [{}] },
                  { "id": "challenge-growth", "name": "Challenge → Growth", "bestFor": "", "skeleton": ["…×4+"], "sources": [{}] },
                  { "id": "topic-deep-dive", "name": "Topic Deep-Dive", "bestFor": "", "skeleton": ["…×4+"], "sources": [{}] }], // each skeleton 4-6 labeled slots
    "ideaPrompts": [{ "id": "", "text": "", "sources": [{}] }] // 8-10 brainstorm questions
  },
  "builderPresets": {
    "universities": ["LUMS", "NUST", "GIKI", "FAST", "Stanford", "MIT", "Harvard", "Oxford", "Toronto", "NYU Abu Dhabi"],
    "majors": ["Computer Science", "Medicine", "Business", "Economics", "Mechanical Engineering", "Architecture", "Law", "Psychology", "Graphic Design", "Data Science"],
    "extracurriculars": ["Debate", "MUN", "Volunteering", "Robotics club", "Sports team", "Coding projects", "School society leadership", "Content writing", "Art & illustration", "Science olympiad"]
  }
}
```
Research targets: Purdue OWL personal statement guide, College Essay Guy brainstorming exercises + structure guides, Harvard admissions application tips, Common App prompt guidance, UChicago admissions advice, university essays structure guides.

- [ ] **Step 2: Merge the three returned JSON objects** into one `src/data/college-essays.json` (top-level keys: `explainer`, `quiz`, `dragDrop`, `inspiration`, `guide`, `builderPresets`; tab-indent 2). Then verify:

Run: `npx vitest run src/data/college-essays.test.ts`
Expected: PASS — 10 tests.

Also spot-check a sample of the URLs: pick 3 random `sources[].url` / `inspiration[].sourceUrl` and fetch each — all must load.

- [ ] **Step 3: Commit**

```bash
git add src/data/college-essays.json
git commit -m "feat(college-essays): add sourced content data"
```

---

### Task 4: Qalam persona

**Files:**
- Modify: `src/lib/ai.ts:11` (union), `src/lib/ai.ts:31-111` (add prompt)
- Modify: `src/app/api/chat/route.ts:10`

- [ ] **Step 1: Extend the persona union** in `src/lib/ai.ts`:

```ts
export interface ChatContext {
  persona: "rahbar" | "study" | "essay" | "cv" | "safar" | "hunar" | "qalam";
```

- [ ] **Step 2: Add `qalam` to `PERSONA_PROMPTS`** (insert after the `hunar` entry, before the closing `};`):

```ts
  qalam: `You are "Qalam" (قلم), a college/scholarship essay rating coach for Pakistani students applying to universities (local or abroad). You rate drafts with structured, specific feedback. You do not rewrite the essay unless the student asks.

Rating framework — when given a draft to rate, structure your reply exactly as:
1. STRENGTHS (3-4 points) — quote the exact phrase from the student's text, e.g. You wrote: "..." — then say why it works.
2. WEAKNESSES (2-3 points) — quote the exact phrase, then diagnose it (cliché, vague, telling instead of showing, weak hook, missing stakes).
3. IMPROVEMENT SUGGESTIONS (3-4 edits) — each tied to a quoted excerpt: Try changing "..." to a specific scene that shows what you mean.

Guidelines (from the site's essay coach persona):
- Value authenticity over polish. Avoid clichés like "I want to help humanity", generic adjectives, and grand claims with no scene behind them.
- A strong hook, a clear narrative arc, and a concrete closing matter more than vocabulary.
- Typical target length is 400-600 words unless the prompt says otherwise. Match tone to the target (Chevening/Fulbright scholarship essays differ from NUST personal statements).
- Never fabricate or assume achievements — rate only what the student actually wrote.
- If the draft is under ~150 words, say it is too thin to rate fully and suggest what to add (a scene, a stake, a reflection).

Rules:
- Base every point on the student's actual text. If you cannot quote it, do not say it.
- If the student pastes no draft and asks a general essay question, answer as a writing coach instead.
- Academic/study questions → redirect to Ustaad (/study). Site navigation questions → redirect to Rahbar.
- End with one concrete next step: a single edit the student can make right now.`,
```

- [ ] **Step 3: Extend the route persona cast** in `src/app/api/chat/route.ts:10`:

```ts
    const persona = (body.persona as "rahbar" | "study" | "essay" | "cv" | "safar" | "hunar" | "qalam") || "rahbar";
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npx eslint src/lib/ai.ts src/app/api/chat/route.ts`
Expected: exit 0, no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai.ts src/app/api/chat/route.ts
git commit -m "feat(college-essays): add Qalam persona for essay rating"
```

---

### Task 5: Shell + Module 1 (explainer)

**Files:**
- Create: `src/components/college-essays/college-essays-app.tsx`
- Create: `src/components/college-essays/essay-explainer.tsx`

- [ ] **Step 1: Write the shell** `src/components/college-essays/college-essays-app.tsx`

```tsx
"use client";

import * as React from "react";
import { Eye, Feather, MessageSquareText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { EssayExplainer } from "./essay-explainer";
import { WritingGuide } from "./writing-guide";
import { EssayRater } from "./essay-rater";
import { ApproachBuilder } from "./approach-builder";

const TABS = [
  { id: "what", label: "What Is It", icon: Eye },
  { id: "how-to", label: "How To Write It", icon: Feather },
  { id: "rating", label: "AI Rating", icon: MessageSquareText },
  { id: "builder", label: "Approach Builder", icon: Sparkles },
] as const;

type TabId = (typeof TABS)[number]["id"];

const COMPLETION_KEYS: Record<TabId, string> = {
  what: "aftermediate:essays:quiz",
  "how-to": "aftermediate:essays:guide-step",
  rating: "aftermediate:essays:rater-chat",
  builder: "aftermediate:essays:strategy",
};

function readKey(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isDone(id: TabId, value: unknown): boolean {
  if (value == null) return false;
  if (id === "what") {
    const quiz = value as Record<string, number>;
    const dd = readKey("aftermediate:essays:dragdrop") as Record<string, string> | null;
    return Object.keys(quiz).length >= 5 && dd != null && Object.keys(dd).length >= 6;
  }
  if (id === "how-to") {
    const g = value as { done: string[] };
    return Array.isArray(g.done) && g.done.length >= 4;
  }
  if (id === "rating") {
    return Array.isArray(value) && value.length > 1;
  }
  return true;
}

export function CollegeEssaysApp() {
  const [tab, setTab] = React.useState<TabId>(() => {
    if (typeof window === "undefined") return "what";
    const hash = window.location.hash.replace("#", "");
    return (TABS.some((t) => t.id === hash) ? hash : "what") as TabId;
  });
  const [done, setDone] = React.useState<Record<TabId, boolean>>({ what: false, "how-to": false, rating: false, builder: false });

  React.useEffect(() => {
    const next = {} as Record<TabId, boolean>;
    for (const t of TABS) next[t.id] = isDone(t.id, readKey(COMPLETION_KEYS[t.id]));
    setDone(next);
  }, [tab]);

  React.useEffect(() => {
    window.history.replaceState(null, "", `#${tab}`);
  }, [tab]);

  React.useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace("#", "");
      if (TABS.some((t) => t.id === h)) setTab(h as TabId);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <div className="mt-6">
      <div className="sticky top-16 z-30 -mx-4 border-b border-line bg-background/95 px-4 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex gap-1 overflow-x-auto py-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors",
                tab === t.id ? "bg-violet/10 text-violet" : "text-muted hover:bg-surface-2 hover:text-ink"
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              {done[t.id] && (
                <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald text-[10px] font-bold text-background">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6">
        {tab === "what" && <EssayExplainer />}
        {tab === "how-to" && <WritingGuide />}
        {tab === "rating" && <EssayRater />}
        {tab === "builder" && <ApproachBuilder />}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write Module 1** `src/components/college-essays/essay-explainer.tsx`

```tsx
"use client";

import * as React from "react";
import { Check, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/lib/skills";
import data from "@/data/college-essays.json";

const explainer = data as unknown as {
  explainer: {
    sections: { id: string; title: string; body: string; sources: { label: string; url: string }[] }[];
    criteria: { id: string; title: string; weight: "high" | "medium"; detail: string; sources: { label: string; url: string }[] }[];
    beforeAfter: { weak: { title: string; paragraphs: string[] }; strong: { title: string; paragraphs: string[] }; notes: { label: string; detail: string }[] };
    myths: { id: string; myth: string; fact: string; sources: { label: string; url: string }[] }[];
  };
  quiz: { id: string; question: string; options: { label: string; correct: boolean }[]; explanation: string; source: { label: string; url: string } }[];
  dragDrop: { zones: { id: string; label: string }[]; items: { id: string; text: string; zone: string; explanation: string }[] };
  inspiration: { id: string; title: string; program: string; backstory: string; excerpt: string; whyItWorks: string; sourceLabel: string; sourceUrl: string }[];
};

function Sources({ sources }: { sources: { label: string; url: string }[] }) {
  return (
    <p className="mt-3 font-mono text-[11px] text-faint">
      Source:{" "}
      {sources.map((s, i) => (
        <React.Fragment key={s.url}>
          {i > 0 && " · "}
          <a href={s.url} target="_blank" rel="noreferrer" className="text-info underline decoration-dotted hover:text-ink">
            {s.label}
          </a>
        </React.Fragment>
      ))}
    </p>
  );
}

function Reveal({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn("transition-all duration-700 ease-out", visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0")}>
      {children}
    </div>
  );
}

function Meter({ value, total = 5 }: { value: number; total?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={cn("h-2.5 w-2.5", i < value ? "bg-violet" : "bg-line")} />
      ))}
    </div>
  );
}

export function EssayExplainer() {
  const [showStrong, setShowStrong] = React.useState(false);
  const [openMyth, setOpenMyth] = React.useState<string | null>(null);
  const [answers, setAnswers] = useLocalStorage<Record<string, number>>("aftermediate:essays:quiz", {});
  const [placed, setPlaced] = useLocalStorage<Record<string, string>>("aftermediate:essays:dragdrop", {});
  const [selectedItem, setSelectedItem] = React.useState<string | null>(null);

  const score = explainer.quiz.filter((q) => answers[q.id] != null && q.options[answers[q.id]].correct).length;
  const answered = Object.keys(answers).length;
  const placedCount = Object.keys(placed).length;
  const correctPlacements = explainer.dragDrop.items.filter((i) => placed[i.id] === i.zone).length;

  function dropItem(itemId: string, zoneId: string) {
    setPlaced((p) => ({ ...p, [itemId]: zoneId }));
    setSelectedItem(null);
  }

  return (
    <div className="space-y-14">
      {explainer.explainer.sections.map((s) => (
        <Reveal key={s.id}>
          <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">{s.title}</h2>
          <p className="mt-2 max-w-3xl leading-relaxed text-muted">{s.body}</p>
          <Sources sources={s.sources} />
        </Reveal>
      ))}

      <Reveal>
        <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">What admissions officers look for</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {explainer.explainer.criteria.map((c) => (
            <div key={c.id} className="rounded-2xl border-2 border-ink bg-surface p-5 shadow-[4px_4px_0_0_#191f2c]">
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs uppercase tracking-widest text-violet">{c.title}</p>
                <Meter value={c.weight === "high" ? 5 : 3} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.detail}</p>
              <Sources sources={c.sources} />
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">Before &amp; after</h2>
        <div className="mt-4 flex gap-2">
          {(["weak", "strong"] as const).map((side) => (
            <button
              key={side}
              type="button"
              onClick={() => setShowStrong(side === "strong")}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                showStrong === (side === "strong") ? "bg-violet text-background" : "bg-surface-2 text-muted hover:text-ink"
              )}
            >
              {side === "weak" ? "Before (weak)" : "After (strong)"}
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border border-line bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-faint">{showStrong ? "After" : "Before"}</p>
          {explainer.explainer.beforeAfter[showStrong ? "strong" : "weak"].paragraphs.map((p, i) => (
            <p key={i} className="mt-2 leading-relaxed text-ink">{p}</p>
          ))}
          {showStrong &&
            explainer.explainer.beforeAfter.notes.map((n) => (
              <div key={n.label} className="mt-3 rounded-lg border-l-2 border-emerald bg-emerald/5 px-3 py-2">
                <p className="font-mono text-xs font-bold text-emerald">{n.label}</p>
                <p className="text-sm text-muted">{n.detail}</p>
              </div>
            ))}
        </div>
      </Reveal>

      <Reveal>
        <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">Common myths</h2>
        <div className="mt-4 space-y-2">
          {explainer.explainer.myths.map((m) => (
            <div key={m.id} className="rounded-xl border border-line bg-surface">
              <button
                type="button"
                onClick={() => setOpenMyth(openMyth === m.id ? null : m.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-ink"
              >
                {m.myth}
                <span className={cn("text-violet transition-transform", openMyth === m.id && "rotate-45")}>+</span>
              </button>
              {openMyth === m.id && (
                <div className="border-t border-line px-4 py-3">
                  <p className="text-sm leading-relaxed text-muted">{m.fact}</p>
                  <Sources sources={m.sources} />
                </div>
              )}
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">Inspiration — real essays that worked</h2>
        <p className="mt-1 text-sm text-muted">
          Real personal statements published by universities and programs. Read the backstory, then open the full essay.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {explainer.inspiration.map((e) => (
            <div key={e.id} className="flex flex-col rounded-2xl border-2 border-ink bg-surface p-5 shadow-[4px_4px_0_0_#191f2c]">
              <p className="font-mono text-[11px] uppercase tracking-widest text-amber">{e.program}</p>
              <h3 className="mt-1 font-display text-base font-bold text-ink">{e.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                <span className="font-semibold text-ink">The backstory: </span>
                {e.backstory}
              </p>
              <p className="mt-3 border-l-2 border-line pl-3 text-sm italic leading-relaxed text-ink">&ldquo;{e.excerpt}&rdquo;</p>
              <p className="mt-3 text-sm leading-relaxed text-emerald">
                <span className="font-mono text-xs font-bold uppercase tracking-widest">Why it works: </span>
                {e.whyItWorks}
              </p>
              <a
                href={e.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-info hover:text-ink"
              >
                Read the full essay <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">Strong vs. weak elements</h2>
          <span className="rounded-lg bg-violet/10 px-3 py-1.5 font-mono text-sm font-bold text-violet">
            {answered}/5 · {score} correct
          </span>
        </div>
        <div className="mt-4 space-y-4">
          {explainer.quiz.map((q, qi) => {
            const chosen = answers[q.id];
            return (
              <div key={q.id} className="rounded-2xl border border-line bg-surface p-5">
                <p className="font-semibold text-ink">
                  {qi + 1}. {q.question}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {q.options.map((o, oi) => {
                    const isChosen = chosen === oi;
                    const isCorrect = o.correct;
                    return (
                      <button
                        key={oi}
                        type="button"
                        disabled={chosen != null}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                          chosen == null && "border-line bg-surface-2 text-muted hover:border-violet/50 hover:text-ink",
                          isChosen && isCorrect && "border-emerald bg-emerald/10 text-ink",
                          isChosen && !isCorrect && "border-danger bg-danger/10 text-ink",
                          chosen != null && !isChosen && isCorrect && "border-emerald/60 bg-emerald/5 text-ink"
                        )}
                      >
                        {isChosen && (isCorrect ? <Check className="h-4 w-4 shrink-0 text-emerald" /> : <X className="h-4 w-4 shrink-0 text-danger" />)}
                        {chosen != null && !isChosen && isCorrect && <Check className="h-4 w-4 shrink-0 text-emerald" />}
                        {o.label}
                      </button>
                    );
                  })}
                </div>
                {chosen != null && (
                  <div className="mt-3 rounded-lg bg-surface-2 px-3 py-2">
                    <p className="text-sm leading-relaxed text-muted">{q.explanation}</p>
                    <Sources sources={[q.source]} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Reveal>

      <Reveal>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">Sort the hooks</h2>
          <span className="rounded-lg bg-violet/10 px-3 py-1.5 font-mono text-sm font-bold text-violet">
            {placedCount}/6 · {correctPlacements} correct
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">Drag each opening into the right zone — or tap an opening, then tap a zone.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {explainer.dragDrop.zones.map((z) => (
            <div
              key={z.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const itemId = e.dataTransfer.getData("text/plain");
                if (itemId && !placed[itemId]) dropItem(itemId, z.id);
              }}
              onClick={() => {
                if (selectedItem && !placed[selectedItem]) dropItem(selectedItem, z.id);
              }}
              className={cn(
                "min-h-40 rounded-2xl border-2 border-dashed p-4 transition-colors",
                z.id === "strong-hook" ? "border-emerald/50 bg-emerald/5" : "border-danger/50 bg-danger/5"
              )}
            >
              <p className={cn("font-mono text-xs font-bold uppercase tracking-widest", z.id === "strong-hook" ? "text-emerald" : "text-danger")}>
                {z.label}
              </p>
              <div className="mt-3 space-y-2">
                {explainer.dragDrop.items
                  .filter((i) => placed[i.id] === z.id)
                  .map((i) => (
                    <div key={i.id} className="rounded-lg border border-line bg-surface px-3 py-2">
                      <p className="text-sm text-ink">&ldquo;{i.text}&rdquo;</p>
                      <p className="mt-1 text-xs text-muted">{i.explanation}</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlaced((p) => {
                            const next = { ...p };
                            delete next[i.id];
                            return next;
                          });
                        }}
                        className="mt-1 font-mono text-[11px] text-faint hover:text-danger"
                      >
                        remove
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {explainer.dragDrop.items
            .filter((i) => !placed[i.id])
            .map((i) => (
              <button
                key={i.id}
                type="button"
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", i.id)}
                onClick={() => setSelectedItem(selectedItem === i.id ? null : i.id)}
                className={cn(
                  "rounded-xl border-2 px-3 py-2 text-sm transition-colors",
                  selectedItem === i.id ? "border-violet bg-violet/10 text-violet" : "border-line bg-surface-2 text-muted hover:text-ink"
                )}
              >
                &ldquo;{i.text}&rdquo;
              </button>
            ))}
        </div>
        {placedCount === explainer.dragDrop.items.length && (
          <p className="mt-4 rounded-xl bg-emerald/10 px-4 py-3 text-sm font-semibold text-emerald">
            {correctPlacements === explainer.dragDrop.items.length
              ? "All 6 sorted correctly — you can spot a strong hook."
              : `${correctPlacements}/6 sorted correctly — check the explanations above to sharpen your eye.`}
          </p>
        )}
      </Reveal>
    </div>
  );
}
```

- [ ] **Step 3: Verify components compile**

Run: `npx tsc --noEmit`
Expected: tsc fails on missing `./writing-guide`, `./essay-rater`, `./approach-builder` — expected. **Continue to Task 6; run tsc after Task 8.**

- [ ] **Step 4: Commit**

```bash
git add src/components/college-essays/
git commit -m "feat(college-essays): add shell and explainer module"
```

---

### Task 6: Module 2 — writing-guide.tsx (step-by-step guide with tools)

**Files:**
- Create: `src/components/college-essays/writing-guide.tsx`

Four-step stepper (brainstorm → outline → draft → revise) with progressive disclosure: a step is locked until the previous one is marked done. Each step renders its tools from `guide.steps[].tools`; localStorage keys `guide-step`, `inventory`, `outline`, `draft`. Reuses `useLocalStorage` from `@/lib/skills` and `analyzeDraft` from `@/lib/college-essays`.

- [ ] **Step 1: Write the component** `src/components/college-essays/writing-guide.tsx`

```tsx
"use client";

import * as React from "react";
import { Check, Dices, ListChecks, PenLine, RefreshCw, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/lib/skills";
import { analyzeDraft } from "@/lib/college-essays";
import data from "@/data/college-essays.json";

type Source = { label: string; url: string };

const guide = data as unknown as {
  guide: {
    steps: { id: "brainstorm" | "outline" | "draft" | "revise"; title: string; summary: string; tools: string[]; sources: Source[] }[];
    starters: { id: string; part: "hook" | "transition" | "reflection" | "closing"; text: string; sources: Source[] }[];
    templates: { id: "narrative-arc" | "challenge-growth" | "topic-deep-dive"; name: string; bestFor: string; skeleton: string[]; sources: Source[] }[];
    ideaPrompts: { id: string; text: string; sources: Source[] }[];
  };
};

const PART_LABELS: Record<string, string> = {
  hook: "Hooks",
  transition: "Transitions",
  reflection: "Reflections",
  closing: "Closings",
};

interface GuideStepState {
  current: number;
  done: string[];
}

interface OutlineState {
  templateId: string | null;
  slots: Record<string, string>;
}

function Sources({ sources }: { sources: Source[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-faint">
      {sources.map((s) => (
        <a
          key={s.url}
          href={s.url}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-dotted underline-offset-2 hover:text-violet"
        >
          {s.label} ↗
        </a>
      ))}
    </div>
  );
}

export function WritingGuide() {
  const [stepState, setStepState] = useLocalStorage<GuideStepState>("aftermediate:essays:guide-step", { current: 0, done: [] });
  const [inventory, setInventory] = useLocalStorage<string[]>("aftermediate:essays:inventory", []);
  const [outlineState, setOutlineState] = useLocalStorage<OutlineState>("aftermediate:essays:outline", { templateId: null, slots: {} });
  const [draft, setDraft] = useLocalStorage<string>("aftermediate:essays:draft", "");

  const [newItem, setNewItem] = React.useState("");
  const [promptId, setPromptId] = React.useState<string | null>(null);
  const [lastCopied, setLastCopied] = React.useState<string | null>(null);

  const steps = guide.guide.steps;
  const currentStep = steps[stepState.current];
  const analysis = React.useMemo(() => analyzeDraft(draft), [draft]);
  const currentPrompt = guide.guide.ideaPrompts.find((p) => p.id === promptId) ?? null;

  function isUnlocked(index: number): boolean {
    if (index === 0) return true;
    return stepState.done.includes(steps[index - 1].id);
  }

  function completeStep(id: string) {
    if (stepState.done.includes(id)) return;
    const done = [...stepState.done, id];
    setStepState({ current: Math.min(stepState.current + 1, steps.length - 1), done });
  }

  function addItem() {
    const value = newItem.trim();
    if (!value || inventory.includes(value)) return;
    setInventory([...inventory, value]);
    setNewItem("");
  }

  function spinPrompt() {
    const pool = guide.guide.ideaPrompts.filter((p) => p.id !== promptId);
    setPromptId(pool[Math.floor(Math.random() * pool.length)].id);
  }

  function appendStarter(text: string) {
    setDraft((d) => (d ? `${d}\n\n${text}` : text));
    setLastCopied(text.slice(0, 60));
    window.setTimeout(() => setLastCopied(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {steps.map((s, i) => {
          const done = stepState.done.includes(s.id);
          const unlocked = isUnlocked(i);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => unlocked && setStepState((p) => ({ ...p, current: i }))}
              className={cn(
                "rounded-xl border-2 px-3 py-3 text-left transition-colors",
                i === stepState.current ? "border-violet bg-violet/10" : "border-line bg-surface",
                !unlocked && "cursor-not-allowed opacity-40"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("font-mono text-[10px] font-bold uppercase tracking-widest", i === stepState.current ? "text-violet" : "text-faint")}>
                  Step {i + 1}
                </span>
                {done && <Check className="h-4 w-4 text-emerald" />}
              </div>
              <p className="mt-1 text-sm font-bold text-ink">{s.title}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted">{s.summary}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border-2 border-ink bg-surface p-5 shadow-[4px_4px_0_0_#191f2c]">
        {currentStep.id === "brainstorm" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                <Dices className="h-5 w-5 text-violet" /> Idea generator
              </h3>
              <button type="button" onClick={spinPrompt} className="inline-flex items-center gap-1.5 rounded-lg bg-violet px-3.5 py-2 text-sm font-bold text-background">
                <RefreshCw className="h-3.5 w-3.5" /> Spin a prompt
              </button>
            </div>
            {currentPrompt ? (
              <div className="mt-4 rounded-xl border border-line bg-surface-2 p-4">
                <p className="text-sm font-semibold text-ink">&ldquo;{currentPrompt.text}&rdquo;</p>
                <Sources sources={currentPrompt.sources} />
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">Press the button to get a brainstorm question, then capture your answer in the inventory below.</p>
            )}
            <h4 className="mt-6 flex items-center gap-2 text-sm font-bold text-ink">
              <ListChecks className="h-4 w-4 text-violet" /> Experience inventory
            </h4>
            <p className="mt-1 text-xs text-muted">List 3-5 concrete moments: a project, a failure, a habit, a place. These become your scenes.</p>
            <div className="mt-3 flex gap-2">
              <input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
                placeholder="e.g. rebuilt a robot for the school science exhibition"
                className="h-11 flex-1 rounded-lg border border-line bg-surface-2 px-3.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-violet/50"
              />
              <button type="button" onClick={addItem} className="rounded-lg bg-violet px-4 text-sm font-bold text-background">
                Add
              </button>
            </div>
            {inventory.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {inventory.map((item) => (
                  <span key={item} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-sm text-ink">
                    {item}
                    <button type="button" onClick={() => setInventory(inventory.filter((x) => x !== item))} className="text-faint hover:text-danger">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        {currentStep.id === "outline" && (
          <>
            <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
              <Wand2 className="h-5 w-5 text-violet" /> Pick a structure template
            </h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {guide.guide.templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setOutlineState({ templateId: t.id, slots: {} })}
                  className={cn(
                    "rounded-xl border-2 p-4 text-left transition-colors",
                    outlineState.templateId === t.id ? "border-violet bg-violet/10" : "border-line bg-surface-2 hover:border-violet/40"
                  )}
                >
                  <p className="text-sm font-bold text-ink">{t.name}</p>
                  <p className="mt-1 text-xs text-muted">{t.bestFor}</p>
                  <ol className="mt-3 space-y-1 text-xs text-muted">
                    {t.skeleton.map((slot, j) => (
                      <li key={j} className="flex gap-1.5">
                        <span className="font-mono text-violet">{j + 1}.</span> {slot}
                      </li>
                    ))}
                  </ol>
                  <Sources sources={t.sources} />
                </button>
              ))}
            </div>
            {outlineState.templateId && (
              <div className="mt-5 space-y-3">
                {(() => {
                  const t = guide.guide.templates.find((x) => x.id === outlineState.templateId)!;
                  return t.skeleton.map((slot, j) => {
                    const key = `${t.id}-${j}`;
                    return (
                      <div key={key}>
                        <label className="font-mono text-[11px] font-bold uppercase tracking-widest text-violet">{slot}</label>
                        <textarea
                          value={outlineState.slots[key] ?? ""}
                          onChange={(e) => setOutlineState((p) => ({ ...p, slots: { ...p.slots, [key]: e.target.value } }))}
                          rows={2}
                          placeholder="One line: what will this paragraph show?"
                          className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-violet/50"
                        />
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </>
        )}

        {currentStep.id === "draft" && (
          <>
            <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
              <PenLine className="h-5 w-5 text-violet" /> Write your draft
            </h3>
            <p className="mt-1 text-xs text-muted">Tap a starter to drop it into your draft, then write in your own voice. Aim for 400-650 words.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {(["hook", "transition", "reflection", "closing"] as const).map((part) => (
                <div key={part} className="rounded-xl border border-line bg-surface-2 p-4">
                  <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-violet">{PART_LABELS[part]}</p>
                  <div className="mt-2 space-y-2">
                    {guide.guide.starters
                      .filter((s) => s.part === part)
                      .map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => appendStarter(s.text)}
                          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-left text-sm text-muted transition-colors hover:border-violet/40 hover:text-ink"
                        >
                          &ldquo;{s.text}&rdquo;
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
            {lastCopied && (
              <p className="mt-3 rounded-lg bg-emerald/10 px-3 py-2 text-xs font-semibold text-emerald">Added to your draft — &ldquo;{lastCopied}…&rdquo;</p>
            )}
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-ink">Your draft</label>
                <span className="font-mono text-xs text-muted">{analysis.wordCount} words</span>
              </div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={12}
                placeholder="Paste your draft here, or tap starters to begin…"
                className="mt-2 w-full rounded-xl border-2 border-line bg-surface-2 p-4 font-mono text-sm leading-relaxed text-ink placeholder:text-faint focus:border-violet focus:outline-none"
              />
            </div>
          </>
        )}

        {currentStep.id === "revise" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-lg font-bold text-ink">Live revision check</h3>
              <div className="flex gap-2 font-mono text-xs text-muted">
                <span>{analysis.wordCount} words</span>
                <span>·</span>
                <span>{analysis.sentenceCount} sentences</span>
                <span>·</span>
                <span>~{analysis.avgSentenceLength} words/sentence</span>
              </div>
            </div>
            {draft.trim() ? (
              <div className="mt-4 space-y-3">
                {analysis.suggestions.map((s, i) => (
                  <div key={i} className="flex gap-2.5 rounded-xl border border-line bg-surface-2 p-3.5 text-sm text-ink">
                    <Wand2 className="mt-0.5 h-4 w-4 shrink-0 text-violet" />
                    <span>{s}</span>
                  </div>
                ))}
                {analysis.longSentences.length > 0 && (
                  <div className="rounded-xl border border-line bg-surface-2 p-3.5">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted">Long sentences</p>
                    {analysis.longSentences.map((s, i) => (
                      <p key={i} className="mt-2 text-sm text-muted">
                        &ldquo;{s.text.slice(0, 140)}…&rdquo; ({s.words} words)
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">Nothing to check yet — write or paste a draft in Step 3 first.</p>
            )}
          </>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <Sources sources={currentStep.sources} />
          {stepState.done.includes(currentStep.id) ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald/10 px-3.5 py-2 text-sm font-bold text-emerald">
              <Check className="h-4 w-4" /> Step complete
            </span>
          ) : (
            <button type="button" onClick={() => completeStep(currentStep.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-violet px-4 py-2 text-sm font-bold text-background">
              Mark step complete <Check className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: only the known missing-module errors for `./writing-guide`, `./essay-rater`, `./approach-builder` (imported by the shell) — the new file itself is clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/college-essays/writing-guide.tsx
git commit -m "feat(college-essays): add step-by-step writing guide"
```

---

### Task 7: Module 3 — essay-rater.tsx (Qalam A.I streaming chat)

**Files:**
- Create: `src/components/college-essays/essay-rater.tsx`

Split view: left panel = draft textarea + live `analyzeDraft` quick check + "Load my draft" (reads `aftermediate:essays:draft` from the writing guide); right panel = streaming chat with `persona: "qalam"` (same fetch/stream-reader pattern as `src/components/skills/skills-chat.tsx`, violet accent). Chat history persists to `aftermediate:essays:rater-chat`. The draft panel is deliberately NOT persisted (spec key table lists only `rater-chat`); "Load my draft" pulls the guide draft on demand.

- [ ] **Step 1: Write the component** `src/components/college-essays/essay-rater.tsx`

```tsx
"use client";

import * as React from "react";
import { ClipboardPaste, Loader2, Send, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { analyzeDraft } from "@/lib/college-essays";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "aftermediate:essays:rater-chat";

const GREETING =
  "Salam! Main Qalam (قلم) hoon — your college essay rating coach. Paste your draft on the left and send it here, or click \"Load my draft\" to pull in the draft from the writing guide. I will rate it with strengths, weaknesses, and one concrete next step.";

const SUGGESTIONS = [
  "Rate my draft",
  "Which sentences are weakest?",
  "How do I make my opening stronger?",
  "Is my essay too cliché?",
];

function loadHistory(): Msg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
}

export function EssayRater() {
  const [messages, setMessages] = React.useState<Msg[]>(() =>
    loadHistory().length > 0 ? loadHistory() : [{ role: "assistant", content: GREETING }]
  );
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [draftText, setDraftText] = React.useState("");
  const [loadedNote, setLoadedNote] = React.useState<string | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const analysis = React.useMemo(() => analyzeDraft(draftText), [draftText]);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  function loadDraft() {
    try {
      const raw = window.localStorage.getItem("aftermediate:essays:draft");
      if (raw) {
        setDraftText(JSON.parse(raw) as string);
        setLoadedNote("Loaded the draft from your writing guide.");
      } else {
        setLoadedNote("No draft saved in the writing guide yet — paste one here instead.");
      }
    } catch {
      setLoadedNote("Could not read the saved draft.");
    }
    window.setTimeout(() => setLoadedNote(null), 3000);
  }

  async function send(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || streaming) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setStreaming(true);
    setMessages([...next, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ persona: "qalam", messages: next.map((m) => ({ role: m.role, content: m.content })) }),
      });
      if (!res.ok || !res.body) throw new Error("failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages([...next, { role: "assistant", content: acc }]);
      }
    } catch {
      setMessages([...next, { role: "assistant", content: "Sorry, I hit a snag. Try again in a moment." }]);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <div className="rounded-2xl border-2 border-ink bg-surface p-4 shadow-[4px_4px_0_0_#191f2c]">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-ink">Your draft</h3>
            <button
              type="button"
              onClick={loadDraft}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-bold text-violet"
            >
              <ClipboardPaste className="h-3.5 w-3.5" /> Load my draft
            </button>
          </div>
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            rows={12}
            placeholder="Paste your essay draft here…"
            className="mt-3 w-full rounded-xl border border-line bg-surface-2 p-3.5 font-mono text-sm leading-relaxed text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-violet/50"
          />
          {loadedNote && <p className="mt-2 text-xs font-semibold text-emerald">{loadedNote}</p>}
          <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-xs text-muted">
            <span>{analysis.wordCount} words</span>
            <span>{analysis.sentenceCount} sentences</span>
            <span>~{analysis.avgSentenceLength} w/s</span>
          </div>
          {draftText.trim() && (
            <div className="mt-3 space-y-2">
              {analysis.suggestions.slice(0, 3).map((s, i) => (
                <p key={i} className="flex gap-2 rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted">
                  <Wand2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet" /> {s}
                </p>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              if (draftText.trim()) send(draftText);
            }}
            disabled={!draftText.trim() || streaming}
            className="mt-3 w-full rounded-lg bg-violet px-4 py-2.5 text-sm font-bold text-background disabled:opacity-50"
          >
            Send draft to Qalam
          </button>
        </div>
      </div>

      <div className="lg:col-span-3">
        <div className="flex h-[560px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    m.role === "user" ? "bg-violet text-background" : "bg-surface-2 text-ink"
                  )}
                >
                  {m.content || (streaming && <Loader2 className="h-4 w-4 animate-spin" />)}
                </div>
              </div>
            ))}

            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3.5 py-2 text-sm text-muted transition-colors hover:border-violet/40 hover:text-ink"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-violet" />
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="border-t border-line p-3">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Paste your essay or ask about a section…"
                className="h-11 flex-1 rounded-lg border border-line bg-surface-2 px-3.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-violet/50"
              />
              <button
                onClick={() => send()}
                disabled={streaming || !input.trim()}
                className="grid h-11 w-11 place-items-center rounded-lg bg-violet text-background disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: only the known missing-module error for `./approach-builder` — the new file itself is clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/college-essays/essay-rater.tsx
git commit -m "feat(college-essays): add Qalam A.I essay rater"
```

---

### Task 8: Module 4 — approach-builder.tsx (deterministic strategy engine UI)

**Files:**
- Create: `src/components/college-essays/approach-builder.tsx`

Form (essay type cards + chip rows from `builderPresets`) → `collegeEssaysStrategy(input)` → strategy output card. Profile data via `useStudent()` (stream, interests, skills, `quiz.english` 1-5, `quiz.dreamField`, `quiz.needsScholarship`). Result persists to `aftermediate:essays:strategy`. Note: `QuizAnswers.needsScholarship` is the string union `"must" | "helpful" | "no"` (not boolean) — prefill essayType when it is `"must"` or `"helpful"`. `copyText` from `@/lib/skills`.

- [ ] **Step 1: Write the component** `src/components/college-essays/approach-builder.tsx`

```tsx
"use client";

import * as React from "react";
import { ArrowRight, Check, Copy, Quote, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { copyText, useLocalStorage } from "@/lib/skills";
import { useStudent } from "@/lib/store";
import { collegeEssaysStrategy, type EssayType, type Strategy, type StrategyInput } from "@/lib/college-essays";
import data from "@/data/college-essays.json";

type Source = { label: string; url: string };

const builderData = data as unknown as {
  builderPresets: { universities: string[]; majors: string[]; extracurriculars: string[] };
  guide: { templates: { id: string; name: string; bestFor: string; skeleton: string[]; sources: Source[] }[] };
};

const APPROACH_LABELS: Record<Strategy["approach"], string> = {
  narrative: "Narrative",
  analytical: "Analytical",
  hybrid: "Hybrid",
};

const ESSAY_OPTIONS: { id: EssayType; label: string; hint: string }[] = [
  { id: "personal", label: "Personal statement", hint: "Your story for regular applications" },
  { id: "scholarship", label: "Scholarship essay", hint: "Outcomes for funding committees" },
  { id: "both", label: "Both", hint: "One draft, two audiences" },
];

function ChipRow({
  label,
  items,
  selected,
  onToggle,
}: {
  label: string;
  items: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div>
      <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-violet">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => {
          const active = selected.includes(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => onToggle(item)}
              className={cn(
                "rounded-full border-2 px-3 py-1.5 text-sm transition-colors",
                active ? "border-violet bg-violet/10 font-bold text-violet" : "border-line bg-surface-2 text-muted hover:text-ink"
              )}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ApproachBuilder() {
  const { profile } = useStudent();
  const [essayType, setEssayType] = React.useState<EssayType>(
    profile.quiz.needsScholarship === "must" || profile.quiz.needsScholarship === "helpful" ? "scholarship" : "personal"
  );
  const [universities, setUniversities] = React.useState<string[]>([]);
  const [major, setMajor] = React.useState(profile.quiz.dreamField ?? "");
  const [extracurriculars, setExtracurriculars] = React.useState<string[]>([]);
  const [strategy, setStrategy] = useLocalStorage<Strategy | null>("aftermediate:essays:strategy", null);
  const [copied, setCopied] = React.useState<string | null>(null);

  const english = typeof profile.quiz.english === "number" ? profile.quiz.english : 3;
  const template = strategy ? builderData.guide.templates.find((t) => t.id === strategy.structureTemplateId) : null;

  function toggle(list: string[], set: (v: string[]) => void, value: string) {
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  function build() {
    const input: StrategyInput = {
      essayType,
      universities,
      major: major.trim() || profile.quiz.dreamField || "",
      extracurriculars: extracurriculars.length > 0 ? extracurriculars : profile.skills,
      profile: {
        stream: profile.stream,
        interests: profile.interests,
        skills: profile.skills,
        english,
      },
    };
    setStrategy(collegeEssaysStrategy(input));
    window.setTimeout(() => {
      document.getElementById("essay-strategy-output")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function jumpToRater() {
    window.location.hash = "rating";
  }

  async function copyPrompt(p: string) {
    await copyText(p);
    setCopied(p);
    window.setTimeout(() => setCopied(null), 2000);
  }

  async function copyAll() {
    if (!strategy) return;
    const text = [
      `Approach: ${APPROACH_LABELS[strategy.approach]}`,
      strategy.approachReason,
      `Themes: ${strategy.themes.map((t) => t.name).join(", ")}`,
      `Structure: ${template?.name ?? strategy.structureTemplateId}`,
      "",
      "Prompts:",
      ...strategy.prompts.map((p, i) => `${i + 1}. ${p}`),
    ].join("\n");
    await copyText(text);
    setCopied("all");
    window.setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="rounded-2xl border-2 border-ink bg-surface p-5 shadow-[4px_4px_0_0_#191f2c]">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
            <Target className="h-5 w-5 text-violet" /> Build your approach
          </h3>
          <p className="mt-1 text-sm text-muted">Answer three quick questions — the engine maps them to an approach, themes, a structure, and prompts. No AI needed, instant result.</p>

          <p className="mt-5 font-mono text-[11px] font-bold uppercase tracking-widest text-violet">Which essay are you writing?</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {ESSAY_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setEssayType(o.id)}
                className={cn(
                  "rounded-xl border-2 p-3.5 text-left transition-colors",
                  essayType === o.id ? "border-violet bg-violet/10" : "border-line bg-surface-2 hover:border-violet/40"
                )}
              >
                <p className="text-sm font-bold text-ink">{o.label}</p>
                <p className="mt-0.5 text-xs text-muted">{o.hint}</p>
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            <ChipRow label="Universities (optional)" items={builderData.builderPresets.universities} selected={universities} onToggle={(v) => toggle(universities, setUniversities, v)} />
            <ChipRow label="Major (optional)" items={builderData.builderPresets.majors} selected={major ? [major] : []} onToggle={(v) => setMajor(major === v ? "" : v)} />
            <ChipRow label="Extracurriculars (optional)" items={builderData.builderPresets.extracurriculars} selected={extracurriculars} onToggle={(v) => toggle(extracurriculars, setExtracurriculars, v)} />
          </div>

          <button
            type="button"
            onClick={build}
            className="mt-6 w-full rounded-xl bg-violet px-4 py-3 text-sm font-bold text-background transition-colors hover:bg-violet/90"
          >
            Build my strategy
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-violet">From your profile</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Stream</dt>
              <dd className="font-semibold text-ink">{profile.stream ?? "Not set"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Interests</dt>
              <dd className="text-right text-ink">{profile.interests.length > 0 ? profile.interests.join(", ") : "None yet"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Skills</dt>
              <dd className="text-right text-ink">{profile.skills.length > 0 ? profile.skills.join(", ") : "None yet"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">English self-rating</dt>
              <dd className="font-semibold text-ink">{english}/5</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-faint">Your profile feeds the strategy engine — keep it up to date on the Profile page.</p>
        </div>
      </div>

      {strategy && (
        <div id="essay-strategy-output" className="rounded-2xl border-2 border-ink bg-surface p-5 shadow-[4px_4px_0_0_#191f2c] lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
              <Quote className="h-5 w-5 text-violet" /> Your strategy
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyAll}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-bold text-muted hover:text-ink"
              >
                {copied === "all" ? <Check className="h-3.5 w-3.5 text-emerald" /> : <Copy className="h-3.5 w-3.5" />}
                Copy all
              </button>
              <button type="button" onClick={jumpToRater} className="inline-flex items-center gap-1.5 rounded-lg bg-violet px-3 py-1.5 text-xs font-bold text-background">
                Get it rated <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-surface-2 p-4">
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-violet">Approach — {APPROACH_LABELS[strategy.approach]}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink">{strategy.approachReason}</p>
          </div>

          <div className="mt-4">
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-violet">Themes</p>
            <div className="mt-2 space-y-2">
              {strategy.themes.map((t) => (
                <p key={t.name} className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink">
                  <span className="font-bold">{t.name}</span> — {t.why}
                </p>
              ))}
            </div>
          </div>

          {template && (
            <div className="mt-4">
              <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-violet">Structure — {template.name}</p>
              <p className="mt-1 text-xs text-muted">{template.bestFor}</p>
              <ol className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {template.skeleton.map((slot, j) => (
                  <li key={j} className="flex gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs text-muted">
                    <span className="font-mono text-violet">{j + 1}.</span> {slot}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="mt-4">
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-violet">Prompts to start from</p>
            <div className="mt-2 space-y-2">
              {strategy.prompts.map((p, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2.5">
                  <span className="font-mono text-xs font-bold text-violet">{i + 1}.</span>
                  <p className="flex-1 text-sm text-ink">{p}</p>
                  <button type="button" onClick={() => copyPrompt(p)} aria-label="Copy prompt" className="text-faint hover:text-violet">
                    {copied === p ? <Check className="h-4 w-4 text-emerald" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button type="button" onClick={() => setStrategy(null)} className="mt-4 text-xs font-semibold text-faint hover:text-danger">
            Clear strategy and rebuild
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: clean (all modules now exist; the shell imports all four children).

- [ ] **Step 3: Commit**

```bash
git add src/components/college-essays/approach-builder.tsx
git commit -m "feat(college-essays): add smart approach builder"
```

---

### Task 9: Page route + sidebar group

**Files:**
- Create: `src/app/(app)/college-essays/page.tsx`
- Modify: `src/components/sidebar.tsx` (import list + `groups` array)

Server component wrapper (same pattern as `src/app/(app)/skills/courses/page.tsx`, violet accent + Feather icon). Sidebar group goes after "Skills & Side Hustles", before "Resources" — the top nav consumes `groups` via flatMap so it picks the new link up automatically.

- [ ] **Step 1: Create the page** `src/app/(app)/college-essays/page.tsx`

```tsx
import { Feather } from "lucide-react";
import { CollegeEssaysApp } from "@/components/college-essays/college-essays-app";

export default function CollegeEssaysPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet/10 text-violet">
          <Feather className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            College Essays <span className="text-violet">· Write yours</span>
          </h1>
          <p className="text-sm text-muted">
            Learn what admissions officers look for, write with a step-by-step guide, get your draft rated by
            Qalam A.I, and build a personalized approach.
          </p>
        </div>
      </div>
      <div className="mt-6">
        <CollegeEssaysApp />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the sidebar group** — `src/components/sidebar.tsx`

Two edits. First, add `Feather` to the lucide-react import (between `Eye` and `FileText`, keeping alphabetical order):

```tsx
  Eye,
  Feather,
  FileText,
```

Second, insert the new group between the "Skills & Side Hustles" group and the "Resources" group (after the closing `},` of the Skills group, i.e. after the line `{ href: "/skills/platforms", label: "Platforms", icon: Store },` and its group closing):

```tsx
  {
    label: "Skills & Side Hustles",
    links: [
      { href: "/skills/courses", label: "Courses", icon: MonitorPlay },
      { href: "/skills/books", label: "Books", icon: BookMarked },
      { href: "/skills/chat", label: "Hunar A.I", icon: MessageSquareText },
      { href: "/skills/clients", label: "Clients", icon: Handshake },
      { href: "/skills/platforms", label: "Platforms", icon: Store },
    ],
  },
  {
    label: "College Essays",
    links: [
      { href: "/college-essays", label: "College Essays", icon: Feather },
    ],
  },
  {
    label: "Resources",
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/college-essays/page.tsx" src/components/sidebar.tsx
git commit -m "feat(college-essays): add page route and sidebar group"
```

---

### Task 10: Verification pass

**Files:** none (gates only)

- [ ] **Step 1: Run the new test suites**

Run: `npx vitest run src/lib/college-essays.test.ts src/data/college-essays.test.ts`
Expected: PASS — 19 lib tests + 10 contract tests, exit code 0.

- [ ] **Step 2: Run the full test suite**

Run: `npx vitest run`
Expected: only the 16 documented pre-existing failures remain — 13 in `src/lib/quiz.test.ts` and 3 in `src/data/abroad-tests.test.ts` (unrelated to this feature, intentionally untouched). No new failures anywhere. If any new failure appears, fix it before continuing.

- [ ] **Step 3: TypeScript**

Run: `npx tsc --noEmit`
Expected: exit code 0, no errors.

- [ ] **Step 4: ESLint**

Run: `npx eslint`
Expected: exit code 0, no warnings or errors. (Watch for `react/no-unescaped-entities` — never a raw apostrophe in JSX text.)

- [ ] **Step 5: Production build**

Run: `npx next build`
Expected: success, all routes compiled including `/college-essays`.

- [ ] **Step 6: Manual smoke check** (optional but recommended)

Run: `npm run dev` and visit `/college-essays`. Verify: 4 tabs switch with hash sync (`#what`, `#how-to`, `#rating`, `#builder`), completion ✓ badges appear after quiz/drag-drop/guide steps, the idea generator spins prompts, template slots fill, starter taps append to draft, the live revision check updates, Qalam streams a reply (needs logged-in session for `/api/chat`), and the builder outputs a strategy with copy working.

- [ ] **Step 7: Final commit** (only if Step 6 uncovered fixes)

```bash
git add -A
git commit -m "fix(college-essays): polish after smoke check"
```

If Step 6 was clean, skip this commit — every task already has its own commit.
