import { describe, expect, it } from "vitest";
import { skillsChatbotKnowledge } from "./skills-chatbot-knowledge";

describe("skills-chatbot-knowledge.ts", () => {
  it("has a YYYY-MM-DD updatedAt", () => {
    expect(skillsChatbotKnowledge.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("has at least 15 topics with unique ids and titles", () => {
    expect(skillsChatbotKnowledge.topics.length).toBeGreaterThanOrEqual(15);
    const ids = skillsChatbotKnowledge.topics.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of skillsChatbotKnowledge.topics) {
      expect(t.title.length, t.id).toBeGreaterThan(2);
      expect(t.facts.length, t.id).toBeGreaterThanOrEqual(3);
    }
  });

  it("every fact has substantive text and an https source URL", () => {
    for (const t of skillsChatbotKnowledge.topics) {
      for (const f of t.facts) {
        expect(f.text.length, `${t.id}`).toBeGreaterThan(40);
        expect(f.source.startsWith("https://"), `${t.id}:${f.source}`).toBe(true);
      }
    }
  });

  it("has at least 3 topics covering pricing", () => {
    const n = skillsChatbotKnowledge.topics.filter((t) => t.id.includes("pricing")).length;
    expect(n).toBeGreaterThanOrEqual(3);
  });

  it("has at least 3 topics covering getting paid from Pakistan", () => {
    const n = skillsChatbotKnowledge.topics.filter(
      (t) => t.id.includes("paid") || t.id.includes("payout") || t.id.includes("payment")
    ).length;
    expect(n).toBeGreaterThanOrEqual(3);
  });

  it("has at least 3 topics covering portfolios", () => {
    const n = skillsChatbotKnowledge.topics.filter((t) => t.id.includes("portfolio")).length;
    expect(n).toBeGreaterThanOrEqual(3);
  });
});
