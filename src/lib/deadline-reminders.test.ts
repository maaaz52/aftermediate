import { describe, expect, it } from "vitest";
import { deadlineDistanceLabel, isIsoCalendarDate } from "./deadline-reminders";

describe("deadline reminders", () => {
  it("accepts only real ISO calendar dates", () => {
    expect(isIsoCalendarDate("2027-07-18")).toBe(true);
    expect(isIsoCalendarDate("2027-02-29")).toBe(false);
    expect(isIsoCalendarDate("18 July 2027")).toBe(false);
  });

  it("uses clear deadline distance labels", () => {
    const today = new Date("2027-07-10T12:00:00Z");
    expect(deadlineDistanceLabel("2027-07-10", today)).toBe("today");
    expect(deadlineDistanceLabel("2027-07-11", today)).toBe("tomorrow");
    expect(deadlineDistanceLabel("2027-07-18", today)).toBe("in 8 days");
  });
});
