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
