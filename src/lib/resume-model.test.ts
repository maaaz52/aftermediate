import { describe, expect, it } from "vitest";
import {
  polishNotes,
  computeAts,
  generateFeedback,
  applyAutoFix,
  suggestSkills,
  STRONG_ACTION_VERBS,
  CLICHE_WORDS,
  type ResumeData,
} from "./resume-model";

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

const mockIdentityResume: ResumeData = {
  identity: {
    name: "Hira Ahmed",
    email: "hira@example.com",
    phone: "+92-300-1234567",
    location: "Lahore, Pakistan",
    github: "https://github.com/hira-ahmed",
    linkedin: "https://linkedin.com/in/hira-ahmed",
    targetRole: "Pre-Med Research Intern",
  },
  experience: {
    rawNotes: "organised school sports day for 200 students, edited 15 videos for my YouTube channel, got 88% in FSc Physics lab",
    bullets: [
      "Coordinated logistics for a school sports day, managing 200+ participants.",
      "Produced and edited 15 videos for my YouTube channel, growing reach to 2.5K+ views.",
      "Assisted with FSc Physics lab experiments, achieving 88% accuracy.",
    ],
    polished: true,
  },
  projects: {
    entries: [
      {
        title: "Science Exhibition Project",
        org: "Kinnaird College",
        year: "2025",
        description: "Investigated the effect of pH on seed germination for school science exhibition.",
      },
      {
        title: "YouTube Channel",
        org: "Self",
        year: "2024",
        description: "Created educational content about pre-med topics and study tips.",
      },
    ],
    academics: [
      { degree: "FSc Pre-Medical", institution: "Kinnaird College", score: "88%", years: "2024-2026" },
    ],
    certificates: [
      "Coursera Introduction to Biology",
      "Digital Skills: Video Editing",
    ],
    leadership: ["House Captain, Science Society"],
  },
  skills: {
    tech: ["Microsoft Office", "Canva", "Basic Video Editing"],
    soft: ["Communication", "Time Management"],
  },
};

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

  it("is deterministic — same input always produces same output", () => {
    const input = "organised sports day for 200 students, edited 15 videos";
    expect(polishNotes(input)).toEqual(polishNotes(input));
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
});

// ---------------------------------------------------------------------------
// computeAts
// ---------------------------------------------------------------------------

describe("computeAts", () => {
  it("mock data impactScore is between 60-80 (startup mode)", () => {
    const result = computeAts(mockIdentityResume, "startup");
    expect(result.impactScore).toBeGreaterThanOrEqual(60);
    expect(result.impactScore).toBeLessThanOrEqual(80);
  });

  it("mock data impactScore is between 60-80 (university mode)", () => {
    const result = computeAts(mockIdentityResume, "university");
    expect(result.impactScore).toBeGreaterThanOrEqual(60);
    expect(result.impactScore).toBeLessThanOrEqual(80);
  });

  it("mock data impactScore is between 60-80 (corporate mode)", () => {
    const result = computeAts(mockIdentityResume, "corporate");
    expect(result.impactScore).toBeGreaterThanOrEqual(60);
    expect(result.impactScore).toBeLessThanOrEqual(80);
  });

  it("mock data breakdown: formatting ~85-95, actionVerbs ~55-70, keywords ~30-60", () => {
    const result = computeAts(mockIdentityResume, "startup");
    expect(result.breakdown.formatting).toBeGreaterThanOrEqual(80);
    expect(result.breakdown.formatting).toBeLessThanOrEqual(100);
    expect(result.breakdown.actionVerbs).toBeGreaterThanOrEqual(55);
    expect(result.breakdown.actionVerbs).toBeLessThanOrEqual(73);
    expect(result.breakdown.keywords).toBeGreaterThanOrEqual(30);
    expect(result.breakdown.keywords).toBeLessThanOrEqual(60);
  });

  it("startup and university modes produce different impactScores on the same resume", () => {
    const startup = computeAts(mockIdentityResume, "startup");
    const university = computeAts(mockIdentityResume, "university");
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
    const result = computeAts(mockIdentityResume, "corporate");
    expect(Number.isInteger(result.impactScore)).toBe(true);
    expect(Number.isInteger(result.breakdown.formatting)).toBe(true);
    expect(Number.isInteger(result.breakdown.actionVerbs)).toBe(true);
    expect(Number.isInteger(result.breakdown.keywords)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// generateFeedback
// ---------------------------------------------------------------------------

function makeResume(overrides: Partial<ResumeData> = {}): ResumeData {
  return {
    identity: { name: "Test", email: "t@t.com", phone: "", location: "", github: "", linkedin: "", targetRole: "" },
    experience: { rawNotes: "", bullets: ["Led a team of 5 students."], polished: false },
    projects: { entries: [], academics: [], certificates: [], leadership: [] },
    skills: { tech: ["Python"], soft: [] },
    ...overrides,
  };
}

describe("generateFeedback", () => {
  it("cliché warning when a bullet contains a cliché word", () => {
    const resume = makeResume({
      experience: { rawNotes: "", bullets: ["I am a hardworking student."], polished: false },
    });
    const feedback = generateFeedback(resume, "corporate");
    const clicheItems = feedback.filter((f) => f.message.toLowerCase().includes("hardworking"));
    expect(clicheItems.length).toBeGreaterThanOrEqual(1);
    expect(clicheItems[0].kind).toBe("warning");
  });

  it("weak-verb warning when a bullet starts with a weak verb", () => {
    const resume = makeResume({
      experience: { rawNotes: "", bullets: ["Was responsible for the project."], polished: false },
    });
    const feedback = generateFeedback(resume, "corporate");
    const weakItems = feedback.filter((f) => f.kind === "warning" && f.message.toLowerCase().includes("strong action verb"));
    expect(weakItems.length).toBeGreaterThanOrEqual(1);
  });

  it("keyword tip when skills are missing for the target role", () => {
    const resume = makeResume({
      identity: { name: "Test", email: "t@t.com", phone: "", location: "", github: "", linkedin: "", targetRole: "web developer" },
      skills: { tech: ["Canva"], soft: [] },
    });
    const feedback = generateFeedback(resume, "startup");
    const kwItems = feedback.filter((f) => f.kind === "tip" && (f.message.toLowerCase().includes("keyword") || f.message.toLowerCase().includes("skills recruiters expect")));
    expect(kwItems.length).toBeGreaterThanOrEqual(1);
  });

  it("GitHub tip when targetRole contains developer/engineer but no github link", () => {
    const resume = makeResume({
      identity: { name: "Test", email: "t@t.com", phone: "", location: "", github: "", linkedin: "", targetRole: "web developer" },
    });
    const feedback = generateFeedback(resume, "startup");
    const ghItems = feedback.filter((f) => f.message.toLowerCase().includes("github"));
    expect(ghItems.length).toBeGreaterThanOrEqual(1);
  });

  it("metrics warning when no bullet contains digits", () => {
    const resume = makeResume({
      experience: { rawNotes: "", bullets: ["Led a team of students."], polished: false },
    });
    const feedback = generateFeedback(resume, "corporate");
    const metricItems = feedback.filter((f) => f.message.toLowerCase().includes("number") || f.message.toLowerCase().includes("quantif"));
    expect(metricItems.length).toBeGreaterThanOrEqual(1);
  });

  it("university mode gets academics tip when academics empty", () => {
    const resume = makeResume({
      identity: { name: "Test", email: "t@t.com", phone: "", location: "", github: "", linkedin: "", targetRole: "pre-med" },
    });
    const feedback = generateFeedback(resume, "university");
    const acadItems = feedback.filter((f) => f.message.toLowerCase().includes("academic") || f.message.toLowerCase().includes("fsc"));
    expect(acadItems.length).toBeGreaterThanOrEqual(1);
  });

  it("academics tip does NOT appear in startup mode when academics empty", () => {
    const resume = makeResume({
      identity: { name: "Test", email: "t@t.com", phone: "", location: "", github: "", linkedin: "", targetRole: "pre-med" },
    });
    const feedback = generateFeedback(resume, "startup");
    const acadItems = feedback.filter((f) => f.message.toLowerCase().includes("academic") || f.message.toLowerCase().includes("fsc"));
    expect(acadItems.length).toBe(0);
  });

  it("returns 3-6 feedback items for the mock resume in startup mode", () => {
    const feedback = generateFeedback(mockIdentityResume, "startup");
    expect(feedback.length).toBeGreaterThanOrEqual(3);
    expect(feedback.length).toBeLessThanOrEqual(6);
  });

  it("each feedback item has id, kind, message, and fixLabel", () => {
    const feedback = generateFeedback(mockIdentityResume, "startup");
    for (const item of feedback) {
      expect(typeof item.id).toBe("string");
      expect(item.id.length).toBeGreaterThan(0);
      expect(["warning", "tip"]).toContain(item.kind);
      expect(typeof item.message).toBe("string");
      expect(item.message.length).toBeGreaterThan(0);
      expect(typeof item.fixLabel).toBe("string");
      expect(item.fixLabel.length).toBeGreaterThan(0);
    }
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
    const clichéItem = feedback.find((f) => f.fixLabel.toLowerCase().includes("clich"));
    expect(clichéItem).toBeDefined();
    const fixed = applyAutoFix(resume, clichéItem!, "corporate");
    const hasCliché = fixed.experience.bullets.some((b) =>
      CLICHE_WORDS.some((c) => b.toLowerCase().includes(c))
    );
    expect(hasCliché).toBe(false);
  });

  it("keyword fix adds a missing keyword to skills.tech", () => {
    const resume = makeResume({
      identity: { name: "Test", email: "t@t.com", phone: "", location: "", github: "", linkedin: "", targetRole: "web developer" },
      skills: { tech: ["Canva"], soft: [] },
    });
    const feedback = generateFeedback(resume, "startup");
    const kwItem = feedback.find((f) => f.fixLabel.toLowerCase().includes("keyword"));
    expect(kwItem).toBeDefined();
    const fixed = applyAutoFix(resume, kwItem!, "startup");
    expect(fixed.skills.tech.length).toBeGreaterThan(resume.skills.tech.length);
  });

  it("GitHub fix sets identity.github to a URL", () => {
    const resume = makeResume({
      identity: { name: "Test", email: "t@t.com", phone: "", location: "", github: "", linkedin: "", targetRole: "web developer" },
    });
    const feedback = generateFeedback(resume, "startup");
    const ghItem = feedback.find((f) => f.fixLabel.toLowerCase().includes("github"));
    expect(ghItem).toBeDefined();
    const fixed = applyAutoFix(resume, ghItem!, "startup");
    expect(fixed.identity.github).toMatch(/^https?:\/\//);
  });

  it("metrics fix adds a number to the first metric-less bullet", () => {
    const resume = makeResume({
      experience: {
        rawNotes: "",
        bullets: ["Led a team of students and completed tasks.", "Organized an event for the department."],
        polished: false,
      },
      skills: { tech: ["Python"], soft: [] },
    });
    const feedback = generateFeedback(resume, "corporate");
    const metricItem = feedback.find(
      (f) => f.fixLabel.toLowerCase().includes("metric") || f.fixLabel.toLowerCase().includes("quantif")
    );
    expect(metricItem).toBeDefined();
    const fixed = applyAutoFix(resume, metricItem!, "corporate");
    expect(/\d+/.test(fixed.experience.bullets.join(" "))).toBe(true);
  });

  it("academics fix adds a placeholder academic entry", () => {
    const resume = makeResume({
      identity: { name: "Test", email: "t@t.com", phone: "", location: "", github: "", linkedin: "", targetRole: "pre-med" },
    });
    const feedback = generateFeedback(resume, "university");
    const acadItem = feedback.find((f) => f.fixLabel.toLowerCase().includes("academic"));
    expect(acadItem).toBeDefined();
    const fixed = applyAutoFix(resume, acadItem!, "university");
    expect(fixed.projects.academics.length).toBeGreaterThan(0);
  });

  it("is deterministic — same input always produces same output", () => {
    const resume = makeResume({
      experience: { rawNotes: "", bullets: ["I am a hardworking student."], polished: false },
    });
    const feedback = generateFeedback(resume, "corporate");
    const clichéItem = feedback.find((f) => f.fixLabel.toLowerCase().includes("clich"));
    expect(clichéItem).toBeDefined();
    expect(applyAutoFix(resume, clichéItem!, "corporate")).toEqual(
      applyAutoFix(resume, clichéItem!, "corporate")
    );
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