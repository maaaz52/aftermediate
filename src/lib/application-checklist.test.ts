import { describe, expect, it } from "vitest";
import { applicationChecklist, validCompletedTaskIds } from "./application-checklist";

describe("application checklist", () => {
  it("derives university admissions tasks from the catalogue", () => {
    expect(applicationChecklist("university", "fast").length).toBeGreaterThan(1);
  });

  it("only accepts task identifiers actually available for that item", () => {
    const task = applicationChecklist("university", "fast")[0]!;
    expect(validCompletedTaskIds("university", "fast", [task.id, task.id])).toEqual([task.id]);
    expect(validCompletedTaskIds("university", "fast", ["invented-task"])).toBeNull();
  });
});
