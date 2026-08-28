import { describe, expect, it } from "vitest";
import json from "@/data/ivy-strategy.json";

type TimelinePhase = {
  id: string;
  phase: string;
  title: string;
  steps: string[];
  sourceUrls?: string[];
};
type StrategySection = { tips: string[]; sourceUrls: string[] };
type StrategyData = {
  timeline: TimelinePhase[];
  essays: StrategySection;
  recommendations: StrategySection;
  interviews: StrategySection;
};

const data = json as unknown as StrategyData;

/** Fixed chronological order of the grade-based timeline phases. */
const CHRONOLOGICAL_IDS = ["fsc-year-1", "fsc-year-2", "application-summer", "final-year"] as const;

function collectSourceUrlGroups(): { label: string; urls: string[] }[] {
  const groups: { label: string; urls: string[] }[] = [];
  data.timeline.forEach((phase, i) => {
    if (phase.sourceUrls) groups.push({ label: `timeline[${i}] (${phase.id}).sourceUrls`, urls: phase.sourceUrls });
  });
  groups.push({ label: "essays.sourceUrls", urls: data.essays.sourceUrls });
  groups.push({ label: "recommendations.sourceUrls", urls: data.recommendations.sourceUrls });
  groups.push({ label: "interviews.sourceUrls", urls: data.interviews.sourceUrls });
  return groups;
}

describe("ivy-strategy.json", () => {
  it("timeline has at least 4 phases with unique ids and required fields", () => {
    expect(data.timeline.length).toBeGreaterThanOrEqual(4);
    const ids = data.timeline.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of data.timeline) {
      expect(p.id.length, p.id).toBeGreaterThan(1);
      expect(p.phase.length, p.id).toBeGreaterThan(1);
      expect(p.title.length, p.id).toBeGreaterThan(1);
    }
  });

  it("every timeline phase has 3-6 concrete, non-empty steps", () => {
    for (const p of data.timeline) {
      expect(p.steps.length, p.id).toBeGreaterThanOrEqual(3);
      expect(p.steps.length, p.id).toBeLessThanOrEqual(6);
      for (const step of p.steps) expect(step.length, p.id).toBeGreaterThan(20);
    }
  });

  it("timeline phases appear in chronological order", () => {
    const ids = data.timeline.map((p) => p.id);
    expect(ids).toEqual([...CHRONOLOGICAL_IDS]);
  });

  it("essays, recommendations and interviews each have non-empty tips arrays", () => {
    for (const [name, section] of Object.entries({
      essays: data.essays,
      recommendations: data.recommendations,
      interviews: data.interviews,
    })) {
      expect(section.tips.length, name).toBeGreaterThanOrEqual(4);
      for (const tip of section.tips) expect(tip.length, name).toBeGreaterThan(20);
    }
  });

  it("every sourceUrls array in the file is non-empty and contains only https URLs", () => {
    for (const group of collectSourceUrlGroups()) {
      expect(group.urls.length, group.label).toBeGreaterThan(0);
      for (const url of group.urls) {
        expect(url.startsWith("https://"), `${group.label}: ${url}`).toBe(true);
      }
    }
  });
});
