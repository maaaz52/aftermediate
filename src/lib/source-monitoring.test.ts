import { describe, expect, it } from "vitest";
import {
  describeDetectedChange,
  extractSourceSignals,
  SOURCE_MONITOR_DEFINITIONS,
  sourceDefinition,
  sourceFingerprint,
  sourceTextFromHtml,
} from "@/lib/source-monitoring";
import universityCatalog from "@/data/pakistan-universities.json";
import pakistanScholarshipCatalog from "@/data/pakistan-scholarships.json";
import abroadScholarshipCatalog from "@/data/abroad-scholarships.json";

describe("source monitoring", () => {
  it("ignores scripts and formatting when fingerprinting an official page", () => {
    const first = sourceTextFromHtml("<html><head><script>nonce=1</script></head><body><h1>FAST schedule</h1><p>Jul 22</p></body></html>");
    const second = sourceTextFromHtml("<body> FAST schedule <p>Jul 22</p><script>nonce=2</script></body>");
    expect(sourceFingerprint(first)).toBe(sourceFingerprint(second));
  });

  it("extracts a reviewable FAST schedule signal without publishing it", () => {
    const source = sourceDefinition("fast-admission-schedule");
    expect(source).toBeDefined();
    const signals = extractSourceSignals(source!, "<title>Schedule</title> Merit List announcement of selected / test qualified candidates | Jul 22 (Wed) | Aug 5 (Wed)");
    expect(signals.meritListAnnouncement).toContain("Jul 22");
    expect(describeDetectedChange(source!, signals)).toContain("FAST-NUCES admission schedule changed");
  });

  it("covers every university in the current Pakistan directory with an allowlisted official source", () => {
    const monitoredUniversityIds = new Set(
      SOURCE_MONITOR_DEFINITIONS.filter((source) => source.entityType === "university").map((source) => source.entityId)
    );
    const directoryUniversityIds = new Set(universityCatalog.universities.map((university) => university.id));

    expect(monitoredUniversityIds).toEqual(directoryUniversityIds);
    expect(SOURCE_MONITOR_DEFINITIONS.every((source) => source.sourceUrl.startsWith("https://"))).toBe(true);

    for (const university of universityCatalog.universities) {
      const expectedUrls = [...new Set([...university.sourceUrls, university.fees.sourceUrl])];
      const monitoredUrls = new Set(
        SOURCE_MONITOR_DEFINITIONS.filter((source) => source.entityId === university.id).map((source) => source.sourceUrl)
      );
      for (const url of expectedUrls) expect(monitoredUrls).toContain(url);
    }
  });

  it("covers every source in both active scholarship directories", () => {
    const scholarshipSources = [
      ...pakistanScholarshipCatalog.scholarships.map((scholarship) => ({
        id: scholarship.id,
        sourceUrls: [scholarship.sourceUrl],
      })),
      ...abroadScholarshipCatalog.scholarships,
    ];

    for (const scholarship of scholarshipSources) {
      const monitoredUrls = new Set(
        SOURCE_MONITOR_DEFINITIONS.filter(
          (source) => source.entityType === "scholarship" && source.entityId === scholarship.id
        ).map((source) => source.sourceUrl)
      );
      for (const url of scholarship.sourceUrls) expect(monitoredUrls).toContain(url);
    }
  });
});
