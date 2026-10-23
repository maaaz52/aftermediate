import { describe, expect, it } from "vitest";
import { searchSite } from "@/lib/site-search";

describe("searchSite", () => {
  it("returns a university detail result for an exact university query", () => {
    expect(searchSite("NUST")[0]).toMatchObject({
      label: "National University of Sciences & Technology",
      href: "/pakistan/universities/nust",
      kind: "university",
    });
  });

  it("includes newly added regional universities in global search", () => {
    expect(searchSite("IMSciences")[0]).toMatchObject({
      label: "Institute of Management Sciences",
      href: "/pakistan/universities/imsciences",
      kind: "university",
    });
    expect(searchSite("Namal")[0]).toMatchObject({
      href: "/pakistan/universities/namal",
      kind: "university",
    });
  });

  it("returns navigable site pages for general feature queries", () => {
    expect(searchSite("merit")).toEqual(
      expect.arrayContaining([expect.objectContaining({ href: "/merit", kind: "page" })])
    );
  });

  it("does not search until the user has entered two characters", () => {
    expect(searchSite("n")).toEqual([]);
  });
});
