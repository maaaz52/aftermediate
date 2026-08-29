import { describe, expect, it } from "vitest";
import json from "./college-essays.json";

interface Source {
  label: string;
  url: string;
}
interface Sourced {
  sources: Source[];
}

const data = json as unknown as {
  explainer: {
    sections: (Sourced & { id: string; title: string; body: string })[];
    criteria: (Sourced & { id: string; title: string; weight: "high" | "medium"; detail: string })[];
    beforeAfter: { weak: { title: string; paragraphs: string[] }; strong: { title: string; paragraphs: string[] }; notes: { label: string; detail: string }[] };
    myths: (Sourced & { id: string; myth: string; fact: string })[];
  };
  quiz: { id: string; question: string; options: { label: string; correct: boolean }[]; explanation: string; source: Source }[];
  dragDrop: { zones: { id: string; label: string }[]; items: { id: string; text: string; zone: string; explanation: string }[] };
  inspiration: { id: string; title: string; program: string; backstory: string; excerpt: string; whyItWorks: string; sourceLabel: string; sourceUrl: string }[];
  guide: {
    steps: (Sourced & { id: "brainstorm" | "outline" | "draft" | "revise"; title: string; summary: string; tools: string[] })[];
    starters: (Sourced & { id: string; part: "hook" | "transition" | "reflection" | "closing"; text: string })[];
    templates: (Sourced & { id: "narrative-arc" | "challenge-growth" | "topic-deep-dive"; name: string; bestFor: string; skeleton: string[] })[];
    ideaPrompts: (Sourced & { id: string; text: string })[];
  };
  builderPresets: { universities: string[]; majors: string[]; extracurriculars: string[] };
};

const isHttps = (u: string) => u.startsWith("https://");

describe("college-essays.json", () => {
  it("explainer has >=4 sections, 5 criteria, >=4 myths, and before/after content", () => {
    expect(data.explainer.sections.length).toBeGreaterThanOrEqual(4);
    expect(data.explainer.criteria).toHaveLength(5);
    expect(data.explainer.myths.length).toBeGreaterThanOrEqual(4);
    expect(data.explainer.beforeAfter.weak.paragraphs.length).toBeGreaterThanOrEqual(2);
    expect(data.explainer.beforeAfter.strong.paragraphs.length).toBeGreaterThanOrEqual(2);
    expect(data.explainer.beforeAfter.notes.length).toBeGreaterThanOrEqual(3);
  });

  it("quiz has exactly 5 questions with 4 options and a correct answer each", () => {
    expect(data.quiz).toHaveLength(5);
    for (const q of data.quiz) {
      expect(q.options).toHaveLength(4);
      expect(q.options.some((o) => o.correct)).toBe(true);
      expect(q.question.trim().length).toBeGreaterThan(10);
      expect(q.explanation.trim().length).toBeGreaterThan(10);
      expect(isHttps(q.source.url)).toBe(true);
    }
  });

  it("dragDrop has exactly 2 zones and >=6 items referencing valid zones", () => {
    expect(data.dragDrop.zones.map((z) => z.id)).toEqual(["strong-hook", "weak-hook"]);
    expect(data.dragDrop.items.length).toBeGreaterThanOrEqual(6);
    const zoneIds = new Set(data.dragDrop.zones.map((z) => z.id));
    for (const item of data.dragDrop.items) {
      expect(zoneIds.has(item.zone), item.id).toBe(true);
      expect(item.explanation.trim().length).toBeGreaterThan(10);
    }
    expect(data.dragDrop.items.some((i) => i.zone === "strong-hook")).toBe(true);
    expect(data.dragDrop.items.some((i) => i.zone === "weak-hook")).toBe(true);
  });

  it("inspiration has 6-8 entries with https links and full content", () => {
    expect(data.inspiration.length).toBeGreaterThanOrEqual(6);
    expect(data.inspiration.length).toBeLessThanOrEqual(8);
    for (const e of data.inspiration) {
      expect(isHttps(e.sourceUrl), e.id).toBe(true);
      expect(e.backstory.trim().length).toBeGreaterThan(30);
      expect(e.excerpt.trim().length).toBeGreaterThan(50);
      expect(e.whyItWorks.trim().length).toBeGreaterThan(30);
      expect(e.sourceLabel.trim().length).toBeGreaterThan(3);
    }
  });

  it("guide has exactly 4 steps in order with valid tools", () => {
    expect(data.guide.steps.map((s) => s.id)).toEqual(["brainstorm", "outline", "draft", "revise"]);
    const TOOLS = ["idea-generator", "inventory", "templates", "starters", "analyzer"];
    for (const s of data.guide.steps) {
      for (const t of s.tools) expect(TOOLS).toContain(t);
    }
  });

  it("guide has exactly 3 templates with >=4 skeleton slots", () => {
    expect(data.guide.templates.map((t) => t.id)).toEqual(["narrative-arc", "challenge-growth", "topic-deep-dive"]);
    for (const t of data.guide.templates) {
      expect(t.skeleton.length).toBeGreaterThanOrEqual(4);
      expect(t.bestFor.trim().length).toBeGreaterThan(10);
    }
  });

  it("guide has >=10 starters covering all 4 parts and >=8 idea prompts", () => {
    expect(data.guide.starters.length).toBeGreaterThanOrEqual(10);
    expect(new Set(data.guide.starters.map((s) => s.part))).toEqual(new Set(["hook", "transition", "reflection", "closing"]));
    expect(data.guide.ideaPrompts.length).toBeGreaterThanOrEqual(8);
  });

  it("every sourced block has at least one https source", () => {
    const blocks: Sourced[] = [
      ...data.explainer.sections,
      ...data.explainer.criteria,
      ...data.explainer.myths,
      ...data.guide.steps,
      ...data.guide.starters,
      ...data.guide.templates,
      ...data.guide.ideaPrompts,
    ];
    for (const b of blocks) {
      expect(b.sources.length, b.id).toBeGreaterThanOrEqual(1);
      for (const s of b.sources) {
        expect(s.label.trim().length).toBeGreaterThan(3);
        expect(isHttps(s.url), b.id).toBe(true);
      }
    }
  });

  it("builderPresets meet minimum sizes", () => {
    expect(data.builderPresets.universities.length).toBeGreaterThanOrEqual(8);
    expect(data.builderPresets.majors.length).toBeGreaterThanOrEqual(5);
    expect(data.builderPresets.extracurriculars.length).toBeGreaterThanOrEqual(5);
  });

  it("has no duplicate ids across all blocks", () => {
    const ids = [
      ...data.explainer.sections.map((x) => x.id),
      ...data.explainer.criteria.map((x) => x.id),
      ...data.explainer.myths.map((x) => x.id),
      ...data.quiz.map((x) => x.id),
      ...data.dragDrop.items.map((x) => x.id),
      ...data.inspiration.map((x) => x.id),
      ...data.guide.steps.map((x) => x.id),
      ...data.guide.starters.map((x) => x.id),
      ...data.guide.templates.map((x) => x.id),
      ...data.guide.ideaPrompts.map((x) => x.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });
});
