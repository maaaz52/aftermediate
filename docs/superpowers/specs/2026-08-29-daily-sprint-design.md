# Daily 5-Question Sprint (Duolingo Effect) — Design Spec

**Date:** 2026-08-29
**Status:** Approved

## Goal

Give students prepping for NUST NET, ECAT, MDCAT, or FAST entry tests a recurring daily reason to open the dashboard: a **2-minute, 5-question MCQ sprint** tailored to their FSc stream, with a **daily streak counter** (🔥) that builds a habit loop right up until entry test week.

## User Decisions (confirmed)

1. **Widget placement:** Option B — directly below the existing **Practice & Mocks** card on the dashboard.
2. **Question source:** Stream-based, driven by `profile.stream` from the onboard picker.
   - `pre-medical` students see medical questions (Biology/Chemistry).
   - `pre-engineering` / `ics` students see respective questions (Physics/Mathematics).
3. **Future-proofing:** The owner will upload more MCQ banks soon; new banks must be picked up by the sprint **automatically**, with no code changes.
4. **Streak rule:** Submitting all 5 questions counts as completing the day, **any score**. Missing a full day resets the streak. A second sprint on the same day scores but does not double the streak.
5. **Flow:** Inline on the dashboard — the card expands in place; no page navigation.
6. **Streak design:** 🔥 flame + number + status pill ("Not done yet" amber / "Done today ✓" green).

## Context (existing infrastructure)

- `src/lib/practice.ts` — 21 registered `PracticeBank`s (net, mdcat, ecat, fungat, lcat, iba, giki, comsats, nts-nat, pieas, aku, lat + abroad). Each bank has `sections: { id, name, questionCount }[]` and `questions: PracticeQuestion[]` with `section`, `topic`, `difficulty`, `options`, `correct`, `explanation`.
- `src/lib/types.ts` — `PracticeMode = "full" | "quick"`, `PracticeAttempt` (id, testId, mode, submittedAt, autoSubmitted, timeUsedSeconds, score, maxScore, percent, sections).
- `src/lib/store.tsx` — `StudentProfile.practice: PracticeAttempt[]`, `profile.stream: Stream | null`, localStorage-first with `update()`.
- `src/components/profile-sync.tsx` — debounced push of `practice` (and other fields) to Supabase `profiles` table. **No new columns or API routes needed.**
- `src/lib/practice.ts` — `grade()` pure function handles any bank/mode/question-set; `pushAttempt()` caps at 50.
- `src/data/entry-tests.json` — `EntryTest.streams` maps each test to streams.
- Dashboard pattern: `card-glass rounded-2xl p-5`, `animate-reveal` with staggered `animationDelay`, violet `--color-violet: #7a5bd4` accent, ink/surface/line tokens, `.pixel-shadow`.

## Architecture

```
profile.stream ──► sprint.ts (pure lib) ──► SprintQuestion set (5)
                        │
                        ├── recipeFor(stream)        → section recipe (e.g. physics×2, math×2, intelligence×1)
                        ├── buildPool(banks, recipe) → questions across all stream-matched banks
                        └── dailyPick(pool, date)    → deterministic 5-question selection
                              │
                              ▼
              Inline widget (client component) — immediate feedback per question
                              │
                              ▼
              grade() with mode "sprint" → PracticeAttempt pushed to profile.practice
                              │
                              ▼
              streak computed: consecutive days (PKT) with a sprint attempt
                              │
                              ▼
              ProfileSync debounced push → Supabase (already exists)
```

### Design principles

- **Pure, testable core:** All selection/streak logic lives in `src/lib/sprint.ts` as pure functions — no React, no storage access, no date-of-today captured at module scope.
- **Zero new storage:** Sprints reuse `PracticeAttempt` with a new `mode: "sprint"`. The streak is **derived** from attempt dates, never stored — no drift, no migration, no new sync code.
- **Future-proof pool:** The pool is built dynamically from every registered bank whose test lists the student's stream (via `entry-tests.json` streams). New banks uploaded later join the pool automatically.
- **Deterministic daily rotation:** The same 5 questions are served all day for a given stream (date-seeded), so the set is stable, testable, and shared across users of the same stream.

## Component Design

### New files

| File | Responsibility |
|------|----------------|
| `src/lib/sprint.ts` | Pure functions: `SPRINT_SIZE`, `sprintRecipes`, `recipeFor(stream)`, `streamTests(stream)`, `buildPool(banks, tests, recipe)`, `dailyPick(pool, dateKey)`, `dayKey(date, tz)`, `isSprintDoneToday(attempts, now)`, `computeStreak(attempts, now)`, `gradeSprint(questions, answers, timeUsedSeconds)` |
| `src/lib/sprint.test.ts` | Vitest coverage of the above |
| `src/components/dashboard/daily-sprint.tsx` | Client widget: idle card + inline question flow + summary (no component tests in MVP — the pure lib carries the logic) |

### Modified files

| File | Change |
|------|--------|
| `src/lib/types.ts` | `PracticeMode = "full" \| "quick" \| "sprint"` |
| `src/lib/practice.ts` | `grade()` unchanged (already mode-agnostic); add helper `sprintAttempts(list)` filter; ensure `modeLabel`-style consumers don't mislabel sprint (see note below) |
| `src/components/practice/exam-results.tsx` | `attempt.mode === "full" ? "Full" : "Quick"` labels — add sprint branch (only reachable if a sprint attempt is ever rendered there; keep the ternary safe) |
| `src/components/practice/practice-catalog.tsx` / `practice-summary.tsx` | Filter out `mode === "sprint"` from "best % per test" and mock stats so 5-question sprints don't pollute readiness scores |
| `src/app/(app)/dashboard/page.tsx` | Render `<DailySprint />` immediately after `<PracticeSummary />` with staggered `animationDelay` |

### Widget states

1. **Idle (most days):**
   - Header: ⚡ Daily Sprint · "5 questions · 2 minutes"
   - Streak cluster: 🔥 + number + status pill (amber "Not done yet" / green "Done today ✓")
   - Composition line: "Today: 2 Physics · 2 Mathematics · 1 Intelligence"
   - Violet full-width button: "Start today's sprint →"

2. **In-progress (expanded in place):**
   - Section label + question counter (e.g., "Physics — 2 / 5") + violet progress bar
   - Stem + 4 options as bordered tap targets
   - Tap → instant feedback: chosen option turns green (correct) or red (wrong, correct one highlighted green); short explanation strip appears
   - "Next →" button advances; "✕" collapses and discards (or keeps via ActiveExam-style persistence — see Edge cases)

3. **Summary (after Q5):**
   - Score "X / 5" with color-coded verdict (5 = emerald "Perfect!", 3–4 = saffron "Solid", ≤2 = danger "Keep at it")
   - Per-section accuracy chips (e.g., "Physics 2/2 ✓")
   - Streak result line: "🔥 Streak: 3 → 4!" with flame animation; if already done today: "Streak stays at 3 (already done today)"
   - "Done — back to dashboard" button collapses the card (explanations were already shown inline per question; no separate review screen in MVP)

### Sprint recipe (per stream)

| Stream | Recipe |
|--------|--------|
| `pre-engineering`, `ics` | 2 × `physics`, 2 × `mathematics` (or `math`), 1 × `intelligence` |
| `pre-medical` | 2 × `biology`, 2 × `chemistry`, 1 × `intelligence` |
| `icom` | 2 × `mathematics`, 2 × `english`, 1 × `intelligence` (fallback mix) |
| `alevel` | 2 × `mathematics`, 2 × `physics`, 1 × `intelligence` (fallback mix) |
| `null` (no stream) | 2 × `mathematics`, 2 × `english`, 1 × `intelligence`; widget shows a "pick your stream" nudge linking to onboard |

**Section id aliases:** banks use different section ids (`math` vs `mathematics`). `recipeFor` must resolve via a canonical alias map — a section matches if its id or name normalized matches the recipe slot.

**Pool construction:**
- `streamTests(stream)` → test ids from `entry-tests.json` where `streams.includes(stream)`.
- `buildPool(banks, testIds, recipe)` → for each recipe slot, collect questions from each stream test's bank where `q.section` matches the slot. All difficulties included (daily rotation varies naturally). If a slot has zero candidates in every bank (e.g., no bank has `intelligence`), redistribute the slot to the slot with the most candidates.

**Deterministic daily pick:**
- Seed = integer day number (e.g., days since epoch in PKT).
- For each slot, pick candidates in a rotation: `candidates[(seed + slotIndex) % candidates.length]` — then advance through the list day over day. Ensure no duplicate question ids across the 5 (if a bank repeats ids, dedupe at pool build).

### Streak rules (derived, PKT)

- `dayKey(date)` — local date string in Asia/Karachi (Intl API with `timeZone: "Asia/Karachi"`).
- `isSprintDoneToday(attempts, now)` — any attempt with `mode === "sprint"` whose `submittedAt` falls on `dayKey(now)`.
- `computeStreak(attempts, now)`:
  - Collect distinct sprint-attempt day keys, sorted desc.
  - Start from today's key (if done today) or yesterday's key (today pending → streak preserved until the day ends). Walk backwards while keys are consecutive. Count.
  - A gap of ≥1 full day missed resets to 0 (or 1 if done today).

## Data Flow

1. Dashboard renders `<DailySprint />` → reads `profile.stream` and `profile.practice`.
2. Idle state computes: today's composition line (from `recipeFor`), streak (from `computeStreak`), done-today (from `isSprintDoneToday`).
3. "Start sprint" → `dailyPick(buildPool(...), today)` → 5 questions rendered inline.
4. Each answer graded instantly against `q.correct`; explanation shown.
5. Q5 → `gradeSprint(questions, answers, elapsedSeconds)` (pure, in sprint.ts) produces a `PracticeAttempt` (mode `"sprint"`, `maxScore` = 5, percent = X/5, sections = recipe slots with correct/wrong/skipped). Scoring: **1 mark per correct answer, no negative marking** — a single consistent rule for sprints regardless of which banks the questions came from. Push via `update({ practice: pushAttempt(profile.practice, attempt) })`.
6. ProfileSync debounced push carries it to Supabase (existing behavior, no change).
7. Streak recomputes from the updated attempt list.

## Error Handling & Edge Cases

- **No stream set:** generic recipe (Math/English/Intelligence) + nudge link to `/onboard`.
- **Stream has no matched banks yet** (future upload timing): show "Sprints coming soon for your stream" empty state instead of a broken pick.
- **A slot has zero candidates:** redistribute to the fullest slot (pure function, tested).
- **In-progress sprint lost on refresh:** acceptable for MVP — treat a refresh as starting over (new deterministic pick for the same day returns the same 5 questions, so nothing is lost except progress). No ActiveExam persistence needed (simpler than the exam runner, which persists because exams are 3 hours).
- **Second sprint same day:** allowed, scored, but streak already counted.
- **Device clock skew:** PKT day boundary is computed client-side; acceptable for MVP (documented).
- **Attempt cap:** `pushAttempt` caps at 50; 1 sprint/day ≈ 7/week — no pressure.
- **Abroad banks:** excluded from the pool (stream-matched local tests only via entry-tests.json).

## Testing

- `sprint.test.ts` (pure, vitest):
  - `recipeFor` for every stream incl. `null` and section-alias resolution (`math` vs `mathematics`).
  - `streamTests` correctness against `entry-tests.json`.
  - `buildPool`: only stream-matched banks; section filtering; empty-slot redistribution; dedupe.
  - `dailyPick`: deterministic for same date; different across dates; size 5; no dupes; every picked id ∈ pool.
  - `computeStreak`: today-done increments; today-pending preserves; gap resets; empty list → 0; yesterday-only → 1 (today pending); PKT boundary cases (fixed `now` values).
  - `isSprintDoneToday`: true/false on fixed timestamps.
  - `gradeSprint`: all-correct → 5/5 100%; mixed answers → correct/wrong/skipped per recipe slot; no negative marking; `timeUsedSeconds` recorded; mode `"sprint"`.
- Full gates: `npx vitest run`, `npx tsc --noEmit`, `npx eslint .`, `npx next build`.

## Out of Scope (future)

- Reminders/push notifications for the sprint.
- Streak freezes / recovery items.
- Per-question difficulty targeting (easy→hard ramp) — daily rotation already varies naturally.
- Sprint analytics (weekly accuracy trends) — the data is captured; visualization can come later.
- Social/shared daily sprint.
