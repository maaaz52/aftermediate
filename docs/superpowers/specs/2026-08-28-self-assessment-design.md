# Self-Assessment Mock Test Platform — Design Spec

Date: 2026-08-28
Status: Approved by user (design presented in session; profile-storage addition approved)
Reference product: ieltsonlinetests.com (adapted for Pakistani entry tests)

## 1. Summary

A timed, exam-hall-faithful mock test platform at `/pakistan/self-assessment`. A generic
test engine renders any test from a static JSON question bank — exact official section
counts, official duration, official marking rules, question palette navigation, auto-submit
on timer expiry, and a full review screen with explanations. Attempts are stored on the
student profile (`profile.practice`) — persisted in localStorage for guests and synced to
Supabase for signed-in students via the existing `ProfileSync` — and surface on the
dashboard.

**Proof of concept scope (this spec):** NET + MDCAT banks, the engine, catalog, results,
profile storage, dashboard card. The catalog lists **all 12** tests from `entry-tests.json`;
tests without a bank yet show a "question bank in preparation" state (no dead buttons).
Expansion (ECAT + NTS NAT next) is a pure content task: new JSON + new test file, zero
engine changes.

## 2. Confirmed decisions

| Decision | Outcome |
| --- | --- |
| Question sourcing | Mix: official sample/model papers where the conducting body publishes them, bank-sourced past-paper questions with the hosting platform cited, and original questions against the official syllabus. Every question carries a provenance tag. |
| Mock length | One full-length paper per test **plus** a quick mode that stride-samples ~half preserving section ratios, at half the duration. |
| Explanations | Every question has an explanation. Bank-sourced questions without one get a practice-authored explanation (provenance of the explanation = the question's provenance tag; we never claim an explanation is "official" unless the source paper includes it — we simply label the tag). |
| Rollout | POC now (NET + MDCAT); catalog shows all 12 with honest states. |
| Exam UI | Classic CBT layout (approved visually): sticky top bar (test name, timer, Submit), question panel left, always-visible question palette right. |
| Attempts storage | `profile.practice` on `StudentProfile` (localStorage + Supabase sync). Compact records only. |
| Auth | No new gating — behaves like every other `(app)` page: open to guests and signed-in users. |

## 3. Architecture

```
src/data/practice-mdcat.json      bank: exam spec + 180 questions   (+ .test.ts)
src/data/practice-net.json        bank: exam spec + 200 questions   (+ .test.ts)
src/lib/practice.ts               types, catalog merge, grading, sampling, storage helpers (+ .test.ts)
src/components/practice/practice-catalog.tsx    catalog grid + stream filter
src/components/practice/exam-runner.tsx         intro → running → handoff (the engine)
src/components/practice/exam-results.tsx        score hero, section table, review, history
src/components/dashboard/practice-summary.tsx   dashboard card
src/app/(app)/pakistan/self-assessment/page.tsx             client wrapper (catalog)
src/app/(app)/pakistan/self-assessment/[testId]/page.tsx    wrapper; generateStaticParams for all 12 ids
src/lib/store.tsx                   + practice: PracticeAttempt[] (default [])
src/components/profile-sync.tsx     + practice column in select/upsert
supabase/schema.sql                 + practice jsonb column (+ ALTER for live DBs)
src/components/sidebar.tsx          + "Self Assessment" link after "Entry Tests"
```

No API routes, no database reads for content — static JSON imports cast
`json as unknown as {...}` per repo convention.

## 4. Question bank schema (`practice-<testId>.json`)

```jsonc
{
  "testId": "mdcat",                     // must exist in entry-tests.json
  "schemaVersion": 1,
  "provenance": {
    "note": "One-paragraph honest description of how this bank was assembled.",
    "sources": ["https://pmdc.pk/Publication/Syllabus", "..."]
  },
  "durationMinutes": 180,
  "marking": {
    "perQuestionMarks": 1,               // ECAT will use 4
    "correctMarks": 1,                   // awarded per correct answer
    "negativeMarks": 0,                  // deducted per wrong answer (FUNGAT: 0.25)
    "totalMarks": 180,
    "note": "No negative marking per PM&DC MDCAT instructions."
  },
  "benchmarks": [                        // optional, real pass marks with year hedge
    { "label": "MBBS (2025 cycle)", "percent": 55 },
    { "label": "BDS (2025 cycle)", "percent": 50 }
  ],
  "sections": [
    { "id": "biology", "name": "Biology", "questionCount": 81 },
    { "id": "chemistry", "name": "Chemistry", "questionCount": 45 },
    { "id": "physics", "name": "Physics", "questionCount": 36 },
    { "id": "english", "name": "English", "questionCount": 9 },
    { "id": "logic", "name": "Logical Reasoning", "questionCount": 9 }
  ],
  "questions": [
    {
      "id": "bio-001",                   // unique within the bank
      "section": "biology",              // must match a sections[].id
      "topic": "Human physiology",       // from the official syllabus topic list
      "difficulty": "medium",            // "easy" | "medium" | "hard"
      "stem": "Which organelle is the primary site of ATP synthesis in eukaryotic cells?",
      "options": ["Ribosome", "Mitochondrion", "Golgi apparatus", "Lysosome"],
      "correct": 1,                      // index into options
      "explanation": "Mitochondria produce ATP via oxidative phosphorylation…",
      "provenance": "practice",          // "official-sample" | "past-paper" | "practice"
      "sourceUrls": ["https://pmdc.pk/Publication/Syllabus"]
    }
  ]
}
```

**Hard rules (test-enforced):**

- Section counts sum to `entry-tests.json` totals (MDCAT 180, NET 200) — the test file
  imports both JSONs and asserts per-section counts against the official `pattern`.
- Every question: 4 options, `correct` in 0–3, non-empty stem/explanation,
  valid `provenance` enum, ≥1 `https://` sourceUrl, unique id, valid section ref.
- `provenance: "official-sample"` only when the question is from a sample/model paper
  published by the conducting body itself (sourceUrl on their domain).
- `provenance: "past-paper"` only when reproduced from a named public collection
  (sourceUrl = the hosting platform's page).
- Everything else is `"practice"` (sourceUrl = official syllabus page; difficulty and
  content built to the syllabus topic list).
- NET distribution: Mathematics 80, Physics 60, Chemistry 30, English 20, Intelligence 10.
  MDCAT distribution per schema above. `topic` values must come from the syllabus entries
  already in `entry-tests.json`.

**MDCAT note:** PM&DC has not published complete reusable past papers for recent cycles;
the MDCAT bank will be predominantly `practice`-tagged questions written strictly to the
final PM&DC curriculum (May 2025) topic lists, with any verifiable official samples or
documented past-paper questions mixed in per the tagging rules. NET has official NUST
sample papers, so `official-sample` coverage there is expected to be higher.

## 5. Profile storage & sync

`StudentProfile` gains:

```ts
export interface PracticeAttempt {
  id: string;                 // crypto.randomUUID()
  testId: string;
  mode: "full" | "quick";
  submittedAt: string;        // ISO
  autoSubmitted: boolean;
  timeUsedSeconds: number;
  score: number;              // correctCount*correctMarks − wrongCount*negativeMarks, floor 0
  maxScore: number;           // perQuestionMarks × administered question count
                              // (full: 180/200; quick: e.g. 92/100) so percent is
                              // comparable across modes
  percent: number;            // 1 decimal
  sections: { id: string; name: string; correct: number; wrong: number; skipped: number }[];
}
// StudentProfile: practice: PracticeAttempt[]   (default [], newest first, cap 50)
```

- Written through the store's `update()` — localStorage persistence comes free;
  `ProfileSync` carries it to Supabase once `practice` is added to its select list and
  upsert payload.
- `supabase/schema.sql`: add `practice jsonb NOT NULL DEFAULT '[]'::jsonb` to `profiles`,
  plus `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS practice jsonb NOT NULL DEFAULT '[]'::jsonb;`
  for existing databases (documented at the top of the migration section of the file).
- Cap logic lives in a pure helper `pushAttempt(list, attempt): PracticeAttempt[]`
  (prepend, slice to 50) — unit-tested, used by the results flow.
- **Not stored on the profile:** per-question answers (sync payload stays small).

Transient localStorage keys (never synced):

- `aftermediate:exam:active:v1` — in-progress attempt: `{ testId, mode, startedAt,
  questionIds (ordered), answers: Record<questionId, number> }`. Written on every answer
  and on start; deleted on submit. This is what makes refresh-resume honest.
- `aftermediate:exam:lastResult:v1` — full graded result for the review screen:
  `{ testId, mode, startedAt, submittedAt, answers, attempt }`. Overwritten each submit;
  the results page renders from it and links "back to catalog" cleanly even after refresh.

## 6. `src/lib/practice.ts` API

```ts
// Types
PracticeQuestion, PracticeSection, PracticeMarking, PracticeBenchmark, PracticeBank
PracticeAttempt, CatalogItem

// Data access
banks: Record<string, PracticeBank>            // from the 2 JSON imports
getBank(testId): PracticeBank | null
buildCatalog(entryTests: EntryTest[], banks): CatalogItem[]
  // CatalogItem = { test: EntryTest; bank: PracticeBank | null; status: "ready" | "preparation" }

// Exam construction
fullOrder(bank): string[]                      // question ids grouped by section, data order
quickOrder(bank): string[]                     // stride-2 within each section (deterministic,
                                               // preserves section ratios; MDCAT → 92 Qs)
quickMinutes(bank): number                     // round(durationMinutes / 2) = 90

// Grading (pure)
grade(bank, questionIds, answers, elapsedSeconds, autoSubmitted): {
  attempt: PracticeAttempt; perQuestion: { id, correct, chosen }[]
}
  // score = correctCount*correctMarks − wrongCount*negativeMarks, floor 0

// Profile helpers (pure)
pushAttempt(list, attempt)                     // prepend + cap 50
bestPercent(list, testId): number | null
latestAttempt(list, testId): PracticeAttempt | null

// Transient storage (guarded try/catch, SSR-safe)
loadActive()/saveActive(s)/clearActive()
loadLastResult()/saveLastResult(r)
```

## 7. UI & flow

### 7.1 Catalog (`/pakistan/self-assessment`)

Page header follows the entry-tests page pattern exactly (Badge "Pakistan", h1, sub).
Content: stat line (tests ready · total questions sourced), stream filter chips reusing
`STREAM_LABEL` + `profile.stream` auto-selection (same pattern as
`entry-tests-explorer.tsx`), then a responsive grid of 12 cards:

- Ready cards: test short name, conducting body, sections count, total Qs, duration,
  marking note (negative marking called out), best % + attempts count from
  `profile.practice`, "Start test →" `Link` button.
- Preparation cards: muted state, "Question bank in preparation" badge, no link-styled
  button (a disabled-style chip). Honest, not clickable-through.

### 7.2 Test page (`/pakistan/self-assessment/[testId]`) — `exam-runner.tsx`

Phase `intro` (default): what-this-is card (official pattern table pulled from
`entry-tests.json`, marking rules, benchmark chips, provenance note + source links) and
mode choice — two selectable cards: **Full mock** (180/200 Qs · 3:00:00) and **Quick**
(92/100 Qs · 1:30:00, "half paper, same section ratios"). Begin button. If an active
attempt exists for this test → banner "Resume in-progress attempt — the clock never
stopped" with Resume / Discard.

Phase `running` (the approved Option A layout):

- Sticky top bar: test short name + mode chip, countdown `HH:MM:SS` (mono; danger color
  under 5 min), Submit button.
- Main panel: section name + "Question n of N", question stem, 4 option rows (radio
  semantics via `type="button"` + `aria-pressed`), Clear button, Prev/Next.
- Right palette (sticky, hidden below `lg` where it becomes a collapsible section under
  the question): numbered grid `grid-cols-8`, emerald = answered, ring = current, plain =
  unanswered; counts row (answered / unanswered); section jump buttons scroll the palette
  groups. Clicking a number jumps directly.
- Timer: computed as `duration − (now − startedAt)`, ticking each second off
  `Date.now()` — refresh-proof. On expiry: auto-grade → phase `done` with
  `autoSubmitted: true`.
- Submit: confirm dialog (custom, `role="dialog" aria-modal`) showing answered/
  unanswered counts; confirm → grade → save `lastResult`, `clearActive()`,
  `update({ practice: pushAttempt(profile.practice, attempt) })` → phase `done`.
- Leave guard: none beyond the timestamp honesty (page navigation discards nothing —
  the active record persists, clock keeps running; that's the anti-cheat stance: honest
  by design, no detection).

Phase `done`: renders `exam-results.tsx` from `lastResult`.

### 7.3 Results (`exam-results.tsx`)

- Score hero: `score / maxScore` (animated count-up), percent, band chip vs benchmarks
  (at/above pass benchmark → emerald; within 10 points below it → amber; further below
  → danger; no benchmarks → neutral band, no verdict implied). "Time expired" banner if
  auto-submitted.
- Section table: name, correct/wrong/skipped, section %.
- Review list with filter chips (`aria-pressed`): All / Incorrect / Skipped / Correct.
  Each item: stem, all options with chosen/correct marks (danger/emerald), explanation
  block, provenance tag badge ("practice" / "past-paper" / "official-sample") + source
  links, topic + difficulty meta.
- History: this test's attempts from `profile.practice` (date, mode, %), newest 10.
- Actions: "Retake" (returns to intro), "Back to catalog".
- Sync note: signed-in → "Saved to your profile"; guest → "Saved on this device —
  sign in to keep your results".

### 7.4 Dashboard card (`practice-summary.tsx`)

Insert after `ProfileSummary` block, same reveal/animation conventions. Shows: total
attempts, tests taken count, best % per taken test (small rows), sparkline bars of last
5 attempts (pure divs, no recharts), CTA → catalog. Empty state: single motivational
line + "Take your first mock" button. Component reads only `profile.practice`.

### 7.5 Sidebar

Education in Pakistan group, after Entry Tests:
`{ href: "/pakistan/self-assessment", label: "Self Assessment", icon: PenLine }`.

## 8. Conventions & quality bar

- Repo conventions apply verbatim: `card-glass`, design tokens, `animate-reveal`
  60/120/180ms, canonical ARIA patterns, `type="button"` everywhere, no setState-in-
  effect (render-time adjustment only), no nested component definitions, JSON casts.
- Exam screen is chrome-free inside `main` — no prose walls; every surface is
  interaction or data.
- Footer disclaimer on catalog + intro: "Practice platform — not affiliated with PM&DC,
  NUST, or any conducting body. Patterns change per cycle; confirm on official sources."
- Data honesty: section counts/durations/marking rules are cited from
  `entry-tests.json` (already sourced); no invented statistics; benchmarks year-hedged.

## 9. Error handling & edge cases

- Corrupt/oversized transient JSON → `try/catch` → clear key, fresh start.
- Active attempt found for a *different* testId than the route → offer discard.
- Resume where remaining time ≤ 0 → auto-grade immediately on mount (banner explains).
- `quickOrder` on odd section counts → `Math.ceil` stride sampling; total may exceed
  exactly-half (documented: MDCAT quick = 92 Qs).
- Last result missing/corrupt on results route → redirect to intro phase.
- Unknown testId (not in entry-tests.json) → `notFound()`. Known test without bank →
  intro page replaced by "in preparation" panel (route still exists, honest state,
  because catalog cards may be deep-linked/shared).
- SSR: all localStorage access behind mount guard; `generateStaticParams` emits all 12
  ids so every variant is static.
- Timer accuracy: `setInterval` 1s re-render is acceptable at this scale (single
  countdown string); no worker needed.

## 10. Testing

Bank tests (`practice-mdcat.test.ts`, `practice-net.test.ts`):
- import `entry-tests.json`; assert bank sections match official pattern counts exactly
  (MDCAT: 81/45/36/9/9=180; NET: 80/60/30/20/10=200), duration 180.
- per-question: unique ids, 4 options, valid correct index, non-empty stem + explanation,
  provenance enum, https sourceUrls, valid section reference, topic non-empty.
- `provenance: "official-sample"` requires a sourceUrl whose host matches the conducting
  body's domain family (pmdc.pk / nust.edu.pk).

Lib tests (`practice.test.ts`):
- grade(): all-correct → max; negative marking math (0.25 deduction, floor at 0);
  skipped counts.
- quickOrder(): deterministic, ratio-preserving per section, ≤ 1 difference from half.
- pushAttempt(): cap 50, newest-first. bestPercent()/latestAttempt(): per-test filtering.
- buildCatalog(): ready vs preparation statuses for all 12 entry-test ids.

UI: no component-test infra exists in the repo (vitest covers data/lib only) — UI
verified via tsc, eslint, production build (both routes static), and manual preview.

## 11. Expansion path (post-POC, separate batches)

- Batch 2: ECAT (100 Qs, 4 marks each = 400 total, 100 min — engine supports
  `perQuestionMarks: 4` with no changes) + NTS NAT (90 Qs, 120 min, official NTS model
  papers are published → real `official-sample` coverage).
- Batch 3: GIKI, PIEAS, FUNGAT (negative marking!), COMSATS, IBA, LCAT, AKU — no
  published question counts, so each ships as a representative "practice pattern" paper
  with the assumption stated in `provenance.note` and on the intro card.
- LAT: MCQ sections only (75 Qs); essay/personal statement listed as not auto-gradable.
- Registration per test = JSON file + import in `banks` map + its `.test.ts`.

## 12. Out of scope

Adaptive difficulty, per-question analytics over time, leaderboards, PDF export,
cross-device resume of *in-progress* exams, proctoring/tab-blur detection, paid plans,
API routes, any database reads for content.
