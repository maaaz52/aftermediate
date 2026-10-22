import { describe, expect, it } from "vitest";
import universities from "@/data/pakistan-universities.json";
import { admissionCalendarFor, withConfirmedAdmissionDates } from "@/lib/admission-calendar";
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

  it("replaces only reviewed dates and keeps planning estimates for the rest", () => {
    const fast = catalogue.universities.find((university) => university.id === "fast");
    const calendar = withConfirmedAdmissionDates(admissionCalendarFor(fast!), [{
      eventType: "test",
      timingLabel: "18 July 2027",
      sourceUrl: "https://www.nu.edu.pk/Admissions/Schedule",
      confirmedAt: "2027-05-01T00:00:00.000Z",
    }]);
    expect(calendar.events.find((event) => event.id === "test")).toMatchObject({ timing: "18 July 2027", confidence: "confirmed" });
    expect(calendar.events.find((event) => event.id === "intake")?.confidence).toBe("estimated");
  });
});
