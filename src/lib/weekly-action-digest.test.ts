import { describe, expect, it } from "vitest";
import { digestContent } from "./weekly-action-digest";

describe("weekly action digest", () => {
  it("makes a focused, escaped application action", () => {
    const content = digestContent({
      entityType: "university", entityId: "fast", kind: "task",
      title: "Prepare <documents>", detail: "Check & upload them.",
    });
    expect(content.subject).toBe("Your next action: Prepare <documents>");
    expect(content.html).toContain("Prepare &lt;documents&gt;");
    expect(content.html).toContain("Check &amp; upload them.");
    expect(content.html).toContain("/pakistan/universities/fast");
  });
});
