# Where You Stand (Peer Benchmarking) — Design Spec

**Date:** 2026-08-30
**Status:** Approved

## Goal

Give dashboard users a **social-comparison anchor**: an anonymized, aggregated distribution of the modeled applicant pool for the university/program they're targeting (or their stream), their **percentile rank** within it, and a concrete **gap-to-closing-merit hook** that gives them a reason to come back and improve their numbers.

## User Decisions (confirmed)

1. **Data provenance: modeled from real closing merits.** There is no real multi-user dataset yet, so the peer distribution is **modeled deterministically** from the real closing merits in `src/data/universities.json` (e.g., NUST BS CS closed at 82% in 2025). Copy is honest — "2025 applicant pool", never fake counts like "450 students on aftermediate". (Real anonymized collection is explicitly out of scope; the pure lib is the seam for it later.)
2. **Cohort: per watchlist target + stream fallback.** Program mode uses the student's watchlist entries (each carries its own `myMerit`); an empty watchlist falls back to stream-level standing (FSc + Matric marks only).
3. **Engagement hook: gap-to-closing-merit bar.** "3.3% below the 2025 closing merit (82%) — a 9-mark NET jump closes it." The percentile badge sits alongside.
4. **Chart: binned bar chart (hand-rolled CSS).** 12 bars in the app's violet ramp, user's bin outlined, dashed closing-merit line. No recharts — matches the pixel/card-glass aesthetic and keeps the pure-lib → render mapping trivial.
5. **Placement: full-width card after the Coarse/Fine aggregates grid** on the dashboard ("how good are my numbers" cluster), before ValuableCountries.

## Deliberate deviation from the request notes

The request said "store cached peer statistics in localStorage like `valuable-countries.tsx`." That cache exists because `ValuableCountries` calls the AI `/api/demand` endpoint. The benchmark model is **pure local math** — there is no API call to minimize, and a cache would go stale the moment marks change (the card promises "updates when your marks change"). **No API endpoint, no localStorage.** Recompute on every render from `profile`; the widget is live by construction.

## Context (existing infrastructure)

- `src/data/universities.json` — 8 universities with `programs: { name, closingMerit, year }[]`. Real closing merits: NUST BS CS 82 (2025), UET CS 82 (2024), FAST CS 75 (2024), COMSATS CS 80 (2024), KEMC MBBS 94.9 (2025), AIMC 94.5 (2025), DOW 91 (2024), **AKU MBBS has `closingMerit: null`** (the null case).
- `src/lib/aggregates.ts` — `nustAggregate` (NET 75% × 200), `fastAggregate` (test 50% × 100), `mdcatAggregate` (MDCAT 50% × 200), `overallStanding` (FSc 60% + Matric 40% marks-only standing with coarse national percentile bands).
- `src/lib/watchlist.ts` — `WatchlistEntry { universityId, programName, capturedMerit, myMerit, myStream, ... }`. `myMerit` is the student's own aggregate for that program.
- `src/lib/store.tsx` — `StudentProfile { marks, stream, watchlist, ... }`, `useStudent()`.
- `src/lib/data.ts` — `STREAM_LABEL` map.
- Dashboard pattern: `card-glass rounded-2xl p-5`, `animate-reveal` staggered delays, violet `#7a5bd4`, emerald/saffron badges, faint footer text.

## Architecture

```
profile (marks + watchlist + stream)
      │
      ▼
benchmark.ts (pure lib, deterministic — no RNG, no API, no storage)
      │
      ├── programCohort(program, closingMerit, closingYear)
      │       → 12 bins (40–44 … 95–100) from normal distribution
      │         mean = closingMerit − 1, σ = 8, clipped [40, 100],
      │         bin shares via erf-based normal CDF
      ├── streamCohort(stream)
      │       → 12 bins of standing (FSc 60% + Matric 40%),
      │         mean = 75, σ = 10, clipped [40, 100]
      ├── cohortPercentile(userValue, bins) → share of pool below user (0..1)
      ├── gapToClosing(userValue, closingMerit) → signed gap
      ├── marksToClose(gap, testWeight, testTotal) → whole marks needed
      └── benchmarkFor(profile, universities) → BenchmarkCohort (selection logic)
              │
              ▼
where-you-stand.tsx (thin client widget, useStudent)
      │
      ▼
dashboard/page.tsx — full-width card after the aggregates grid
```

### BenchmarkCohort shape

```ts
interface BenchmarkBin { lo: number; hi: number; share: number } // share 0..1, sum ≈ 1

interface BenchmarkCohort {
  mode: "program" | "stream";
  label: string;               // "NUST BS Computer Science" | "ICS applicants"
  closingMerit: number | null; // program mode only; null when unknown (AKU) or stream mode
  closingYear: string | null;
  bins: BenchmarkBin[];        // always 12 bins
  userValue: number | null;    // aggregate (program) or standing (stream); null when marks/myMerit missing
  percentile: number | null;   // 0..1 share of pool below userValue
  gap: number | null;          // userValue − closingMerit; null when either side missing
  actionHint: string | null;   // "a 9-mark NET jump closes it" — only program mode, gap < 0, known formula
}
```

### Cohort selection (benchmarkFor)

1. If `marks.fscObtained > 0` is false → `userValue: null` everywhere (widget shows the empty state).
2. Program mode: watchlist entries with `myMerit !== null` preferred; if none have `myMerit`, the first entry is still used (chart + closing line, no rank). Null-`closingMerit` programs (AKU) anchor bins at the stream default.
3. Stream mode (empty watchlist): standing = `fscPct * 0.6 + matPct * 0.4`, label from `STREAM_LABEL`, plus a `topQuartile` threshold (75th percentile of the stream distribution ≈ 81.7) for the hook copy.

### Formula map for the action hint (marksToClose)

| university id | weight | total | hint label |
|---|---|---|---|
| `nust` | 0.75 | 200 | NET |
| `fast` | 0.50 | 100 | FAST test |
| `kemc`, `aimc`, `dow`, `aku` | 0.50 | 200 | MDCAT |
| `uet`, `comsats` | — | — | no hint (no confident formula) |

`marksNeeded = gap / weight * total`, rounded to a whole number. Example: NUST gap 3.3 → 3.3 / 0.75 × 200 = 8.8 → "a 9-mark NET jump closes it."

## Component Design (where-you-stand.tsx)

Card `card-glass rounded-2xl p-5`, header pattern like other widgets.

**Header row**
- Label: `WHERE YOU STAND` (11px, uppercase, tracked, `text-faint`).
- Program mode: violet pill `NUST BS Computer Science ▾` — clicking cycles to the next watchlist entry when 2+ entries exist; amber pill `2025 applicant pool`.
- Stream mode: violet pill `<Stream> applicants`; amber pill `FSc + Matric standing`.

**Chart (hand-rolled bars)**
- Flex row of 12 bars, heights ∝ `share` (max-share bar = 100%), violet ramp (`#d9d2ee` → `#7a5bd4`), user's bin outlined `outline: 2px solid #5b3fb8`.
- Dashed closing line absolutely positioned at `left: ((closing − 40) / 60 * 100)%` with a `82%` tag (program mode with closingMerit; hidden otherwise).
- Axis labels 40 … 95 beneath, 8.5–9px, `text-faint`.
- Green user marker on the track (only when `userValue` known).

**Rank card** ("Your rank")
- Copy rule: `percentile ≥ 0.5` → `Top {round(100 − p*100)}% of the applicant pool` in emerald; else `Ahead of {round(p*100)}% of the applicant pool` in saffron. (`p` = fraction below user.)
- Sub-line: `aggregate 78.7%` (program) or `FSc + Matric 79.4%` (stream).
- `userValue` null → `Add your aggregate to see your rank` (muted), no number.

**Gap-to-closing card**
- Horizontal track 40% → 100% with green user marker + orange closing tick.
- gap < 0: `3.3% below the 2025 closing merit (82%)` + saffron action line `A 9-mark NET jump closes it.` (only when `actionHint` non-null).
- gap ≥ 0: `You're above the 2025 closing line ✓` (emerald).
- Stream mode: `The top 25% of {stream} applicants score ≈ 82%` (threshold = topQuartile, rounded to a whole percent for display) + distance to that threshold.

**Footer** — `Anonymized · aggregated · modeled from 2025 closing merit data · updates when your marks change` (9.5px, `text-faint`).

**Empty states**
1. No marks (`fscObtained === 0`): `Add your marks to see where you stand` + link to `/profile`.
2. Watchlist empty: stream mode (needs marks only).
3. Watchlist entries without `myMerit`: chart + closing line render; rank/gap cards show the "add your aggregate" prompt.

## Data Flow

`profile.marks / profile.watchlist / profile.stream` → `useStudent()` → `benchmarkFor(profile, universities)` (pure, computed in render — deterministic, cheap: 12 erf evaluations) → render. No effects, no fetch, no storage. Editing marks or the watchlist re-renders the card instantly (the promised "updates when your marks change" behavior for free).

## Error Handling & Edge Cases

- `closingMerit: null` (AKU MBBS): bins anchored at the stream default (mean 75, σ 10, clipped [40, 100]); no closing line, no gap, no action hint.
- Unknown university id / formula (uet, comsats): gap shows, action hint omitted.
- `myMerit` null for all entries: `userValue` null → rank/gap placeholders, chart still renders.
- Marks partially missing (`matricObtained` 0): standing computes what it can; `userValue` null only when FSc is entirely missing.
- User value outside [40, 100]: percentile clamps (≈ 0 below, ≈ 1 above); marker clamps to track edges.
- Empty watchlist: stream mode. Both empty watchlist and no marks: empty state 1 wins.

## Testing (`src/lib/benchmark.test.ts`, ~20 tests)

- Determinism: same inputs → deep-equal outputs.
- Bins: 12 bins, lo 40…95 step 5, hi 44…100, shares sum ≈ 1 (±0.01).
- Anchor: peak bin near `closingMerit − 1` for NUST CS (82 → 81) and KEMC MBBS (94.9 → 93.9).
- Percentile: monotonic (higher value → higher percentile); at mean ≈ 0.5; clamps at extremes.
- Gap: `gap = userValue − closingMerit`; above-closing gap positive.
- marksToClose: NUST 3.3 → 9; FAST 4 → 8; MDCAT 2 → 8; null for uet/comsats.
- Null closing (AKU): default anchor, gap null, actionHint null.
- Stream mode: empty watchlist → mode "stream", label from `STREAM_LABEL`, standing = fsc·0.6 + mat·0.4, topQuartile ≈ 81.7.
- Selection: entries with `myMerit` preferred over entries without; no marks → `userValue` null.
- Widget stays thin — no component tests (codebase pattern: lib tests + gates).

## Gates

`npx vitest run` (all green), `npx tsc --noEmit`, `npx eslint .` (0 errors), `npx next build`.

## Out of Scope (future)

- Real anonymized peer collection (Supabase table + consent + cold-start UI) — the pure lib API is the seam.
- Per-stream distribution parameters or program-specific σ tuning.
- Density-curve styling, tooltips, or recharts migration.
- Cohort counts in copy ("450 students…") — intentionally never fabricated.
