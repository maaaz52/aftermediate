import { describe, expect, it } from "vitest";
import { abroadChatbotKnowledge } from "@/data/abroad-chatbot-knowledge";
import { skillsChatbotKnowledge } from "@/data/skills-chatbot-knowledge";
import type { Persona } from "@/lib/chat-request";
import {
  ALIAS,
  buildIndex,
  buildRetrievalQuery,
  formatFacts,
  retrieveFacts,
  retrieveForMessages,
  tokenize,
  type RetrievedFact,
} from "@/lib/knowledge";

const factCount = (kb: { topics: { facts: unknown[] }[] }) =>
  kb.topics.reduce((n, t) => n + t.facts.length, 0);

const ABROAD_FACTS = factCount(abroadChatbotKnowledge);
const SKILLS_FACTS = factCount(skillsChatbotKnowledge);

const topicIds = (kb: { topics: { id: string }[] }) => kb.topics.map((t) => t.id);

describe("tokenize", () => {
  it("lowercases, splits on punctuation and drops stopwords", () => {
    expect(tokenize("The Fulbright's DEADLINE is in April!")).toEqual(
      expect.arrayContaining(["fulbright", "deadline", "april"])
    );
    expect(tokenize("the is of and to")).toEqual([]);
  });

  it("reduces plurals so inflected forms share a token", () => {
    expect(tokenize("scholarships")).toEqual(tokenize("scholarship"));
    expect(tokenize("universities")).toEqual(tokenize("university"));
    expect(tokenize("bank statements")).toEqual(["bank", "statement"]);
  });

  it("keeps numbers and drops single characters", () => {
    expect(tokenize("EUR 11,904 a-day b")).toEqual(expect.arrayContaining(["eur", "11", "904", "day"]));
    expect(tokenize("EUR 11,904 a-day b")).not.toContain("b");
  });

  it("returns nothing for an empty or whitespace query", () => {
    expect(tokenize("   ")).toEqual([]);
    expect(tokenize("")).toEqual([]);
  });
});

describe("index", () => {
  it("indexes every abroad and skills fact exactly once", () => {
    const abroad = buildIndex("safar");
    const skills = buildIndex("hunar");
    expect(abroad).toHaveLength(ABROAD_FACTS);
    expect(skills).toHaveLength(SKILLS_FACTS);
    expect(new Set(abroad.map((d) => d.id)).size).toBe(ABROAD_FACTS);
    expect(new Set(skills.map((d) => d.id)).size).toBe(SKILLS_FACTS);
  });

  it("carries the topic id, title, text and source on every doc", () => {
    for (const persona of ["safar", "hunar"] as Persona[]) {
      for (const doc of buildIndex(persona)) {
        expect(doc.text.length).toBeGreaterThan(20);
        expect(doc.source.startsWith("https://")).toBe(true);
        expect(doc.topicTitle.length).toBeGreaterThan(0);
        expect(topicIds(persona === "safar" ? abroadChatbotKnowledge : skillsChatbotKnowledge)).toContain(
          doc.topicId
        );
      }
    }
  });

  it("is memoised, so the corpus is tokenized once per process", () => {
    expect(buildIndex("safar")).toBe(buildIndex("safar"));
  });

  it("is empty for a persona with no knowledge base", () => {
    expect(buildIndex("essay")).toEqual([]);
    expect(buildIndex("rahbar")).toEqual([]);
    expect(buildIndex("study")).toEqual([]);
    expect(buildIndex("cv")).toEqual([]);
    expect(buildIndex("qalam")).toEqual([]);
  });
});

describe("every fact is reachable by its own text", () => {
  for (const persona of ["safar", "hunar"] as Persona[]) {
    it(`returns each ${persona} fact within the top 8 for its own text`, () => {
      const failures: string[] = [];
      for (const doc of buildIndex(persona)) {
        const { facts } = retrieveFacts(persona, doc.text);
        if (!facts.some((f) => f.text === doc.text)) failures.push(doc.id);
      }
      expect(failures).toEqual([]);
    });
  }
});

describe("retrieveFacts", () => {
  it("returns cited facts, ordered by score and trimmed to k", () => {
    const { facts, covered } = retrieveFacts("safar", "German blocked account how much money");
    expect(covered).toBe(true);
    expect(facts.length).toBeGreaterThan(0);
    expect(facts.length).toBeLessThanOrEqual(8);
    expect(facts.slice(0, 3).map((f) => f.topicId)).toContain("bank-statements");
    const blockedAccount = facts.find((f) => f.text.includes("11,904"));
    expect(blockedAccount?.topicId).toBe("bank-statements");
    expect(blockedAccount?.source).toBe("https://www.make-it-in-germany.com");
  });

  it("honours a smaller k", () => {
    const { facts } = retrieveFacts("safar", "visa documents checklist passport transcripts", { k: 3 });
    expect(facts.length).toBeLessThanOrEqual(3);
  });

  it("never crosses personas", () => {
    expect(retrieveFacts("safar", "Payoneer Wise withdrawal fees").facts).toEqual([]);
    expect(retrieveFacts("hunar", "blocked account Germany visa").facts).toEqual([]);
  });

  it("returns nothing for a persona without a knowledge base", () => {
    for (const persona of ["essay", "cv", "qalam", "rahbar", "study"] as Persona[]) {
      expect(retrieveFacts(persona, "blocked account Germany visa")).toEqual({ facts: [], covered: false });
    }
  });

  it("marks an off-domain question as not covered instead of padding results", () => {
    const result = retrieveFacts("safar", "which cricket team will win the world cup");
    expect(result.covered).toBe(false);
    expect(result.facts).toEqual([]);
    expect(retrieveFacts("hunar", "how long should I proof sourdough bread").covered).toBe(false);
  });

  it("returns nothing for an empty query", () => {
    expect(retrieveFacts("safar", "")).toEqual({ facts: [], covered: false });
    expect(retrieveFacts("safar", "the and of")).toEqual({ facts: [], covered: false });
  });

  it("is deterministic across calls", () => {
    const a = retrieveFacts("hunar", "how do I price my first logo job");
    const b = retrieveFacts("hunar", "how do I price my first logo job");
    expect(b).toEqual(a);
    expect(a.facts.map((f) => f.text)).toEqual(b.facts.map((f) => f.text));
  });

  it("retrieves follow-up questions from the recent message window", () => {
    const query = buildRetrievalQuery([
      { role: "user", content: "How much money do I need for Germany?" },
      { role: "assistant", content: "You need a blocked account." },
      { role: "user", content: "And for Ireland?" },
    ]);
    expect(query).toContain("And for Ireland?");
    expect(query).not.toContain("blocked account.");
    expect(retrieveFacts("safar", query).covered).toBe(true);
  });
});

describe("buildRetrievalQuery", () => {
  it("joins the last three user turns", () => {
    const messages = [
      { role: "user" as const, content: "one" },
      { role: "user" as const, content: "two" },
      { role: "user" as const, content: "three" },
      { role: "user" as const, content: "four" },
      { role: "assistant" as const, content: "five" },
      { role: "user" as const, content: "six" },
    ];
    expect(buildRetrievalQuery(messages)).toBe("three four six");
  });

  it("ignores assistant turns and returns an empty string when there is nothing to match", () => {
    expect(buildRetrievalQuery([{ role: "assistant", content: "hello" }])).toBe("");
    expect(buildRetrievalQuery([])).toBe("");
  });
});

describe("formatFacts", () => {
  it("renders each fact with its source so the model can cite it", () => {
    const facts: RetrievedFact[] = [
      {
        topicId: "bank-statements",
        topicTitle: "Bank Statements & Proof of Funds",
        text: "Germany requires a blocked account of approximately EUR 11,904.",
        source: "https://www.make-it-in-germany.com",
      },
    ];
    const out = formatFacts(facts);
    expect(out).toContain("Bank Statements & Proof of Funds");
    expect(out).toContain("Germany requires a blocked account of approximately EUR 11,904.");
    expect(out).toContain("[source: https://www.make-it-in-germany.com]");
  });

  it("returns an empty string when nothing was retrieved", () => {
    expect(formatFacts([])).toBe("");
  });
});

describe("alias table", () => {
  it("each alias topic id exists in its knowledge base", () => {
    const known = [...topicIds(abroadChatbotKnowledge), ...topicIds(skillsChatbotKnowledge)];
    for (const id of Object.keys(ALIAS)) {
      expect(known, `ALIAS key "${id}" is not a real topic id`).toContain(id);
      expect(ALIAS[id].length).toBeGreaterThan(0);
    }
  });

  it("reaches a fact through vocabulary the fact never uses", () => {
    const { facts } = retrieveFacts("safar", "how much cash do I park for the german residence paper");
    expect(facts.slice(0, 3).some((f) => f.topicId === "bank-statements")).toBe(true);
  });
});

describe("retrieveForMessages", () => {
  const turn = (role: "user" | "assistant", content: string) => ({ role, content });

  it("grounds a persona on the question it was actually asked", () => {
    const { facts, covered } = retrieveForMessages(
      "safar",
      [turn("user", "Hello"), turn("assistant", "Hi! Ask me about studying abroad."), turn("user", "How much money do I have to park in a blocked account for Germany?")]
    );
    expect(covered).toBe(true);
    expect(facts.slice(0, 3).map((f) => f.topicId)).toContain("bank-statements");
  });

  it("hands different questions different facts", () => {
    const money = retrieveForMessages("safar", [turn("user", "How much money do I have to park in a blocked account for Germany?")]);
    const funding = retrieveForMessages("safar", [turn("user", "When does the Fulbright application close for Pakistani students?")]);
    const topOf = (r: { facts: RetrievedFact[] }) => new Set(r.facts.slice(0, 3).map((f) => f.topicId));
    const moneyTopics = topOf(money);
    const fundingTopics = topOf(funding);
    expect([...fundingTopics].some((t) => !moneyTopics.has(t))).toBe(true);
    expect(funding.facts.some((f) => f.topicId === "scholarships")).toBe(true);
    expect(money.facts.some((f) => f.topicId === "scholarships")).toBe(false);
  });

  it("returns nothing for a persona with no knowledge base", () => {
    const out = retrieveForMessages("essay", [
      turn("user", "How much money do I have to park in a blocked account for Germany?"),
    ]);
    expect(out).toEqual({ facts: [], covered: false });
  });

  it("returns nothing when the thread has no user turn", () => {
    expect(retrieveForMessages("safar", [])).toEqual({ facts: [], covered: false });
  });
});

interface HarnessCase {
  persona: Persona;
  query: string;
  expectTopicId?: string;
}

const HARNESS: HarnessCase[] = [
  { persona: "safar", query: "How much money do I have to park in a blocked account for Germany?", expectTopicId: "bank-statements" },
  { persona: "safar", query: "How long does the German national D student visa take to process?", expectTopicId: "visa-process" },
  { persona: "safar", query: "Which documents does the UK embassy want — CAS, TB test, bank statements?", expectTopicId: "documents" },
  { persona: "safar", query: "When does the Fulbright application close for Pakistani students?", expectTopicId: "scholarships" },
  { persona: "safar", query: "Do I need IELTS for Germany or is TestDaF enough?", expectTopicId: "tests" },
  { persona: "safar", query: "Which Ivy League universities are need-blind for international applicants?", expectTopicId: "ivy-league" },
  { persona: "safar", query: "What are the UK student visa fee and the immigration health surcharge?", expectTopicId: "visa-process" },
  { persona: "safar", query: "Can I work while studying in the Netherlands, and what is the orientation year?", expectTopicId: "country-notes" },
  { persona: "safar", query: "An agent says he can guarantee me Stipendium Hungaricum for a fee — is that real?", expectTopicId: "scams-safety" },
  { persona: "safar", query: "What is the SEVIS I-901 fee and the DS-160 for the F-1 visa?", expectTopicId: "visa-process" },
  { persona: "safar", query: "How much proof of funds does Ireland require for the D study visa?", expectTopicId: "bank-statements" },
  { persona: "safar", query: "Is there an interview at the embassy for Turkiye Burslari?", expectTopicId: "interviews" },
  { persona: "hunar", query: "I have no money and no experience — which free courses should I start with in Pakistan?", expectTopicId: "zero-to-start" },
  { persona: "hunar", query: "Which skill actually has demand on Upwork for a beginner?", expectTopicId: "choosing-a-skill" },
  { persona: "hunar", query: "Where can I host my portfolio site for free with HTTPS?", expectTopicId: "portfolio-hosting" },
  { persona: "hunar", query: "What is a typical rate for a logo from Pakistan in USD?", expectTopicId: "pricing-rates-pakistan" },
  { persona: "hunar", query: "What percentage does Upwork take from my earnings as a service fee?", expectTopicId: "payment-fees" },
  { persona: "hunar", query: "Do I need an NTN and how is freelance export income taxed by FBR?", expectTopicId: "fbr-taxes" },
  { persona: "hunar", query: "Which is cheaper to withdraw into a Pakistani bank, Payoneer or Wise?", expectTopicId: "getting-paid" },
  { persona: "hunar", query: "My client has not paid for two weeks — what do I do about late payment?", expectTopicId: "difficult-clients" },
  { persona: "hunar", query: "How do I write an Upwork proposal that actually gets a reply?", expectTopicId: "client-acquisition" },
  { persona: "hunar", query: "How do I keep freelancing going while my exams approach without burning out?", expectTopicId: "time-management" },
  { persona: "safar", query: "Which cricket team will win the world cup final?" },
  { persona: "hunar", query: "How long should I proof a sourdough loaf before baking it?" },
];

describe("recall harness", () => {
  for (const [i, c] of HARNESS.entries()) {
    it(`#${i + 1} [${c.persona}] ${c.query.slice(0, 52)}…`, () => {
      const { facts, covered } = retrieveFacts(c.persona, c.query);
      if (c.expectTopicId) {
        expect(covered).toBe(true);
        expect(facts.slice(0, 3).map((f) => f.topicId)).toContain(c.expectTopicId);
      } else {
        expect(covered).toBe(false);
      }
    });
  }

  it("scores at least 22 of 24", () => {
    const misses: string[] = [];
    for (const c of HARNESS) {
      const { facts, covered } = retrieveFacts(c.persona, c.query);
      const hit = c.expectTopicId
        ? covered && facts.slice(0, 3).some((f) => f.topicId === c.expectTopicId)
        : !covered;
      if (!hit) misses.push(`[${c.persona}] ${c.query} -> want ${c.expectTopicId ?? "no match"}, got ${facts.slice(0, 3).map((f) => f.topicId).join(", ") || "nothing"}`);
    }
    console.log(`RETRIEVAL HARNESS SCORE ${HARNESS.length - misses.length}/${HARNESS.length}`);
    for (const m of misses) console.log(`  MISS ${m}`);
    expect(misses.length).toBeLessThanOrEqual(HARNESS.length - 22);
  });
});
