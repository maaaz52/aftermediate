import type {
  EntryTest,
  PakistanScholarship,
  PakistanUniversity,
  SalaryField,
  SalaryLevel,
  ScholarshipCategory,
  Stream,
} from "./types";

export interface UniversityFilterOptions {
  query?: string;
  stream?: Stream | "all";
  type?: "all" | "public" | "private";
}

export function filterUniversities(
  list: PakistanUniversity[],
  opts: UniversityFilterOptions = {}
): PakistanUniversity[] {
  const q = opts.query?.trim().toLowerCase() ?? "";
  const stream = opts.stream ?? "all";
  const type = opts.type ?? "all";
  return list.filter((u) => {
    if (stream !== "all" && !u.streams.includes(stream)) return false;
    if (type !== "all" && u.type !== type) return false;
    if (q) {
      const haystack = [u.name, u.short, u.city, ...u.bestFields.map((b) => b.field)]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function filterEntryTests(
  list: EntryTest[],
  stream: Stream | "all" = "all"
): EntryTest[] {
  if (stream === "all") return [...list];
  return list.filter((t) => t.streams.includes(stream));
}

export interface ScholarshipFilterOptions {
  category?: ScholarshipCategory | "all";
  query?: string;
}

export function filterScholarships(
  list: PakistanScholarship[],
  opts: ScholarshipFilterOptions = {}
): PakistanScholarship[] {
  const category = opts.category ?? "all";
  const q = opts.query?.trim().toLowerCase() ?? "";
  return list.filter((s) => {
    if (category !== "all" && s.category !== category) return false;
    if (q) {
      const haystack = [s.name, s.funder, s.level, s.coverage, ...s.eligibility]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function sortSalaryFields(
  list: SalaryField[],
  level: SalaryLevel = "senior",
  dir: "asc" | "desc" = "desc"
): SalaryField[] {
  const factor = dir === "desc" ? -1 : 1;
  return [...list].sort((a, b) => {
    const aMax = a.salaries[level][1];
    const bMax = b.salaries[level][1];
    if (aMax !== bMax) return (aMax - bMax) * factor;
    return (a.salaries[level][0] - b.salaries[level][0]) * factor;
  });
}

/** Returns the field with the highest senior salary max. Precondition: `list` is non-empty. */
export function highestPayingField(list: SalaryField[]): SalaryField {
  return sortSalaryFields(list, "senior", "desc")[0];
}

/** Returns the field with the highest growth rate. Precondition: `list` is non-empty. */
export function fastestGrowingField(list: SalaryField[]): SalaryField {
  return [...list].sort((a, b) => b.growth - a.growth)[0];
}

/** Returns the highest-paid field with stability=high (preferring demand=high). Precondition: `list` contains at least one field with `stability === "high"`. */
export function mostStableField(list: SalaryField[]): SalaryField {
  const stable = list.filter((f) => f.stability === "high");
  const highDemandStable = stable.filter((f) => f.demand === "high");
  const pool = highDemandStable.length > 0 ? highDemandStable : stable;
  return sortSalaryFields(pool, "senior", "desc")[0];
}

/**
 * Formats a salary range. Values are stored in thousands of PKR/month,
 * e.g. (50, 120) renders "50k – 120k" (= PKR 50,000–120,000/month).
 */
export function formatSalaryRange(min: number, max: number): string {
  return `${min}k – ${max}k`;
}
