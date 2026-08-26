# Onboarding Quiz — Design

**Date:** 2026-08-26
**Status:** Awaiting review
**Scope:** Expand `/onboard` into the full post-login journey quiz, persist answers to Supabase, and feed the pages that already expect the data.

---

## 1. Problem

Three pages are already built against profile data that nothing ever collects:

| Page | Reads | Reality today |
|---|---|---|
| `/merit` | `marks.entryTestObtained` / `entryTestTotal` | Never collected. `aggregates.ts` falls back to `?? 0`, so **every entry-test aggregate is computed from a score of zero** — NUST merit is wrong for every user. |
| `/money` | `city`, `budget` | Both exist in `StudentProfile` and in the `profiles` table. Neither is asked anywhere. |
| `/convince` | `certifications`, `projects`, `english`, `consistency` | Held in local `React.useState` (`0, 0, 3, 3`) that **resets on every page load**. Never persisted. |

Separately, persistence is one-way. `useStudent` is localStorage-first and `ProfileSync` only ever *pushes* to Supabase — nothing reads back. A student who logs in on a second device gets an empty profile.

`/onboard` already exists as a 3-step quiz (stream → marksheet OCR → interests) but is unreachable from the login flow: login always pushes to `/dashboard` (`login/page.tsx` lines 97, 107, 121). The `onboarded` flag in `store.tsx:71` is computed and never read.

## 2. Goals

- After login, a student with an incomplete profile lands on the quiz and cannot reach the app until it is done.
- Progress survives closing the tab **and** switching devices.
- The four starved inputs above get real values.
- Adding a question later is a data edit, not JSX surgery.

## 3. Non-goals

- Redesigning `/merit`, `/money`, or `/convince`. This wires data into them; it does not rework them.
- Analytics or reporting over quiz answers.
- Editing answers after completion beyond re-running `/onboard` (the existing "Edit profile →" link on the dashboard already points there).
- Question-level history or versioning.

## 4. Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Quiz vs `/onboard` | **Expand `/onboard` in place** | One flow, one source of truth; avoids asking stream/marks twice; keeps working OCR wiring. |
| Content | Merit + Money & location + Aspirations & pressure + Readiness & skills | Each maps to a page already waiting on the data. |
| Gating | **Required once, resumable** | Guarantees downstream pages have real data instead of zeros. |
| Storage | **Single `quiz jsonb` column** | Smallest migration; new questions need no further migration. |
| Budget | **`budgetMonthly` number, not a band** | `/money`'s `affordability()` already takes a monthly PKR figure with thresholds at 20k/60k/150k; an enum would need an invented lossy conversion. Revised during planning. |
| Testing | **Add vitest, TDD the pure logic** | Completeness rules gate site access — a wrong rule locks users out or lets them through with zeros. |

## 5. Migration — ALREADY APPLIED

Run by the user on 2026-08-26 and verified present via the REST API
(`select=quiz` and `select=quiz_completed_at` both return `200`, versus `400 42703` for a non-existent column):

```sql
alter table public.profiles
  add column if not exists quiz jsonb default '{}'::jsonb,
  add column if not exists quiz_completed_at timestamptz;
```

Existing RLS policies on `profiles` already cover these columns; no policy changes needed.
`supabase/schema.sql` must be updated to match, so a fresh setup produces the same shape.

## 6. Data model

Entry-test marks go into the **existing** `Marks` fields, not a duplicate — `aggregates.ts` already reads them.

```ts
// src/lib/types.ts
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
  english?: number;      // 1-5
  consistency?: number;  // 1-5
}
```

`StudentProfile` gains:

```ts
quiz: QuizAnswers;
quizStep: number;               // resume point; localStorage only, NOT synced to Supabase
quizCompletedAt: string | null; // ISO; null = incomplete
```

`city` and `budget` already exist as top-level `StudentProfile` fields and as `profiles` columns.
To avoid two homes for one value, **`city` and `budgetMonthly` are written to `quiz` AND mirrored to the
existing top-level `city` / `budget` columns** by `ProfileSync`, so existing consumers keep working.
`quiz` is the source of truth; the columns are a denormalised mirror.

## 7. Questions as data

`src/lib/quiz.ts` declares the quiz; components render it. `/onboard` is already 271 lines with three
hardcoded steps — adding four more that way is unmaintainable.

```ts
export type QuestionKind = "single" | "multi" | "number" | "text" | "scale" | "stream" | "marksheet";

export interface Question {
  id: string;                                  // dotted path: "quiz.board", "marks.entryTestObtained"
  kind: QuestionKind;
  label: string;
  help?: string;
  options?: { value: string; label: string; sub?: string }[];
  min?: number; max?: number;
  required?: boolean;
  showIf?: (p: StudentProfile) => boolean;
}

export interface QuizSection { id: string; title: string; subtitle: string; questions: Question[]; }
export const QUIZ_SECTIONS: QuizSection[];

export function visibleQuestions(s: QuizSection, p: StudentProfile): Question[];
export function isSectionComplete(s: QuizSection, p: StudentProfile): boolean;
export function isQuizComplete(p: StudentProfile): boolean;
export function firstIncompleteSection(p: StudentProfile): number;
```

`id` is a dotted path so one setter can write to either `marks.*` or `quiz.*` without special-casing.

**Resume point.** `quizStep` is the *saved* position, written on each section advance. `firstIncompleteSection` is the *computed* fallback, used when `quizStep` is absent (a user who has never started) or stale (it points past a section that is no longer complete, e.g. after a stream change hides answers). On mount the quiz opens at `min(quizStep, firstIncompleteSection)` so a user can never skip past an unfinished section by way of a stale saved index.

### Sections

| # | id | Title | Questions | Required |
|---|---|---|---|---|
| 0 | `stream` | What did you do in FSc? | stream | yes |
| 1 | `marks` | Your marksheet | OCR upload, matric obtained/total, FSc obtained/total, FSc Part-1 obtained/total | matric + FSc totals |
| 2 | `merit` | Your entry test | board, examYear, entryTest, entryTestObtained/Total | entryTest |
| 3 | `money` | What can you afford? | city, province, budgetMonthly, canRelocate, needsScholarship | city, budgetMonthly |
| 4 | `pressure` | Who's deciding? | dreamField, parentsExpect, decisionMaker, parentsFirmness | parentsExpect, decisionMaker |
| 5 | `readiness` | Where are you now? | certifications, projects, english, consistency | english, consistency |
| 6 | `interests` | What pulls you? | interests (multi) | at least 1 |

### Conditional rules

- `entryTestObtained` / `entryTestTotal` — hidden unless `quiz.entryTest !== "none"`.
- `entryTest` options are stream-filtered: `mdcat` only for `pre-medical`; `ecat` only for `pre-engineering`; `net` always; `none` always.
- `fscPart1Obtained` / `Total` — shown only when `entryTest === "net"` (NUST is the only formula that uses Part-1).

`entryTestTotal` defaults per test (NET 200, MDCAT 200, ECAT 400) rather than being asked.

## 8. Persistence

`ProfileSync` becomes bidirectional and is renamed conceptually to a sync controller:

1. **Hydrate.** When `user.id` changes, fetch the `profiles` row. If it exists and its `updated_at` is
   newer than the local cache's, replace the store from remote. Otherwise push local up. Set `hydrated = true`.
2. **Push.** Debounce upserts by ~800ms. Today it fires on *every keystroke* (a `JSON.stringify` diff with
   no debounce); across a 7-section quiz that is a write storm.
3. **Checkpoint.** Force a flush on section advance so `quizStep` is durable.

The store exposes `hydrated: boolean`. Nothing may gate on `quizCompletedAt` before `hydrated` is true —
otherwise a completed user is bounced into the quiz during the async load.

**`quizStep` is not synced.** Cross-device resume derives from `firstIncompleteSection`, which cannot go
stale; same-browser resume uses the localStorage value. This avoids a third column for a hint value.

Conflict rule is last-write-wins on `updated_at`. Acceptable: a single student on their own devices.

## 9. Gating

Single enforcement point in `src/app/(app)/layout.tsx`:

```
if (!hydrated)                          -> render loader
if (user && !isQuizComplete(profile))   -> router.replace("/onboard")
```

This covers direct URL navigation, not just the login path. Login keeps pushing to `/dashboard`; the
layout gate does the bouncing. `/onboard` itself is outside the `(app)` group, so it is not self-gated.

On finish: set `quizCompletedAt`, flush, then `router.replace("/dashboard")`.

The dead `onboarded` flag in `store.tsx:71` is replaced by `isQuizComplete`.

## 10. Consumption wiring

Minimal seeding only.

- **`/merit`** — no code change needed; it already reads `marks.entryTestObtained/Total`. It starts
  producing correct numbers once the quiz supplies them. This is the headline bug fix.
- **`/money`** — read `profile.quiz.city` and `profile.quiz.budgetMonthly`.
- **`/convince`** — seed the four `useState` initialisers from `profile.quiz` instead of `0,0,3,3`.
  Sliders stay adjustable; changes write back to `quiz` so they persist.
- **`/dashboard`** — unchanged.

## 11. Files

**New**
- `src/lib/quiz.ts` — question definitions + completeness logic
- `src/lib/quiz.test.ts` — vitest
- `src/components/quiz/question-field.tsx` — renders one `Question` by `kind`
- `src/components/quiz/quiz-section.tsx` — renders a section
- `src/components/quiz/marksheet-step.tsx` — OCR upload + manual marks, extracted from `onboard/page.tsx`
- `vitest.config.ts`

**Modified**
- `src/app/onboard/page.tsx` — becomes a thin orchestrator (section index, next/back, finish)
- `src/lib/types.ts` — `QuizAnswers`
- `src/lib/store.tsx` — `quiz`, `quizStep`, `quizCompletedAt`, `hydrated`; drop `onboarded`
- `src/components/profile-sync.tsx` — bidirectional + debounced
- `src/app/(app)/layout.tsx` — the gate
- `src/app/(app)/money/page.tsx`, `src/app/(app)/convince/page.tsx` — seeding
- `supabase/schema.sql` — match the applied migration
- `package.json` — vitest + `test` script

## 12. Testing

vitest, pure logic only (no jsdom needed):

- `isQuizComplete` — false when any required answer is missing, per section; true when all present.
- `visibleQuestions` — entry-test score hidden when `entryTest === "none"`; MDCAT absent for
  `pre-engineering`; ECAT absent for `pre-medical`; Part-1 shown only for `net`.
- `firstIncompleteSection` — returns the right resume index, including when an early section is
  incomplete but a later one is filled.
- `nustAggregate` / `mdcatAggregate` with real entry-test values — locks in the zero-score bug fix.

UI verified in the browser as with the layout work: walk the full flow, confirm resume after reload,
confirm the gate redirects and then releases.

## 13. Risks

- **Drop-off.** Seven sections is long. Mitigated by resumability and a visible progress bar; if it
  proves too long, sections 3–5 are the ones to make optional later.
- **Lockout.** A bug in `isQuizComplete` traps users in the quiz. This is why it is test-driven.
- **Hydration flash.** Gating before `hydrated` bounces completed users. Explicitly guarded.
- **Existing users.** Anyone who signed up before this ships has `quiz_completed_at = null` and will be
  sent through the quiz once. Acceptable — their existing stream/marks/interests prefill sections 0, 1 and 6.

## 14. Not committed to git

This repo is not a git repository (`git init` has not been run), so this spec is written to disk but not
committed. Worth initialising before implementation lands, so the change is reviewable.
