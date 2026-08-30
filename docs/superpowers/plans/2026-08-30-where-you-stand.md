# Where You Stand (Peer Benchmarking) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Where You Stand" dashboard card that shows the user's percentile rank and gap-to-closing-merit against a deterministic, modeled applicant-pool distribution for their watchlist target (or stream), using honest copy ("2025 applicant pool") and no fabricated peer counts.

**Architecture:** A pure, deterministic lib (`src/lib/benchmark.ts`) models the pool as 12 binned bars from a normal distribution anchored on the real closing merits in `universities.json` (erf-based CDF, no RNG/API/storage), then a thin client widget (`src/components/dashboard/where-you-stand.tsx`) renders bars + rank + gap hook from `useStudent()` profile data. Placement: full-width card after the Coarse/Fine aggregates grid on the dashboard.

**Tech Stack:** TypeScript 5, React 19 (client component), Tailwind CSS 4 tokens (card-glass, violet/emerald/saffron/amber), vitest (node env, `@/` alias configured in `vitest.config.ts`), Next.js 16.

**Spec:** `docs/superpowers/specs/2026-08-30-where-you-stand-design.md` (approved; includes the deliberate deviation: **no API endpoint, no localStorage** — pure local math, recompute on render).

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/lib/benchmark.ts` | Create | Pure model: erf CDF, bin builder, percentile, gap, marks-to-close, `benchmarkFor` selection |
| `src/lib/benchmark.test.ts` | Create | ~30 pure-function tests (vitest) |
| `src/components/dashboard/where-you-stand.tsx` | Create | Client widget: chart, rank card, gap card, empty states |
| `src/app/(app)/dashboard/page.tsx` | Modify | Import + place the card after the aggregates grid (delay 220ms) |

Patterns to follow: pure libs like `src/lib/watchlist.ts`; widget conventions from `src/components/dashboard/daily-sprint.tsx` / `fine-aggregate.tsx` (`card-glass rounded-2xl p-5`, `text-[11px] font-semibold uppercase tracking-widest text-faint` header, `font-mono ... text-ink` values); `universities` imported as `import universitiesJson from "@/data/universities.json"` + `as unknown as University[]` (same as `watchlist-section.tsx`). No component tests — the codebase pattern is lib tests + gates (tsc/eslint/build).

---

### Task 1: Distribution core — `normalBins`, `programCohort`, `streamCohort`

**Files:**
- Create: `src/lib/benchmark.ts`
- Create: `src/lib/benchmark.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/benchmark.test.ts` with exactly this content:

```ts
import { describe, expect, it } from "vitest";
import { programCohort, streamCohort } from "./benchmark";

describe("programCohort / streamCohort (distribution core)", () => {
  it("produces 12 bins spanning 40–100 in 5-point steps", () => {
    const bins = programCohort(82);
    expect(bins).toHaveLength(12);
    expect(bins[0].lo).toBe(40);
    expect(bins[0].hi).toBe(44);
    expect(bins[5].lo).toBe(65);
    expect(bins[5].hi).toBe(69);
    expect(bins[11].lo).toBe(95);
    expect(bins[11].hi).toBe(100);
  });

  it("keeps every share in [0, 1] and sums to ≈ 1", () => {
    const bins = programCohort(82);
    const sum = bins.reduce((acc, b) => acc + b.share, 0);
    expect(sum).toBeCloseTo(1, 2);
    for (const bin of bins) {
      expect(bin.share).toBeGreaterThanOrEqual(0);
      expect(bin.share).toBeLessThanOrEqual(1);
    }
  });

  it("anchors the peak near closingMerit − 1 (NUST 82 → bin 80–84)", () => {
    const peak = programCohort(82).reduce((max, b) => (b.share > max.share ? b : max));
    expect(peak.lo).toBe(80);
  });

  it("clips high closing merits into the top bin (KEMC 94.9)", () => {
    const bins = programCohort(94.9);
    const peak = bins.reduce((max, b) => (b.share > max.share ? b : max));
    expect(peak.lo).toBe(95);
    const mid = bins.find((b) => b.lo === 90);
    expect(mid?.share ?? 0).toBeGreaterThan(0.2);
  });

  it("falls back to the stream default when closingMerit is null (AKU)", () => {
    expect(programCohort(null)).toEqual(streamCohort());
  });

  it("is deterministic", () => {
    expect(programCohort(82)).toEqual(programCohort(82));
    expect(streamCohort()).toEqual(streamCohort());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/benchmark.test.ts`
Expected: FAIL — `Cannot find module './benchmark'` (or similar module resolution error).

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/benchmark.ts` with exactly this content (no imports yet — added in Task 3):

```ts
export interface BenchmarkBin {
  lo: number;
  hi: number;
  share: number; // 0..1 — model share of the pool in this bin
}

export const BIN_START = 40;
export const BIN_END = 100;
export const BIN_SIZE = 5;
export const BIN_COUNT = 12;

const PROGRAM_SD = 8;
const STREAM_MEAN = 75;
const STREAM_SD = 10;
const TOP_QUARTILE_Z = 0.67448975; // Φ⁻¹(0.75) for the normal distribution

// Abramowitz & Stegun 7.1.26 — max absolute error ≈ 1.5e-7.
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-ax * ax));
  return sign * y;
}

function normalCdf(x: number, mean: number, sd: number): number {
  return 0.5 * (1 + erf((x - mean) / (sd * Math.SQRT2)));
}

// 12 bins [40,44]…[95,100]. The first bin absorbs everything below 40 and the
// last bin everything above 100, so the shares sum to exactly 1.
function normalBins(mean: number, sd: number): BenchmarkBin[] {
  const cdf = (x: number) => normalCdf(x, mean, sd);
  const bins: BenchmarkBin[] = [
    { lo: BIN_START, hi: BIN_START + BIN_SIZE - 1, share: cdf(BIN_START + BIN_SIZE) },
  ];
  for (let i = 1; i < BIN_COUNT - 1; i++) {
    const lo = BIN_START + i * BIN_SIZE;
    bins.push({ lo, hi: lo + BIN_SIZE - 1, share: cdf(lo + BIN_SIZE) - cdf(lo) });
  }
  bins.push({ lo: BIN_END - BIN_SIZE, hi: BIN_END, share: 1 - cdf(BIN_END - BIN_SIZE) });
  return bins;
}

// Applicant-pool distributions. Program pools are anchored one point below the
// real closing merit; unknown closings (AKU) and stream pools use the default.
export function programCohort(closingMerit: number | null): BenchmarkBin[] {
  if (closingMerit === null) return normalBins(STREAM_MEAN, STREAM_SD);
  return normalBins(closingMerit - 1, PROGRAM_SD);
}

export function streamCohort(): BenchmarkBin[] {
  return normalBins(STREAM_MEAN, STREAM_SD);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/benchmark.test.ts`
Expected: PASS — 6 tests, all green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/benchmark.ts src/lib/benchmark.test.ts
git commit -m "feat(benchmark): add deterministic cohort distribution model"
```

---

### Task 2: Percentile, gap, and marks-to-close helpers

**Files:**
- Modify: `src/lib/benchmark.ts` (append three exported functions)
- Modify: `src/lib/benchmark.test.ts` (extend imports + append three describes)

- [ ] **Step 1: Write the failing tests**

Replace the import line in `src/lib/benchmark.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { cohortPercentile, gapToClosing, marksToClose, programCohort, streamCohort } from "./benchmark";
```

Append to the end of `src/lib/benchmark.test.ts`:

```ts
describe("cohortPercentile", () => {
  it("is 0 below the track and 1 above it", () => {
    const bins = programCohort(82);
    expect(cohortPercentile(30, bins)).toBe(0);
    expect(cohortPercentile(110, bins)).toBe(1);
  });

  it("sits at ≈ 0.5 at the model mean", () => {
    expect(cohortPercentile(81, programCohort(82))).toBeCloseTo(0.5, 1);
  });

  it("matches the mockup NUST case (78.7 → ≈ 39% below)", () => {
    expect(cohortPercentile(78.7, programCohort(82))).toBeCloseTo(0.39, 1);
  });

  it("is monotonic in userValue", () => {
    const bins = programCohort(82);
    const values = [50, 60, 70, 78.7, 82, 90, 95];
    for (let i = 1; i < values.length; i++) {
      expect(cohortPercentile(values[i], bins)).toBeGreaterThan(
        cohortPercentile(values[i - 1], bins)
      );
    }
  });

  it("reaches ≈ 0.96 at 95 for the NUST model", () => {
    expect(cohortPercentile(95, programCohort(82))).toBeCloseTo(0.96, 2);
  });
});

describe("gapToClosing", () => {
  it("is the signed difference userValue − closingMerit", () => {
    expect(gapToClosing(78.7, 82)).toBeCloseTo(-3.3, 1);
    expect(gapToClosing(85, 82)).toBe(3);
    expect(gapToClosing(80, 80)).toBe(0);
  });
});

describe("marksToClose", () => {
  it("NUST: 3.3-point gap → 9 NET marks", () => {
    expect(marksToClose(-3.3, 0.75, 200)).toBe(9);
  });

  it("FAST: 4-point gap → 8 test marks", () => {
    expect(marksToClose(-4, 0.5, 100)).toBe(8);
  });

  it("MDCAT: 2-point gap → 8 test marks", () => {
    expect(marksToClose(-2, 0.5, 200)).toBe(8);
  });

  it("returns null when the gap is missing, non-negative, or the formula is degenerate", () => {
    expect(marksToClose(null, 0.75, 200)).toBeNull();
    expect(marksToClose(0, 0.75, 200)).toBeNull();
    expect(marksToClose(3.3, 0.75, 200)).toBeNull();
    expect(marksToClose(-3.3, 0, 200)).toBeNull();
    expect(marksToClose(-3.3, 0.75, 0)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/benchmark.test.ts`
Expected: FAIL — `cohortPercentile` / `gapToClosing` / `marksToClose` are not exported (the three new describes fail).

- [ ] **Step 3: Implement the helpers**

Append to the end of `src/lib/benchmark.ts`:

```ts
// Share of the pool below userValue (0..1). Linear interpolation inside the
// user's bin; values outside [BIN_START, BIN_END] clamp to 0/1.
export function cohortPercentile(userValue: number, bins: BenchmarkBin[]): number {
  if (userValue < BIN_START) return 0;
  if (userValue >= BIN_END) return 1;
  let below = 0;
  for (const bin of bins) {
    if (userValue > bin.hi) {
      below += bin.share;
    } else if (userValue >= bin.lo) {
      below += bin.share * ((userValue - bin.lo) / BIN_SIZE);
      break;
    }
  }
  return below;
}

export function gapToClosing(userValue: number, closingMerit: number): number {
  return userValue - closingMerit;
}

// Whole entry-test marks needed to close a gap measured in aggregate
// percentage points. Each test mark is worth weight × 100 / total points of
// aggregate, so marks = gap × total / (100 × weight). Null when the gap is
// missing, non-negative (nothing to close), or the formula is degenerate.
export function marksToClose(
  gap: number | null,
  weight: number,
  total: number
): number | null {
  if (gap === null || gap >= 0 || weight <= 0 || total <= 0) return null;
  return Math.round((Math.abs(gap) * total) / (100 * weight));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/benchmark.test.ts`
Expected: PASS — 16 tests, all green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/benchmark.ts src/lib/benchmark.test.ts
git commit -m "feat(benchmark): add percentile, gap, and marks-to-close helpers"
```

---

### Task 3: `benchmarkFor` — cohort selection and assembly

**Files:**
- Modify: `src/lib/benchmark.ts` (add imports, interfaces, TEST_FORMULAS, `benchmarkFor`)
- Modify: `src/lib/benchmark.test.ts` (extend imports, add fixtures + two describes)

- [ ] **Step 1: Write the failing tests**

Replace the import block at the top of `src/lib/benchmark.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import {
  benchmarkFor,
  cohortPercentile,
  gapToClosing,
  marksToClose,
  programCohort,
  streamCohort,
  type BenchmarkProfile,
} from "./benchmark";
import type { University } from "./types";
import type { WatchlistEntry } from "./watchlist";
```

Append to the end of `src/lib/benchmark.test.ts` (after the `marksToClose` describe):

```ts
// Real closing merits from universities.json (NUST BS CS 82/2025, KEMC MBBS
// 94.9/2025); AKU intentionally has no closingMerit — the null case.
const mockUnis: University[] = [
  {
    id: "nust",
    name: "NUST",
    short: "NUST",
    city: "Islamabad",
    type: "public",
    category: "engineering",
    streams: ["pre-engineering", "ics"],
    programs: [{ name: "BS Computer Science (SEECS)", closingMerit: 82, year: "2025" }],
    formulas: { note: "", components: [], eligibility: [] },
    entryTest: "NET",
    source_url: "",
  },
  {
    id: "fast",
    name: "FAST",
    short: "FAST",
    city: "Islamabad",
    type: "private",
    category: "computing",
    streams: ["pre-engineering", "ics"],
    programs: [{ name: "BS CS", closingMerit: 75, year: "2024" }],
    formulas: { note: "", components: [], eligibility: [] },
    entryTest: "FAST test",
    source_url: "",
  },
  {
    id: "kemc",
    name: "KEMC",
    short: "KEMC",
    city: "Lahore",
    type: "public",
    category: "medical",
    streams: ["pre-medical"],
    programs: [{ name: "MBBS", closingMerit: 94.9, year: "2025" }],
    formulas: { note: "", components: [], eligibility: [] },
    entryTest: "MDCAT",
    source_url: "",
  },
  {
    id: "aku",
    name: "AKU",
    short: "AKU",
    city: "Karachi",
    type: "private",
    category: "medical",
    streams: ["pre-medical"],
    programs: [{ name: "MBBS", year: "2025" }],
    formulas: { note: "", components: [], eligibility: [] },
    entryTest: "AKU test",
    source_url: "",
  },
  {
    id: "uet",
    name: "UET",
    short: "UET",
    city: "Lahore",
    type: "public",
    category: "engineering",
    streams: ["pre-engineering"],
    programs: [{ name: "CS", closingMerit: 82, year: "2024" }],
    formulas: { note: "", components: [], eligibility: [] },
    entryTest: "UET test",
    source_url: "",
  },
];

function makeEntry(overrides: Partial<WatchlistEntry> = {}): WatchlistEntry {
  return {
    id: "wl_test",
    type: "university",
    universityId: "nust",
    programName: "BS Computer Science (SEECS)",
    capturedMerit: 82,
    capturedYear: "2025",
    capturedAt: "2026-08-01T00:00:00.000Z",
    lastKnownMerit: 82,
    lastCheckedAt: "2026-08-01T00:00:00.000Z",
    myMerit: 78.7,
    myStream: "pre-engineering",
    notifyEmail: true,
    lastNotifiedAt: null,
    ...overrides,
  };
}

function makeProfile(overrides: Partial<BenchmarkProfile> = {}): BenchmarkProfile {
  return {
    marks: { matricObtained: 850, matricTotal: 1100, fscObtained: 900, fscTotal: 1100 },
    stream: "pre-engineering",
    watchlist: [makeEntry()],
    ...overrides,
  };
}

describe("benchmarkFor — program mode", () => {
  it("builds the NUST cohort from a watchlist entry", () => {
    const cohort = benchmarkFor(makeProfile(), mockUnis);
    expect(cohort.mode).toBe("program");
    expect(cohort.label).toBe("NUST BS Computer Science (SEECS)");
    expect(cohort.closingMerit).toBe(82);
    expect(cohort.closingYear).toBe("2025");
    expect(cohort.userValue).toBe(78.7);
    expect(cohort.percentile).toBeCloseTo(0.39, 1);
    expect(cohort.gap).toBeCloseTo(-3.3, 1);
    expect(cohort.actionHint).toBe("A 9-mark NET jump closes it.");
    expect(cohort.topQuartile).toBeNull();
  });

  it("prefers the first watchlist entry that has myMerit", () => {
    const noMerit = makeEntry({
      id: "wl_fast",
      universityId: "fast",
      programName: "BS CS",
      capturedMerit: 75,
      myMerit: null,
    });
    const withMerit = makeEntry({ id: "wl_nust" });
    const cohort = benchmarkFor(makeProfile({ watchlist: [noMerit, withMerit] }), mockUnis);
    expect(cohort.label).toBe("NUST BS Computer Science (SEECS)");
    expect(cohort.userValue).toBe(78.7);
  });

  it("honors an explicit entry even when it has no myMerit", () => {
    const noMerit = makeEntry({
      id: "wl_fast",
      universityId: "fast",
      programName: "BS CS",
      capturedMerit: 75,
      myMerit: null,
    });
    const cohort = benchmarkFor(makeProfile(), mockUnis, noMerit);
    expect(cohort.label).toBe("FAST BS CS");
    expect(cohort.userValue).toBeNull();
    expect(cohort.percentile).toBeNull();
    expect(cohort.gap).toBeNull();
  });

  it("falls back to the entry snapshot when the program is unknown", () => {
    const ghost = makeEntry({
      id: "wl_ghost",
      universityId: "xxx",
      programName: "Some Program",
      capturedMerit: 80,
      capturedYear: "2023",
    });
    const cohort = benchmarkFor(makeProfile({ watchlist: [ghost] }), mockUnis);
    expect(cohort.label).toBe("xxx Some Program");
    expect(cohort.closingMerit).toBe(80);
    expect(cohort.closingYear).toBe("2023");
  });

  it("omits the action hint when no formula exists (uet)", () => {
    const uet = makeEntry({
      id: "wl_uet",
      universityId: "uet",
      programName: "CS",
      capturedMerit: 82,
      myMerit: 78,
    });
    const cohort = benchmarkFor(makeProfile({ watchlist: [uet] }), mockUnis);
    expect(cohort.gap).toBeCloseTo(-4, 1);
    expect(cohort.actionHint).toBeNull();
  });

  it("handles a null closingMerit (AKU) with the stream default bins", () => {
    const aku = makeEntry({
      id: "wl_aku",
      universityId: "aku",
      programName: "MBBS",
      capturedMerit: null,
      capturedYear: "2025",
      myMerit: 80,
    });
    const cohort = benchmarkFor(makeProfile({ watchlist: [aku] }), mockUnis);
    expect(cohort.closingMerit).toBeNull();
    expect(cohort.bins).toEqual(streamCohort());
    expect(cohort.gap).toBeNull();
    expect(cohort.actionHint).toBeNull();
    expect(cohort.percentile).toBeCloseTo(0.69, 2);
  });

  it("gates userValue on marks even when myMerit exists", () => {
    const profile = makeProfile({
      marks: { matricObtained: 0, matricTotal: 1100, fscObtained: 0, fscTotal: 1100 },
    });
    const cohort = benchmarkFor(profile, mockUnis);
    expect(cohort.userValue).toBeNull();
    expect(cohort.percentile).toBeNull();
    expect(cohort.gap).toBeNull();
  });
});

describe("benchmarkFor — stream mode", () => {
  it("falls back to the stream when the watchlist is empty", () => {
    const cohort = benchmarkFor(makeProfile({ watchlist: [], stream: "ics" }), mockUnis);
    expect(cohort.mode).toBe("stream");
    expect(cohort.label).toBe("ICS applicants");
    expect(cohort.closingMerit).toBeNull();
    expect(cohort.bins).toEqual(streamCohort());
  });

  it("computes standing as FSc 60% + Matric 40%", () => {
    const cohort = benchmarkFor(makeProfile({ watchlist: [] }), mockUnis);
    expect(cohort.userValue).toBeCloseTo(80, 1);
    expect(cohort.percentile).toBeCloseTo(0.69, 2);
    expect(cohort.topQuartile).toBeCloseTo(81.7, 1);
  });

  it("uses the STREAM_LABEL for the cohort name", () => {
    const cohort = benchmarkFor(makeProfile({ watchlist: [], stream: "pre-medical" }), mockUnis);
    expect(cohort.label).toBe("FSc Pre-Medical applicants");
  });

  it("is deterministic", () => {
    const profile = makeProfile({ watchlist: [] });
    expect(benchmarkFor(profile, mockUnis)).toEqual(benchmarkFor(profile, mockUnis));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/benchmark.test.ts`
Expected: FAIL — `benchmarkFor` is not exported (the two new describes fail).

- [ ] **Step 3: Implement `benchmarkFor`**

Replace the top of `src/lib/benchmark.ts` (the file currently starts with `export interface BenchmarkBin {`) with:

```ts
import type { Marks, Stream, University } from "./types";
import type { WatchlistEntry } from "./watchlist";
import { overallStanding } from "./aggregates";
import { STREAM_LABEL } from "./data";

export interface BenchmarkBin {
  lo: number;
  hi: number;
  share: number; // 0..1 — model share of the pool in this bin
}

export interface BenchmarkCohort {
  mode: "program" | "stream";
  label: string;               // "NUST BS Computer Science (SEECS)" | "ICS applicants"
  closingMerit: number | null; // program mode only; null when unknown (AKU) or stream mode
  closingYear: string | null;
  bins: BenchmarkBin[];        // always 12 bins
  userValue: number | null;    // aggregate (program) or standing (stream); null when marks/myMerit missing
  percentile: number | null;   // 0..1 share of the pool below userValue
  gap: number | null;          // userValue − closingMerit; null when either side is missing
  actionHint: string | null;   // "A 9-mark NET jump closes it." — program mode, gap < 0, known formula
  topQuartile: number | null;  // stream mode only — 75th percentile of the modeled pool
}

export interface BenchmarkProfile {
  marks: Marks;
  stream: Stream | null;
  watchlist: WatchlistEntry[];
}

export interface TestFormula {
  weight: number; // aggregate weight of the entry test (0..1)
  total: number;  // entry test total marks
  label: string;  // "NET" | "FAST test" | "MDCAT"
}

// Entry-test formulas by university id — matches aggregates in aggregates.ts.
export const TEST_FORMULAS: Record<string, TestFormula> = {
  nust: { weight: 0.75, total: 200, label: "NET" },
  fast: { weight: 0.5, total: 100, label: "FAST test" },
  kemc: { weight: 0.5, total: 200, label: "MDCAT" },
  aimc: { weight: 0.5, total: 200, label: "MDCAT" },
  dow: { weight: 0.5, total: 200, label: "MDCAT" },
  aku: { weight: 0.5, total: 200, label: "MDCAT" },
};
```

Append to the end of `src/lib/benchmark.ts`:

```ts
export function benchmarkFor(
  profile: BenchmarkProfile,
  universities: University[],
  entry?: WatchlistEntry
): BenchmarkCohort {
  const hasMarks = profile.marks.fscObtained > 0;

  // Program mode — an explicit target wins; otherwise the first entry with
  // myMerit, falling back to the first entry at all.
  const target =
    entry ??
    profile.watchlist.find((e) => e.myMerit !== null) ??
    profile.watchlist[0];

  if (target) {
    const uni = universities.find((u) => u.id === target.universityId);
    const prog = uni?.programs.find((p) => p.name === target.programName);
    const closingMerit = prog?.closingMerit ?? target.capturedMerit ?? null;
    const closingYear = prog?.year ?? target.capturedYear ?? null;
    const bins = programCohort(closingMerit);
    const userValue = hasMarks ? target.myMerit : null;
    const percentile = userValue === null ? null : cohortPercentile(userValue, bins);
    const gap =
      userValue === null || closingMerit === null
        ? null
        : gapToClosing(userValue, closingMerit);
    const formula = TEST_FORMULAS[target.universityId];
    const actionHint =
      gap !== null && gap < 0 && formula
        ? `A ${marksToClose(gap, formula.weight, formula.total)}-mark ${formula.label} jump closes it.`
        : null;

    return {
      mode: "program",
      label: `${uni?.short ?? target.universityId} ${target.programName}`,
      closingMerit,
      closingYear,
      bins,
      userValue,
      percentile,
      gap,
      actionHint,
      topQuartile: null,
    };
  }

  // Stream mode — marks-only standing against the default applicant pool.
  const standing = overallStanding(profile.marks).value;
  const bins = streamCohort();
  const userValue = hasMarks ? standing : null;
  return {
    mode: "stream",
    label: profile.stream ? `${STREAM_LABEL[profile.stream]} applicants` : "Applicants",
    closingMerit: null,
    closingYear: null,
    bins,
    userValue,
    percentile: userValue === null ? null : cohortPercentile(userValue, bins),
    gap: null,
    actionHint: null,
    topQuartile: STREAM_MEAN + TOP_QUARTILE_Z * STREAM_SD,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/benchmark.test.ts`
Expected: PASS — 27 tests, all green.

Also run `npx tsc --noEmit` — expected: exit 0 (no type errors).

- [ ] **Step 5: Commit**

```bash
git add src/lib/benchmark.ts src/lib/benchmark.test.ts
git commit -m "feat(benchmark): add benchmarkFor cohort selection"
```

---

### Task 4: `WhereYouStand` widget

**Files:**
- Create: `src/components/dashboard/where-you-stand.tsx`

No component tests — the codebase pattern is lib tests + gates (see the spec's Testing section). Verification is `tsc` + `eslint` + the final build.

- [ ] **Step 1: Write the widget**

Create `src/components/dashboard/where-you-stand.tsx` with exactly this content:

```tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { BIN_COUNT, BIN_END, BIN_START, benchmarkFor } from "@/lib/benchmark";
import universitiesJson from "@/data/universities.json";
import type { University } from "@/lib/types";
import { useStudent } from "@/lib/store";
import { cn } from "@/lib/utils";

const UNIVERSITIES = universitiesJson as unknown as University[];

// Violet ramp #d9d2ee → #7a5bd4 across the 12 bins.
function violetRamp(i: number): string {
  const t = i / (BIN_COUNT - 1);
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${lerp(217, 122)}, ${lerp(210, 91)}, ${lerp(238, 212)})`;
}

// Position on the 40→100 track, clamped to its edges.
function trackLeft(value: number): number {
  return Math.min(100, Math.max(0, ((value - BIN_START) / (BIN_END - BIN_START)) * 100));
}

export function WhereYouStand() {
  const { profile } = useStudent();
  const watchlist = profile.watchlist;
  const hasMarks = profile.marks.fscObtained > 0;

  // Start the cycle on the first target that has the student's aggregate.
  const preferredIdx = watchlist.findIndex((e) => e.myMerit !== null);
  const [idx, setIdx] = React.useState(() => (preferredIdx >= 0 ? preferredIdx : 0));
  const safeIdx = watchlist.length === 0 ? 0 : Math.min(idx, watchlist.length - 1);
  const target = watchlist.length > 0 ? watchlist[safeIdx] : undefined;

  const cohort = React.useMemo(
    () => benchmarkFor(profile, UNIVERSITIES, target),
    [profile, target]
  );

  const cycle = () => {
    if (watchlist.length < 2) return;
    setIdx((i) => (i + 1) % watchlist.length);
  };

  // Empty state 1 — no marks at all.
  if (!hasMarks) {
    return (
      <div className="card-glass rounded-2xl p-5">
        <p className="text-base font-bold text-ink">📍 Where you stand</p>
        <p className="mt-2 text-sm text-muted">Add your marks to see where you stand.</p>
        <Link
          href="/profile"
          className="mt-4 inline-block rounded-xl bg-violet px-4 py-2 text-sm font-extrabold text-white shadow-[0_4px_0_#5b3fb8] transition-colors hover:brightness-110"
        >
          Add your marks →
        </Link>
      </div>
    );
  }

  const maxShare = Math.max(...cohort.bins.map((b) => b.share));
  const uv = cohort.userValue;
  let userBinIdx = -1;
  if (uv !== null) {
    userBinIdx = cohort.bins.findIndex((b) => uv >= b.lo && uv <= b.hi);
  }

  let gapCard: React.ReactNode = null;
  if (cohort.mode === "stream") {
    if (uv === null) {
      gapCard = <p className="text-sm font-semibold text-muted">Add your marks to see where you stand.</p>;
    } else {
      const tq = cohort.topQuartile ?? 0;
      gapCard = (
        <>
          <p className="text-sm font-semibold text-ink">
            The top 25% of {cohort.label} score ≈ {Math.round(tq)}%
          </p>
          <p className="mt-1 text-xs font-bold text-saffron">
            {uv >= tq
              ? "You're in the top quarter ✓"
              : `${(tq - uv).toFixed(1)}% to reach the top quarter`}
          </p>
        </>
      );
    }
  } else if (cohort.closingMerit === null) {
    gapCard = (
      <p className="text-sm font-semibold text-muted">
        Closing merit for this program isn&apos;t published yet.
      </p>
    );
  } else if (cohort.gap === null) {
    gapCard = (
      <p className="text-sm font-semibold text-muted">
        Add your aggregate to compare against the closing line.
      </p>
    );
  } else if (cohort.gap >= 0) {
    gapCard = (
      <p className="text-sm font-extrabold text-emerald">
        You&apos;re above the {cohort.closingYear ? `${cohort.closingYear} ` : ""}closing line ✓
      </p>
    );
  } else {
    gapCard = (
      <>
        <p className="text-sm font-semibold text-ink">
          {Math.abs(cohort.gap).toFixed(1)}% below the{" "}
          {cohort.closingYear ? `${cohort.closingYear} ` : ""}closing merit ({cohort.closingMerit}%)
        </p>
        <div className="relative mt-2 h-1.5 rounded-full bg-surface-2">
          <div
            className="absolute -top-[3px] h-3 w-[3px] rounded-full bg-saffron"
            style={{ left: `${trackLeft(cohort.closingMerit)}%` }}
          />
          {uv !== null && (
            <div
              className="absolute -top-[5px] h-4 w-4 -translate-x-1/2 rounded-full border-2 border-emerald bg-surface"
              style={{ left: `${trackLeft(uv)}%` }}
            />
          )}
        </div>
        {cohort.actionHint !== null && (
          <p className="mt-2 text-xs font-bold text-saffron">{cohort.actionHint}</p>
        )}
      </>
    );
  }

  return (
    <div className="card-glass rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
          Where you stand
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {cohort.mode === "program" ? (
            <button
              type="button"
              onClick={cycle}
              disabled={watchlist.length < 2}
              title={watchlist.length < 2 ? undefined : "Switch target"}
              className="rounded-full border border-violet/30 bg-violet/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violet transition-colors hover:bg-violet/20 disabled:cursor-default disabled:opacity-70"
            >
              {cohort.label}
              {watchlist.length > 1 && <span aria-hidden="true"> ▾</span>}
            </button>
          ) : (
            <span className="rounded-full border border-violet/30 bg-violet/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violet">
              {cohort.label}
            </span>
          )}
          <span className="rounded-full border border-amber/30 bg-amber/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber">
            {cohort.mode === "program"
              ? cohort.closingYear
                ? `${cohort.closingYear} applicant pool`
                : "Applicant pool"
              : "FSc + Matric standing"}
          </span>
        </div>
      </div>

      {/* Distribution chart — 12 binned bars */}
      <div className="relative mt-5">
        <div className="flex h-28 items-end gap-[3px]">
          {cohort.bins.map((bin, i) => (
            <div
              key={i}
              title={`${bin.lo}–${bin.hi}%: ${(bin.share * 100).toFixed(1)}% of pool`}
              className={cn(
                "flex-1 rounded-t-[3px]",
                i === userBinIdx && "outline-2 outline-[#5b3fb8] -outline-offset-1"
              )}
              style={{
                height: `${(bin.share / maxShare) * 100}%`,
                backgroundColor: violetRamp(i),
              }}
            />
          ))}
        </div>
        {cohort.closingMerit !== null && (
          <div
            className="pointer-events-none absolute inset-y-0 border-l-2 border-dashed border-saffron"
            style={{ left: `${trackLeft(cohort.closingMerit)}%` }}
          >
            <span className="absolute -top-5 left-0 -translate-x-1/2 rounded bg-saffron px-1 text-[9px] font-bold leading-4 text-white">
              {cohort.closingMerit}%
            </span>
          </div>
        )}
        {uv !== null && (
          <div
            className="pointer-events-none absolute -top-1.5 -translate-x-1/2"
            style={{ left: `${trackLeft(uv)}%` }}
          >
            <div className="h-2 w-2 rounded-full bg-emerald ring-2 ring-surface" />
          </div>
        )}
        <div className="mt-1.5 flex justify-between text-[8.5px] font-medium text-faint">
          <span>40</span>
          <span>60</span>
          <span>80</span>
          <span>95</span>
          <span>100</span>
        </div>
      </div>

      {/* Rank card */}
      {uv !== null && cohort.percentile !== null ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-2 px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-faint">Your rank</p>
            <p
              className={cn(
                "mt-0.5 text-lg font-extrabold leading-tight",
                cohort.percentile >= 0.5 ? "text-emerald" : "text-saffron"
              )}
            >
              {cohort.percentile >= 0.5
                ? `Top ${Math.max(1, Math.round(100 - cohort.percentile * 100))}% of the applicant pool`
                : `Ahead of ${Math.round(cohort.percentile * 100)}% of the applicant pool`}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-lg font-extrabold text-ink">{uv.toFixed(1)}%</p>
            <p className="text-[10px] text-faint">
              {cohort.mode === "program" ? "aggregate" : "FSc + Matric standing"}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl bg-surface-2 px-4 py-3">
          <p className="text-sm font-semibold text-muted">
            {cohort.mode === "program"
              ? "Add your aggregate to see your rank"
              : "Add your marks to see your rank"}
          </p>
        </div>
      )}

      {/* Gap-to-closing / stream-hook card */}
      <div className="mt-3 rounded-xl border border-surface-2 px-4 py-3">{gapCard}</div>

      <p className="mt-3 text-[9.5px] text-faint">
        Anonymized · aggregated · modeled from 2025 closing merit data · updates when your marks
        change
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Verify types**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Verify lint**

Run: `npx eslint src/components/dashboard/where-you-stand.tsx`
Expected: no errors (0 problems).

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/where-you-stand.tsx
git commit -m "feat(dashboard): add Where You Stand benchmark widget"
```

---

### Task 5: Dashboard placement

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Import the widget**

In `src/app/(app)/dashboard/page.tsx`, add this import after the `DailySprint` import (line 13):

```tsx
import { WhereYouStand } from "@/components/dashboard/where-you-stand";
```

- [ ] **Step 2: Place the card after the aggregates grid**

In `src/app/(app)/dashboard/page.tsx`, insert this block between the closing of the Coarse/Fine aggregates grid (the `</div>` at line 57) and the opening of the ValuableCountries grid (line 59):

```tsx
      <div className="mt-4 animate-reveal" style={{ animationDelay: "220ms" }}>
        <WhereYouStand />
      </div>
```

The surrounding structure should now read:

```tsx
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {profile.marks.fscObtained > 0 && (
          <div className="animate-reveal" style={{ animationDelay: "120ms" }}>
            <CoarseAggregate />
          </div>
        )}
        <div className="animate-reveal" style={{ animationDelay: "180ms" }}>
          <FineAggregate />
        </div>
      </div>

      <div className="mt-4 animate-reveal" style={{ animationDelay: "220ms" }}>
        <WhereYouStand />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="animate-reveal" style={{ animationDelay: "240ms" }}>
          <ValuableCountries />
```

- [ ] **Step 3: Verify types and lint**

Run: `npx tsc --noEmit` — expected: exit 0.
Run: `npx eslint src/app/\(app\)/dashboard/page.tsx` — expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/dashboard/page.tsx"
git commit -m "feat(dashboard): place Where You Stand after aggregates grid"
```

---

### Task 6: Full gates and final review

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: PASS — all suites green (the 528 existing tests plus the 27 new benchmark tests).

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Run lint**

Run: `npx eslint .`
Expected: 0 errors (2 pre-existing warnings in other files are acceptable).

- [ ] **Step 4: Run the production build**

Run: `npm run build`
Expected: exit 0, `✓ Compiled successfully` (the widget compiles as a client component).

- [ ] **Step 5: Spec compliance spot-check**

Verify against the spec (`docs/superpowers/specs/2026-08-30-where-you-stand-design.md`):

1. 12 bins, violet ramp, dashed closing line with `82%` tag, green user marker, axis labels 40…100 — Task 4 chart block.
2. Rank card copy rules (`Top X%` / `Ahead of X%`, emerald/saffron) — Task 4 rank card.
3. Gap card copy (`X% below the 2025 closing merit (82%)` + action hint; `above the closing line ✓`; stream top-25% hook) — Task 4 `gapCard`.
4. Three empty states (no marks → link to /profile; empty watchlist → stream mode; no myMerit → rank/gap prompts) — Task 4 widget branches + Task 3 stream fallback.
5. Footer disclaimer — Task 4 footer.
6. No API endpoint, no localStorage — verified: the widget only imports `benchmarkFor` (pure math) and `useStudent`.
7. Full-width placement after the aggregates grid — Task 5.

If any check fails, fix it, re-run the four gates, and commit the fix.

- [ ] **Step 6: Commit any stragglers**

```bash
git add -A
git commit -m "chore(benchmark): final gates verification" --allow-empty
```

(Only if there are uncommitted changes; an empty commit is acceptable to mark the gate pass.)

---

## Notes / Deviations from the spec (all within approved scope)

- `programCohort`/`streamCohort` take only the distribution inputs (`closingMerit` / nothing) and return bins — label, year, and user data are assembled by `benchmarkFor` (the spec diagram listed `program`/`stream` params; they don't affect the math).
- `BenchmarkCohort` gains `topQuartile: number | null` (stream mode only) — the spec's stream-mode hook copy needs it, and the shape is the documented seam.
- The spec's formula line was corrected from `gap / weight * total` (which yields 880 for the NUST example) to `gap × total / (100 × weight)` (yields the spec's pinned 8.8 → 9). Committed as `313ceb0`.
- KEMC-style high closings clip mass into the top bin — the test asserts the peak lands at `[95,100]` (honest model behavior), not "near closingMerit − 1".
