import { describe, expect, it } from "vitest";
import { chooseProfile } from "@/lib/merge-profile";

const localAt = "2026-08-20T10:00:00.000Z";
const remoteNewer = "2026-08-21T10:00:00.000Z";
const remoteOlder = "2026-08-19T10:00:00.000Z";

describe("chooseProfile", () => {
  it("takes local when there is no remote row", () => {
    const r = chooseProfile({ city: "Lahore" }, localAt, null, null);
    expect(r.use).toBe("local");
  });

  it("takes remote when remote is newer", () => {
    const r = chooseProfile({ city: "Lahore" }, localAt, { city: "Karachi" }, remoteNewer);
    expect(r.use).toBe("remote");
    expect(r.profile.city).toBe("Karachi");
  });

  it("keeps local when local is newer", () => {
    const r = chooseProfile({ city: "Lahore" }, localAt, { city: "Karachi" }, remoteOlder);
    expect(r.use).toBe("local");
    expect(r.profile.city).toBe("Lahore");
  });

  it("takes remote when the local cache has never been stamped", () => {
    const r = chooseProfile({}, null, { city: "Karachi" }, remoteOlder);
    expect(r.use).toBe("remote");
  });
});
