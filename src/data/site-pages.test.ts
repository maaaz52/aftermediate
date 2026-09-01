import { describe, expect, it } from "vitest";
import { groups } from "@/components/sidebar";
import { SITE_PAGES } from "@/data/site-pages";

const navLinks = groups.flatMap((group) => group.links);
const navHrefs = navLinks.map((l) => l.href);
const described = SITE_PAGES.map((p) => p.href);

describe("SITE_PAGES vs the sidebar", () => {
  it("describes every page the sidebar links to", () => {
    expect(navHrefs.filter((href) => !described.includes(href))).toEqual([]);
  });

  it("does not describe a page a student cannot reach", () => {
    // /onboard is the first-run quiz: required, deliberately not in the nav.
    expect(described.filter((href) => !navHrefs.includes(href))).toEqual(["/onboard"]);
  });

  it("calls each page what the student sees in the sidebar", () => {
    for (const link of navLinks) {
      expect(SITE_PAGES.find((p) => p.href === link.href)?.label, link.href).toBe(link.label);
    }
  });

  it("has a purpose for every page, short enough to sit on one prompt line", () => {
    for (const page of SITE_PAGES) {
      expect(page.purpose.length, page.href).toBeGreaterThan(20);
      expect(page.purpose.length, page.href).toBeLessThan(150);
    }
  });

  it("describes each href once, in the order a student meets them", () => {
    // The list goes into a prompt, so its order is the journey: core pages,
    // the first-run quiz, then the subject sections as the sidebar groups them.
    expect(new Set(described).size).toBe(described.length);
    expect(described).toEqual([...navHrefs.slice(0, 2), "/onboard", ...navHrefs.slice(2)]);
  });
});
