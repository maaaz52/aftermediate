import { describe, expect, it } from "vitest";
import {
  fastestGrowingField,
  filterEntryTests,
  filterScholarships,
  filterUniversities,
  formatSalaryRange,
  highestPayingField,
  mostStableField,
  sortSalaryFields,
} from "@/lib/pakistan-filters";
import type {
  EntryTest,
  PakistanScholarship,
  PakistanUniversity,
  SalaryField,
} from "@/lib/types";

const unis: PakistanUniversity[] = [
  {
    id: "nust", name: "National University of Sciences & Technology", short: "NUST",
    city: "Islamabad", type: "public", streams: ["pre-engineering", "ics"],
    ranking: { label: "QS #334", sourceUrl: "https://nust.edu.pk" },
    entryTest: "NET", intro: "x".repeat(50),
    admissionSteps: [{ title: "Apply", detail: "Apply online via the admission portal" }],
    fees: { summary: "~PKR 175k/year", sourceUrl: "https://nust.edu.pk/fees" },
    bestFields: [{ field: "Engineering", why: "Top-ranked engineering school in Pakistan" }],
    sourceUrls: ["https://nust.edu.pk"],
  },
  {
    id: "lums", name: "Lahore University of Management Sciences", short: "LUMS",
    city: "Lahore", type: "private", streams: ["pre-engineering", "icom", "alevel"],
    ranking: { label: "QS #551-600", sourceUrl: "https://lums.edu.pk" },
    entryTest: "SAT/LCAT", intro: "x".repeat(50),
    admissionSteps: [{ title: "Apply", detail: "Apply online via the admission portal" }],
    fees: { summary: "~PKR 900k/year", sourceUrl: "https://lums.edu.pk/fees" },
    bestFields: [{ field: "Business", why: "Pakistan's top business school" }],
    sourceUrls: ["https://lums.edu.pk"],
  },
  {
    id: "aku", name: "Aga Khan University", short: "AKU",
    city: "Karachi", type: "private", streams: ["pre-medical", "alevel"],
    ranking: { label: "Unranked internationally", sourceUrl: "https://aku.edu" },
    entryTest: "AKU test", intro: "x".repeat(50),
    admissionSteps: [{ title: "Apply", detail: "Apply online via the admission portal" }],
    fees: { summary: "Financial aid available", sourceUrl: "https://aku.edu/fees" },
    bestFields: [{ field: "Medicine", why: "Premier medical university" }],
    sourceUrls: ["https://aku.edu"],
  },
];

const tests: EntryTest[] = [
  {
    id: "mdcat", name: "Medical & Dental College Admission Test", short: "MDCAT",
    streams: ["pre-medical"], conductingBody: "PMC", acceptedBy: ["All medical colleges"],
    fee: "PKR 8,000", frequency: "Once a year", validity: "2 years",
    pattern: [{ section: "Biology", questions: 68, marks: 68 }],
    syllabus: [{ subject: "Biology", topics: ["Cell biology", "Genetics"] }],
    howToApply: ["Register online"], sourceUrls: ["https://pmdc.pk"],
  },
  {
    id: "net", name: "NUST Entry Test", short: "NET",
    streams: ["pre-engineering", "ics"], conductingBody: "NUST", acceptedBy: ["NUST"],
    fee: "PKR 8,000", frequency: "4 series/year", validity: "1 year",
    pattern: [{ section: "Maths", questions: 80, marks: 80 }],
    syllabus: [{ subject: "Maths", topics: ["Calculus", "Algebra"] }],
    howToApply: ["Register online"], sourceUrls: ["https://nust.edu.pk"],
  },
];

const scholarships: PakistanScholarship[] = [
  {
    id: "ehsaas-ug", name: "Ehsaas Undergraduate Scholarship", category: "hec",
    funder: "HEC + BISP", level: "Undergraduate", coverage: "Full tuition + stipend",
    eligibility: ["Family income below threshold"], deadline: "Cycle-based",
    sourceUrl: "https://hec.gov.pk",
  },
  {
    id: "nop", name: "National Outreach Programme", category: "university-specific",
    funder: "LUMS", level: "Undergraduate", coverage: "Full financial aid",
    eligibility: ["Top board marks", "Demonstrated need"], deadline: "Annually Feb-May",
    sourceUrl: "https://nop.lums.edu.pk",
  },
  {
    id: "peef", name: "PEEF Scholarship", category: "provincial",
    funder: "Punjab Govt", level: "Undergraduate", coverage: "Tuition support",
    eligibility: ["Punjab domicile", "Merit based"], deadline: "Cycle-based",
    sourceUrl: "https://peef.org.pk",
  },
];

const fields: SalaryField[] = [
  {
    id: "se", name: "Software Engineering", emoji: "💻", streams: ["pre-engineering", "ics"],
    salaries: { entry: [50, 120], mid: [120, 250], senior: [250, 500] },
    demand: "high", growth: 25, stability: "medium",
    sources: ["https://www.glassdoor.com"],
  },
  {
    id: "medicine", name: "Medicine", emoji: "🩺", streams: ["pre-medical"],
    salaries: { entry: [60, 150], mid: [150, 300], senior: [300, 800] },
    demand: "high", growth: 8, stability: "high",
    sources: ["https://www.payscale.com"],
  },
  {
    id: "education", name: "Education", emoji: "📚", streams: ["pre-engineering", "icom"],
    salaries: { entry: [30, 60], mid: [60, 110], senior: [110, 200] },
    demand: "medium", growth: 10, stability: "medium",
    sources: ["https://www.salaryexplorer.com"],
  },
];

describe("filterUniversities", () => {
  it("returns all when no filters are given", () => {
    expect(filterUniversities(unis)).toHaveLength(3);
  });

  it("filters by stream", () => {
    const result = filterUniversities(unis, { stream: "pre-medical" });
    expect(result.map((u) => u.id)).toEqual(["aku"]);
  });

  it("filters by type", () => {
    const result = filterUniversities(unis, { type: "public" });
    expect(result.map((u) => u.id)).toEqual(["nust"]);
  });

  it("filters by query across name, short, city, and best fields", () => {
    expect(filterUniversities(unis, { query: "business" }).map((u) => u.id)).toEqual(["lums"]);
    expect(filterUniversities(unis, { query: "Lahore" }).map((u) => u.id)).toEqual(["lums"]);
    expect(filterUniversities(unis, { query: "  NuSt  " }).map((u) => u.id)).toEqual(["nust"]);
  });

  it("combines query, stream, and type", () => {
    const result = filterUniversities(unis, { query: "university", stream: "pre-engineering", type: "private" });
    expect(result.map((u) => u.id)).toEqual(["lums"]);
  });

  it("does not mutate the input array", () => {
    const before = [...unis];
    filterUniversities(unis, { query: "x", stream: "pre-medical", type: "private" });
    expect(unis).toEqual(before);
  });
});

describe("filterEntryTests", () => {
  it("returns all when stream is 'all'", () => {
    expect(filterEntryTests(tests, "all")).toHaveLength(2);
  });

  it("filters by stream", () => {
    expect(filterEntryTests(tests, "pre-medical").map((t) => t.id)).toEqual(["mdcat"]);
    expect(filterEntryTests(tests, "ics").map((t) => t.id)).toEqual(["net"]);
  });
});

describe("filterScholarships", () => {
  it("returns all when no filters are given", () => {
    expect(filterScholarships(scholarships)).toHaveLength(3);
  });

  it("filters by category", () => {
    expect(filterScholarships(scholarships, { category: "hec" }).map((s) => s.id)).toEqual(["ehsaas-ug"]);
  });

  it("filters by query across name, funder, level, and eligibility", () => {
    expect(filterScholarships(scholarships, { query: "punjab" }).map((s) => s.id)).toEqual(["peef"]);
    expect(filterScholarships(scholarships, { query: "financial aid" }).map((s) => s.id)).toEqual(["nop"]);
  });

  it("combines category and query", () => {
    expect(filterScholarships(scholarships, { category: "university-specific", query: "LUMS" }).map((s) => s.id))
      .toEqual(["nop"]);
  });
});

describe("sortSalaryFields", () => {
  it("sorts by max salary desc by default at senior level", () => {
    expect(sortSalaryFields(fields).map((f) => f.id)).toEqual(["medicine", "se", "education"]);
  });

  it("sorts ascending when dir is 'asc'", () => {
    expect(sortSalaryFields(fields, "entry", "asc").map((f) => f.id)).toEqual(["education", "se", "medicine"]);
  });

  it("breaks ties on max using the min", () => {
    const tied: SalaryField[] = [
      { ...fields[0], id: "b", salaries: { entry: [50, 100], mid: [50, 100], senior: [80, 300] } },
      { ...fields[0], id: "a", salaries: { entry: [50, 100], mid: [50, 100], senior: [100, 300] } },
    ];
    expect(sortSalaryFields(tied, "senior", "desc").map((f) => f.id)).toEqual(["a", "b"]);
  });

  it("does not mutate the input array", () => {
    const before = [...fields];
    sortSalaryFields(fields, "entry", "asc");
    expect(fields).toEqual(before);
  });
});

describe("stat helpers", () => {
  it("highestPayingField returns the field with the highest senior max", () => {
    expect(highestPayingField(fields).id).toBe("medicine");
  });

  it("fastestGrowingField returns the field with the highest growth", () => {
    expect(fastestGrowingField(fields).id).toBe("se");
  });

  it("mostStableField prefers stability=high with demand=high", () => {
    expect(mostStableField(fields).id).toBe("medicine");
  });

  it("mostStableField falls back to stability=high when none has high demand", () => {
    const noHighDemand: SalaryField[] = fields.map((f) =>
      f.id === "medicine" ? { ...f, demand: "medium" } : f
    );
    expect(mostStableField(noHighDemand).id).toBe("medicine");
  });

  it("mostStableField prefers stability=high over a higher-paid lower-stability field", () => {
    const decoy: SalaryField[] = [
      {
        ...fields[0],
        id: "se",
        salaries: { entry: [50, 120], mid: [120, 250], senior: [400, 900] },
        stability: "medium",
      },
      fields[1],
      fields[2],
    ];
    expect(mostStableField(decoy).id).toBe("medicine");
  });
});

describe("formatSalaryRange", () => {
  it("renders values in thousands with the k suffix", () => {
    expect(formatSalaryRange(50, 120)).toBe("50k – 120k");
  });

  it("does not divide values (stored in thousands, not raw PKR)", () => {
    expect(formatSalaryRange(50, 120)).not.toBe("0.05k – 0.12k");
  });

  it("handles equal bounds", () => {
    expect(formatSalaryRange(80, 80)).toBe("80k – 80k");
  });
});
