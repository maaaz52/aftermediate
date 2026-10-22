import { describe, expect, it } from "vitest";
import { followEntityDetail, isFollowableEntity, isFollowEntityType } from "./source-follow";

describe("source follows", () => {
  it("allows catalogue universities and scholarships", () => {
    expect(isFollowableEntity("university", "fast")).toBe(true);
    expect(isFollowableEntity("scholarship", "fulbright-pakistan")).toBe(true);
  });

  it("refuses unknown entities and invalid types", () => {
    expect(isFollowableEntity("university", "not-a-university")).toBe(false);
    expect(isFollowableEntity("scholarship", "")).toBe(false);
    expect(isFollowEntityType("university")).toBe(true);
    expect(isFollowEntityType("country")).toBe(false);
  });

  it("maps followed catalogue entries to their detail pages", () => {
    expect(followEntityDetail("university", "fast")).toMatchObject({ href: "/pakistan/universities/fast", kindLabel: "University" });
    expect(followEntityDetail("scholarship", "ehsaas-ug")).toMatchObject({ href: "/pakistan/scholarships/ehsaas-ug", kindLabel: "Scholarship" });
  });
});
