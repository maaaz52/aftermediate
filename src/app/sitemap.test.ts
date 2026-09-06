import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";

describe("sitemap", () => {
  it("includes landing, legal and every dynamic content route with absolute URLs", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://www.aftermediate.site/");
    expect(urls).toContain("https://www.aftermediate.site/terms");
    expect(urls).toContain("https://www.aftermediate.site/pakistan/universities/nust");
    expect(urls).toContain("https://www.aftermediate.site/pakistan/entry-tests/mdcat");
    expect(urls).toContain("https://www.aftermediate.site/pakistan/scholarships/ehsaas-ug");
    expect(urls).toContain("https://www.aftermediate.site/abroad/countries/germany");
    expect(urls).toContain("https://www.aftermediate.site/abroad/scholarships/hec-foreign-scholarships");
    expect(urls).toContain("https://www.aftermediate.site/abroad/test-prep/ielts");
    expect(urls).toContain("https://www.aftermediate.site/mentors");
  });

  it("excludes auth, tool and app-only routes", () => {
    const urls = sitemap().map((e) => e.url);
    for (const p of ["/login", "/dashboard", "/profile", "/merit", "/study", "/builder", "/api/chat"]) {
      expect(urls.some((u) => u.endsWith(p)), p).toBe(false);
    }
  });
});

describe("robots", () => {
  it("disallows sensitive routes and references the production sitemap", () => {
    const r = robots();
    expect(r.sitemap).toBe("https://www.aftermediate.site/sitemap.xml");
    const dis = Array.isArray(r.rules) ? r.rules.flatMap((x) => x.disallow ?? []) : (r.rules.disallow ?? []);
    for (const p of ["/api/", "/dashboard", "/profile", "/login", "/study"]) {
      expect(dis).toContain(p);
    }
    expect(dis).not.toContain("/");
  });
});