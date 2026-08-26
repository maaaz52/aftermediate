# Onboarding Quiz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/onboard` into a required, resumable 7-section quiz whose answers persist to Supabase and feed the pages that already expect them.

**Architecture:** Questions are declared as data in `src/lib/quiz.ts` and rendered by small generic components, so `/onboard` becomes a thin orchestrator. `ProfileSync` becomes bidirectional (hydrate on login, debounced push) so progress survives a device change. A single gate in `src/app/(app)/layout.tsx` bounces incomplete profiles to `/onboard`.

**Tech Stack:** Next.js 16.3.2 (App Router, Turbopack), React 19.2.8, TypeScript 5 (strict), Tailwind v4, Supabase (`@supabase/ssr` 0.12), vitest (added in Task 1).

**Spec:** `docs/superpowers/specs/2026-08-26-onboarding-quiz-design.md`

## Global Constraints

- Node must come from nvm in every shell: `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use default`. System node is v18 and too old for Next 16.
- Path alias is `@/*` → `./src/*` (tsconfig.json). Use it in all imports.
- TypeScript is `strict: true`. No `any`; no non-null assertions on quiz values.
- All new UI must use existing primitives from `src/components/ui/` (`Button`, `Card`, `Input`, `Label`, `Progress`) and existing theme tokens (`ink`, `muted`, `faint`, `accent`, `saffron`, `emerald`, `danger`, `line`, `surface`, `surface-2`). Do not introduce new colors.
- Every `.tsx` file that uses hooks needs `"use client"` as the first line.
- Verification commands after every task: `npx tsc --noEmit -p tsconfig.json` and `./node_modules/.bin/eslint <changed files>`. Both must exit 0.
- `entryTestTotal` defaults per test: NET 200, MDCAT 200, ECAT 400. Never asked.
- **Deviation from spec §6, approved during planning:** `budgetBand` (enum) is replaced by `budgetMonthly?: number` — PKR per month. `/money`'s `affordability()` already takes a monthly number with thresholds at 20000 / 60000 / 150000; an enum would require an invented lossy conversion.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/types.ts` (modify) | `QuizAnswers` interface. Types only, no logic. |
| `src/lib/quiz.ts` (create) | Question/section declarations, dotted-path get/set, completeness + visibility logic. Pure, no React. |
| `src/lib/quiz.test.ts` (create) | vitest for everything in `quiz.ts` and the aggregate bug fix. |
| `src/lib/merge-profile.ts` (create) | Pure `chooseProfile(local, remote)` last-write-wins decision. Split from sync so it is testable without React or network. |
| `src/lib/merge-profile.test.ts` (create) | vitest for the merge rule. |
| `src/lib/store.tsx` (modify) | Adds `quiz`, `quizStep`, `quizCompletedAt` to profile; adds `hydrated` + `hydrate()`; drops dead `onboarded`. |
| `src/components/quiz/question-field.tsx` (create) | Renders exactly one `Question` by `kind`. No knowledge of sections. |
| `src/components/quiz/quiz-section.tsx` (create) | Renders one section's visible questions. No knowledge of navigation. |
| `src/components/quiz/marksheet-step.tsx` (create) | OCR upload + manual marks, extracted verbatim from today's `onboard/page.tsx`. |
| `src/app/onboard/page.tsx` (modify) | Orchestrator only: section index, next/back/finish, progress bar. |
| `src/components/profile-sync.tsx` (modify) | Bidirectional + debounced sync. |
| `src/app/(app)/layout.tsx` (modify) | The gate. |
| `src/app/(app)/money/page.tsx` (modify) | Seed budget from quiz. |
| `src/app/(app)/convince/page.tsx` (modify) | Seed the four sliders from quiz. |
| `supabase/schema.sql` (modify) | Match the already-applied migration. |
| `vitest.config.ts` (create) | Test runner config. |

---

### Task 0: Initialize the git repository

The repo is not under version control, so no later task can commit. This must happen first.

**Files:**
- Create: `.gitignore` (verify existing one is adequate)

- [ ] **Step 1: Confirm there is no repo yet**

```bash
git rev-parse --is-inside-work-tree 2>&1 | head -1
```

Expected: `fatal: not a git repository ...`. If it prints `true`, skip this whole task.

- [ ] **Step 2: Verify .gitignore covers the secrets and build output**

```bash
cd /home/themz/aftermediate && grep -E "node_modules|\.next|\.env" .gitignore
```

Expected: lines matching `node_modules`, `/.next/`, `.env*`. If `.env*` is absent, append it — `.env.local` holds the Supabase service-role key and must never be committed.

- [ ] **Step 3: Initialize and make the baseline commit**

```bash
cd /home/themz/aftermediate
git init -b main
git add -A
git status --short | head -20
```

Confirm `.env.local` does NOT appear in the staged list before continuing.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: initial commit of existing aftermediate app"
```

- [ ] **Step 5: Verify the secret is untracked**

```bash
cd /home/themz/aftermediate && git ls-files --error-unmatch .env.local 2>&1 | head -1
```

Expected: `error: pathspec '.env.local' did not match any file` — meaning it is correctly untracked.

---

### Task 1: Add vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/smoke.test.ts` (deleted at the end of this task)
- Modify: `package.json`

**Interfaces:**
- Produces: `npm test` runs vitest once and exits; `@/` alias resolves inside tests.

- [ ] **Step 1: Install vitest**

```bash
cd /home/themz/aftermediate
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use default
npm install -D vitest
```

- [ ] **Step 2: Create the config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Add the scripts**

In `package.json`, inside `"scripts"`, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write a smoke test that proves the alias works**

Create `src/lib/smoke.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { pct } from "@/lib/aggregates";

describe("vitest wiring", () => {
  it("resolves the @/ alias and runs real project code", () => {
    expect(pct(550, 1100)).toBe(50);
  });
});
```

- [ ] **Step 5: Run it**

```bash
cd /home/themz/aftermediate
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use default
npm test
```

Expected: PASS, 1 test.

- [ ] **Step 6: Delete the smoke test**

```bash
rm src/lib/smoke.test.ts
```

It has served its purpose; real tests arrive in Task 3.

- [ ] **Step 7: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: add vitest for pure-logic tests"
```

---

### Task 2: Extend the profile types and store

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/store.tsx`

**Interfaces:**
- Produces: `QuizAnswers` interface; `StudentProfile` with `quiz`, `quizStep`, `quizCompletedAt`; store context with `hydrated: boolean` and `hydrate(remote: Partial<StudentProfile>): void`. `onboarded` is removed.

- [ ] **Step 1: Add QuizAnswers to types.ts**

Append to `src/lib/types.ts`:

```ts
export interface QuizAnswers {
  // merit
  board?: string;
  examYear?: number;
  entryTest?: "net" | "mdcat" | "ecat" | "none";
  // money & location
  city?: string;
  province?: string;
  budgetMonthly?: number; // PKR per month
  canRelocate?: "yes" | "in-province" | "no";
  needsScholarship?: "must" | "helpful" | "no";
  // aspirations & pressure
  dreamField?: string;
  parentsExpect?: "doctor" | "engineer" | "civil-service" | "business" | "my-choice" | "unsure";
  decisionMaker?: "me" | "parents" | "together";
  parentsFirmness?: number; // 1-5
  // readiness
  certifications?: number;
  projects?: number;
  english?: number; // 1-5
  consistency?: number; // 1-5
}
```

- [ ] **Step 2: Extend StudentProfile in store.tsx**

In `src/lib/store.tsx`, change the import line to include the new type:

```ts
import type { Marks, QuizAnswers, Stream } from "@/lib/types";
```

Add three fields to `StudentProfile`:

```ts
export interface StudentProfile {
  name: string;
  stream: Stream | null;
  marks: Marks;
  interests: string[];
  city: string;
  budget: string;
  quiz: QuizAnswers;
  quizStep: number;
  quizCompletedAt: string | null;
}
```

And to `defaultProfile`:

```ts
  quiz: {},
  quizStep: 0,
  quizCompletedAt: null,
```

- [ ] **Step 3: Replace the dead `onboarded` flag with hydration state**

Replace the `Store` interface in `src/lib/store.tsx`:

```ts
interface Store {
  profile: StudentProfile;
  update: (patch: Partial<StudentProfile>) => void;
  reset: () => void;
  hydrated: boolean;
  hydrate: (remote: Partial<StudentProfile>) => void;
}
```

`onboarded` is deleted — nothing reads it (verified: no references outside `store.tsx`). Completeness now comes from `isQuizComplete` in Task 3.

- [ ] **Step 4: Implement hydrate in StudentProvider**

Inside `StudentProvider`, after the `reset` callback, add:

```ts
  const [hydrated, setHydrated] = React.useState(false);

  const hydrate = React.useCallback((remote: Partial<StudentProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...remote };
      if (typeof window !== "undefined") {
        window.localStorage.setItem("aftermediate:profile", JSON.stringify(next));
      }
      return next;
    });
    setHydrated(true);
  }, []);
```

Then replace the `value` memo:

```ts
  const value = React.useMemo<Store>(
    () => ({ profile, update, reset, hydrated, hydrate }),
    [profile, update, reset, hydrated, hydrate]
  );
```

- [ ] **Step 5: Verify it compiles**

```bash
cd /home/themz/aftermediate
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use default
npx tsc --noEmit -p tsconfig.json
```

Expected: exit 0. If it reports an error about `onboarded` in another file, that file must be updated to use `isQuizComplete` in Task 8 — note it and continue only if the error is in `store.tsx` itself.

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/store.tsx
git commit -m "feat: add quiz answers and hydration state to student profile"
```

---

### Task 3: Build quiz.ts with TDD

This is the core. The completeness rule decides who can enter the site, so it is written test-first.

**Files:**
- Create: `src/lib/quiz.ts`
- Create: `src/lib/quiz.test.ts`

**Interfaces:**
- Consumes: `StudentProfile`, `QuizAnswers` (Task 2).
- Produces:
  - `QUIZ_SECTIONS: QuizSection[]` — 7 sections, ids `stream`, `marks`, `merit`, `money`, `pressure`, `readiness`, `interests`
  - `getAnswer(p: StudentProfile, id: string): unknown`
  - `setAnswer(p: StudentProfile, id: string, value: unknown): StudentProfile`
  - `visibleQuestions(s: QuizSection, p: StudentProfile): Question[]`
  - `isSectionComplete(s: QuizSection, p: StudentProfile): boolean`
  - `isQuizComplete(p: StudentProfile): boolean`
  - `firstIncompleteSection(p: StudentProfile): number`
  - `entryTestTotalFor(t: string | undefined): number`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/quiz.test.ts`:

```ts
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
import type { StudentProfile } from "@/lib/store";

function blank(): StudentProfile {
  return {
    name: "",
    stream: null,
    marks: { matricObtained: 0, matricTotal: 1100, fscObtained: 0, fscTotal: 1100 },
    interests: [],
    city: "",
    budget: "",
    quiz: {},
    quizStep: 0,
    quizCompletedAt: null,
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

  it("ignores hidden questions when judging completeness", () => {
    // entryTest "none" hides the score, so its absence must not block completion
    const p = { ...filled(), quiz: { ...filled().quiz, entryTest: "none" as const }, marks: { ...filled().marks, entryTestObtained: undefined } };
    expect(isQuizComplete(p)).toBe(true);
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
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd /home/themz/aftermediate
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use default
npm test
```

Expected: FAIL — `Failed to resolve import "@/lib/quiz"`.

- [ ] **Step 3: Implement quiz.ts**

Create `src/lib/quiz.ts`:

```ts
import type { StudentProfile } from "@/lib/store";

export type QuestionKind =
  | "single" | "multi" | "number" | "text" | "scale" | "stream" | "marksheet";

export interface QuestionOption {
  value: string;
  label: string;
  sub?: string;
}

export interface Question {
  id: string; // dotted path: "stream", "quiz.city", "marks.entryTestObtained"
  kind: QuestionKind;
  label: string;
  help?: string;
  options?: QuestionOption[];
  min?: number;
  max?: number;
  required?: boolean;
  showIf?: (p: StudentProfile) => boolean;
  optionsFor?: (p: StudentProfile) => QuestionOption[];
}

export interface QuizSection {
  id: string;
  title: string;
  subtitle: string;
  questions: Question[];
}

export function entryTestTotalFor(t: string | undefined): number {
  if (t === "ecat") return 400;
  return 200; // net, mdcat
}

/* ---------- dotted-path access ---------- */

export function getAnswer(p: StudentProfile, id: string): unknown {
  const [head, tail] = id.split(".");
  if (!tail) return (p as unknown as Record<string, unknown>)[head];
  const branch = (p as unknown as Record<string, Record<string, unknown>>)[head];
  return branch ? branch[tail] : undefined;
}

export function setAnswer(p: StudentProfile, id: string, value: unknown): StudentProfile {
  const [head, tail] = id.split(".");
  if (!tail) return { ...p, [head]: value } as StudentProfile;
  const branch = (p as unknown as Record<string, Record<string, unknown>>)[head] ?? {};
  return { ...p, [head]: { ...branch, [tail]: value } } as StudentProfile;
}

function isAnswered(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "number") return Number.isFinite(v);
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

/* ---------- option sets ---------- */

const ENTRY_TESTS: { value: string; label: string; sub: string; streams: string[] }[] = [
  { value: "net", label: "NUST NET", sub: "200 marks · 75% of NUST merit", streams: ["pre-engineering", "ics", "icom", "alevel", "pre-medical"] },
  { value: "mdcat", label: "MDCAT", sub: "200 MCQs · 50% of medical merit", streams: ["pre-medical"] },
  { value: "ecat", label: "UET ECAT", sub: "400 marks · engineering", streams: ["pre-engineering"] },
  { value: "none", label: "Not yet", sub: "Haven't taken one", streams: ["pre-engineering", "ics", "icom", "alevel", "pre-medical"] },
];

const BOARDS = [
  "Lahore", "Federal", "Karachi", "Peshawar", "Multan", "Rawalpindi",
  "Gujranwala", "Sargodha", "Faisalabad", "AJK", "Cambridge / other",
].map((b) => ({ value: b, label: b }));

const PROVINCES = ["Punjab", "Sindh", "KPK", "Balochistan", "Islamabad", "AJK", "Gilgit-Baltistan"]
  .map((p) => ({ value: p, label: p }));

const INTERESTS = [
  "Medicine & Healthcare", "Technology & Coding", "Engineering & Machines",
  "Business & Finance", "Design & Creativity", "Data & Numbers",
  "Writing & Communication", "Teaching & Mentoring", "Research & Science",
  "Helping People", "Building Things", "Leadership",
].map((i) => ({ value: i, label: i }));

/* ---------- sections ---------- */

const hasTest = (p: StudentProfile) => !!p.quiz.entryTest && p.quiz.entryTest !== "none";

export const QUIZ_SECTIONS: QuizSection[] = [
  {
    id: "stream",
    title: "What did you do in FSc?",
    subtitle: "This decides which doors we map for you.",
    questions: [
      {
        id: "stream", kind: "stream", label: "Your stream", required: true,
        options: [
          { value: "pre-medical", label: "FSc Pre-Medical", sub: "Biology · Chemistry · Physics" },
          { value: "pre-engineering", label: "FSc Pre-Engineering", sub: "Math · Chemistry · Physics" },
          { value: "ics", label: "ICS", sub: "Computer Science · Physics · Math" },
          { value: "icom", label: "I.Com", sub: "Commerce · Accounting" },
          { value: "alevel", label: "A-Levels", sub: "Cambridge International" },
        ],
      },
    ],
  },
  {
    id: "marks",
    title: "Your marksheet",
    subtitle: "Scan it or type it. We only need the totals.",
    questions: [
      { id: "marks", kind: "marksheet", label: "Scan your marksheet" },
      { id: "marks.matricObtained", kind: "number", label: "Matric obtained", required: true, min: 0 },
      { id: "marks.matricTotal", kind: "number", label: "Matric total", required: true, min: 1 },
      { id: "marks.fscObtained", kind: "number", label: "FSc obtained", required: true, min: 0 },
      { id: "marks.fscTotal", kind: "number", label: "FSc total", required: true, min: 1 },
      {
        id: "marks.fscPart1Obtained", kind: "number", label: "FSc Part-1 obtained", min: 0,
        help: "NUST weighs Part-1 at 15%.", showIf: (p) => p.quiz.entryTest === "net",
      },
      {
        id: "marks.fscPart1Total", kind: "number", label: "FSc Part-1 total", min: 1,
        showIf: (p) => p.quiz.entryTest === "net",
      },
    ],
  },
  {
    id: "merit",
    title: "Your entry test",
    subtitle: "This is the single biggest lever on your merit.",
    questions: [
      { id: "quiz.board", kind: "single", label: "Which board?", options: BOARDS },
      { id: "quiz.examYear", kind: "number", label: "FSc exam year", min: 2015, max: 2030 },
      {
        id: "quiz.entryTest", kind: "single", label: "Which entry test?", required: true,
        optionsFor: (p) =>
          ENTRY_TESTS.filter((t) => !p.stream || t.streams.includes(p.stream))
            .map(({ value, label, sub }) => ({ value, label, sub })),
      },
      {
        id: "marks.entryTestObtained", kind: "number", label: "Your score", min: 0,
        help: "Leave blank if you haven't got your result yet.", showIf: hasTest,
      },
    ],
  },
  {
    id: "money",
    title: "What can you afford?",
    subtitle: "Money is a merit factor too. Nobody tells you that.",
    questions: [
      { id: "quiz.city", kind: "text", label: "Which city do you live in?", required: true },
      { id: "quiz.province", kind: "single", label: "Province", options: PROVINCES },
      {
        id: "quiz.budgetMonthly", kind: "number", label: "Family budget (PKR per month)",
        required: true, min: 0, help: "A rough number is fine — it changes what we recommend.",
      },
      {
        id: "quiz.canRelocate", kind: "single", label: "Can you move city to study?",
        options: [
          { value: "yes", label: "Yes, anywhere" },
          { value: "in-province", label: "Only within my province" },
          { value: "no", label: "No, I need to stay home" },
        ],
      },
      {
        id: "quiz.needsScholarship", kind: "single", label: "Do you need a scholarship?",
        options: [
          { value: "must", label: "Yes — I can't go without one" },
          { value: "helpful", label: "It would help a lot" },
          { value: "no", label: "No" },
        ],
      },
    ],
  },
  {
    id: "pressure",
    title: "Who's deciding?",
    subtitle: "Be honest. This is what we help you talk about.",
    questions: [
      { id: "quiz.dreamField", kind: "text", label: "If it were entirely your call, what would you study?" },
      {
        id: "quiz.parentsExpect", kind: "single", label: "What do your parents expect?", required: true,
        options: [
          { value: "doctor", label: "Doctor" },
          { value: "engineer", label: "Engineer" },
          { value: "civil-service", label: "CSS / civil service" },
          { value: "business", label: "Business / family business" },
          { value: "my-choice", label: "Whatever I choose" },
          { value: "unsure", label: "I'm not sure" },
        ],
      },
      {
        id: "quiz.decisionMaker", kind: "single", label: "Who actually makes the final call?", required: true,
        options: [
          { value: "me", label: "Me" },
          { value: "parents", label: "My parents" },
          { value: "together", label: "We decide together" },
        ],
      },
      {
        id: "quiz.parentsFirmness", kind: "scale", label: "How firm are they about it?",
        min: 1, max: 5, help: "1 = open to anything · 5 = completely set",
      },
    ],
  },
  {
    id: "readiness",
    title: "Where are you now?",
    subtitle: "This builds your worth score — no wrong answers.",
    questions: [
      { id: "quiz.certifications", kind: "number", label: "Certifications completed", min: 0, max: 20 },
      { id: "quiz.projects", kind: "number", label: "Projects built", min: 0, max: 20 },
      {
        id: "quiz.english", kind: "scale", label: "How comfortable is your English?",
        required: true, min: 1, max: 5, help: "1 = struggling · 5 = fluent",
      },
      {
        id: "quiz.consistency", kind: "scale", label: "How consistent is your study routine?",
        required: true, min: 1, max: 5, help: "1 = all-nighters only · 5 = daily",
      },
    ],
  },
  {
    id: "interests",
    title: "What pulls you?",
    subtitle: "Pick everything that sounds interesting. We'll connect the dots.",
    questions: [
      { id: "interests", kind: "multi", label: "Your interests", required: true, options: INTERESTS },
    ],
  },
];

/* ---------- derived logic ---------- */

export function visibleQuestions(s: QuizSection, p: StudentProfile): Question[] {
  return s.questions
    .filter((q) => (q.showIf ? q.showIf(p) : true))
    .map((q) => (q.optionsFor ? { ...q, options: q.optionsFor(p) } : q));
}

export function isSectionComplete(s: QuizSection, p: StudentProfile): boolean {
  return visibleQuestions(s, p)
    .filter((q) => q.required)
    .every((q) => isAnswered(getAnswer(p, q.id)));
}

export function isQuizComplete(p: StudentProfile): boolean {
  return QUIZ_SECTIONS.every((s) => isSectionComplete(s, p));
}

export function firstIncompleteSection(p: StudentProfile): number {
  const i = QUIZ_SECTIONS.findIndex((s) => !isSectionComplete(s, p));
  return i === -1 ? QUIZ_SECTIONS.length : i;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
cd /home/themz/aftermediate
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use default
npm test
```

Expected: PASS, all tests green.

- [ ] **Step 5: Typecheck and lint**

```bash
npx tsc --noEmit -p tsconfig.json && ./node_modules/.bin/eslint src/lib/quiz.ts src/lib/quiz.test.ts
```

Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/lib/quiz.ts src/lib/quiz.test.ts
git commit -m "feat: declare quiz sections and completeness logic"
```

---

### Task 4: Lock in the /merit bug fix with a test

The spec's headline claim is that every entry-test aggregate is currently computed from a score of zero. This task proves it and prevents regression.

**Files:**
- Create: `src/lib/aggregates.test.ts`

**Interfaces:**
- Consumes: `nustAggregate`, `mdcatAggregate` from `src/lib/aggregates.ts` (existing, unchanged).

- [ ] **Step 1: Write the test**

Create `src/lib/aggregates.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { mdcatAggregate, nustAggregate } from "@/lib/aggregates";
import type { Marks } from "@/lib/types";

const base: Marks = {
  matricObtained: 950, matricTotal: 1100,
  fscObtained: 880, fscTotal: 1100,
  fscPart1Obtained: 440, fscPart1Total: 550,
};

describe("nustAggregate", () => {
  it("collapses toward the floor when no entry-test score is supplied", () => {
    // This is the pre-quiz behaviour: entryTestObtained is undefined -> treated as 0,
    // so 75% of the aggregate is thrown away.
    const r = nustAggregate(base);
    expect(r.value).toBeCloseTo(0.15 * 80 + 0.1 * (950 / 1100) * 100, 4);
    expect(r.value).toBeLessThan(25);
  });

  it("uses the real score once the quiz supplies one", () => {
    const r = nustAggregate({ ...base, entryTestObtained: 150, entryTestTotal: 200 });
    // 75% * 75 + 15% * 80 + 10% * 86.36
    expect(r.value).toBeCloseTo(0.75 * 75 + 0.15 * 80 + 0.1 * (950 / 1100) * 100, 4);
    expect(r.value).toBeGreaterThan(75);
  });

  it("keeps the three weights at 75/15/10", () => {
    const r = nustAggregate({ ...base, entryTestObtained: 150, entryTestTotal: 200 });
    expect(r.breakdown.map((b) => b.weight)).toEqual([75, 15, 10]);
  });
});

describe("mdcatAggregate", () => {
  it("uses the real MDCAT score when present", () => {
    const r = mdcatAggregate({ ...base, entryTestObtained: 170, entryTestTotal: 200 });
    expect(r.value).toBeCloseTo(0.5 * 85 + 0.4 * 80 + 0.1 * (950 / 1100) * 100, 4);
  });
});
```

- [ ] **Step 2: Run it**

```bash
cd /home/themz/aftermediate
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use default
npm test
```

Expected: PASS. These document existing behaviour plus the corrected path; no source change is needed because `aggregates.ts` already reads the fields.

- [ ] **Step 3: Commit**

```bash
git add src/lib/aggregates.test.ts
git commit -m "test: pin aggregate maths for missing and real entry-test scores"
```

---

### Task 5: Profile merge rule with TDD

**Files:**
- Create: `src/lib/merge-profile.ts`
- Create: `src/lib/merge-profile.test.ts`

**Interfaces:**
- Produces: `chooseProfile(local, remote): { use: "local" | "remote"; profile: Partial<StudentProfile> }`

- [ ] **Step 1: Write the failing test**

Create `src/lib/merge-profile.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { chooseProfile } from "@/lib/merge-profile";

const localAt = "2026-08-20T10:00:00.000Z";
const remoteNewer = "2026-08-21T10:00:00.000Z";
const remoteOlder = "2026-08-19T10:00:00.000Z";

describe("chooseProfile", () => {
  it("takes local when there is no remote row", () => {
    const r = chooseProfile({ city: "Lahore" }, localAt, null, null);
    expect(r.use).toBe("local");
  });

  it("takes remote when remote is newer", () => {
    const r = chooseProfile({ city: "Lahore" }, localAt, { city: "Karachi" }, remoteNewer);
    expect(r.use).toBe("remote");
    expect(r.profile.city).toBe("Karachi");
  });

  it("keeps local when local is newer", () => {
    const r = chooseProfile({ city: "Lahore" }, localAt, { city: "Karachi" }, remoteOlder);
    expect(r.use).toBe("local");
    expect(r.profile.city).toBe("Lahore");
  });

  it("takes remote when the local cache has never been stamped", () => {
    const r = chooseProfile({}, null, { city: "Karachi" }, remoteOlder);
    expect(r.use).toBe("remote");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm test
```

Expected: FAIL — cannot resolve `@/lib/merge-profile`.

- [ ] **Step 3: Implement**

Create `src/lib/merge-profile.ts`:

```ts
import type { StudentProfile } from "@/lib/store";

export interface ProfileChoice {
  use: "local" | "remote";
  profile: Partial<StudentProfile>;
}

/**
 * Last-write-wins on updated_at. A single student across their own devices,
 * so a simple timestamp comparison is sufficient.
 */
export function chooseProfile(
  local: Partial<StudentProfile>,
  localUpdatedAt: string | null,
  remote: Partial<StudentProfile> | null,
  remoteUpdatedAt: string | null
): ProfileChoice {
  if (!remote) return { use: "local", profile: local };
  if (!localUpdatedAt) return { use: "remote", profile: remote };
  if (!remoteUpdatedAt) return { use: "local", profile: local };
  return Date.parse(remoteUpdatedAt) > Date.parse(localUpdatedAt)
    ? { use: "remote", profile: remote }
    : { use: "local", profile: local };
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/merge-profile.ts src/lib/merge-profile.test.ts
git commit -m "feat: add last-write-wins profile merge rule"
```

---
### Task 6: Question renderers

**Files:**
- Create: `src/components/quiz/question-field.tsx`
- Create: `src/components/quiz/quiz-section.tsx`

**Interfaces:**
- Consumes: `Question`, `QuizSection`, `visibleQuestions`, `getAnswer` (Task 3).
- Produces:
  - `<QuestionField question={Question} profile={StudentProfile} onChange={(id: string, value: unknown) => void} />`
  - `<QuizSectionView section={QuizSection} profile={StudentProfile} onChange={(id, value) => void} marksheet={React.ReactNode} />`

Note: `kind: "marksheet"` renders nothing in `QuestionField`; `QuizSectionView` slots the `marksheet` node in its place. This keeps OCR wiring out of the generic renderer.

- [ ] **Step 1: Create QuestionField**

Create `src/components/quiz/question-field.tsx`:

```tsx
"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getAnswer, type Question } from "@/lib/quiz";
import type { StudentProfile } from "@/lib/store";

interface Props {
  question: Question;
  profile: StudentProfile;
  onChange: (id: string, value: unknown) => void;
}

export function QuestionField({ question: q, profile, onChange }: Props) {
  const value = getAnswer(profile, q.id);

  if (q.kind === "marksheet") return null;

  if (q.kind === "single" || q.kind === "stream") {
    const opts = q.options ?? [];
    return (
      <fieldset className="min-w-0">
        <legend className="text-sm font-semibold text-ink">
          {q.label}
          {q.required && <span className="ml-1 text-danger">*</span>}
        </legend>
        {q.help && <p className="mt-1 text-xs text-faint">{q.help}</p>}
        <div className={cn("mt-3 grid gap-2.5", q.kind === "stream" ? "sm:grid-cols-2" : "sm:grid-cols-2")}>
          {opts.map((o) => {
            const active = value === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange(q.id, o.value)}
                aria-pressed={active}
                className={cn(
                  "min-w-0 border-2 border-ink p-3.5 text-left transition-all",
                  active
                    ? "bg-accent text-white shadow-[4px_4px_0_0_var(--color-ink)]"
                    : "bg-surface text-ink hover:bg-surface-2"
                )}
              >
                <span className="block text-sm font-semibold">{o.label}</span>
                {o.sub && (
                  <span className={cn("mt-0.5 block font-mono text-[11px]", active ? "text-white/75" : "text-faint")}>
                    {o.sub}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  }

  if (q.kind === "multi") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <fieldset className="min-w-0">
        <legend className="text-sm font-semibold text-ink">
          {q.label}
          {q.required && <span className="ml-1 text-danger">*</span>}
        </legend>
        {q.help && <p className="mt-1 text-xs text-faint">{q.help}</p>}
        <div className="mt-3 flex flex-wrap gap-2.5">
          {(q.options ?? []).map((o) => {
            const active = selected.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  onChange(
                    q.id,
                    active ? selected.filter((x) => x !== o.value) : [...selected, o.value]
                  )
                }
                className={cn(
                  "border-2 border-ink px-3.5 py-2 text-sm font-medium transition-all",
                  active
                    ? "bg-accent text-white shadow-[3px_3px_0_0_var(--color-ink)]"
                    : "bg-surface text-muted hover:bg-surface-2 hover:text-ink"
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  }

  if (q.kind === "scale") {
    const min = q.min ?? 1;
    const max = q.max ?? 5;
    const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    return (
      <fieldset className="min-w-0">
        <legend className="text-sm font-semibold text-ink">
          {q.label}
          {q.required && <span className="ml-1 text-danger">*</span>}
        </legend>
        {q.help && <p className="mt-1 font-mono text-[11px] text-faint">{q.help}</p>}
        <div className="mt-3 flex gap-2">
          {steps.map((n) => {
            const active = value === n;
            return (
              <button
                key={n}
                type="button"
                aria-pressed={active}
                onClick={() => onChange(q.id, n)}
                className={cn(
                  "h-11 flex-1 border-2 border-ink font-mono text-sm font-bold transition-all",
                  active
                    ? "bg-accent text-white shadow-[3px_3px_0_0_var(--color-ink)]"
                    : "bg-surface text-muted hover:bg-surface-2"
                )}
              >
                {n}
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  }

  // number | text
  return (
    <div className="min-w-0">
      <Label htmlFor={q.id}>
        {q.label}
        {q.required && <span className="ml-1 text-danger">*</span>}
      </Label>
      <Input
        id={q.id}
        type={q.kind === "number" ? "number" : "text"}
        inputMode={q.kind === "number" ? "numeric" : undefined}
        min={q.min}
        max={q.max}
        className="mt-1.5 font-mono"
        value={typeof value === "number" || typeof value === "string" ? String(value) : ""}
        onChange={(e) => {
          const raw = e.target.value;
          if (q.kind === "number") {
            onChange(q.id, raw === "" ? undefined : Number(raw));
          } else {
            onChange(q.id, raw);
          }
        }}
      />
      {q.help && <p className="mt-1.5 text-xs text-faint">{q.help}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Create QuizSectionView**

Create `src/components/quiz/quiz-section.tsx`:

```tsx
"use client";

import * as React from "react";
import { QuestionField } from "@/components/quiz/question-field";
import { visibleQuestions, type QuizSection } from "@/lib/quiz";
import type { StudentProfile } from "@/lib/store";

interface Props {
  section: QuizSection;
  profile: StudentProfile;
  onChange: (id: string, value: unknown) => void;
  marksheet?: React.ReactNode;
}

export function QuizSectionView({ section, profile, onChange, marksheet }: Props) {
  const questions = visibleQuestions(section, profile);

  return (
    <div className="animate-rise">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{section.title}</h1>
      <p className="mt-2 text-muted">{section.subtitle}</p>

      <div className="mt-8 grid gap-7">
        {questions.map((q) =>
          q.kind === "marksheet" ? (
            <React.Fragment key={q.id}>{marksheet}</React.Fragment>
          ) : (
            <QuestionField key={q.id} question={q} profile={profile} onChange={onChange} />
          )
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck and lint**

```bash
cd /home/themz/aftermediate
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use default
npx tsc --noEmit -p tsconfig.json && ./node_modules/.bin/eslint src/components/quiz/
```

Expected: both exit 0. These are presentational components with no pure logic to unit test; they are exercised in the browser in Task 9.

- [ ] **Step 4: Commit**

```bash
git add src/components/quiz/question-field.tsx src/components/quiz/quiz-section.tsx
git commit -m "feat: add generic quiz question and section renderers"
```

---

### Task 7: Extract the marksheet step

**Files:**
- Create: `src/components/quiz/marksheet-step.tsx`
- Modify: `src/app/onboard/page.tsx:66-100` (the `handleFile` function moves out)

**Interfaces:**
- Produces: `<MarksheetStep onExtract={(patch: { marks: Partial<Marks>; stream?: Stream }) => void} />`

- [ ] **Step 1: Create the component**

Create `src/components/quiz/marksheet-step.tsx`. The OCR call is moved verbatim from today's `onboard/page.tsx` `handleFile`:

```tsx
"use client";

import * as React from "react";
import { Loader2, ScanLine } from "lucide-react";
import type { Marks, Stream } from "@/lib/types";

interface Props {
  onExtract: (patch: { marks: Partial<Marks>; stream?: Stream }) => void;
}

export function MarksheetStep({ onExtract }: Props) {
  const [scanning, setScanning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setError(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "OCR failed");

      const marks: Partial<Marks> = {};
      if (json.matricObtained != null) marks.matricObtained = json.matricObtained;
      if (json.matricTotal != null) marks.matricTotal = json.matricTotal;
      if (json.fscObtained != null) marks.fscObtained = json.fscObtained;
      if (json.fscTotal != null) marks.fscTotal = json.fscTotal;
      if (json.fscPart1Obtained != null) marks.fscPart1Obtained = json.fscPart1Obtained;
      if (json.fscPart1Total != null) marks.fscPart1Total = json.fscPart1Total;

      onExtract({ marks, stream: json.stream ?? undefined });
    } catch {
      setError("Couldn't read that image. Enter your marks by hand below.");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="min-w-0">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed border-line bg-surface p-8 text-center transition-colors hover:border-accent">
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        {scanning ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <span className="text-sm text-muted">Scanning marksheet…</span>
          </>
        ) : (
          <>
            <div className="grid h-14 w-14 place-items-center border-2 border-ink bg-surface-2 text-accent">
              <ScanLine className="h-7 w-7" />
            </div>
            <span className="font-semibold text-ink">Scan your marksheet</span>
            <span className="font-mono text-[11px] text-faint">JPG or PNG — AI reads it</span>
          </>
        )}
      </label>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

```bash
npx tsc --noEmit -p tsconfig.json && ./node_modules/.bin/eslint src/components/quiz/marksheet-step.tsx
```

Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/quiz/marksheet-step.tsx
git commit -m "refactor: extract marksheet OCR step into its own component"
```

---

### Task 8: Rewrite /onboard as an orchestrator

**Files:**
- Modify: `src/app/onboard/page.tsx` (full rewrite — 271 lines become ~110)

**Interfaces:**
- Consumes: `QUIZ_SECTIONS`, `setAnswer`, `isSectionComplete`, `isQuizComplete`, `firstIncompleteSection`, `entryTestTotalFor` (Task 3); `QuizSectionView` (Task 6); `MarksheetStep` (Task 7).

**Note on `quizStep`:** it is kept in the local profile (and therefore localStorage) but is deliberately NOT written to Supabase. Cross-device resume is derived from `firstIncompleteSection`, which is always correct; persisting a step index would add a column and could go stale. Same-browser resume still uses the saved index.

- [ ] **Step 1: Replace the file**

Replace the entire contents of `src/app/onboard/page.tsx`:

```tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { QuizSectionView } from "@/components/quiz/quiz-section";
import { MarksheetStep } from "@/components/quiz/marksheet-step";
import { useStudent } from "@/lib/store";
import {
  QUIZ_SECTIONS,
  entryTestTotalFor,
  firstIncompleteSection,
  isSectionComplete,
  setAnswer,
} from "@/lib/quiz";

export default function OnboardPage() {
  const router = useRouter();
  const { profile, update, hydrated } = useStudent();

  const [step, setStep] = React.useState(0);
  const started = React.useRef(false);

  // Open at the earliest unfinished section; never trust a stale saved index.
  React.useEffect(() => {
    if (!hydrated || started.current) return;
    started.current = true;
    setStep(Math.min(profile.quizStep, firstIncompleteSection(profile)));
  }, [hydrated, profile]);

  const section = QUIZ_SECTIONS[step];
  const total = QUIZ_SECTIONS.length;
  const canAdvance = isSectionComplete(section, profile);
  const isLast = step === total - 1;

  function change(id: string, value: unknown) {
    let next = setAnswer(profile, id, value);
    // Entry-test totals are implied by the test, never asked.
    if (id === "quiz.entryTest") {
      next = setAnswer(next, "marks.entryTestTotal", entryTestTotalFor(value as string));
    }
    update(next);
  }

  function go(to: number) {
    const clamped = Math.max(0, Math.min(total - 1, to));
    setStep(clamped);
    update({ quizStep: clamped });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function finish() {
    update({ quizCompletedAt: new Date().toISOString(), quizStep: total - 1 });
    router.replace("/dashboard");
  }

  if (!hydrated) {
    return (
      <div className="grid-bg grid min-h-screen place-items-center">
        <p className="font-mono text-sm text-faint">loading your answers…</p>
      </div>
    );
  }

  return (
    <div className="grid-bg relative min-h-screen">
      <header className="relative mx-auto flex h-20 max-w-3xl items-center justify-between px-4">
        <Link href="/"><Brand /></Link>
        <span className="font-mono text-xs text-faint">
          step {step + 1} / {total}
        </span>
      </header>

      <main className="relative mx-auto max-w-3xl px-4 pb-24">
        <div className="mb-8 h-1.5 w-full overflow-hidden border-2 border-ink bg-surface-2">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>

        <QuizSectionView
          key={section.id}
          section={section}
          profile={profile}
          onChange={change}
          marksheet={
            <MarksheetStep
              onExtract={({ marks, stream }) => {
                update({
                  marks: { ...profile.marks, ...marks },
                  ...(stream ? { stream } : {}),
                });
              }}
            />
          }
        />

        <div className="mt-10 flex items-center justify-between gap-4">
          <Button variant="ghost" onClick={() => go(step - 1)} disabled={step === 0}>
            <ArrowLeft /> Back
          </Button>

          {isLast ? (
            <Button size="lg" className="gap-2" disabled={!canAdvance} onClick={finish}>
              <Sparkles className="h-4 w-4" /> Build my map <ArrowRight />
            </Button>
          ) : (
            <Button size="lg" disabled={!canAdvance} onClick={() => go(step + 1)}>
              Continue <ArrowRight />
            </Button>
          )}
        </div>

        {!canAdvance && (
          <p className="mt-3 text-right font-mono text-[11px] text-faint">
            answer the starred questions to continue
          </p>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

```bash
cd /home/themz/aftermediate
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use default
npx tsc --noEmit -p tsconfig.json && ./node_modules/.bin/eslint src/app/onboard/page.tsx
```

Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/app/onboard/page.tsx
git commit -m "feat: rebuild /onboard as a seven-section data-driven quiz"
```

---

### Task 9: Make ProfileSync bidirectional and debounced

**Files:**
- Modify: `src/components/profile-sync.tsx` (full rewrite)

**Interfaces:**
- Consumes: `chooseProfile` (Task 5), `hydrate` from the store (Task 2).

- [ ] **Step 1: Replace the file**

Replace the entire contents of `src/components/profile-sync.tsx`:

```tsx
"use client";

import * as React from "react";
import { useAuth } from "@/lib/auth";
import { useStudent, type StudentProfile } from "@/lib/store";
import { chooseProfile } from "@/lib/merge-profile";
import { createClient } from "@/lib/supabase/client";

const LOCAL_STAMP = "aftermediate:profile:updatedAt";

export function ProfileSync() {
  const { user } = useAuth();
  const { profile, hydrate, hydrated } = useStudent();
  const pushed = React.useRef<string | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Hydrate once per user.
  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const supabase = createClient();

    supabase
      .from("profiles")
      .select("name, stream, marks, interests, city, budget, quiz, quiz_completed_at, updated_at")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn("profile load failed", error.message);
          hydrate({});
          return;
        }

        const remote: Partial<StudentProfile> | null = data
          ? {
              name: data.name ?? "",
              stream: data.stream ?? null,
              marks: data.marks ?? undefined,
              interests: data.interests ?? [],
              city: data.city ?? "",
              budget: data.budget ?? "",
              quiz: data.quiz ?? {},
              quizCompletedAt: data.quiz_completed_at ?? null,
            }
          : null;

        const localStamp =
          typeof window !== "undefined" ? window.localStorage.getItem(LOCAL_STAMP) : null;

        const choice = chooseProfile(profile, localStamp, remote, data?.updated_at ?? null);
        hydrate(choice.use === "remote" ? choice.profile : {});
      });

    return () => {
      cancelled = true;
    };
    // Intentionally keyed on the user only — this must run once per sign-in,
    // not on every profile edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 2. Debounced push.
  React.useEffect(() => {
    if (!user || !hydrated) return;

    const payload = JSON.stringify(profile);
    if (pushed.current === payload) return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      pushed.current = payload;
      const now = new Date().toISOString();
      const supabase = createClient();

      supabase
        .from("profiles")
        .upsert({
          id: user.id,
          name: profile.name || user.user_metadata?.full_name || null,
          stream: profile.stream,
          marks: profile.marks,
          interests: profile.interests,
          // quiz is the source of truth; these two columns are a mirror
          // so existing consumers keep working.
          city: profile.quiz.city ?? profile.city ?? null,
          budget:
            profile.quiz.budgetMonthly != null
              ? String(profile.quiz.budgetMonthly)
              : profile.budget || null,
          quiz: profile.quiz,
          quiz_completed_at: profile.quizCompletedAt,
          updated_at: now,
        })
        .then(({ error }) => {
          if (error) console.warn("profile sync failed", error.message);
          else if (typeof window !== "undefined") {
            window.localStorage.setItem(LOCAL_STAMP, now);
          }
        });
    }, 800);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [user, profile, hydrated]);

  return null;
}
```

- [ ] **Step 2: Mount ProfileSync outside the gated group**

`ProfileSync` currently lives in `src/app/(app)/layout.tsx`, but `/onboard` is outside that group and needs sync too. Move it into `src/app/layout.tsx` so it wraps both. Open `src/app/layout.tsx`, import it, and render `<ProfileSync />` inside the provider tree alongside `{children}`. Then remove the `<ProfileSync />` line and its import from `src/app/(app)/layout.tsx`.

- [ ] **Step 3: Typecheck and lint**

```bash
npx tsc --noEmit -p tsconfig.json && ./node_modules/.bin/eslint src/components/profile-sync.tsx src/app/layout.tsx "src/app/(app)/layout.tsx"
```

Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/profile-sync.tsx src/app/layout.tsx "src/app/(app)/layout.tsx"
git commit -m "feat: hydrate profile from supabase and debounce writes"
```

---

### Task 10: Gate the app on quiz completion

**Files:**
- Modify: `src/app/(app)/layout.tsx`

**Interfaces:**
- Consumes: `isQuizComplete` (Task 3), `hydrated` (Task 2).

- [ ] **Step 1: Replace the layout**

Replace the contents of `src/app/(app)/layout.tsx`:

```tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { Chatbot } from "@/components/chatbot";
import { useAuth } from "@/lib/auth";
import { useStudent } from "@/lib/store";
import { isQuizComplete } from "@/lib/quiz";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { profile, hydrated } = useStudent();

  const complete = isQuizComplete(profile);

  React.useEffect(() => {
    if (loading || !hydrated) return;
    if (user && !complete) router.replace("/onboard");
  }, [loading, hydrated, user, complete, router]);

  // Never gate before hydration — a completed user would be bounced
  // into the quiz during the async load.
  if (loading || !hydrated || (user && !complete)) {
    return (
      <div className="grid-bg grid min-h-screen place-items-center">
        <p className="font-mono text-sm text-faint">loading your plan…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <Chatbot />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

```bash
npx tsc --noEmit -p tsconfig.json && ./node_modules/.bin/eslint "src/app/(app)/layout.tsx"
```

Expected: both exit 0.

- [ ] **Step 3: Verify the gate in the browser**

```bash
cd /home/themz/aftermediate
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use default
npm run dev
```

Then, signed in with a fresh account:
1. Visit `http://localhost:3000/dashboard` → must redirect to `/onboard`.
2. Complete all seven sections → must land on `/dashboard` and stay there.
3. Reload `/dashboard` → must NOT bounce back to `/onboard` (proves the hydration guard).
4. Refresh mid-quiz at section 4 → must resume at section 4, not section 1.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/layout.tsx"
git commit -m "feat: require a completed quiz before entering the app"
```

---

### Task 11: Wire the answers into /money, /convince and the schema

**Files:**
- Modify: `src/app/(app)/money/page.tsx:27` (the `useState(0)` initialiser)
- Modify: `src/app/(app)/convince/page.tsx:44-47` (the four `useState` initialisers)
- Modify: `supabase/schema.sql`

- [ ] **Step 1: Seed the money page**

In `src/app/(app)/money/page.tsx`, add the store import at the top of the file:

```tsx
import { useStudent } from "@/lib/store";
```

Then replace the budget state inside `MoneyPage`:

```tsx
  const { profile } = useStudent();
  const [budget, setBudget] = React.useState(profile.quiz.budgetMonthly ?? 0);
```

- [ ] **Step 2: Seed the convince page**

In `src/app/(app)/convince/page.tsx`, replace lines 44–47:

```tsx
  const [certifications, setCertifications] = React.useState(profile.quiz.certifications ?? 0);
  const [projects, setProjects] = React.useState(profile.quiz.projects ?? 0);
  const [english, setEnglish] = React.useState(profile.quiz.english ?? 3);
  const [consistency, setConsistency] = React.useState(profile.quiz.consistency ?? 3);
```

`profile` is already in scope on line 41 (`const { profile } = useStudent();`).

- [ ] **Step 3: Update schema.sql to match the applied migration**

In `supabase/schema.sql`, add two columns to the `create table if not exists public.profiles` block, after `budget text`:

```sql
  quiz jsonb default '{}'::jsonb,
  quiz_completed_at timestamptz,
```

This keeps a fresh setup identical to the live database, where the migration has already been run.

- [ ] **Step 4: Typecheck, lint and test**

```bash
cd /home/themz/aftermediate
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use default
npx tsc --noEmit -p tsconfig.json
./node_modules/.bin/eslint "src/app/(app)/money/page.tsx" "src/app/(app)/convince/page.tsx"
npm test
```

Expected: all three exit 0.

- [ ] **Step 5: Verify /merit is fixed in the browser**

With the dev server running and the quiz completed with a real entry-test score, open `http://localhost:3000/merit`. The NUST aggregate must now reflect the score entered in section 3 — before this work it was computed from zero for every user.

- [ ] **Step 6: Full production build**

```bash
cd /home/themz/aftermediate
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use default
npm run build
```

Expected: exit 0, all routes built.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(app)/money/page.tsx" "src/app/(app)/convince/page.tsx" supabase/schema.sql
git commit -m "feat: seed money and convince pages from saved quiz answers"
```

---

## Self-Review Notes

**Spec coverage.** Every numbered spec section maps to a task: §1 problem → Tasks 4 and 11; §5 migration → Task 11 step 3 (schema file only; the database change is already applied); §6 data model → Task 2, with the `budgetBand` → `budgetMonthly` deviation recorded in Global Constraints; §7 questions-as-data → Task 3, with the resume rule implemented in Task 8; §8 persistence → Tasks 5 and 9; §9 gating → Task 10; §10 consumption → Task 11; §12 testing → Tasks 1, 3, 4, 5.

**Deliberate spec deviations, both recorded above:**
1. `budgetBand` enum → `budgetMonthly` number, because `/money`'s `affordability()` takes a monthly PKR figure.
2. `quizStep` is not persisted to Supabase. Cross-device resume derives from `firstIncompleteSection`, which cannot go stale; same-browser resume still uses the localStorage value. This avoids a third column for a hint value.

**Type consistency.** `StudentProfile` is defined once in Task 2 and imported everywhere. `getAnswer`/`setAnswer`/`visibleQuestions`/`isSectionComplete`/`isQuizComplete`/`firstIncompleteSection`/`entryTestTotalFor` are declared in Task 3 and used with identical names in Tasks 6, 8 and 10. `chooseProfile` is declared in Task 5 and used in Task 9. `QuizSectionView` (not `QuizSection`, which is the type) is the component name in Tasks 6 and 8.

**Known follow-up, out of scope.** `/money` and `/convince` seed from the quiz but do not write edits back to it, so a slider moved on `/convince` is not persisted. The spec lists write-back under §10; implementing it means lifting those pages' local state into the store, which is closer to the rework §3 rules out. Flag to the user after Task 11.
