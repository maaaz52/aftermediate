// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { mockResume } from "@/data/resume-mock";
import { buildStandaloneHtml, slugify } from "./share-modal";

describe("slugify", () => {
  it("lowercases and joins words with dashes", () => {
    expect(slugify("Hira Ahmed")).toBe("hira-ahmed");
  });

  it("collapses whitespace runs and strips punctuation", () => {
    expect(slugify("  Ali  Khan!  ")).toBe("ali-khan");
  });

  it("preserves existing hyphens", () => {
    expect(slugify("Pre-Med")).toBe("pre-med");
  });
});

describe("buildStandaloneHtml", () => {
  it("academic template includes name, role, a bullet, the print rule, and closes the doc", () => {
    const html = buildStandaloneHtml(mockResume, "academic");
    expect(html).toContain("Hira Ahmed");
    expect(html).toContain("Pre-Med Research Intern");
    expect(html).toContain("Coordinated logistics");
    expect(html).toContain("@media print");
    expect(html).toContain("background: white !important");
    expect(html.endsWith("</html>")).toBe(true);
  });

  it("silicon template uses the dark slate palette", () => {
    const html = buildStandaloneHtml(mockResume, "silicon");
    expect(html).toContain("#0F172A");
  });

  it("escapes user text so raw HTML cannot be injected", () => {
    const resume = {
      ...mockResume,
      identity: { ...mockResume.identity, name: '<script>alert("x")</script>' },
    };
    const html = buildStandaloneHtml(resume, "academic");
    expect(html).not.toContain("<script");
    expect(html).toContain("&lt;script&gt;");
  });

  it("omits sections that have no content", () => {
    const resume = {
      ...mockResume,
      experience: { ...mockResume.experience, bullets: [] },
      projects: { entries: [], academics: [], certificates: [], leadership: [] },
      skills: { tech: [], soft: [] },
    };
    const html = buildStandaloneHtml(resume, "academic");
    expect(html).not.toContain("<h2>Experience</h2>");
    expect(html).not.toContain("<h2>Projects</h2>");
    expect(html).not.toContain("<h2>Skills</h2>");
  });
});
