import { describe, expect, it } from "vitest";
import universities from "@/data/pakistan-universities.json";
import { admissionCalendarFor } from "@/lib/admission-calendar";
import type { PakistanUniversity } from "@/lib/types";

const catalogue = universities as unknown as { universities: PakistanUniversity[] };

describe("admission calendar", () => {
  it("creates six clearly estimated milestones for every listed university", () => {
    for (const university of catalogue.universities) {
      const calendar = admissionCalendarFor(university);
      expect(calendar.events).toHaveLength(6);
      expect(calendar.events.every((event) => event.confidence === "estimated")).toBe(true);
      expect(calendar.sourceUrl.startsWith("https://")).toBe(true);
    }
  });

  it("uses distinctive cycles where a university has a known multi-stage pattern", () => {
    const nust = catalogue.universities.find((university) => university.id === "nust");
    const fast = catalogue.universities.find((university) => university.id === "fast");
    expect(admissionCalendarFor(nust!).events.find((event) => event.id === "test")?.timing).toBe("Dec–Apr");
    expect(admissionCalendarFor(fast!).events.find((event) => event.id === "test")?.timing).toBe("Jul");
  });
});
