import { describe, expect, it } from "vitest";
import { groups } from "@/components/sidebar";
import { SITE_PAGES } from "@/data/site-pages";
import { buildSystemPrompt, PERSONA_PROMPTS } from "@/lib/chat-prompt";
import { PERSONAS } from "@/lib/chat-request";
import { KNOWLEDGE_BASES, retrieveFacts, type RetrievedFact } from "@/lib/knowledge";
import { QUIZ_SECTIONS } from "@/lib/quiz";
import type { StudentContext } from "@/lib/student-context";

const MARKERS: Record<string, string> = {
  rahbar: "Rahbar",
  study: "Ustaad",
  essay: "essay coach",
  cv: "ATS-friendly",
  safar: "Safar",
  hunar: "Hunar",
  qalam: "Qalam",
  manzil: "Manzil",
};

const factsFor = (query: string, persona: "safar" | "hunar"): RetrievedFact[] =>
  retrieveFacts(persona, query).facts;

const STRAY_FACT: RetrievedFact = {
  topicId: "bank-statements",
  topicTitle: "Bank Statements & Proof of Funds",
  text: "Germany requires a blocked account of approximately EUR 11,904 for one year.",
  source: "https://www.make-it-in-germany.com",
};

describe("buildSystemPrompt", () => {
  it("gives every persona its own identity", () => {
    for (const persona of PERSONAS) {
      const prompt = buildSystemPrompt({ persona });
      expect(prompt.length, persona).toBeGreaterThan(200);
      expect(prompt.includes(MARKERS[persona]), `${persona} marker`).toBe(true);
    }
  });

  it("never renders the words undefined or NaN", () => {
    for (const persona of PERSONAS) {
      const prompt = buildSystemPrompt({ persona });
      expect(prompt.includes("undefined"), persona).toBe(false);
      expect(prompt.includes("NaN"), persona).toBe(false);
    }
  });
});

describe("grounding block", () => {
  it("hands safar only the retrieved facts, with citations", () => {
    const facts = factsFor("How much money do I park in a blocked account for Germany?", "safar");
    const prompt = buildSystemPrompt({ persona: "safar", facts, covered: true });
    expect(facts.length).toBeGreaterThan(0);
    expect(prompt).toContain("FACTS FROM THE SITE KNOWLEDGE BASE");
    expect(prompt).toContain(facts[0].text);
    expect(prompt).toContain(`[source: ${facts[0].source}]`);
  });

  it("dates the grounding block so hedges can carry a year", () => {
    expect(buildSystemPrompt({ persona: "safar", facts: [STRAY_FACT], covered: true })).toContain(
      "2026-08-27"
    );
    expect(buildSystemPrompt({ persona: "hunar", facts: [STRAY_FACT], covered: true })).toContain(
      "2026-08-29"
    );
  });

  it("tells safar it has no matching fact instead of pretending", () => {
    const prompt = buildSystemPrompt({ persona: "safar", facts: [], covered: false });
    expect(prompt).toContain("no fact that matches this question");
    expect(prompt).not.toContain("FACTS FROM THE SITE KNOWLEDGE BASE");
  });

  it("keeps a grounded prompt cheaper than the old inlined knowledge base", () => {
    // The full abroad KB alone was ~23k chars; a prompt that drifts back to
    // inlining it will blow through this ceiling.
    const facts = factsFor("How much does it cost to study in the UK versus Germany?", "safar");
    expect(buildSystemPrompt({ persona: "safar", facts, covered: true }).length).toBeLessThan(4500);
    const hunarFacts = factsFor("How do I price a logo and get paid in Pakistan?", "hunar");
    expect(buildSystemPrompt({ persona: "hunar", facts: hunarFacts, covered: true }).length).toBeLessThan(4500);
  });

  it("no longer inlines the knowledge base into an ungrounded prompt", () => {
    for (const persona of ["safar", "hunar"] as const) {
      const prompt = buildSystemPrompt({ persona });
      expect(prompt).not.toContain("11,904");
      expect(prompt).not.toContain("Stipendium Hungaricum fully funds");
      expect(prompt).not.toContain("[source: https://");
    }
  });

  it("never leaks retrieved facts to a persona with no knowledge base", () => {
    for (const persona of ["essay", "cv", "qalam", "rahbar", "study"] as const) {
      const prompt = buildSystemPrompt({ persona, facts: [STRAY_FACT], covered: true });
      expect(prompt, persona).not.toContain("11,904");
      expect(prompt, persona).not.toContain("make-it-in-germany");
      expect(prompt, persona).not.toContain("FACTS FROM THE SITE KNOWLEDGE BASE");
    }
  });

  it("keeps every persona's own redirects while dropping the shared KB wording", () => {
    const safar = buildSystemPrompt({ persona: "safar", facts: [], covered: false });
    expect(safar).toContain("/study");
    expect(safar).toContain("Rahbar");
    expect(safar).toContain("Country Explorer");
    const hunar = buildSystemPrompt({ persona: "hunar", facts: [], covered: false });
    expect(hunar).toContain("/study");
    expect(hunar).not.toContain("Country Explorer");
  });
});

describe("student block", () => {
  const STUDENT: StudentContext = {
    name: "Ayesha",
    stream: "pre-medical",
    fscPct: 87.3,
    city: "Lahore",
    budgetMonthly: 50000,
    interests: ["Medicine & Healthcare"],
  };

  it("tells the bot who it is talking to when the profile is known", () => {
    const prompt = buildSystemPrompt({ persona: "safar", student: STUDENT });

    expect(prompt).toContain("WHO YOU ARE TALKING TO");
    expect(prompt).toContain("Name: Ayesha");
    expect(prompt).toContain("FSc: 87.3%");
    expect(prompt).toContain("PKR 50,000");
  });

  it("says where the profile data came from so the bot trusts the right copy", () => {
    expect(buildSystemPrompt({ persona: "study", student: { stream: "ics" } })).toContain(
      "own profile"
    );
  });

  it("renders no student block at all when nobody is signed in", () => {
    for (const persona of PERSONAS) {
      expect(buildSystemPrompt({ persona }), persona).not.toContain("WHO YOU ARE TALKING TO");
      expect(buildSystemPrompt({ persona, student: null }), persona).not.toContain(
        "WHO YOU ARE TALKING TO"
      );
    }
  });

  it("personalises before it grounds", () => {
    const facts = factsFor("How much money do I park in a blocked account for Germany?", "safar");
    const prompt = buildSystemPrompt({ persona: "safar", student: STUDENT, facts, covered: true });

    expect(prompt.indexOf("WHO YOU ARE TALKING TO")).toBeGreaterThan(-1);
    expect(prompt.indexOf("WHO YOU ARE TALKING TO")).toBeLessThan(
      prompt.indexOf("FACTS FROM THE SITE KNOWLEDGE BASE")
    );
  });

  it("stays cheaper than the old inlined knowledge base even with a student block", () => {
    const facts = factsFor("How much does it cost to study in the UK versus Germany?", "safar");

    expect(buildSystemPrompt({ persona: "safar", student: STUDENT, facts, covered: true }).length).toBeLessThan(
      4500
    );
  });
});

describe("Manzil's prompt", () => {
  it("is registered as a persona with a knowledge base", () => {
    expect(PERSONAS).toContain("manzil");
    expect(KNOWLEDGE_BASES.manzil).toBeDefined();
  });

  it("names the bots it must defer to, so the four do not overlap", () => {
    const prompt = PERSONA_PROMPTS.manzil;
    expect(prompt).toContain("Ustaad");
    expect(prompt).toContain("Safar");
    expect(prompt).toContain("Rahbar");
  });

  it("stays under the prompt size ceiling", () => {
    expect(PERSONA_PROMPTS.manzil.length).toBeLessThan(4000);
  });
});

describe("rahbar's site map", () => {
  const rahbar = PERSONA_PROMPTS.rahbar;

  it("names every route the sidebar offers", () => {
    for (const group of groups)
      for (const link of group.links) expect(rahbar, link.href).toContain(link.href);
  });

  it("takes each page's purpose from the data instead of hand-copied prose", () => {
    for (const page of SITE_PAGES) expect(rahbar, page.href).toContain(page.purpose);
  });

  it("counts the quiz the way quiz.ts counts it", () => {
    expect(QUIZ_SECTIONS).toHaveLength(5);
    expect(rahbar).toContain(`${QUIZ_SECTIONS.length}-section quiz`);
    expect(rahbar).toContain(QUIZ_SECTIONS.map((section) => section.id).join(", "));
  });

  it("never repeats the claims it shipped with, which were wrong", () => {
    expect(rahbar).not.toMatch(/7-section/);
    expect(rahbar).not.toContain("entry test, money & budget");
  });

  it("fits the whole site map inside one message", () => {
    const prompt = buildSystemPrompt({ persona: "rahbar", student: { city: "Lahore" } });
    expect(prompt.length).toBeLessThan(6_000);
  });
});
