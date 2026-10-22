import { describe, expect, it } from "vitest";
import { applicationFocus } from "./application-focus";

describe("application focus", () => {
  const now = new Date("2027-07-10T12:00:00Z");

  it("puts an imminent confirmed deadline ahead of other work", () => {
    const focus = applicationFocus(
      [{ entityType: "university", entityId: "fast" }],
      [{ entityType: "university", entityId: "fast", label: "Apply", dueDate: "2027-07-15" }],
      [], now
    );
    expect(focus).toMatchObject({ kind: "deadline", title: "Apply" });
  });

  it("asks for a plan before suggesting checklist work", () => {
    const focus = applicationFocus([{ entityType: "university", entityId: "fast" }], [], [], now);
    expect(focus).toMatchObject({ kind: "plan" });
  });
});
