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
