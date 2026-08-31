import { describe, expect, it } from "vitest";
import { abroadChatbotKnowledge } from "@/data/abroad-chatbot-knowledge";

describe("abroad-chatbot-knowledge.ts", () => {
  it("has a YYYY-MM-DD updatedAt", () => {
    expect(abroadChatbotKnowledge.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("has an updatedAt recent enough to quote to students", () => {
    // Retrieval prints this date into Safar's prompt so he can date his
    // hedges — a forgotten bump makes every hedge sound fresher than it is.
    const days =
      (Date.now() - Date.parse(`${abroadChatbotKnowledge.updatedAt}T00:00:00Z`)) / 86_400_000;
    expect(days, "re-review the facts and bump updatedAt").toBeLessThan(120);
    expect(days).toBeGreaterThan(-1);
  });

  it("has at least 8 topics with unique ids", () => {
    expect(abroadChatbotKnowledge.topics.length).toBeGreaterThanOrEqual(8);
    const ids = abroadChatbotKnowledge.topics.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every topic has a title and at least 3 facts", () => {
    for (const t of abroadChatbotKnowledge.topics) {
      expect(t.title.length, t.id).toBeGreaterThan(2);
      expect(t.facts.length, t.id).toBeGreaterThanOrEqual(3);
    }
  });

  it("every fact has a substantive text and an https source URL", () => {
    for (const t of abroadChatbotKnowledge.topics) {
      for (const f of t.facts) {
        expect(f.text.length, t.id).toBeGreaterThan(20);
        expect(f.source.startsWith("https://"), `${t.id}:${f.source}`).toBe(true);
      }
    }
  });

  it("has an ivy-league topic with 6-10 facts", () => {
    const topic = abroadChatbotKnowledge.topics.find((t) => t.id === "ivy-league");
    expect(topic, "ivy-league topic").toBeDefined();
    expect(topic!.title).toBe("Ivy League Admissions");
    expect(topic!.facts.length).toBeGreaterThanOrEqual(6);
    expect(topic!.facts.length).toBeLessThanOrEqual(10);
  });
});
