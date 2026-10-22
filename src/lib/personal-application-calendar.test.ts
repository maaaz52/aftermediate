import { describe, expect, it } from "vitest";
import { personalApplicationCalendar } from "./personal-application-calendar";

describe("personal application calendar", () => {
  it("keeps estimates labelled and lets official dates override a milestone", () => {
    const [fast] = personalApplicationCalendar(
      [{ entityType: "university", entityId: "fast" }],
      { fast: [{ eventType: "test", timingLabel: "18 July 2027", sourceUrl: "https://nu.edu.pk/admissions", confirmedAt: "2027-06-01" }] },
      []
    );
    expect(fast.events).toHaveLength(6);
    expect(fast.events.find((event) => event.id === "test")).toMatchObject({ timing: "18 July 2027", confidence: "confirmed" });
    expect(fast.events.find((event) => event.id === "intake")?.confidence).toBe("estimated");
  });

  it("adds exact scholarship deadlines but does not invent a schedule", () => {
    const [scholarship] = personalApplicationCalendar(
      [{ entityType: "scholarship", entityId: "example" }], {},
      [{ entityType: "scholarship", entityId: "example", label: "Apply by", dueDate: "2027-04-11", officialUrl: "https://example.edu/deadline" }]
    );
    expect(scholarship.events).toEqual([expect.objectContaining({ timing: "2027-04-11", confidence: "confirmed" })]);
  });
});
