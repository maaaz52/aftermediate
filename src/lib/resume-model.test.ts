import { describe, expect, it } from "vitest";
import {
  polishNotes,
  computeAts,
  generateFeedback,
  applyAutoFix,
  suggestSkills,
  rewriteBullet,
  makeQuantifiable,
  STRONG_ACTION_VERBS,
  CLICHE_WORDS,
  type ResumeData,
  type FeedbackItem,
} from "./resume-model";
import { mockResume } from "@/data/resume-mock";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const emptyResume: ResumeData = {
  identity: {
    name: "",
    email: "",
    phone: "",
    location: "",
    github: "",
    linkedin: "",
    targetRole: "",
  },
  experience: { rawNotes: "", bullets: [], polished: false },
  projects: { entries: [], academics: [], certificates: [], leadership: [] },
  skills: { tech: [], soft: [] },
};

function makeResume(overrides: Partial<ResumeData> = {}): ResumeData {
  return {
    identity: { name: "Test", email: "t@t.com", phone: "", location: "", github: "", linkedin: "", targetRole: "" },
    experience: { rawNotes: "", bullets: ["Led a team of 5 students."], polished: false },
    projects: { entries: [], academics: [], certificates: [], leadership: [] },
    skills: { tech: ["Python"], soft: [] },
    ...overrides,
  };
}

/** Find a feedback item by machine-readable fix kind. */
function findFix(feedback: FeedbackItem[], fixType: FeedbackItem["fixType"]): FeedbackItem | undefined {
  return feedback.find((f) => f.fixType === fixType);
}

// ---------------------------------------------------------------------------
// polishNotes
// ---------------------------------------------------------------------------

describe("polishNotes", () => {
  it("extracts and preserves numbers from raw notes", () => {
    const bullets = polishNotes("edited 15 videos, got 88% in exam");
    const allText = bullets.join(" ");
    expect(/\d+/.test(allText)).toBe(true);
    expect(allText).toContain("15");
    expect(allText).toContain("88");
  });

  it("returns exactly 3 bullets", () => {
    expect(polishNotes("one clause only")).toHaveLength(3);
    expect(polishNotes("a, b, c, d, e")).toHaveLength(3);
    expect(polishNotes("")).toHaveLength(3);
  });

  it("produces bullets starting with strong action verbs", () => {
    const bullets = polishNotes("organised event for 200 students, edited 15 videos, got 88% in test");
    for (const b of bullets) {
      const firstWord = b.split(" ")[0].toLowerCase();
      const startsStrong = STRONG_ACTION_VERBS.some((v) => firstWord.startsWith(v));
      expect(startsStrong).toBe(true);
    }
  });

  it("produces exact polished bullets for the standard input", () => {
    expect(
      polishNotes(
        "organised school sports day for 200 students, edited 15 videos for my YouTube channel, got 88% in FSc Physics lab"
      )
    ).toEqual([
      "Coordinated logistics for school sports day, managing 200+ participants.",
      "Produced and edited 15 videos for my YouTube channel.",
      "Achieved 88% in FSc Physics lab.",
    ]);
  });

  it("pads with generic bullets when fewer than 3 clauses", () => {
    const bullets = polishNotes("just one thing");
    expect(bullets).toHaveLength(3);
  });

  it("each bullet ends with a period", () => {
    const bullets = polishNotes("organised event for 200 people");
    for (const b of bullets) {
      expect(b.endsWith(".")).toBe(true);
    }
  });

  it("transforms 'organised X' into 'Coordinated logistics for X'", () => {
    const bullets = polishNotes("organised school sports day for 200 students");
    expect(bullets[0]).toMatch(/^Coordinated logistics for/i);
    expect(bullets[0]).toContain("200+ participants");
    // The count phrase is not duplicated back into the subject
    expect(bullets[0]).not.toContain("sports day for 200 students");
  });

  it("transforms 'edited X' into 'Produced and edited X'", () => {
    const bullets = polishNotes("edited 15 videos for my channel");
    expect(bullets[0]).toMatch(/^Produced and edited/i);
    expect(bullets[0]).toContain("15");
  });

  it("transforms 'got X% in Y' into 'Achieved X% in Y'", () => {
    const bullets = polishNotes("got 88% in FSc Physics lab");
    expect(bullets[0]).toMatch(/^Achieved 88/i);
  });

  it("transforms 'helped with X' into 'Supported delivery of X'", () => {
    const bullets = polishNotes("helped with laboratory setup");
    expect(bullets[0]).toMatch(/^Supported delivery of/i);
  });

  it("keeps decimals like 2.5K intact", () => {
    const bullets = polishNotes("grew my channel to 2.5K subscribers");
    expect(bullets[0]).toContain("2.5K");
    expect(bullets[0]).not.toContain("2. 5");
  });

  it("keeps thousands like 1,000 intact", () => {
    const bullets = polishNotes("organized a bake sale raising 1,000 rupees");
    expect(bullets[0]).toContain("1,000");
  });

  it("does not treat a year like 2023 as a participant count", () => {
    const bullets = polishNotes("organized a sports event in 2023");
    expect(bullets[0]).toContain("in 2023");
    expect(bullets[0]).not.toContain("2023+");
  });

  it("strips first-person pronouns before routing", () => {
    const bullets = polishNotes("I organized the school sports day for 200 students");
    expect(bullets[0]).toBe(
      "Coordinated logistics for the school sports day, managing 200+ participants."
    );
    expect(bullets[0]).not.toMatch(/\bI\s/);
  });

  it("does not duplicate a mid-clause strong verb", () => {
    const bullets = polishNotes("managed a team of 12 people");
    expect(bullets[0]).toBe("Managed a team of 12 people.");
    expect(bullets[0]).not.toMatch(/Led managed/i);
  });
});

// ---------------------------------------------------------------------------
// computeAts
// ---------------------------------------------------------------------------

describe("computeAts", () => {
  it("mock resume startup mode has exact scores", () => {
    expect(computeAts(mockResume, "startup")).toEqual({
      impactScore: 77,
      breakdown: { formatting: 100, actionVerbs: 100, keywords: 33 },
    });
  });

  it("mock resume university mode has exact scores", () => {
    const result = computeAts(mockResume, "university");
    expect(result.impactScore).toBe(83);
    expect(result.breakdown).toEqual({ formatting: 100, actionVerbs: 100, keywords: 33 });
  });

  it("mock resume corporate mode has exact scores", () => {
    const result = computeAts(mockResume, "corporate");
    expect(result.impactScore).toBe(77);
    expect(result.breakdown).toEqual({ formatting: 100, actionVerbs: 100, keywords: 33 });
  });

  it("startup and university modes produce different impactScores on the same resume", () => {
    const startup = computeAts(mockResume, "startup");
    const university = computeAts(mockResume, "university");
    expect(startup.impactScore).not.toBe(university.impactScore);
  });

  it("empty resume produces low scores", () => {
    const result = computeAts(emptyResume, "startup");
    expect(result.impactScore).toBeLessThan(30);
    expect(result.breakdown.actionVerbs).toBe(0);
    expect(result.breakdown.formatting).toBeLessThan(60);
    expect(result.breakdown.keywords).toBe(0);
  });

  it("no bullets yields actionVerbs = 0", () => {
    const noBullets: ResumeData = {
      ...emptyResume,
      identity: { ...emptyResume.identity, name: "Test", email: "t@t.com" },
      skills: { tech: ["Python"], soft: [] },
      projects: {
        entries: [],
        academics: [{ degree: "BSc", institution: "U", score: "80%", years: "2020-24" }],
        certificates: [],
        leadership: [],
      },
    };
    const result = computeAts(noBullets, "startup");
    expect(result.breakdown.actionVerbs).toBe(0);
  });

  it("all scores are integers", () => {
    const result = computeAts(mockResume, "corporate");
    expect(Number.isInteger(result.impactScore)).toBe(true);
    expect(Number.isInteger(result.breakdown.formatting)).toBe(true);
    expect(Number.isInteger(result.breakdown.actionVerbs)).toBe(true);
    expect(Number.isInteger(result.breakdown.keywords)).toBe(true);
  });

  it("does not count 'Git' for a 'Digital marketing' skill (word boundaries)", () => {
    const resume: ResumeData = {
      ...mockResume,
      identity: { ...mockResume.identity, targetRole: "web developer" },
      skills: { tech: ["Digital marketing"], soft: [] },
    };
    const result = computeAts(resume, "startup");
    expect(result.breakdown.keywords).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// generateFeedback
// ---------------------------------------------------------------------------

describe("generateFeedback", () => {
  it("cliché warning when a bullet contains a cliché word", () => {
    const resume = makeResume({
      experience: { rawNotes: "", bullets: ["I am a hardworking student."], polished: false },
    });
    const feedback = generateFeedback(resume, "corporate");
    const clicheItems = feedback.filter((f) => f.message.toLowerCase().includes("hardworking"));
    expect(clicheItems.length).toBeGreaterThanOrEqual(1);
    expect(clicheItems[0].kind).toBe("warning");
    expect(clicheItems[0].fixType).toBe("cliche");
  });

  it("weak-verb warning when a bullet starts with a weak verb", () => {
    const resume = makeResume({
      experience: { rawNotes: "", bullets: ["Was responsible for the project."], polished: false },
    });
    const feedback = generateFeedback(resume, "corporate");
    const weakItems = feedback.filter((f) => f.fixType === "weakverb");
    expect(weakItems.length).toBeGreaterThanOrEqual(1);
  });

  it("does not flag 'Washed lab equipment' as weak (whole-word match)", () => {
    const resume = makeResume({
      experience: { rawNotes: "", bullets: ["Washed lab equipment daily."], polished: false },
    });
    const feedback = generateFeedback(resume, "corporate");
    expect(feedback.filter((f) => f.fixType === "weakverb")).toHaveLength(0);
  });

  it("keyword tip when skills are missing for the target role", () => {
    const resume = makeResume({
      identity: { name: "Test", email: "t@t.com", phone: "", location: "", github: "", linkedin: "", targetRole: "web developer" },
      skills: { tech: ["Canva"], soft: [] },
    });
    const feedback = generateFeedback(resume, "startup");
    const kwItems = feedback.filter((f) => f.fixType === "keywords");
    expect(kwItems.length).toBeGreaterThanOrEqual(1);
  });

  it("GitHub tip when targetRole contains developer/engineer but no github link", () => {
    const resume = makeResume({
      identity: { name: "Test", email: "t@t.com", phone: "", location: "", github: "", linkedin: "", targetRole: "web developer" },
    });
    const feedback = generateFeedback(resume, "startup");
    const ghItems = feedback.filter((f) => f.message.toLowerCase().includes("github"));
    expect(ghItems.length).toBeGreaterThanOrEqual(1);
    expect(ghItems[0].fixType).toBe("github");
  });

  it("metrics warning when no bullet contains digits", () => {
    const resume = makeResume({
      experience: { rawNotes: "", bullets: ["Led a team of students."], polished: false },
    });
    const feedback = generateFeedback(resume, "corporate");
    const metricItems = feedback.filter((f) => f.fixType === "metrics");
    expect(metricItems.length).toBeGreaterThanOrEqual(1);
  });

  it("university mode gets academics tip when academics empty", () => {
    const resume = makeResume({
      identity: { name: "Test", email: "t@t.com", phone: "", location: "", github: "", linkedin: "", targetRole: "pre-med" },
    });
    const feedback = generateFeedback(resume, "university");
    const acadItems = feedback.filter((f) => f.fixType === "academics");
    expect(acadItems.length).toBeGreaterThanOrEqual(1);
  });

  it("academics tip does NOT appear in startup mode when academics empty", () => {
    const resume = makeResume({
      identity: { name: "Test", email: "t@t.com", phone: "", location: "", github: "", linkedin: "", targetRole: "pre-med" },
    });
    const feedback = generateFeedback(resume, "startup");
    expect(feedback.filter((f) => f.fixType === "academics")).toHaveLength(0);
  });

  it("mock resume in startup mode yields exactly the keyword tip", () => {
    const feedback = generateFeedback(mockResume, "startup");
    expect(feedback).toHaveLength(1);
    expect(feedback[0].fixType).toBe("keywords");
    expect(feedback[0].id).toBe("s-kw-tip");
  });

  it("each feedback item has id, kind, message, fixLabel, and fixType", () => {
    const feedback = generateFeedback(mockResume, "startup");
    for (const item of feedback) {
      expect(typeof item.id).toBe("string");
      expect(item.id.length).toBeGreaterThan(0);
      expect(["warning", "tip"]).toContain(item.kind);
      expect(typeof item.message).toBe("string");
      expect(item.message.length).toBeGreaterThan(0);
      expect(typeof item.fixLabel).toBe("string");
      expect(item.fixLabel.length).toBeGreaterThan(0);
      expect(
        ["cliche", "weakverb", "keywords", "github", "metrics", "formatting", "academics", "actionverbs"]
      ).toContain(item.fixType);
    }
  });

  it("feedback ids are stable across calls for the same resume", () => {
    const first = generateFeedback(mockResume, "startup").map((f) => f.id);
    const second = generateFeedback(mockResume, "startup").map((f) => f.id);
    expect(second).toEqual(first);
  });
});

// ---------------------------------------------------------------------------
// applyAutoFix
// ---------------------------------------------------------------------------

describe("applyAutoFix", () => {
  it("cliché fix replaces a cliché word in bullets", () => {
    const resume = makeResume({
      experience: { rawNotes: "", bullets: ["I am a hardworking student who did well."], polished: false },
    });
    const feedback = generateFeedback(resume, "corporate");
    const clichéItem = findFix(feedback, "cliche");
    expect(clichéItem).toBeDefined();
    const fixed = applyAutoFix(resume, clichéItem!, "corporate");
    const hasCliché = fixed.experience.bullets.some((b) =>
      CLICHE_WORDS.some((c) => b.toLowerCase().includes(c))
    );
    expect(hasCliché).toBe(false);
  });

  it("cliché fix also scrubs the cliché pill from skills", () => {
    const resume = makeResume({
      experience: { rawNotes: "", bullets: ["I am a hardworking student."], polished: false },
      skills: { tech: ["Python"], soft: ["Hardworking", "Punctual"] },
    });
    const feedback = generateFeedback(resume, "corporate");
    const clichéItem = findFix(feedback, "cliche");
    expect(clichéItem).toBeDefined();
    const fixed = applyAutoFix(resume, clichéItem!, "corporate");
    expect(fixed.skills.soft).toEqual(["Punctual"]);
    expect(fixed.experience.bullets.some((b) => b.toLowerCase().includes("hardworking"))).toBe(false);
  });

  it("keyword fix adds a missing keyword to skills.tech", () => {
    const resume = makeResume({
      identity: { name: "Test", email: "t@t.com", phone: "", location: "", github: "", linkedin: "", targetRole: "web developer" },
      skills: { tech: ["Canva"], soft: [] },
    });
    const feedback = generateFeedback(resume, "startup");
    const kwItem = findFix(feedback, "keywords");
    expect(kwItem).toBeDefined();
    const fixed = applyAutoFix(resume, kwItem!, "startup");
    expect(fixed.skills.tech.length).toBeGreaterThan(resume.skills.tech.length);
  });

  it("GitHub fix sets identity.github to a URL", () => {
    const resume = makeResume({
      identity: { name: "Test", email: "t@t.com", phone: "", location: "", github: "", linkedin: "", targetRole: "web developer" },
    });
    const feedback = generateFeedback(resume, "startup");
    const ghItem = findFix(feedback, "github");
    expect(ghItem).toBeDefined();
    const fixed = applyAutoFix(resume, ghItem!, "startup");
    expect(fixed.identity.github).toMatch(/^https?:\/\//);
  });

  it("metrics fix appends a mode outcome and never fabricates numbers", () => {
    const resume = makeResume({
      experience: {
        rawNotes: "",
        bullets: ["Organized an event for the department.", "Led a team of 5 students."],
        polished: false,
      },
    });
    const feedback = generateFeedback(resume, "corporate");
    const metricItem = findFix(feedback, "metrics");
    expect(metricItem).toBeDefined();

    const corporate = applyAutoFix(resume, metricItem!, "corporate");
    expect(corporate.experience.bullets[0]).toBe("Organized an event for the department.");
    expect(corporate.experience.bullets[1]).toBe(
      "Led a team of 5 students, supporting business outcomes."
    );

    const startup = applyAutoFix(resume, metricItem!, "startup");
    expect(startup.experience.bullets[1]).toContain("driving measurable growth");

    const university = applyAutoFix(resume, metricItem!, "university");
    expect(university.experience.bullets[1]).toContain("demonstrating strong commitment");
  });

  it("academics fix adds a placeholder academic entry", () => {
    const resume = makeResume({
      identity: { name: "Test", email: "t@t.com", phone: "", location: "", github: "", linkedin: "", targetRole: "pre-med" },
    });
    const feedback = generateFeedback(resume, "university");
    const acadItem = findFix(feedback, "academics");
    expect(acadItem).toBeDefined();
    const fixed = applyAutoFix(resume, acadItem!, "university");
    expect(fixed.projects.academics.length).toBeGreaterThan(0);
  });

  it("weak-verb fix rewrites explicit weak phrases", () => {
    const cases: Array<[string, string]> = [
      ["Was responsible for the project.", "Owned the project."],
      ["Was in charge of the club.", "Led the club."],
      ["Was tasked with managing the event.", "Owned managing the event."],
      ["Helped with laboratory setup.", "Supported delivery of laboratory setup."],
      ["Did a presentation.", "Executed a presentation."],
      ["Were part of the committee.", "Led part of the committee."],
    ];
    for (const [input, expected] of cases) {
      const resume = makeResume({
        experience: { rawNotes: "", bullets: [input], polished: false },
      });
      const feedback = generateFeedback(resume, "corporate");
      const weakItem = findFix(feedback, "weakverb");
      expect(weakItem, `weakverb feedback for: ${input}`).toBeDefined();
      const fixed = applyAutoFix(resume, weakItem!, "corporate");
      expect(fixed.experience.bullets[0], `rewrite of: ${input}`).toBe(expected);
    }
  });

  it("action-verbs tip fix actually rewrites a weak bullet", () => {
    const resume = makeResume({
      experience: {
        rawNotes: "",
        bullets: ["Led a team of 5.", "Built a website.", "Assisted with lab experiments."],
        polished: false,
      },
    });
    const feedback = generateFeedback(resume, "startup");
    const avTip = findFix(feedback, "actionverbs");
    expect(avTip).toBeDefined();
    const fixed = applyAutoFix(resume, avTip!, "startup");
    expect(fixed.experience.bullets[2]).toBe("Supported lab experiments.");
  });

  it("action-verbs tip fix forces a strong-verb opener when no weak verb exists", () => {
    const resume = makeResume({
      experience: {
        rawNotes: "",
        bullets: ["Led a team of 5.", "Built a website.", "Member of the debate society."],
        polished: false,
      },
    });
    const feedback = generateFeedback(resume, "startup");
    const avTip = findFix(feedback, "actionverbs");
    expect(avTip).toBeDefined();
    const fixed = applyAutoFix(resume, avTip!, "startup");
    expect(fixed.experience.bullets[2]).not.toBe(resume.experience.bullets[2]);
    const firstWord = fixed.experience.bullets[2].split(" ")[0].toLowerCase();
    expect(STRONG_ACTION_VERBS.some((v) => firstWord.startsWith(v))).toBe(true);
  });

  it("repeat-click is safe — applying the same fix twice is a no-op", () => {
    const resume = makeResume({
      experience: { rawNotes: "", bullets: ["Was responsible for the project."], polished: false },
    });
    const feedback = generateFeedback(resume, "startup");
    expect(feedback.length).toBeGreaterThan(0);
    for (const item of feedback) {
      const once = applyAutoFix(resume, item, "startup");
      const twice = applyAutoFix(once, item, "startup");
      expect(twice).toEqual(once);
    }
  });
});

// ---------------------------------------------------------------------------
// suggestSkills
// ---------------------------------------------------------------------------

describe("suggestSkills", () => {
  it("matching role returns up to 4 suggestions", () => {
    const suggestions = suggestSkills("Web Developer", []);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.length).toBeLessThanOrEqual(4);
    expect(suggestions).toEqual(expect.arrayContaining(["HTML", "CSS", "JavaScript"]));
  });

  it("excludes already-selected skills", () => {
    const suggestions = suggestSkills("Web Developer", ["HTML", "CSS"]);
    expect(suggestions).not.toContain("HTML");
    expect(suggestions).not.toContain("CSS");
  });

  it("returns empty array when no role matches", () => {
    expect(suggestSkills("xyz unknown role", [])).toEqual([]);
  });

  it("matches via substring — 'pre-med research intern at hospital' matches pre-med research intern", () => {
    const suggestions = suggestSkills("pre-med research intern at hospital", []);
    expect(suggestions.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// rewriteBullet & makeQuantifiable — canvas hover-to-rewrite
// ---------------------------------------------------------------------------

describe("rewriteBullet", () => {
  it("rewrites a weak-verb opener to a strong action verb", () => {
    expect(rewriteBullet("was responsible for the sports day")).toBe("Owned the sports day");
  });

  it("replaces a cliché with its mapped concrete phrasing", () => {
    expect(rewriteBullet("I am a hardworking student")).toBe(
      "I am a consistently delivered student"
    );
  });

  it("returns the input unchanged when there is nothing to improve", () => {
    expect(rewriteBullet("Led a team of 12 people.")).toBe("Led a team of 12 people.");
  });
});

describe("makeQuantifiable", () => {
  it("appends a mode-appropriate outcome when a number already exists", () => {
    expect(makeQuantifiable("Managed 200+ participants.", "startup")).toBe(
      "Managed 200+ participants, driving measurable growth."
    );
  });

  it("returns the input unchanged when the outcome phrasing is already present", () => {
    expect(makeQuantifiable("Managed 200+ participants, driving measurable growth.", "startup")).toBe(
      "Managed 200+ participants, driving measurable growth."
    );
  });

  it("never fabricates numbers — no digit means no change", () => {
    expect(makeQuantifiable("Attended school assembly.", "corporate")).toBe(
      "Attended school assembly."
    );
  });
});
