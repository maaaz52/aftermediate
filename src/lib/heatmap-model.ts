// ── Types ──

export interface HeatmapTestConfig {
  id: string;
  name: string;
  shortName: string;
  totalQuestionsPerYear: number;
  years: string[];
  sections: HeatmapSection[];
}

export interface HeatmapSection {
  id: string;
  name: string;
  totalQuestions: number;
  chapters: HeatmapChapter[];
}

export interface HeatmapChapter {
  id: string;
  name: string;
  appearances3yr: number;
  appearances5yr: number;
  appearances10yr: number;
  trend: "up" | "down" | "stable";
  practiceCount?: number;
}

export interface ComputedHeatmap {
  sections: ComputedSection[];
  overallProbability: number;
  testName: string;
  testYears: string[];
}

export interface ComputedSection {
  id: string;
  name: string;
  totalQuestions: number;
  chapters: ComputedChapter[];
  sectionProbability: number;
}

export interface ComputedChapter {
  id: string;
  name: string;
  probability: number;
  tier: "danger" | "amber" | "emerald";
  trend: "up" | "down" | "stable";
  appearances3yr: number;
  appearances5yr: number;
  appearances10yr: number;
}

export type Stream = "pre-medical" | "pre-engineering" | "ics" | "icom" | "alevel" | null;

// ── Constants ──

const DANGER_THRESHOLD = 0.03;
const EMERALD_THRESHOLD = 0.09;
const TREND_UP_RATIO = 1.2;
const TREND_DOWN_RATIO = 0.8;
const DEFAULT_SMOOTHING = 1;

// ── Helpers ──

export function getTier(probability: number): "danger" | "amber" | "emerald" {
  if (probability < DANGER_THRESHOLD) return "danger";
  if (probability > EMERALD_THRESHOLD) return "emerald";
  return "amber";
}

export function getTrend(
  recent3yrAvg: number,
  older7yrAvg: number
): "up" | "down" | "stable" {
  if (recent3yrAvg > older7yrAvg * TREND_UP_RATIO) return "up";
  if (recent3yrAvg < older7yrAvg * TREND_DOWN_RATIO) return "down";
  return "stable";
}

export function getStreamTest(stream: Stream): string | null {
  switch (stream) {
    case "pre-medical":
      return "mdcat";
    case "pre-engineering":
    case "ics":
      return "ecat";
    default:
      return null;
  }
}

// ── Main computation ──

export function computeHeatmap(
  config: HeatmapTestConfig,
  options?: { smoothing?: number }
): ComputedHeatmap {
  const smoothing = options?.smoothing ?? DEFAULT_SMOOTHING;

  const sections: ComputedSection[] = config.sections.map((section) => {
    const weightedSum = section.chapters.reduce(
      (sum, ch) =>
        sum +
        ch.appearances3yr * 3 +
        ch.appearances5yr * 2 +
        ch.appearances10yr * 1,
      0
    );

    const chapterCount = section.chapters.length;
    const denom = weightedSum + smoothing * chapterCount;

    const chapters: ComputedChapter[] = section.chapters.map((ch) => {
      const chapterWeighted =
        ch.appearances3yr * 3 +
        ch.appearances5yr * 2 +
        ch.appearances10yr * 1;
      const probability = (chapterWeighted + smoothing) / denom;

      return {
        id: ch.id,
        name: ch.name,
        probability,
        tier: getTier(probability),
        trend: ch.trend,
        appearances3yr: ch.appearances3yr,
        appearances5yr: ch.appearances5yr,
        appearances10yr: ch.appearances10yr,
      };
    });

    const sectionProbability =
      chapters.reduce((sum, ch) => sum + ch.probability, 0) / chapterCount;

    return {
      id: section.id,
      name: section.name,
      totalQuestions: section.totalQuestions,
      chapters,
      sectionProbability,
    };
  });

  const overallProbability =
    sections.reduce((sum, s) => sum + s.sectionProbability, 0) /
    sections.length;

  return {
    sections,
    overallProbability,
    testName: config.name,
    testYears: config.years,
  };
}
