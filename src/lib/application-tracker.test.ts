import { describe, expect, it } from "vitest";
import { applicationStatusLabel, isApplicationStatus } from "./application-tracker";

describe("application tracker", () => {
  it("accepts only the supported private plan statuses", () => {
    expect(isApplicationStatus("preparing")).toBe(true);
    expect(isApplicationStatus("accepted")).toBe(false);
  });

  it("uses student-friendly status labels", () => {
    expect(applicationStatusLabel("decision-received")).toBe("Decision received");
  });
});
