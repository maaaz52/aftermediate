import { describe, expect, it } from "vitest";
import json from "./skills-client-playbook.json";

const SECTION_IDS = ["kickoff", "contracts", "pricing", "difficult", "delivery"] as const;
const TYPES = ["template", "script", "rule", "framework"] as const;

interface PlaybookCard {
  id: string;
  type: (typeof TYPES)[number];
  title: string;
  body: string;
  tags: string[];
}

interface PlaybookSection {
  id: (typeof SECTION_IDS)[number];
  title: string;
  intro: string;
  cards: PlaybookCard[];
}

const playbook = json as unknown as { sections: PlaybookSection[] };

describe("skills-client-playbook.json", () => {
  it("has exactly the 5 expected sections in order", () => {
    expect(playbook.sections.map((s) => s.id)).toEqual([...SECTION_IDS]);
  });

  it("every section has a title and intro", () => {
    for (const s of playbook.sections) {
      expect(s.title.length, s.id).toBeGreaterThan(3);
      expect(s.intro.length, s.id).toBeGreaterThan(20);
    }
  });

  it("every section has at least 3 cards and the file has at least 18 total", () => {
    const total = playbook.sections.reduce((n, s) => n + s.cards.length, 0);
    expect(total).toBeGreaterThanOrEqual(18);
    for (const s of playbook.sections) {
      expect(s.cards.length, s.id).toBeGreaterThanOrEqual(3);
    }
  });

  it("every card has a unique id, valid type, substantive body, and tags", () => {
    const ids: string[] = [];
    for (const s of playbook.sections) {
      for (const c of s.cards) {
        expect(TYPES, `${s.id}:${c.id}`).toContain(c.type);
        expect(c.title.length, c.id).toBeGreaterThan(3);
        expect(c.body.length, c.id).toBeGreaterThan(80);
        expect(c.tags.length, c.id).toBeGreaterThanOrEqual(1);
        ids.push(c.id);
      }
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every section has at least one template and one script card", () => {
    for (const s of playbook.sections) {
      expect(s.cards.filter((c) => c.type === "template").length, `${s.id}:template`).toBeGreaterThanOrEqual(1);
      expect(s.cards.filter((c) => c.type === "script").length, `${s.id}:script`).toBeGreaterThanOrEqual(1);
    }
  });
});
