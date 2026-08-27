import type { Marks } from "./types";

export function pct(obtained: number, total: number): number {
  if (!total) return 0;
  return (obtained / total) * 100;
}

export interface AggregateResult {
  name: string;
  value: number;
  breakdown: { component: string; weight: number; contribution: number; note: string }[];
  note: string;
}

/**
 * NUST: 75% NET + 15% FSc Part-I + 10% Matric
 */
export function nustAggregate(m: Marks): AggregateResult {
  const netPct = pct(m.entryTestObtained ?? 0, m.entryTestTotal ?? 200);
  const fscPct = pct(m.fscPart1Obtained ?? m.fscObtained, m.fscPart1Total ?? m.fscTotal);
  const matPct = pct(m.matricObtained, m.matricTotal);

  const net = netPct * 0.75;
  const fsc = fscPct * 0.15;
  const mat = matPct * 0.1;
  const value = net + fsc + mat;

  return {
    name: "NUST",
    value,
    breakdown: [
      { component: "NET (entry test)", weight: 75, contribution: net, note: `${netPct.toFixed(1)}% of 200` },
      { component: "FSc Part-I", weight: 15, contribution: fsc, note: `${fscPct.toFixed(1)}%` },
      { component: "Matric", weight: 10, contribution: mat, note: `${matPct.toFixed(1)}%` },
    ],
    note: "NET carries 75% — a 10-mark NET jump raises your aggregate by 3.75%.",
  };
}

/**
 * FAST computing: 50% test + 40% HSSC + 10% SSC
 */
export function fastAggregate(m: Marks, engineering = false): AggregateResult {
  const testPct = pct(m.entryTestObtained ?? 0, m.entryTestTotal ?? 100);
  const fscPct = pct(m.fscObtained, m.fscTotal);
  const matPct = pct(m.matricObtained, m.matricTotal);

  const tw = engineering ? 33 : 50;
  const fw = engineering ? 50 : 40;
  const mw = engineering ? 17 : 10;

  const test = testPct * (tw / 100);
  const fsc = fscPct * (fw / 100);
  const mat = matPct * (mw / 100);
  const value = test + fsc + mat;

  return {
    name: `FAST (${engineering ? "Engineering" : "Computing"})`,
    value,
    breakdown: [
      { component: "Entry test", weight: tw, contribution: test, note: `${testPct.toFixed(1)}%` },
      { component: "HSSC / FSc", weight: fw, contribution: fsc, note: `${fscPct.toFixed(1)}%` },
      { component: "SSC / Matric", weight: mw, contribution: mat, note: `${matPct.toFixed(1)}%` },
    ],
    note: engineering ? "Engineering uses a 33/50/17 split." : "Computing uses a 50/40/10 split.",
  };
}

/**
 * PMDC medical aggregate: 50% MDCAT + 40% HSSC + 10% SSC
 */
export function mdcatAggregate(m: Marks): AggregateResult {
  const testPct = pct(m.entryTestObtained ?? 0, m.entryTestTotal ?? 200);
  const fscPct = pct(m.fscObtained, m.fscTotal);
  const matPct = pct(m.matricObtained, m.matricTotal);

  const test = testPct * 0.5;
  const fsc = fscPct * 0.4;
  const mat = matPct * 0.1;
  const value = test + fsc + mat;

  return {
    name: "Medical (PMDC)",
    value,
    breakdown: [
      { component: "MDCAT", weight: 50, contribution: test, note: `${testPct.toFixed(1)}%` },
      { component: "FSc / HSSC", weight: 40, contribution: fsc, note: `${fscPct.toFixed(1)}%` },
      { component: "Matric", weight: 10, contribution: mat, note: `${matPct.toFixed(1)}%` },
    ],
    note: "Top public colleges close at 91–96% aggregate.",
  };
}

export function mdcatPercentile(aggregate: number): { percentile: number; band: string } {
  // Approximate mapping of medical aggregate to candidate percentile.
  // Derived from the fact that only ~10-12% of ~180k candidates secure a seat
  // and top colleges close at 91-96%.
  if (aggregate >= 95) return { percentile: 99, band: "Top 1%" };
  if (aggregate >= 93) return { percentile: 98, band: "Top 2%" };
  if (aggregate >= 91) return { percentile: 96, band: "Top 4%" };
  if (aggregate >= 88) return { percentile: 90, band: "Top 10%" };
  if (aggregate >= 84) return { percentile: 75, band: "Top 25%" };
  if (aggregate >= 80) return { percentile: 55, band: "Top 45%" };
  if (aggregate >= 75) return { percentile: 35, band: "Top 65%" };
  return { percentile: 20, band: "Lower 20%" };
}

export function worthScore(input: {
  fscPct: number;
  certifications: number;
  projects: number;
  english: number;
  consistency: number;
}): { score: number; label: string; breakdown: { key: string; value: number; weight: number }[] } {
  const fsc = Math.min(100, input.fscPct) * 0.35;
  const certs = Math.min(100, input.certifications * 25) * 0.25;
  const projects = Math.min(100, input.projects * 25) * 0.2;
  const english = Math.min(100, input.english * 20) * 0.1;
  const consistency = Math.min(100, input.consistency * 20) * 0.1;
  const score = Math.round(fsc + certs + projects + english + consistency);

  let label = "Early stage";
  if (score >= 75) label = "High potential";
  else if (score >= 55) label = "Building momentum";
  else if (score >= 35) label = "Emerging";

  return {
    score,
    label,
    breakdown: [
      { key: "Academics (FSc)", value: Math.round(fsc), weight: 35 },
      { key: "Certifications", value: Math.round(certs), weight: 25 },
      { key: "Projects / XP", value: Math.round(projects), weight: 20 },
      { key: "English", value: Math.round(english), weight: 10 },
      { key: "Consistency", value: Math.round(consistency), weight: 10 },
    ],
  };
}

export interface Standing {
  value: number; // 0-100 weighted score
  percentile: number; // approximate national percentile rank
  label: string; // "top 12%" style band
}

/**
 * Coarse "overall standing": FSc 60% + Matric 40%, marks only.
 * Entry test intentionally ignored — this is the pre-test ballpark.
 */
export function overallStanding(m: Marks): Standing {
  const fscPct = pct(m.fscObtained, m.fscTotal);
  const matPct = pct(m.matricObtained, m.matricTotal);
  const value = fscPct * 0.6 + matPct * 0.4;

  if (value >= 95) return { value, percentile: 99, label: "top 1%" };
  if (value >= 90) return { value, percentile: 95, label: "top 5%" };
  if (value >= 85) return { value, percentile: 90, label: "top 10%" };
  if (value >= 80) return { value, percentile: 80, label: "top 20%" };
  if (value >= 70) return { value, percentile: 60, label: "top 40%" };
  if (value >= 60) return { value, percentile: 40, label: "top 60%" };
  return { value, percentile: 20, label: "top 80%" };
}
