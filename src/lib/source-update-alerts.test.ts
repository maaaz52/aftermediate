import { describe, expect, it } from "vitest";
import { sourceUpdateAlertLink } from "./source-update-alerts";

describe("source update alert links", () => {
  it("links followed universities to their official Aftermediate detail page", () => {
    expect(sourceUpdateAlertLink("university", "fast")).toContain("/pakistan/universities/fast");
  });

  it("distinguishes Pakistan and abroad scholarship detail pages", () => {
    expect(sourceUpdateAlertLink("scholarship", "ehsaas-ug")).toContain("/pakistan/scholarships/ehsaas-ug");
    expect(sourceUpdateAlertLink("scholarship", "fulbright-pakistan")).toContain("/abroad/scholarships/fulbright-pakistan");
  });
});
