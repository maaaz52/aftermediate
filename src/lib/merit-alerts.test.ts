import { describe, expect, it } from "vitest";
import { isSourceAlertKind, sourceAlertIntro, sourceAlertSubject } from "./merit-alerts";

describe("merit and selection alerts", () => {
  it("uses clear, non-personal merit list language", () => {
    expect(sourceAlertSubject("merit-list", "FAST-NUCES admissions")).toBe("Merit list published: FAST-NUCES admissions");
    expect(sourceAlertIntro("merit-list")).toContain("official merit-list");
  });

  it("accepts only supported classifications", () => {
    expect(isSourceAlertKind("selection-update")).toBe(true);
    expect(isSourceAlertKind("personal-offer")).toBe(false);
  });
});
