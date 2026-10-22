import { createHash } from "node:crypto";
import universityCatalog from "@/data/pakistan-universities.json";
import pakistanScholarshipCatalog from "@/data/pakistan-scholarships.json";
import abroadScholarshipCatalog from "@/data/abroad-scholarships.json";

export type SourceMonitorKind = "admission-schedule" | "eligibility" | "fee-structure" | "admissions-page" | "scholarship";

export interface SourceMonitorDefinition {
  id: string;
  entityType: "university" | "scholarship";
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
  fees?: { sourceUrl?: string };
};

const UNIVERSITY_ADMISSIONS_MONITORS: SourceMonitorDefinition[] = (
  universityCatalog.universities as UniversityCatalogEntry[]
)
  .flatMap((university) => {
    // Monitor every official admissions or fee link recorded for a university.
    // The first ID stays stable so existing baselines are retained after this
    // expansion; later sources receive their own independent history.
    const officialUrls = [...new Set([...university.sourceUrls, university.fees?.sourceUrl].filter(Boolean))] as string[];
    if (officialUrls.length === 0 || officialUrls.some((url) => !url.startsWith("https://"))) {
      throw new Error(`University ${university.id} needs HTTPS official source URLs.`);
    }

    return officialUrls.map((sourceUrl, index) => ({
      id: index === 0 ? `university-${university.id}-admissions` : `university-${university.id}-source-${index + 1}`,
      entityType: "university" as const,
      entityId: university.id,
      label:
        sourceUrl === university.fees?.sourceUrl
          ? `${university.short || university.name} fee structure`
          : index === 0
            ? `${university.short || university.name} admissions information`
            : `${university.short || university.name} official admissions source ${index + 1}`,
      sourceUrl,
      kind: sourceUrl === university.fees?.sourceUrl ? "fee-structure" as const : "admissions-page" as const,
    }));
  });

type PakistanScholarshipEntry = {
  id: string;
  name: string;
  sourceUrl: string;
};

type AbroadScholarshipEntry = {
  id: string;
  name: string;
  sourceUrls: string[];
};

function scholarshipMonitorDefinitions(
  catalogue: "pakistan" | "abroad",
  scholarships: { id: string; name: string; sourceUrls: string[] }[]
): SourceMonitorDefinition[] {
  return scholarships.flatMap((scholarship) => {
    const sourceUrls = [...new Set(scholarship.sourceUrls)];
    if (sourceUrls.length === 0 || sourceUrls.some((url) => !url.startsWith("https://"))) {
      throw new Error(`Scholarship ${scholarship.id} needs HTTPS source URLs.`);
    }

    return sourceUrls.map((sourceUrl, index) => ({
      id: `scholarship-${catalogue}-${scholarship.id}-source-${index + 1}`,
      entityType: "scholarship" as const,
      entityId: scholarship.id,
      label: `${scholarship.name} source${sourceUrls.length > 1 ? ` ${index + 1}` : ""}`,
      sourceUrl,
      kind: "scholarship" as const,
    }));
  });
}

const SCHOLARSHIP_SOURCE_MONITOR_DEFINITIONS = [
  ...scholarshipMonitorDefinitions(
    "pakistan",
    (pakistanScholarshipCatalog.scholarships as PakistanScholarshipEntry[]).map((scholarship) => ({
      ...scholarship,
      sourceUrls: [scholarship.sourceUrl],
    }))
  ),
  ...scholarshipMonitorDefinitions("abroad", abroadScholarshipCatalog.scholarships as AbroadScholarshipEntry[]),
];

/**
 * This is the complete, versioned allowlist for the monitor. The university
 * directory is the source of truth, so every recorded official admissions and
 * fee source is enrolled in the next cron cycle.
 */
export const SOURCE_MONITOR_DEFINITIONS: SourceMonitorDefinition[] = [
  ...FAST_SOURCE_MONITOR_DEFINITIONS,
  ...UNIVERSITY_ADMISSIONS_MONITORS,
  ...SCHOLARSHIP_SOURCE_MONITOR_DEFINITIONS,
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
