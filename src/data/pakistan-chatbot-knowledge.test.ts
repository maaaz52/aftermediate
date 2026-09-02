import { describe, expect, it } from "vitest";
import { pakistanChatbotKnowledge } from "@/data/pakistan-chatbot-knowledge";

const { topics, updatedAt } = pakistanChatbotKnowledge;
const AUTHORED = [
  "choosing-where-to-apply",
  "merit-strategy",
  "scholarship-strategy",
  "admission-safety",
];

describe("pakistanChatbotKnowledge", () => {
  it("carries a reviewed date the prompt can print", () => {
    expect(updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("merges the derived topics with the four authored ones", () => {
    const ids = topics.map((t) => t.id);
    expect(ids).toContain("uni-nust");
    expect(ids).toContain("test-mdcat");
    expect(ids).toContain("scholarships-hec");
    for (const id of AUTHORED) expect(ids).toContain(id);
  });

  it("gives every authored topic real substance", () => {
    for (const id of AUTHORED) {
      const topic = topics.find((t) => t.id === id)!;
      expect(topic.facts.length, id).toBeGreaterThanOrEqual(3);
      for (const fact of topic.facts) {
        expect(fact.text.length, id).toBeGreaterThan(60);
      }
    }
  });

  it("sources every fact in the whole base over https", () => {
    for (const topic of topics) {
      for (const fact of topic.facts) {
        expect(fact.source, `${topic.id}: ${fact.text.slice(0, 40)}`).toMatch(/^https:\/\//);
      }
    }
  });

  it("keeps every fact in the whole base short enough for a prompt", () => {
    // Retrieved facts are printed into the system prompt verbatim, so a
    // runaway derived fact inflates every request that retrieves it.
    for (const topic of topics) {
      for (const fact of topic.facts) {
        expect(fact.text.length, `${topic.id}: ${fact.text.slice(0, 40)}`).toBeLessThan(900);
      }
    }
  });

  it("uses a unique id per topic", () => {
    const ids = topics.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
