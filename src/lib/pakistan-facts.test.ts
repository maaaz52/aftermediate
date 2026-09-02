import { describe, expect, it } from "vitest";
import { deriveEntryTestTopics, deriveScholarshipTopics, deriveUniversityTopics } from "@/lib/pakistan-facts";
import universitiesJson from "@/data/pakistan-universities.json";
import entryTestsJson from "@/data/entry-tests.json";
import scholarshipsJson from "@/data/pakistan-scholarships.json";

const universities = universitiesJson.universities;
const tests = entryTestsJson.tests;
const scholarships = scholarshipsJson.scholarships;

describe("the derived corpus as a whole", () => {
  const topics = [...deriveUniversityTopics(), ...deriveEntryTestTopics(), ...deriveScholarshipTopics()];

  it("never renders a missing JSON field as the word 'undefined'", () => {
    // These strings are pasted verbatim into the model's prompt as sourced
    // facts. An optional field that goes missing must drop out of the sentence,
    // never surface as "undefined questions, undefined marks".
    for (const topic of topics) {
      expect(topic.title, topic.id).not.toMatch(/\bundefined\b/);
      for (const fact of topic.facts) {
        expect(fact.text, `${topic.id}: ${fact.text.slice(0, 120)}`).not.toMatch(/\bundefined\b/);
        expect(fact.source, topic.id).not.toMatch(/\bundefined\b/);
      }
    }
  });
});

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
    // 433,500 is the NUST programFees perYear value and reaches fact text only
    // through programLines — asserting on the summary figure alone would let
    // the whole per-programme block be deleted with the test still green.
    expect(all).toContain("433,500");
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

describe("deriveEntryTestTopics", () => {
  const topics = deriveEntryTestTopics();

  it("produces one topic per entry test", () => {
    expect(topics).toHaveLength(tests.length);
    expect(topics.map((t) => t.id)).toContain("test-mdcat");
  });

  it("names its subject in every fact", () => {
    for (const test of tests) {
      const topic = topics.find((t) => t.id === `test-${test.id}`);
      expect(topic, test.id).toBeDefined();
      for (const fact of topic!.facts) {
        expect(fact.text, `${test.id}: "${fact.text.slice(0, 60)}…"`).toContain(test.short);
      }
    }
  });

  it("carries an https source on every fact", () => {
    for (const topic of topics) {
      for (const fact of topic.facts) {
        expect(fact.source, topic.id).toMatch(/^https:\/\//);
      }
    }
  });

  it("does not repeat the short name when the full name already opens with it", () => {
    const mdcat = topics.find((t) => t.id === "test-mdcat")!;
    expect(mdcat.title).toBe("MDCAT — Medical & Dental College Admission Test");
    for (const topic of topics) {
      expect(topic.title, topic.id).not.toMatch(/^(\S+) — \1\b/);
      for (const fact of topic.facts) {
        expect(fact.text, topic.id).not.toMatch(/^(\S+) \(\1\b/);
      }
    }
  });

  it("copies a cycle-based fee verbatim instead of inventing a number", () => {
    const mdcat = topics.find((t) => t.id === "test-mdcat")!;
    const all = mdcat.facts.map((f) => f.text).join(" ");
    expect(all).toContain("Announced per cycle");
    expect(all).toContain("Biology");
  });

  it("leaves syllabus topics to Ustaad", () => {
    // Manzil covers test logistics; concept teaching belongs to /study.
    const mdcat = topics.find((t) => t.id === "test-mdcat")!;
    const all = mdcat.facts.map((f) => f.text).join(" ");
    expect(all).not.toContain("Cell structure and biological molecules");
  });
});

describe("deriveScholarshipTopics", () => {
  const topics = deriveScholarshipTopics();

  it("groups scholarships by their existing category field", () => {
    const categories = [...new Set(scholarships.map((s) => s.category))];
    expect(topics).toHaveLength(categories.length);
    for (const category of categories) {
      expect(topics.map((t) => t.id)).toContain(`scholarships-${category}`);
    }
  });

  it("turns every scholarship into exactly one fact, dropping none", () => {
    const factCount = topics.reduce((n, t) => n + t.facts.length, 0);
    expect(factCount).toBe(scholarships.length);
  });

  it("names each scholarship in its own fact", () => {
    const all = topics.flatMap((t) => t.facts).map((f) => f.text);
    for (const s of scholarships) {
      expect(all.some((text) => text.includes(s.name)), s.id).toBe(true);
    }
  });

  it("carries an https source on every fact", () => {
    for (const topic of topics) {
      for (const fact of topic.facts) {
        expect(fact.source, topic.id).toMatch(/^https:\/\//);
      }
    }
  });

  it("copies a cycle-based deadline verbatim instead of inventing a date", () => {
    // The single worst failure this feature can produce is a confident,
    // invented deadline. Pin the vague wording through to the fact.
    const need = topics.find((t) => t.id === "scholarships-need-based")!;
    const ehsaas = need.facts.find((f) => f.text.includes("Ehsaas Undergraduate"))!;
    expect(ehsaas.text).toContain("Cycle-based");
    expect(ehsaas.text).not.toMatch(/\b\d{1,2} (January|February|March|April|May|June|July|August|September|October|November|December)\b/);
  });
});
