import { describe, expect, it } from "vitest";
import { deriveUniversityTopics } from "@/lib/pakistan-facts";
import universitiesJson from "@/data/pakistan-universities.json";

const universities = universitiesJson.universities;

describe("deriveUniversityTopics", () => {
  const topics = deriveUniversityTopics();

  it("produces one topic per university in the dataset", () => {
    expect(topics).toHaveLength(universities.length);
    expect(topics.map((t) => t.id)).toContain("uni-nust");
  });

  it("gives every topic a title and at least one fact", () => {
    for (const topic of topics) {
      expect(topic.title.length, topic.id).toBeGreaterThan(0);
      expect(topic.facts.length, topic.id).toBeGreaterThan(0);
    }
  });

  it("names its subject in every fact, so BM25 can reach it", () => {
    // topicId is metadata and does not participate in matching: a fact that
    // does not say which university it describes is unreachable by any query.
    for (const uni of universities) {
      const topic = topics.find((t) => t.id === `uni-${uni.id}`);
      expect(topic, uni.id).toBeDefined();
      for (const fact of topic!.facts) {
        expect(fact.text, `${uni.id}: "${fact.text.slice(0, 60)}…"`).toContain(uni.short);
      }
    }
  });

  it("carries an https source on every fact", () => {
    for (const topic of topics) {
      for (const fact of topic.facts) {
        expect(fact.source, `${topic.id}: ${fact.text.slice(0, 40)}`).toMatch(/^https:\/\//);
      }
    }
  });

  it("states fees, admission steps and strengths for NUST", () => {
    const nust = topics.find((t) => t.id === "uni-nust")!;
    const all = nust.facts.map((f) => f.text).join(" ");
    expect(all).toContain("216,750");
    expect(all).toContain("NET");
    expect(all).toContain("SEECS");
  });

  it("keeps every fact short enough to sit in a prompt", () => {
    for (const topic of topics) {
      for (const fact of topic.facts) {
        expect(fact.text.length, `${topic.id}: ${fact.text.slice(0, 40)}`).toBeLessThan(900);
      }
    }
  });
});
