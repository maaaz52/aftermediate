import { createHash } from "node:crypto";
import universityCatalog from "@/data/pakistan-universities.json";

export type SourceMonitorKind = "admission-schedule" | "eligibility" | "fee-structure" | "admissions-page";

export interface SourceMonitorDefinition {
  id: string;
  entityType: "university";
  entityId: string;
  label: string;
  sourceUrl: string;
  kind: SourceMonitorKind;
}

/**
 * These sources are deliberately allowlisted in code. A database row is not
 * allowed to turn the cron job into an unrestricted server-side fetcher.
 */
const FAST_SOURCE_MONITOR_DEFINITIONS: SourceMonitorDefinition[] = [
  {
    id: "fast-admission-schedule",
    entityType: "university",
    entityId: "fast",
    label: "FAST-NUCES admission schedule",
    sourceUrl: "https://nu.edu.pk/Admissions/Schedule",
    kind: "admission-schedule",
  },
  {
    id: "fast-eligibility",
    entityType: "university",
    entityId: "fast",
    label: "FAST-NUCES eligibility criteria",
    sourceUrl: "https://nu.edu.pk/Admissions/EligibilityCriteria",
    kind: "eligibility",
  },
  {
    id: "fast-fees",
    entityType: "university",
    entityId: "fast",
    label: "FAST-NUCES fee structure",
    sourceUrl: "https://nu.edu.pk/Admissions/FeeStructure",
    kind: "fee-structure",
  },
];

type UniversityCatalogEntry = {
  id: string;
  name: string;
  short: string;
  sourceUrls: string[];
};

const UNIVERSITY_ADMISSIONS_MONITORS: SourceMonitorDefinition[] = (
  universityCatalog.universities as UniversityCatalogEntry[]
)
  // FAST already has three more useful, admissions-specific official checks above.
  .filter((university) => university.id !== "fast")
  .map((university) => {
    const sourceUrl = university.sourceUrls[0];
    if (!sourceUrl?.startsWith("https://")) {
      throw new Error(`University ${university.id} needs an HTTPS primary official source URL.`);
    }

    return {
      id: `university-${university.id}-admissions`,
      entityType: "university",
      entityId: university.id,
      label: `${university.short || university.name} admissions information`,
      sourceUrl,
      kind: "admissions-page",
    };
  });

/**
 * This is the complete, versioned allowlist for the monitor. The university
 * directory is the source of truth, so adding a university there automatically
 * enrolls its primary official admissions page in the next cron cycle.
 */
export const SOURCE_MONITOR_DEFINITIONS: SourceMonitorDefinition[] = [
  ...FAST_SOURCE_MONITOR_DEFINITIONS,
  ...UNIVERSITY_ADMISSIONS_MONITORS,
];

export function sourceDefinition(id: string): SourceMonitorDefinition | undefined {
  return SOURCE_MONITOR_DEFINITIONS.find((source) => source.id === id);
}

/** Turn HTML into a stable, bounded public-text representation for comparison. */
export function sourceTextFromHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120_000);
}

export function sourceFingerprint(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function matchedValue(text: string, expression: RegExp): string | null {
  const match = expression.exec(text);
  return match?.[1]?.replace(/\s+/g, " ").trim().slice(0, 240) || null;
}

/**
 * Extract only small, reviewable signals. The complete official page is never
 * treated as a trustworthy automatic update to student-facing data.
 */
export function extractSourceSignals(source: SourceMonitorDefinition, text: string): Record<string, string | null> {
  const title = matchedValue(text, /<title[^>]*>([\s\S]*?)<\/title>/i) ?? null;
  const plain = sourceTextFromHtml(text);

  if (source.id === "fast-admission-schedule") {
    return {
      title,
      meritListAnnouncement: matchedValue(
        plain,
        /Merit List announcement of selected\s*\/\s*test qualified candidates\s*(?:\||:)?\s*([^|]{3,90})/i
      ),
      admissionApplications: matchedValue(
        plain,
        /Admission Application Submission\s*(?:\||:)?\s*([^|]{3,90})/i
      ),
    };
  }

  if (source.id === "fast-fees") {
    return {
      title,
      feePerCreditHour: matchedValue(
        plain,
        /(?:Rs\.?|PKR)\s*([0-9][0-9,]{2,12})\s*(?:per credit hour|\/\s*credit hour)/i
      ),
    };
  }

  if (source.id === "fast-eligibility") {
    return {
      title,
      computingTestWeight: matchedValue(plain, /Weightage of Admission Test marks\s*(?:\||:)?\s*([0-9]{1,3}%?)/i),
      computingHsscWeight: matchedValue(plain, /Weightage of HSSC[^|]{0,80}?(?:\||:)?\s*([0-9]{1,3}%?)/i),
    };
  }

  return { title };
}

export function describeDetectedChange(source: SourceMonitorDefinition, signals: Record<string, string | null>): string {
  const highlights = Object.entries(signals)
    .filter(([key, value]) => key !== "title" && value)
    .map(([key, value]) => `${key}: ${value}`)
    .slice(0, 3);
  return highlights.length > 0
    ? `${source.label} changed. Detected signals: ${highlights.join("; ")}.`
    : `${source.label} changed. Review the official source before publishing an update.`;
}
