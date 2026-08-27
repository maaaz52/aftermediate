import { describe, expect, it } from "vitest";
import {
  cheapestCountry,
  compareCountries,
  filterAbroadScholarships,
  filterAbroadTests,
  filterCountries,
  lowestVisaFeeCountry,
  monthlyLivingTotal,
  mostGenerousPostStudyWork,
  sortCountries,
  testsForCountry,
} from "@/lib/abroad-filters";
import type { AbroadCountry, AbroadScholarship, AbroadTest } from "@/lib/types";

function country(id: string, over: Partial<AbroadCountry> = {}): AbroadCountry {
  return {
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    flag: "🏳️",
    intro: "A popular study destination for Pakistani students.",
    region: "europe",
    capital: "Capital City",
    language: "Language",
    currency: { code: "EUR", name: "Euro", symbol: "€", toPkr: 300, rateAsOf: "2026-08" },
    visa: {
      type: "Student visa",
      feePkr: 25000,
      processingTime: "4 weeks",
      keyPoints: ["Proof of funds", "Health insurance"],
    },
    intakes: ["October"],
    tuition: { ug: { min: 0, max: 0 }, masters: { min: 0, max: 0 }, phd: { min: 0, max: 0 } },
    living: {
      bigCity: { rent: 80000, food: 40000, transport: 12000, utilities: 12000, misc: 12000 },
      smallCity: { rent: 55000, food: 32000, transport: 9000, utilities: 10000, misc: 9000 },
    },
    oneTime: { applicationFee: 10000, visaFee: 25000, insurance: 30000, flight: 140000 },
    postStudyWork: "18-month job-seeking visa",
    postStudyWorkMonths: 18,
    pathway: [{ title: "Apply", detail: "Apply to the university online." }],
    documents: ["Passport", "Offer letter"],
    requiredTests: ["ielts"],
    topFields: ["Engineering"],
    pros: ["Good universities"],
    cons: ["Living costs"],
    sources: [{ label: "Official", url: "https://example.com" }],
    ...over,
  };
}

const countries: AbroadCountry[] = [
  country("germany"),
  country("usa", {
    region: "north-america",
    tuition: { ug: { min: 6000000, max: 9000000 }, masters: { min: 0, max: 0 }, phd: { min: 0, max: 0 } },
    postStudyWorkMonths: 36,
  }),
  country("china", {
    region: "asia",
    capital: "Beijing",
    tuition: { ug: { min: 400000, max: 800000 }, masters: { min: 0, max: 0 }, phd: { min: 0, max: 0 } },
    visa: {
      type: "X1 student visa",
      feePkr: 15000,
      processingTime: "2 weeks",
      keyPoints: ["Admission letter", "JW202 form"],
    },
    oneTime: { applicationFee: 5000, visaFee: 15000, insurance: 20000, flight: 120000 },
    topFields: ["Medicine", "Computer Science"],
  }),
];

describe("filterCountries", () => {
  it("returns all when no filters are given", () => {
    expect(filterCountries(countries)).toHaveLength(3);
  });

  it("filters by region", () => {
    expect(filterCountries(countries, { region: "europe" }).map((c) => c.id)).toEqual(["germany"]);
    expect(filterCountries(countries, { region: "asia" }).map((c) => c.id)).toEqual(["china"]);
  });

  it("filters by query across name, capital, and top fields", () => {
    expect(filterCountries(countries, { query: "beijing" }).map((c) => c.id)).toEqual(["china"]);
    expect(filterCountries(countries, { query: "medicine" }).map((c) => c.id)).toEqual(["china"]);
    expect(filterCountries(countries, { query: "  GeRmAnY  " }).map((c) => c.id)).toEqual(["germany"]);
  });

  it("combines query and region", () => {
    const result = filterCountries(countries, { query: "computer", region: "asia" });
    expect(result.map((c) => c.id)).toEqual(["china"]);
  });

  it("does not mutate the input array", () => {
    const before = [...countries];
    filterCountries(countries, { query: "x", region: "asia" });
    expect(countries).toEqual(before);
  });
});

describe("sortCountries", () => {
  it("sorts by name with localeCompare", () => {
    expect(sortCountries(countries, "name").map((c) => c.id)).toEqual(["china", "germany", "usa"]);
  });

  it("sorts cheapest first by bigCity living + UG tuition midpoint", () => {
    expect(sortCountries(countries, "cheapest").map((c) => c.id)).toEqual(["germany", "china", "usa"]);
  });

  it("does not mutate the input array", () => {
    const before = [...countries];
    sortCountries(countries, "cheapest");
    expect(countries).toEqual(before);
  });
});

describe("compareCountries", () => {
  it("preserves the requested id order", () => {
    expect(compareCountries(countries, ["usa", "germany"]).map((c) => c.id)).toEqual(["usa", "germany"]);
  });

  it("skips unknown ids", () => {
    expect(compareCountries(countries, ["usa", "nope", "china"]).map((c) => c.id)).toEqual(["usa", "china"]);
  });

  it("deduplicates repeated ids", () => {
    expect(compareCountries(countries, ["usa", "usa", "china"]).map((c) => c.id)).toEqual(["usa", "china"]);
  });
});

describe("monthlyLivingTotal", () => {
  it("sums all five components for the chosen tier", () => {
    expect(monthlyLivingTotal(countries[0], "big")).toBe(156000);
    expect(monthlyLivingTotal(countries[0], "small")).toBe(115000);
  });
});

describe("stat-strip helpers", () => {
  it("cheapestCountry returns the lowest-cost country", () => {
    expect(cheapestCountry(countries).id).toBe("germany");
  });

  it("mostGenerousPostStudyWork returns the longest window", () => {
    expect(mostGenerousPostStudyWork(countries).id).toBe("usa");
  });

  it("lowestVisaFeeCountry returns the cheapest visa fee", () => {
    expect(lowestVisaFeeCountry(countries).id).toBe("china");
  });

  it("throws on an empty list", () => {
    expect(() => cheapestCountry([])).toThrow("list must be non-empty");
    expect(() => mostGenerousPostStudyWork([])).toThrow("list must be non-empty");
    expect(() => lowestVisaFeeCountry([])).toThrow("list must be non-empty");
  });
});

const scholarships: AbroadScholarship[] = [
  {
    id: "fulbright",
    name: "Fulbright Pakistan",
    funder: "USEFP",
    category: "host-government",
    countries: ["usa"],
    level: "masters",
    coverage: "full",
    coverageDetail: "Tuition + stipend + airfare",
    eligibility: ["Pakistani citizen", "16 years of education", "Strong academics"],
    deadline: "Feb 2027 (approx.)",
    howToApply: ["Apply online via USEFP"],
    sourceUrls: ["https://usefp.org"],
  },
  {
    id: "hec-foreign",
    name: "HEC Foreign Scholarship",
    funder: "HEC Pakistan",
    category: "hec",
    countries: ["multiple"],
    level: "multiple",
    coverage: "full",
    coverageDetail: "Tuition + living allowance",
    eligibility: ["Pakistani citizen", "Masters degree", "HEC eligibility criteria"],
    deadline: "Cycle-based",
    howToApply: ["Apply via HEC portal"],
    sourceUrls: ["https://hec.gov.pk"],
  },
  {
    id: "daad-epos",
    name: "DAAD EPOS",
    funder: "DAAD",
    category: "host-government",
    countries: ["germany"],
    level: "masters",
    coverage: "full",
    coverageDetail: "Tuition + monthly stipend",
    eligibility: ["Bachelor's degree", "2 years work experience"],
    deadline: "Aug-Dec 2026 (approx.)",
    howToApply: ["Apply via DAAD portal"],
    sourceUrls: ["https://daad.de"],
  },
];

describe("filterAbroadScholarships", () => {
  it("returns all when no filters are given", () => {
    expect(filterAbroadScholarships(scholarships)).toHaveLength(3);
  });

  it("filters by category", () => {
    expect(filterAbroadScholarships(scholarships, { category: "hec" }).map((s) => s.id)).toEqual(["hec-foreign"]);
  });

  it("country filter matches specific ids and the \"multiple\" wildcard", () => {
    expect(filterAbroadScholarships(scholarships, { country: "usa" }).map((s) => s.id)).toEqual(["fulbright", "hec-foreign"]);
    expect(filterAbroadScholarships(scholarships, { country: "germany" }).map((s) => s.id)).toEqual(["hec-foreign", "daad-epos"]);
  });

  it("level filter matches exact level and the \"multiple\" wildcard", () => {
    expect(filterAbroadScholarships(scholarships, { level: "phd" }).map((s) => s.id)).toEqual(["hec-foreign"]);
    expect(filterAbroadScholarships(scholarships, { level: "bachelors" }).map((s) => s.id)).toEqual(["hec-foreign"]);
  });

  it("filters by query across name, funder, coverage, and eligibility", () => {
    expect(filterAbroadScholarships(scholarships, { query: "daad" }).map((s) => s.id)).toEqual(["daad-epos"]);
    expect(filterAbroadScholarships(scholarships, { query: "stipend" }).map((s) => s.id)).toEqual(["fulbright", "daad-epos"]);
  });

  it("combines category and country", () => {
    const result = filterAbroadScholarships(scholarships, { category: "host-government", country: "germany" });
    expect(result.map((s) => s.id)).toEqual(["daad-epos"]);
  });

  it("does not mutate the input array", () => {
    const before = [...scholarships];
    filterAbroadScholarships(scholarships, { query: "x", category: "hec" });
    expect(scholarships).toEqual(before);
  });
});

const tests: AbroadTest[] = [
  {
    id: "ielts",
    name: "IELTS Academic",
    short: "IELTS",
    kind: "english",
    countries: ["germany", "usa"],
    pattern: [{ section: "Listening", content: "4 recordings, 40 questions", duration: "30 min" }],
    feePkr: 59000,
    feeNote: "Varies by centre; PKR 59,000 typical in 2026",
    frequency: "Multiple times per month",
    validity: "2 years",
    competitiveScore: "7.0+ for top universities",
    prep: { tips: ["Take timed practice tests"], resources: [{ label: "IELTS.org", url: "https://ielts.org" }] },
    sourceUrls: ["https://ielts.org"],
  },
  {
    id: "testdaf",
    name: "TestDaF",
    short: "TestDaF",
    kind: "language",
    countries: ["germany"],
    pattern: [{ section: "Reading", content: "3 texts", duration: "60 min" }],
    feePkr: 45000,
    feeNote: "Varies by centre",
    frequency: "Several times per year",
    validity: "Unlimited",
    competitiveScore: "TDN 4 in all sections",
    prep: { tips: ["Practice with model tests"], resources: [{ label: "TestDaF.de", url: "https://testdaf.de" }] },
    sourceUrls: ["https://testdaf.de"],
  },
  {
    id: "gre",
    name: "GRE General Test",
    short: "GRE",
    kind: "graduate",
    countries: ["usa"],
    pattern: [{ section: "Quantitative", content: "Math reasoning", duration: "35 min" }],
    feePkr: 65000,
    feeNote: "Approximate",
    frequency: "Year-round",
    validity: "5 years",
    competitiveScore: "320+ for top programs",
    prep: { tips: ["Learn the question types"], resources: [{ label: "ETS.org", url: "https://ets.org" }] },
    sourceUrls: ["https://ets.org"],
  },
];

describe("filterAbroadTests", () => {
  it("returns all when no filters are given", () => {
    expect(filterAbroadTests(tests)).toHaveLength(3);
  });

  it("filters by kind", () => {
    expect(filterAbroadTests(tests, { kind: "language" }).map((t) => t.id)).toEqual(["testdaf"]);
  });

  it("filters by country", () => {
    expect(filterAbroadTests(tests, { country: "usa" }).map((t) => t.id)).toEqual(["ielts", "gre"]);
  });

  it("filters by query across name and short", () => {
    expect(filterAbroadTests(tests, { query: "GRE" }).map((t) => t.id)).toEqual(["gre"]);
  });

  it("combines kind and country", () => {
    expect(filterAbroadTests(tests, { kind: "english", country: "usa" }).map((t) => t.id)).toEqual(["ielts"]);
  });

  it("does not mutate the input array", () => {
    const before = [...tests];
    filterAbroadTests(tests, { kind: "graduate", country: "germany" });
    expect(tests).toEqual(before);
  });
});

describe("testsForCountry", () => {
  it("returns every test that lists the country", () => {
    expect(testsForCountry(tests, "germany").map((t) => t.id)).toEqual(["ielts", "testdaf"]);
  });

  it("returns an empty array for unknown countries", () => {
    expect(testsForCountry(tests, "nope")).toEqual([]);
  });
});
