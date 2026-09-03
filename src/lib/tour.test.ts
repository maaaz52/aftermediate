import { describe, it, expect } from "vitest";
import { chapters } from "./tour";
import { groups } from "@/components/sidebar";

const navRoutes = new Set(groups.flatMap((g) => g.links.map((l) => l.href)));

describe("tour data integrity", () => {
  it("has exactly 4 chapters with unique ids", () => {
    expect(chapters).toHaveLength(4);
    expect(new Set(chapters.map((c) => c.id)).size).toBe(4);
  });

  it("every chapter has 5-7 steps", () => {
    for (const ch of chapters) {
      expect(ch.steps.length, `${ch.id} step count`).toBeGreaterThanOrEqual(5);
      expect(ch.steps.length, `${ch.id} step count`).toBeLessThanOrEqual(7);
    }
  });

  it("every step has a data-tour target, title and body", () => {
    for (const ch of chapters) {
      for (const [i, step] of ch.steps.entries()) {
        expect(step.target, `${ch.id}[${i}] target`).toMatch(/^\[data-tour="/);
        expect(step.title.trim(), `${ch.id}[${i}] title`).not.toBe("");
        expect(step.body.trim(), `${ch.id}[${i}] body`).not.toBe("");
      }
    }
  });

  it("every step route exists in the sidebar nav", () => {
    for (const ch of chapters) {
      for (const [i, step] of ch.steps.entries()) {
        if (step.route === undefined) continue;
        expect(navRoutes.has(step.route), `${ch.id}[${i}] route ${step.route}`).toBe(true);
      }
    }
  });

  it("step targets are unique across all chapters", () => {
    const targets = chapters.flatMap((c) => c.steps.map((s) => s.target));
    expect(new Set(targets).size).toBe(targets.length);
  });

  it("has 23 steps across all chapters", () => {
    expect(chapters.reduce((n, c) => n + c.steps.length, 0)).toBe(23);
  });
});
