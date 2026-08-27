import { monthlyLivingTotal } from "./abroad-filters";
import type {
  AbroadCountry,
  AbroadTest,
  CityTier,
  DegreeLevel,
  Lifestyle,
} from "./types";

export const LIFESTYLE_MULTIPLIERS: Record<Lifestyle, number> = {
  frugal: 0.85,
  moderate: 1,
  comfortable: 1.25,
};

export interface FirstYearBreakdown {
  tuition: number;
  living: number;
  visaFee: number;
  applicationFee: number;
  insurance: number;
  flight: number;
  testFees: number;
  total: number;
}

/**
 * First-year cost breakdown in PKR.
 * `tuitionT` is a 0..1 position on the chosen level's tuition range (clamped).
 * `tests` is the full abroad-tests list; fees are summed only for the
 * country's `requiredTests` ids.
 */
export function firstYearCost(
  c: AbroadCountry,
  level: DegreeLevel,
  tier: CityTier,
  lifestyle: Lifestyle,
  tuitionT: number,
  tests: AbroadTest[]
): FirstYearBreakdown {
  const range = c.tuition[level];
  const t = Math.min(1, Math.max(0, tuitionT));
  const tuition = Math.round(range.min + t * (range.max - range.min));
  const living = Math.round(monthlyLivingTotal(c, tier) * 12 * LIFESTYLE_MULTIPLIERS[lifestyle]);
  const testFees = tests
    .filter((test) => c.requiredTests.includes(test.id))
    .reduce((sum, test) => sum + test.feePkr, 0);
  const breakdown = {
    tuition,
    living,
    visaFee: c.visa.feePkr,
    applicationFee: c.oneTime.applicationFee,
    insurance: c.oneTime.insurance,
    flight: c.oneTime.flight,
    testFees,
  };
  return { ...breakdown, total: Object.values(breakdown).reduce((a, b) => a + b, 0) };
}

/**
 * Year-by-year total cost: tuition inflates annually, non-tuition costs stay flat.
 * Year 1 equals `breakdown.total`.
 */
export function yearlyProjection(
  breakdown: FirstYearBreakdown,
  years = 4,
  tuitionInflation = 0.06
): number[] {
  const nonTuition = breakdown.total - breakdown.tuition;
  return Array.from({ length: years }, (_, y) =>
    Math.round(breakdown.tuition * Math.pow(1 + tuitionInflation, y) + nonTuition)
  );
}

/**
 * Months needed to save `targetPkr` at `monthlySavingsPkr`/month.
 * Returns null when monthly savings are zero or negative.
 */
export function savingsTimeline(
  monthlySavingsPkr: number,
  targetPkr: number
): { months: number; yearsMonths: string } | null {
  if (monthlySavingsPkr <= 0) return null;
  if (targetPkr <= 0) return { months: 0, yearsMonths: "already saved" };
  const months = Math.ceil(targetPkr / monthlySavingsPkr);
  const years = Math.floor(months / 12);
  const rem = months % 12;
  const yearsMonths =
    years === 0
      ? `${rem} month${rem === 1 ? "" : "s"}`
      : rem === 0
        ? `${years} year${years === 1 ? "" : "s"}`
        : `${years} year${years === 1 ? "" : "s"} ${rem} month${rem === 1 ? "" : "s"}`;
  return { months, yearsMonths };
}

/** Formats PKR in the site's k/M notation, e.g. 6000000 -> "PKR 6M", 850000 -> "PKR 850k". */
export function formatPkr(n: number): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const fmt = (v: number) => String(Math.round(v * 10) / 10);
  if (abs >= 1_000_000) return `${sign}PKR ${fmt(abs / 1_000_000)}M`;
  if (abs >= 1_000) {
    const s = fmt(abs / 1_000);
    if (s === "1000") return `${sign}PKR ${fmt(abs / 1_000_000)}M`;
    return `${sign}PKR ${s}k`;
  }
  return `${sign}PKR ${Math.round(abs).toLocaleString()}`;
}
