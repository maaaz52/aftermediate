# Education Abroad Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 5 interactive Education Abroad pages under `/abroad/*` — Country Explorer (13 countries, compare mode), Abroad Scholarships (50-70 sourced programs, HEC-first), Test Prep Hub (18-22 tests), Safar AI Assistant (chat grounded in a user-editable knowledge base), and Financial Planner (first-year + 4-year cost projection) — all backed by researched, source-verified data.

**Architecture:** Static curated JSON in `src/data/` + a typed editable knowledge file `src/data/abroad-chatbot-knowledge.ts` (user edits = "training" Safar) + pure tested helpers in `src/lib/abroad-filters.ts` and `src/lib/abroad-planner.ts` + "use client" explorer components in `src/components/abroad/` consumed by thin page routes under `src/app/(app)/abroad/`. The Safar persona extends the existing Gemini-powered `src/lib/ai.ts`; the knowledge base is injected into Safar's system prompt at module load.

**Tech Stack:** Next.js 16 App Router (Turbopack), React 19, Tailwind CSS 4, lucide-react icons, vitest (node env, `src/**/*.test.ts`), Vercel AI SDK (`@ai-sdk/google`, `gemini-flash-latest`).

**Spec:** `docs/superpowers/specs/2026-08-27-abroad-pages-design.md` — read it before starting; it carries the mandatory data-collection & verification rules (section 7). All type shapes below mirror the spec.

**Workflow notes (important):**
- **NO git commits.** The user's workflow is working-tree-only on `main`. Do not run `git commit` at any step.
- `npm test` = `vitest run` (all tests). For one file: `npx vitest run <path>`.
- `npm run lint` = eslint over the project. For one file: `npx eslint <file>`.
- Type check: `npx tsc --noEmit`.
- Do NOT touch `src/proxy.ts` (user-owned).
- The `(app)` layout already handles auth/quiz gating — new pages inherit it and need no auth logic.
- This is a modified Next.js (see `AGENTS.md`): if any App Router API in this plan behaves differently than written (especially `searchParams` on the Test Prep page), read the relevant guide in `node_modules/next/dist/docs/` and adapt; report the deviation in your task report.

**Repo conventions (match existing `src/components/pakistan/*` code exactly):**
- Cards use `card-glass overflow-hidden rounded-2xl`; accents are `bg-saffron/10 text-saffron`; muted text `text-muted`/`text-faint`.
- Heroes: `animate-reveal` on badge/h1/p with staggered `style={{ animationDelay: "60ms" | "120ms" | "180ms" }}`.
- Accordions: `<h3><button type="button" aria-expanded={open} aria-controls={id}>` trigger, panel is `<div id={id} hidden={!open} role="region" aria-labelledby={id + "-trigger"}>` (always mounted, `hidden` toggled).
- Filter chips: `type="button"` with `aria-pressed={active}`.
- External links always `target="_blank" rel="noreferrer"`.
- **No `setState` inside `useEffect`** (repo lint rule) — derive state at render time instead.
- **No component definitions inside components** (`react-hooks/static-components` rule) — define `Chip`, `Card`, etc. at module level.
- JSON import cast: `const data = json as unknown as { dataYear: number; countries: AbroadCountry[] };`.

---

## File Structure Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `src/lib/types.ts` | Append 10 abroad types/interfaces |
| Create | `src/lib/abroad-filters.ts` | Pure filter/sort/compare helpers (no React) |
| Create | `src/lib/abroad-filters.test.ts` | Unit tests for filters |
| Create | `src/lib/abroad-planner.ts` | Pure cost-math helpers (no React) |
| Create | `src/lib/abroad-planner.test.ts` | Unit tests for planner math |
| Create | `src/data/abroad-countries.json` | 13 countries, full cost structure (researched) |
| Create | `src/data/abroad-countries.test.ts` | Schema validation tests |
| Create | `src/data/abroad-scholarships.json` | 50-70 scholarships (researched) |
| Create | `src/data/abroad-scholarships.test.ts` | Schema validation tests |
| Create | `src/data/abroad-tests.json` | 18-22 tests (researched) |
| Create | `src/data/abroad-tests.test.ts` | Schema validation + cross-file id tests |
| Create | `src/data/abroad-chatbot-knowledge.ts` | User-editable Safar knowledge base (typed, commented) |
| Create | `src/data/abroad-chatbot-knowledge.test.ts` | Knowledge base validation tests |
| Modify | `src/lib/ai.ts` | Add `safar` persona + knowledge injection |
| Modify | `src/app/api/chat/route.ts` | Extend persona union with `"safar"` |
| Modify | `src/components/sidebar.tsx` | Add 5 links to Education Abroad group |
| Create | `src/components/abroad/countries-explorer.tsx` | Search/filter/sort + stat strip + compare mode + accordion |
| Create | `src/components/abroad/abroad-scholarships-explorer.tsx` | Category tabs + filters + grouped cards |
| Create | `src/components/abroad/test-prep-explorer.tsx` | Kind/country filters + "which tests do I need?" helper + accordions |
| Create | `src/components/abroad/safar-assistant.tsx` | Full-page streaming chat (persona `safar`) |
| Create | `src/components/abroad/financial-planner.tsx` | Inputs + first-year/4-year/monthly/savings outputs |
| Create | `src/app/(app)/abroad/countries/page.tsx` | Thin page wrapper |
| Create | `src/app/(app)/abroad/scholarships/page.tsx` | Thin page wrapper |
| Create | `src/app/(app)/abroad/test-prep/page.tsx` | Server wrapper passing `?country=` param |
| Create | `src/app/(app)/abroad/assistant/page.tsx` | Thin page wrapper |
| Create | `src/app/(app)/abroad/planner/page.tsx` | Thin page wrapper |

---

### Task 1: Abroad types + filter/planner helper libraries (TDD)

**Files:**
- Modify: `src/lib/types.ts` (append at end)
- Create: `src/lib/abroad-filters.test.ts`
- Create: `src/lib/abroad-planner.test.ts`
- Create: `src/lib/abroad-filters.ts`
- Create: `src/lib/abroad-planner.ts`

- [ ] **Step 1: Append types to `src/lib/types.ts`**

Append the following to the end of the existing file (do not modify existing content):

```ts
export type AbroadRegion = "europe" | "asia" | "north-america";

export interface AbroadCurrency {
  code: string;        // "EUR"
  name: string;        // "Euro"
  symbol: string;      // "€"
  toPkr: number;       // 1 unit = X PKR
  rateAsOf: string;    // "2026-08"
}

export interface CostRange {
  min: number;
  max: number; // PKR
}

export interface MonthlyLiving {
  rent: number;
  food: number;
  transport: number;
  utilities: number;
  misc: number; // PKR/month
}

export interface AbroadOneTime {
  applicationFee: number;
  visaFee: number;
  insurance: number;
  flight: number; // PKR
}

export interface AbroadCountry {
  id: string;                // "germany"
  name: string;              // "Germany"
  flag: string;              // "🇩🇪"
  intro: string;             // 2-3 sentences: profile overview
  region: AbroadRegion;
  capital: string;
  language: string;          // "German"
  currency: AbroadCurrency;
  visa: {
    type: string;            // "National D Student Visa"
    feePkr: number;
    processingTime: string;  // "4–8 weeks"
    keyPoints: string[];     // proof of funds, blocked account, etc.
  };
  intakes: string[];         // ["October", "April"]
  tuition: Record<"ug" | "masters" | "phd", CostRange>; // PKR/year
  living: {
    bigCity: MonthlyLiving;
    smallCity: MonthlyLiving;
  };
  oneTime: AbroadOneTime;
  postStudyWork: string;     // "18-month job-seeking visa"
  postStudyWorkMonths: number; // 18 — numeric for sorting/stat strip
  pathway: { title: string; detail: string }[]; // numbered application journey
  documents: string[];
  requiredTests: string[];   // ids from abroad-tests.json
  topFields: string[];
  pros: string[];
  cons: string[];
  sources: { label: string; url: string }[];
}

export type CityTier = "big" | "small";
export type Lifestyle = "frugal" | "moderate" | "comfortable";
export type DegreeLevel = "ug" | "masters" | "phd";

export type AbroadScholarshipCategory =
  | "hec"                 // HEC Pakistan foreign programs
  | "host-government"     // Fulbright, Chevening, DAAD, GKS, CSC, etc.
  | "university-specific" // named university awards
  | "merit-based"
  | "need-based";

export interface AbroadScholarship {
  id: string;
  name: string;
  funder: string;
  category: AbroadScholarshipCategory;
  countries: string[];       // AbroadCountry ids, or ["multiple"]
  level: "bachelors" | "masters" | "phd" | "multiple";
  coverage: "full" | "partial";
  coverageDetail: string;    // "Tuition + living stipend + airfare"
  eligibility: string[];     // Pakistani-specific requirements
  deadline: string;          // hedged, e.g. "Jan 2027 cycle (approx.)"
  howToApply: string[];
  sourceUrls: string[];
}

export type AbroadTestKind = "english" | "aptitude" | "graduate" | "language";

export interface AbroadTest {
  id: string;                // "ielts"
  name: string;              // "IELTS Academic"
  short: string;             // "IELTS"
  kind: AbroadTestKind;
  countries: string[];       // AbroadCountry ids where required/accepted
  pattern: { section: string; content: string; duration: string }[];
  feePkr: number;            // approximate, one sitting
  feeNote: string;           // "Varies by centre; PKR 59,000 typical in 2026"
  frequency: string;
  validity: string;          // "2 years"
  competitiveScore: string;  // "7.0+ for top universities"
  prep: {
    tips: string[];
    resources: { label: string; url: string }[];
  };
  sourceUrls: string[];
}
```

- [ ] **Step 2: Write the failing tests for the filters library**

Create `src/lib/abroad-filters.test.ts`:

```ts
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
    // germany 156k, china 756k, usa 7.656M
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
    level: "phd",
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
```

- [ ] **Step 3: Write the failing tests for the planner library**

Create `src/lib/abroad-planner.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  firstYearCost,
  formatPkr,
  LIFESTYLE_MULTIPLIERS,
  savingsTimeline,
  yearlyProjection,
} from "@/lib/abroad-planner";
import type { AbroadCountry, AbroadTest } from "@/lib/types";

function country(over: Partial<AbroadCountry> = {}): AbroadCountry {
  return {
    id: "germany",
    name: "Germany",
    flag: "🇩🇪",
    intro: "A popular study destination for Pakistani students.",
    region: "europe",
    capital: "Berlin",
    language: "German",
    currency: { code: "EUR", name: "Euro", symbol: "€", toPkr: 300, rateAsOf: "2026-08" },
    visa: {
      type: "National D Student Visa",
      feePkr: 25000,
      processingTime: "4-8 weeks",
      keyPoints: ["Blocked account", "Health insurance"],
    },
    intakes: ["October", "April"],
    tuition: { ug: { min: 0, max: 0 }, masters: { min: 2000000, max: 4000000 }, phd: { min: 0, max: 0 } },
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
    pros: ["Tuition-free public universities"],
    cons: ["German needed for many jobs"],
    sources: [{ label: "Make it in Germany", url: "https://www.make-it-in-germany.com" }],
    ...over,
  };
}

const ielts: AbroadTest = {
  id: "ielts",
  name: "IELTS Academic",
  short: "IELTS",
  kind: "english",
  countries: ["germany"],
  pattern: [{ section: "Listening", content: "4 recordings", duration: "30 min" }],
  feePkr: 59000,
  feeNote: "Varies by centre",
  frequency: "Monthly",
  validity: "2 years",
  competitiveScore: "7.0+",
  prep: { tips: ["Practice"], resources: [{ label: "IELTS.org", url: "https://ielts.org" }] },
  sourceUrls: ["https://ielts.org"],
};

const c = country();
const baseline = {
  tuition: 3000000, // masters midpoint at tuitionT 0.5
  living: 156000 * 12, // big city moderate
  visaFee: 25000,
  applicationFee: 10000,
  insurance: 30000,
  flight: 140000,
  testFees: 59000,
  total: 5136000,
};

describe("LIFESTYLE_MULTIPLIERS", () => {
  it("has the three lifestyle keys with expected multipliers", () => {
    expect(LIFESTYLE_MULTIPLIERS).toEqual({ frugal: 0.85, moderate: 1, comfortable: 1.25 });
  });
});

describe("firstYearCost", () => {
  it("computes the full breakdown at the midpoint of the tuition range", () => {
    const b = firstYearCost(c, "masters", "big", "moderate", 0.5, [ielts]);
    expect(b).toEqual(baseline);
  });

  it("clamps tuitionT below 0 and above 1", () => {
    const low = firstYearCost(c, "masters", "big", "moderate", -1, [ielts]);
    expect(low.tuition).toBe(2000000);
    const high = firstYearCost(c, "masters", "big", "moderate", 2, [ielts]);
    expect(high.tuition).toBe(4000000);
  });

  it("applies the lifestyle multiplier to living only", () => {
    const frugal = firstYearCost(c, "masters", "big", "frugal", 0.5, [ielts]);
    expect(frugal.living).toBe(Math.round(156000 * 12 * 0.85));
    expect(frugal.tuition).toBe(3000000);
    expect(frugal.total).toBe(3000000 + Math.round(156000 * 12 * 0.85) + 264000);
  });

  it("uses the small-city living costs for tier small", () => {
    const b = firstYearCost(c, "masters", "small", "moderate", 0.5, [ielts]);
    expect(b.living).toBe(115000 * 12);
    expect(b.total).toBe(3000000 + 115000 * 12 + 264000);
  });

  it("only sums test fees for tests listed in requiredTests", () => {
    const extra: AbroadTest = { ...ielts, id: "gre", feePkr: 65000 };
    const b = firstYearCost(c, "masters", "big", "moderate", 0.5, [ielts, extra]);
    expect(b.testFees).toBe(59000);
  });
});

describe("yearlyProjection", () => {
  it("projects 4 years by default with 6% tuition inflation and flat non-tuition costs", () => {
    const b = firstYearCost(c, "masters", "big", "moderate", 0.5, [ielts]);
    expect(yearlyProjection(b)).toEqual([
      5136000, // year 1 = total
      3000000 * 1.06 + 2136000,
      3000000 * 1.06 ** 2 + 2136000,
      3000000 * 1.06 ** 3 + 2136000,
    ].map((n) => Math.round(n)));
  });

  it("honors a custom year count", () => {
    const b = firstYearCost(c, "masters", "big", "moderate", 0.5, [ielts]);
    expect(yearlyProjection(b, 2)).toHaveLength(2);
  });
});

describe("savingsTimeline", () => {
  it("returns null for zero or negative monthly savings", () => {
    expect(savingsTimeline(0, 5000000)).toBeNull();
    expect(savingsTimeline(-500, 5000000)).toBeNull();
  });

  it("returns an already-saved result for a non-positive target", () => {
    expect(savingsTimeline(100000, 0)).toEqual({ months: 0, yearsMonths: "already saved" });
  });

  it("rounds up months and formats under one year", () => {
    expect(savingsTimeline(25000, 100000)).toEqual({ months: 4, yearsMonths: "4 months" });
  });

  it("formats whole years", () => {
    expect(savingsTimeline(100000, 6000000)).toEqual({ months: 60, yearsMonths: "5 years" });
  });

  it("formats years plus months", () => {
    expect(savingsTimeline(100000, 1300000)).toEqual({ months: 13, yearsMonths: "1 year 1 month" });
  });
});

describe("formatPkr", () => {
  it("formats millions with M", () => {
    expect(formatPkr(6000000)).toBe("PKR 6M");
    expect(formatPkr(6500000)).toBe("PKR 6.5M");
    expect(formatPkr(5136000)).toBe("PKR 5.1M");
  });

  it("formats thousands with k", () => {
    expect(formatPkr(850000)).toBe("PKR 850k");
    expect(formatPkr(59000)).toBe("PKR 59k");
  });

  it("formats small amounts with separators", () => {
    expect(formatPkr(850)).toBe("PKR 850");
  });

  it("handles negatives", () => {
    expect(formatPkr(-850000)).toBe("-PKR 850k");
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npx vitest run src/lib/abroad-filters.test.ts src/lib/abroad-planner.test.ts`
Expected: FAIL — cannot resolve `@/lib/abroad-filters` and `@/lib/abroad-planner`.

- [ ] **Step 5: Implement `src/lib/abroad-filters.ts`**

```ts
import type {
  AbroadCountry,
  AbroadRegion,
  AbroadScholarship,
  AbroadScholarshipCategory,
  AbroadTest,
  AbroadTestKind,
  CityTier,
} from "./types";

export interface CountryFilterOptions {
  query?: string;
  region?: AbroadRegion | "all";
}

export function filterCountries(
  list: AbroadCountry[],
  opts: CountryFilterOptions = {}
): AbroadCountry[] {
  const q = opts.query?.trim().toLowerCase() ?? "";
  const region = opts.region ?? "all";
  return list.filter((c) => {
    if (region !== "all" && c.region !== region) return false;
    if (q) {
      const haystack = [c.name, c.capital, ...c.topFields].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

/** Total monthly living cost for a country+tier (PKR/month). */
export function monthlyLivingTotal(c: AbroadCountry, tier: CityTier): number {
  const m = c.living[tier === "big" ? "bigCity" : "smallCity"];
  return m.rent + m.food + m.transport + m.utilities + m.misc;
}

export function sortCountries(
  list: AbroadCountry[],
  by: "cheapest" | "name" = "cheapest"
): AbroadCountry[] {
  const sorted = [...list];
  if (by === "name") return sorted.sort((a, b) => a.name.localeCompare(b.name));
  return sorted.sort((a, b) => {
    const aCost = monthlyLivingTotal(a, "big") + (a.tuition.ug.min + a.tuition.ug.max) / 2;
    const bCost = monthlyLivingTotal(b, "big") + (b.tuition.ug.min + b.tuition.ug.max) / 2;
    return aCost - bCost;
  });
}

/** Returns known countries in the requested id order, skipping unknown ids and duplicates. */
export function compareCountries(list: AbroadCountry[], ids: string[]): AbroadCountry[] {
  const byId = new Map(list.map((c) => [c.id, c]));
  const seen = new Set<string>();
  const out: AbroadCountry[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    const c = byId.get(id);
    if (c) {
      out.push(c);
      seen.add(id);
    }
  }
  return out;
}

export interface AbroadScholarshipFilterOptions {
  category?: AbroadScholarshipCategory | "all";
  country?: string; // AbroadCountry id; "all" default
  level?: AbroadScholarship["level"] | "all";
  query?: string;
}

export function filterAbroadScholarships(
  list: AbroadScholarship[],
  opts: AbroadScholarshipFilterOptions = {}
): AbroadScholarship[] {
  const category = opts.category ?? "all";
  const country = opts.country ?? "all";
  const level = opts.level ?? "all";
  const q = opts.query?.trim().toLowerCase() ?? "";
  return list.filter((s) => {
    if (category !== "all" && s.category !== category) return false;
    if (country !== "all" && !s.countries.includes(country) && !s.countries.includes("multiple")) {
      return false;
    }
    if (level !== "all" && s.level !== level && s.level !== "multiple") return false;
    if (q) {
      const haystack = [s.name, s.funder, s.coverageDetail, ...s.eligibility].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export interface AbroadTestFilterOptions {
  kind?: AbroadTestKind | "all";
  country?: string; // AbroadCountry id; "all" default
  query?: string;
}

export function filterAbroadTests(
  list: AbroadTest[],
  opts: AbroadTestFilterOptions = {}
): AbroadTest[] {
  const kind = opts.kind ?? "all";
  const country = opts.country ?? "all";
  const q = opts.query?.trim().toLowerCase() ?? "";
  return list.filter((t) => {
    if (kind !== "all" && t.kind !== kind) return false;
    if (country !== "all" && !t.countries.includes(country)) return false;
    if (q) {
      const haystack = [t.name, t.short].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function testsForCountry(list: AbroadTest[], countryId: string): AbroadTest[] {
  return list.filter((t) => t.countries.includes(countryId));
}

/** Cheapest overall country (bigCity living + UG tuition midpoint). Precondition: `list` is non-empty. */
export function cheapestCountry(list: AbroadCountry[]): AbroadCountry {
  return sortCountries(list, "cheapest")[0];
}

/** Country with the longest post-study work window in months. Precondition: `list` is non-empty. */
export function mostGenerousPostStudyWork(list: AbroadCountry[]): AbroadCountry {
  return [...list].sort((a, b) => b.postStudyWorkMonths - a.postStudyWorkMonths)[0];
}

/** Country with the lowest student visa fee. Precondition: `list` is non-empty. */
export function lowestVisaFeeCountry(list: AbroadCountry[]): AbroadCountry {
  return [...list].sort((a, b) => a.visa.feePkr - b.visa.feePkr)[0];
}
```

- [ ] **Step 6: Implement `src/lib/abroad-planner.ts`**

```ts
import { monthlyLivingTotal } from "./abroad-filters";
import type {
  AbroadCountry,
  AbroadTest,
  CityTier,
  DegreeLevel,
  Lifestyle,
} from "./types";

export const LIFESTYLE_MULTIPLIERS: Record<Lifestyle, number> = {
  frugal: 0.85,
  moderate: 1,
  comfortable: 1.25,
};

export interface FirstYearBreakdown {
  tuition: number;
  living: number;
  visaFee: number;
  applicationFee: number;
  insurance: number;
  flight: number;
  testFees: number;
  total: number;
}

/**
 * First-year cost breakdown in PKR.
 * `tuitionT` is a 0..1 position on the chosen level's tuition range (clamped).
 * `tests` is the full abroad-tests list; fees are summed only for the
 * country's `requiredTests` ids.
 */
export function firstYearCost(
  c: AbroadCountry,
  level: DegreeLevel,
  tier: CityTier,
  lifestyle: Lifestyle,
  tuitionT: number,
  tests: AbroadTest[]
): FirstYearBreakdown {
  const range = c.tuition[level];
  const t = Math.min(1, Math.max(0, tuitionT));
  const tuition = Math.round(range.min + t * (range.max - range.min));
  const living = Math.round(monthlyLivingTotal(c, tier) * 12 * LIFESTYLE_MULTIPLIERS[lifestyle]);
  const testFees = tests
    .filter((test) => c.requiredTests.includes(test.id))
    .reduce((sum, test) => sum + test.feePkr, 0);
  const breakdown = {
    tuition,
    living,
    visaFee: c.visa.feePkr,
    applicationFee: c.oneTime.applicationFee,
    insurance: c.oneTime.insurance,
    flight: c.oneTime.flight,
    testFees,
  };
  return { ...breakdown, total: Object.values(breakdown).reduce((a, b) => a + b, 0) };
}

/**
 * Year-by-year total cost: tuition inflates annually, non-tuition costs stay flat.
 * Year 1 equals `breakdown.total`.
 */
export function yearlyProjection(
  breakdown: FirstYearBreakdown,
  years = 4,
  tuitionInflation = 0.06
): number[] {
  const nonTuition = breakdown.total - breakdown.tuition;
  return Array.from({ length: years }, (_, y) =>
    Math.round(breakdown.tuition * Math.pow(1 + tuitionInflation, y) + nonTuition)
  );
}

/**
 * Months needed to save `targetPkr` at `monthlySavingsPkr`/month.
 * Returns null when monthly savings are zero or negative.
 */
export function savingsTimeline(
  monthlySavingsPkr: number,
  targetPkr: number
): { months: number; yearsMonths: string } | null {
  if (monthlySavingsPkr <= 0) return null;
  if (targetPkr <= 0) return { months: 0, yearsMonths: "already saved" };
  const months = Math.ceil(targetPkr / monthlySavingsPkr);
  const years = Math.floor(months / 12);
  const rem = months % 12;
  const yearsMonths =
    years === 0
      ? `${rem} month${rem === 1 ? "" : "s"}`
      : rem === 0
        ? `${years} year${years === 1 ? "" : "s"}`
        : `${years} year${years === 1 ? "" : "s"} ${rem} month${rem === 1 ? "" : "s"}`;
  return { months, yearsMonths };
}

/** Formats PKR in the site's k/M notation, e.g. 6000000 -> "PKR 6M", 850000 -> "PKR 850k". */
export function formatPkr(n: number): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const trim = (v: number) => v.toFixed(1).replace(/\.0$/, "");
  if (abs >= 1_000_000) return `${sign}PKR ${trim(abs / 1_000_000)}M`;
  if (abs >= 1_000) return `${sign}PKR ${trim(abs / 1_000)}k`;
  return `${sign}PKR ${Math.round(abs).toLocaleString()}`;
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx vitest run src/lib/abroad-filters.test.ts src/lib/abroad-planner.test.ts`
Expected: PASS — 30 filters tests + 17 planner tests (47 total).

- [ ] **Step 8: Lint + type check**

Run: `npx eslint src/lib/abroad-filters.ts src/lib/abroad-planner.ts src/lib/abroad-filters.test.ts src/lib/abroad-planner.test.ts`
Expected: no errors.

Run: `npx tsc --noEmit`
Expected: exit 0.

---

### Task 2: abroad-countries.json (13 researched countries) + schema tests

**Files:**
- Create: `src/data/abroad-countries.test.ts`
- Create: `src/data/abroad-countries.json`

- [ ] **Step 1: Write the schema test (will fail — JSON does not exist yet)**

Create `src/data/abroad-countries.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import json from "@/data/abroad-countries.json";
import type { AbroadCountry, AbroadRegion } from "@/lib/types";

const data = json as unknown as { dataYear: number; countries: AbroadCountry[] };
const REGIONS: AbroadRegion[] = ["europe", "asia", "north-america"];
const REQUIRED = [
  "germany", "austria", "italy", "south-korea", "turkey", "china", "indonesia",
  "usa", "uk", "ireland", "lithuania", "netherlands", "hungary",
] as const;

describe("abroad-countries.json", () => {
  it("has exactly 13 countries", () => {
    expect(data.countries).toHaveLength(13);
  });

  it("has a numeric dataYear of 2026", () => {
    expect(data.dataYear).toBe(2026);
  });

  it("includes all 13 required countries", () => {
    const ids = data.countries.map((c) => c.id);
    for (const id of REQUIRED) expect(ids, id).toContain(id);
  });

  it("has the expected region distribution (8 europe, 4 asia, 1 north-america)", () => {
    const counts = { europe: 0, asia: 0, "north-america": 0 };
    for (const c of data.countries) counts[c.region] += 1;
    expect(counts).toEqual({ europe: 8, asia: 4, "north-america": 1 });
  });

  it("has unique ids", () => {
    const ids = data.countries.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every country has a valid region and non-empty profile fields", () => {
    for (const c of data.countries) {
      expect(REGIONS, c.id).toContain(c.region);
      expect(c.name.length, c.id).toBeGreaterThan(2);
      expect(c.flag.length, c.id).toBeGreaterThan(0);
      expect(c.intro.length, c.id).toBeGreaterThan(40);
      expect(c.capital.length, c.id).toBeGreaterThan(1);
      expect(c.language.length, c.id).toBeGreaterThan(1);
    }
  });

  it("every currency has a positive rate and a YYYY-MM rateAsOf", () => {
    for (const c of data.countries) {
      expect(c.currency.code.length, c.id).toBeGreaterThanOrEqual(3);
      expect(c.currency.toPkr, c.id).toBeGreaterThan(0);
      expect(c.currency.rateAsOf, c.id).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  it("every visa has a positive fee, processing time, and 3+ key points", () => {
    for (const c of data.countries) {
      expect(c.visa.type.length, c.id).toBeGreaterThan(2);
      expect(c.visa.feePkr, c.id).toBeGreaterThan(0);
      expect(c.visa.processingTime.length, c.id).toBeGreaterThan(1);
      expect(c.visa.keyPoints.length, c.id).toBeGreaterThanOrEqual(3);
      for (const kp of c.visa.keyPoints) expect(kp.length, c.id).toBeGreaterThan(5);
    }
  });

  it("every country has at least one intake and a positive postStudyWorkMonths", () => {
    for (const c of data.countries) {
      expect(c.intakes.length, c.id).toBeGreaterThanOrEqual(1);
      expect(c.postStudyWork.length, c.id).toBeGreaterThan(5);
      expect(c.postStudyWorkMonths, c.id).toBeGreaterThan(0);
    }
  });

  it("every tuition level has a positive min and max >= min", () => {
    for (const c of data.countries) {
      for (const level of ["ug", "masters", "phd"] as const) {
        const t = c.tuition[level];
        expect(t.min, `${c.id}:${level}`).toBeGreaterThanOrEqual(0);
        expect(t.max, `${c.id}:${level}`).toBeGreaterThanOrEqual(t.min);
      }
      expect(c.tuition.masters.max, c.id).toBeGreaterThan(0); // at least one level must be non-zero
    }
  });

  it("every living component is positive in both city tiers", () => {
    for (const c of data.countries) {
      for (const tier of ["bigCity", "smallCity"] as const) {
        const m = c.living[tier];
        for (const key of ["rent", "food", "transport", "utilities", "misc"] as const) {
          expect(m[key], `${c.id}:${tier}:${key}`).toBeGreaterThan(0);
        }
      }
      // small city must be cheaper than big city overall
      const big = c.living.bigCity.rent + c.living.bigCity.food + c.living.bigCity.transport + c.living.bigCity.utilities + c.living.bigCity.misc;
      const small = c.living.smallCity.rent + c.living.smallCity.food + c.living.smallCity.transport + c.living.smallCity.utilities + c.living.smallCity.misc;
      expect(small, c.id).toBeLessThan(big);
    }
  });

  it("one-time costs are non-negative and visaFee matches visa.feePkr", () => {
    for (const c of data.countries) {
      expect(c.oneTime.applicationFee, c.id).toBeGreaterThanOrEqual(0);
      expect(c.oneTime.insurance, c.id).toBeGreaterThanOrEqual(0);
      expect(c.oneTime.flight, c.id).toBeGreaterThan(0);
      expect(c.oneTime.visaFee, c.id).toBe(c.visa.feePkr);
    }
  });

  it("every country has 4-8 pathway steps with title and detail", () => {
    for (const c of data.countries) {
      expect(c.pathway.length, c.id).toBeGreaterThanOrEqual(4);
      expect(c.pathway.length, c.id).toBeLessThanOrEqual(8);
      for (const step of c.pathway) {
        expect(step.title.length, c.id).toBeGreaterThan(1);
        expect(step.detail.length, c.id).toBeGreaterThan(10);
      }
    }
  });

  it("every country has 5+ documents and 1+ required test ids (lowercase, no spaces)", () => {
    for (const c of data.countries) {
      expect(c.documents.length, c.id).toBeGreaterThanOrEqual(5);
      for (const d of c.documents) expect(d.length, c.id).toBeGreaterThan(2);
      expect(c.requiredTests.length, c.id).toBeGreaterThanOrEqual(1);
      for (const t of c.requiredTests) {
        expect(t, c.id).toMatch(/^[a-z0-9-]+$/);
      }
    }
  });

  it("every country has 3+ top fields, 3+ pros, 2+ cons", () => {
    for (const c of data.countries) {
      expect(c.topFields.length, c.id).toBeGreaterThanOrEqual(3);
      expect(c.pros.length, c.id).toBeGreaterThanOrEqual(3);
      expect(c.cons.length, c.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("every country has 2+ labeled https sources", () => {
    for (const c of data.countries) {
      expect(c.sources.length, c.id).toBeGreaterThanOrEqual(2);
      for (const s of c.sources) {
        expect(s.label.length, c.id).toBeGreaterThan(1);
        expect(s.url.startsWith("https://"), `${c.id}:${s.url}`).toBe(true);
      }
    }
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/data/abroad-countries.test.ts`
Expected: FAIL — cannot resolve `@/data/abroad-countries.json`.

- [ ] **Step 3: Research the 13 countries**

Use `WebSearch` and `WebFetch` to research these 13 countries (exact ids): `germany`, `austria`, `italy`, `south-korea`, `turkey`, `china`, `indonesia`, `usa`, `uk`, `ireland`, `lithuania`, `netherlands`, `hungary`.

**Currency rates first (single pass):** before country research, look up all 13 currencies once so every `toPkr` uses the same date window. Currencies: Germany/Austria/Italy/Ireland/Lithuania/Netherlands = EUR; USA = USD; UK = GBP; South Korea = KRW; Turkey = TRY; China = CNY; Indonesia = IDR; Hungary = HUF. Search e.g. "1 EUR to PKR 1 USD to PKR GBP KRW TRY CNY IDR HUF to PKR August 2026" (xe.com or exchange-rate snippets). Record the source and set `rateAsOf: "2026-08"` on all currencies.

For EACH country, find and record (sources: official embassy/consulate sites, official "Study in X" portals, official immigration sites; Numbeo only as a labeled secondary source for living costs):
1. **intro** — 2-3 plain sentences: education system snapshot, what it is known for, approximate Pakistani student presence. No marketing fluff.
2. **visa** — the actual student visa name, current fee (convert to PKR with `toPkr`), official processing time, 3-5 key points (proof of funds / blocked account amount, insurance requirement, interview, biometrics, part-time work rights tied to visa).
3. **intakes** — main intakes (e.g. Germany: October + April; USA: Fall + Spring).
4. **tuition** — `ug`/`masters`/`phd` PKR/year ranges from official fee pages or study portals. Countries with tuition-free public universities (Germany, Austria, Norway-style) may have `{ min: 0, max: 0 }` with the fact captured in `pros`. Private university range goes in `max` where applicable. If only one figure exists, use `min === max`.
5. **living** — big city vs small city monthly breakdown (rent/food/transport/utilities/misc) in PKR, converted from local figures. Prefer official study-portal living-cost guidance (blocked-account amounts for Germany are authoritative); use Numbeo as labeled secondary source.
6. **oneTime** — application fee (0 where universities charge none), visaFee (equal to `visa.feePkr`), insurance (typical annual cost), flight (conservative KHI/LHE round-trip estimate, e.g. PKR 120k-300k depending on distance).
7. **postStudyWork** + `postStudyWorkMonths` — official post-study work window (e.g. Germany 18-month job-seeker; UK 24-month Graduate Route; USA 12-month OPT, 36 for STEM; Ireland 24 months; Netherlands 12-month orientation year; Hungary 9 months). Months must match the description.
8. **pathway** — 4-8 numbered steps from official guides: shortlist & apply, receive offer, tests/language certs, financial proof, visa application & biometrics, pre-departure & arrival.
9. **documents** — 5+ items from the official embassy checklist (passport, offer letter, financial proof, academic transcripts/degrees, language cert, insurance, accommodation, photos).
10. **requiredTests** — ids from the spec's test list (see Task 4's id list; ids are lowercase-kebab: `ielts`, `toefl`, `pte`, `duolingo`, `sat`, `act`, `gre`, `gmat`, `testdaf`, `goethe`, `osd`, `cils`, `celi`, `topik`, `hsk`, `tr-yos`, `tolc`, `nt2`, `bipa`). Pick what that country actually requires/accepts (usually `ielts` + optional local-language tests).
11. **topFields** — 3+ fields that country is genuinely strong in.
12. **pros/cons** — 3+ pros, 2+ cons, grounded in the researched facts.
13. **sources** — 2+ `{ label, url }` per country (e.g. "Make it in Germany", "German Embassy Islamabad").

**URL verification rule (mandatory):** before adding ANY URL to the JSON, run `WebFetch` on it and confirm it resolves to the expected official page. If a link cannot be verified, drop it — never guess a URL.

**Facts rule (mandatory):** if a figure cannot be confirmed, write a conservative hedged value (ranges, "approx."), never an invented precise number. No fabricated fees.

- [ ] **Step 4: Write `src/data/abroad-countries.json`**

Top-level shape: `{ "dataYear": 2026, "countries": [ ...13 entries matching AbroadCountry... ] }`.

Anchor example (verify every fact via official pages during research and correct anything outdated — this shows the exact shape):

```json
{
  "id": "germany",
  "name": "Germany",
  "flag": "🇩🇪",
  "intro": "Germany's public universities charge little to no tuition, making it one of the most affordable Western destinations for Pakistani students. It is known for engineering, applied sciences, and strong post-graduation job options.",
  "region": "europe",
  "capital": "Berlin",
  "language": "German",
  "currency": { "code": "EUR", "name": "Euro", "symbol": "€", "toPkr": 300, "rateAsOf": "2026-08" },
  "visa": {
    "type": "National D Student Visa",
    "feePkr": 23000,
    "processingTime": "4-8 weeks",
    "keyPoints": [
      "Blocked account with ~EUR 11,904 for one year of living costs",
      "Health insurance valid in Germany required",
      "Offer letter / admission confirmation required",
      "Visa interview at the German Embassy Islamabad",
      "Students may work 140 full days or 280 half days per year"
    ]
  },
  "intakes": ["October (Winter)", "April (Summer)"],
  "tuition": {
    "ug": { "min": 0, "max": 0 },
    "masters": { "min": 0, "max": 0 },
    "phd": { "min": 0, "max": 0 }
  },
  "living": {
    "bigCity": { "rent": 90000, "food": 45000, "transport": 15000, "utilities": 15000, "misc": 15000 },
    "smallCity": { "rent": 60000, "food": 35000, "transport": 10000, "utilities": 12000, "misc": 10000 }
  },
  "oneTime": { "applicationFee": 15000, "visaFee": 23000, "insurance": 40000, "flight": 180000 },
  "postStudyWork": "18-month job-seeking visa after graduation",
  "postStudyWorkMonths": 18,
  "pathway": [
    { "title": "Shortlist programs", "detail": "Find English-taught programs on the DAAD database and shortlist 3-5." },
    { "title": "Apply via uni-assist", "detail": "Many public universities accept applications through uni-assist; check each program's own deadline." },
    { "title": "Receive the offer", "detail": "Get the admission letter (Zulassungsbescheid) from the university." },
    { "title": "Open a blocked account", "detail": "Deposit the required living-cost amount into a blocked account and get the confirmation." },
    { "title": "Apply for the visa", "detail": "Book an appointment at the German Embassy, submit documents, pay the visa fee." },
    { "title": "Travel & enroll", "detail": "Fly to Germany, register your address, and enroll at the university." }
  ],
  "documents": [
    "Valid passport",
    "University admission letter",
    "Blocked account confirmation",
    "Academic transcripts and degrees",
    "Language certificate (IELTS/TOEFL or German)",
    "Health insurance proof"
  ],
  "requiredTests": ["ielts", "testdaf"],
  "topFields": ["Mechanical Engineering", "Computer Science", "Automotive Engineering"],
  "pros": [
    "Tuition-free public universities",
    "Strong job market after graduation",
    "18-month job-seeking visa"
  ],
  "cons": [
    "Blocked-account requirement of ~EUR 11,904 up front",
    "German language needed for many jobs"
  ],
  "sources": [
    { "label": "Make it in Germany", "url": "https://www.make-it-in-germany.com" },
    { "label": "German Embassy Islamabad", "url": "https://pakistan.diplo.de" }
  ]
}
```

Notes for the other 12 entries:
- Tuition `min: 0, max: 0` is allowed only where public tuition is genuinely free (Germany, Austria). Everywhere else give real ranges.
- `usa.requiredTests` must include `sat`/`act` (UG) and `gre`/`gmat` (grads); `uk.requiredTests` includes `ielts` (UKVI IELTS accepted everywhere) — use the researched truth, not assumptions.
- All PKR numbers are converted with the rate table from Step 3.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/data/abroad-countries.test.ts`
Expected: PASS, 16 tests.

- [ ] **Step 6: Lint + type check**

Run: `npx eslint src/data/abroad-countries.test.ts`
Expected: no errors.

Run: `npx tsc --noEmit`
Expected: exit 0.

---

### Task 3: abroad-scholarships.json (50-70 researched scholarships) + schema tests

**Files:**
- Create: `src/data/abroad-scholarships.test.ts`
- Create: `src/data/abroad-scholarships.json`

- [ ] **Step 1: Write the schema test (will fail — JSON does not exist yet)**

Create `src/data/abroad-scholarships.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import json from "@/data/abroad-scholarships.json";
import countriesJson from "@/data/abroad-countries.json";
import type { AbroadCountry, AbroadScholarship, AbroadScholarshipCategory } from "@/lib/types";

const data = json as unknown as { dataYear: number; scholarships: AbroadScholarship[] };
const countryIds = (countriesJson as unknown as { countries: AbroadCountry[] }).countries.map((c) => c.id);
const CATEGORIES: AbroadScholarshipCategory[] = [
  "hec", "host-government", "university-specific", "merit-based", "need-based",
];
const LEVELS = ["bachelors", "masters", "phd", "multiple"] as const;
const FLAGSHIPS = [
  "fulbright-pakistan", "chevening", "daad-epos", "gks-korea", "csc-chinese-govt",
  "stipendium-hungaricum", "turkiye-burslari", "hec-foreign-scholarships",
  "commonwealth-masters", "commonwealth-phd", "global-ugrad-pakistan",
  "erasmus-mundus-joint-masters", "government-of-ireland", "nl-scholarship",
  "lithuania-state-scholarship", "knb-indonesia", "italy-maeci-grant",
  "austria-oead-grant", "kaist-international",
] as const;

describe("abroad-scholarships.json", () => {
  it("has 50-70 scholarships", () => {
    expect(data.scholarships.length).toBeGreaterThanOrEqual(50);
    expect(data.scholarships.length).toBeLessThanOrEqual(70);
  });

  it("has a numeric dataYear of 2026", () => {
    expect(data.dataYear).toBe(2026);
  });

  it("has unique ids", () => {
    const ids = data.scholarships.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes the flagship verified programs", () => {
    const ids = new Set(data.scholarships.map((s) => s.id));
    for (const id of FLAGSHIPS) expect(ids, id).toContain(id);
  });

  it("every category has entries and HEC has at least 8", () => {
    for (const cat of CATEGORIES) {
      expect(data.scholarships.filter((s) => s.category === cat).length).toBeGreaterThan(0);
    }
    expect(data.scholarships.filter((s) => s.category === "hec").length).toBeGreaterThanOrEqual(8);
  });

  it("every scholarship has a valid category and level", () => {
    for (const s of data.scholarships) {
      expect(CATEGORIES, s.id).toContain(s.category);
      expect(LEVELS, s.id).toContain(s.level);
      expect(["full", "partial"], s.id).toContain(s.coverage);
    }
  });

  it("every scholarship has countries that are valid ids or the multiple wildcard", () => {
    for (const s of data.scholarships) {
      expect(s.countries.length, s.id).toBeGreaterThanOrEqual(1);
      for (const c of s.countries) {
        if (c === "multiple") continue;
        expect(countryIds, `${s.id}:${c}`).toContain(c);
      }
    }
  });

  it("every scholarship has 3+ eligibility items, a deadline, and 2+ apply steps", () => {
    for (const s of data.scholarships) {
      expect(s.eligibility.length, s.id).toBeGreaterThanOrEqual(3);
      for (const e of s.eligibility) expect(e.length, s.id).toBeGreaterThan(5);
      expect(s.deadline.length, s.id).toBeGreaterThan(2);
      expect(s.howToApply.length, s.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("every scholarship has non-empty text fields and 1+ https source", () => {
    for (const s of data.scholarships) {
      expect(s.name.length, s.id).toBeGreaterThan(3);
      expect(s.funder.length, s.id).toBeGreaterThan(2);
      expect(s.coverageDetail.length, s.id).toBeGreaterThan(10);
      expect(s.sourceUrls.length, s.id).toBeGreaterThanOrEqual(1);
      for (const url of s.sourceUrls) expect(url.startsWith("https://"), `${s.id}:${url}`).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/data/abroad-scholarships.test.ts`
Expected: FAIL — cannot resolve `@/data/abroad-scholarships.json`.

- [ ] **Step 3: Research 50-70 scholarships**

Use `WebSearch` and `WebFetch` to research scholarships open to Pakistani students, grouped as:
- **HEC Pakistan (at least 8):** HEC Foreign Scholarships for MS/PhD, HEC need-based programs with foreign-study tracks, Commonwealth Scholarships (HEC is the nominating agency), Stipendium Hungaricum (HEC nominating agency), and similar programs where HEC is the channel. Verify on `hec.gov.pk` and HEC's scholarship announcements.
- **Host government (~15-20):** Fulbright Pakistan (USEFP), Chevening, DAAD (EPOS + other DAAD programs), Global Korea Scholarship (GKS), Chinese Government Scholarship (CSC), Türkiye Bursları, Erasmus Mundus Joint Masters, Government of Ireland Postgraduate Scholarship, Netherlands NL Scholarship, Lithuania State Scholarships, KNB Indonesia, Italy MAECI "Invest Your Talent in Italy", Austria OeAD Ernst Mach Grant, Hungary Stipendium Hungaricum (also cross-listed under HEC), Global UGRAD-Pakistan (USEFP).
- **University-specific (~15-20):** verified named awards at top universities in the 13 countries (e.g. KAIST/SNU Korea, Tsinghua/Peking CSC-linked, Oxford/Imperial/LSE UK, MIT/Harvard/Stanford USA, TU Munich, TU Delft, Politecnico di Milano, University of Bologna, Koç/Sabancı Turkey, University of Groningen...). Every entry needs a verifiable official award page.
- **Merit-based + need-based (~10-15 each region-wide):** verified merit/need awards from the same country set.

For EACH scholarship record: name, funder, category, `countries` (use country ids from Task 2; `["multiple"]` when genuinely multi-country), level, coverage (`full`/`partial`), coverageDetail, 3+ Pakistani-specific eligibility points, a hedged deadline (e.g. "Applications open Oct 2026 (approx.)" — never a precise fake date), 2+ how-to-apply steps, and 1+ official source URL.

**URL verification rule (mandatory):** `WebFetch` every `sourceUrls` entry and confirm it resolves. Drop unverifiable URLs. Never guess.
**Facts rule (mandatory):** the flagship names above are candidates to verify — if one does not exist or is not open to Pakistanis, substitute an equivalent verifiable program and note the substitution in your task report.

- [ ] **Step 4: Write `src/data/abroad-scholarships.json`**

Top-level shape: `{ "dataYear": 2026, "scholarships": [ ...50-70 entries matching AbroadScholarship... ] }`.

Anchor example (verify every fact during research and correct anything outdated):

```json
{
  "id": "fulbright-pakistan",
  "name": "Fulbright Pakistan (Masters & PhD)",
  "funder": "USEFP / US Department of State",
  "category": "host-government",
  "countries": ["usa"],
  "level": "multiple",
  "coverage": "full",
  "coverageDetail": "Tuition, living stipend, airfare, health insurance, and visa support",
  "eligibility": [
    "Pakistani citizen residing in Pakistan",
    "16 years of formal education for Masters; 18 for PhD",
    "Strong academic record and GRE (for most programs)",
    "Return to Pakistan for 2 years after the program"
  ],
  "deadline": "Applications open early 2027 (approx.)",
  "howToApply": [
    "Submit the online application on the USEFP Fulbright portal",
    "Take the GRE and TOEFL if shortlisted",
    "Attend the interview with USEFP panel"
  ],
  "sourceUrls": ["https://usefp.org/scholarships/fulbright-degree-program/"]
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/data/abroad-scholarships.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 6: Lint + type check**

Run: `npx eslint src/data/abroad-scholarships.test.ts`
Expected: no errors.

Run: `npx tsc --noEmit`
Expected: exit 0.

---

### Task 4: abroad-tests.json (18-22 tests) + schema and cross-file tests

**Files:**
- Create: `src/data/abroad-tests.test.ts`
- Create: `src/data/abroad-tests.json`

- [ ] **Step 1: Write the schema test (will fail — JSON does not exist yet)**

Create `src/data/abroad-tests.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import json from "@/data/abroad-tests.json";
import countriesJson from "@/data/abroad-countries.json";
import type { AbroadCountry, AbroadTest, AbroadTestKind } from "@/lib/types";

const data = json as unknown as { dataYear: number; tests: AbroadTest[] };
const countries = (countriesJson as unknown as { countries: AbroadCountry[] }).countries;
const countryIds = countries.map((c) => c.id);
const KINDS: AbroadTestKind[] = ["english", "aptitude", "graduate", "language"];
const REQUIRED = [
  "ielts", "toefl", "pte", "duolingo", "sat", "act", "gre", "gmat", "testdaf",
  "goethe", "osd", "cils", "celi", "topik", "hsk", "tr-yos", "tolc", "nt2", "bipa",
] as const;

describe("abroad-tests.json", () => {
  it("has 18-22 tests", () => {
    expect(data.tests.length).toBeGreaterThanOrEqual(18);
    expect(data.tests.length).toBeLessThanOrEqual(22);
  });

  it("has a numeric dataYear of 2026", () => {
    expect(data.dataYear).toBe(2026);
  });

  it("has unique ids", () => {
    const ids = data.tests.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes the full required test list", () => {
    const ids = data.tests.map((t) => t.id);
    for (const id of REQUIRED) expect(ids, id).toContain(id);
  });

  it("has the expected kind distribution (4 english, 4 aptitude, 2 graduate, 9 language)", () => {
    const counts = { english: 0, aptitude: 0, graduate: 0, language: 0 };
    for (const t of data.tests) counts[t.kind] += 1;
    expect(counts).toEqual({ english: 4, aptitude: 4, graduate: 2, language: 9 });
  });

  it("every test has valid kind, countries, and non-empty text fields", () => {
    for (const t of data.tests) {
      expect(KINDS, t.id).toContain(t.kind);
      expect(t.countries.length, t.id).toBeGreaterThanOrEqual(1);
      for (const c of t.countries) expect(countryIds, `${t.id}:${c}`).toContain(c);
      expect(t.name.length, t.id).toBeGreaterThan(2);
      expect(t.short.length, t.id).toBeGreaterThan(1);
      expect(t.feeNote.length, t.id).toBeGreaterThan(5);
      expect(t.frequency.length, t.id).toBeGreaterThan(1);
      expect(t.validity.length, t.id).toBeGreaterThan(1);
      expect(t.competitiveScore.length, t.id).toBeGreaterThan(2);
    }
  });

  it("every test has a positive fee and a 2-6 section pattern", () => {
    for (const t of data.tests) {
      expect(t.feePkr, t.id).toBeGreaterThan(0);
      expect(t.pattern.length, t.id).toBeGreaterThanOrEqual(2);
      expect(t.pattern.length, t.id).toBeLessThanOrEqual(6);
      for (const p of t.pattern) {
        expect(p.section.length, t.id).toBeGreaterThan(1);
        expect(p.content.length, t.id).toBeGreaterThan(2);
        expect(p.duration.length, t.id).toBeGreaterThan(1);
      }
    }
  });

  it("every test has 3+ prep tips, 2+ https prep resources, and 1+ https source", () => {
    for (const t of data.tests) {
      expect(t.prep.tips.length, t.id).toBeGreaterThanOrEqual(3);
      expect(t.prep.resources.length, t.id).toBeGreaterThanOrEqual(2);
      for (const r of t.prep.resources) {
        expect(r.label.length, t.id).toBeGreaterThan(1);
        expect(r.url.startsWith("https://"), `${t.id}:${r.url}`).toBe(true);
      }
      expect(t.sourceUrls.length, t.id).toBeGreaterThanOrEqual(1);
      for (const url of t.sourceUrls) expect(url.startsWith("https://"), `${t.id}:${url}`).toBe(true);
    }
  });

  it("every country's requiredTests reference real test ids that cover that country", () => {
    const byId = new Map(data.tests.map((t) => [t.id, t]));
    for (const c of countries) {
      for (const testId of c.requiredTests) {
        const test = byId.get(testId);
        expect(test, `${c.id}:${testId}`).toBeDefined();
        expect(test?.countries, `${c.id}:${testId}`).toContain(c.id);
      }
    }
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/data/abroad-tests.test.ts`
Expected: FAIL — cannot resolve `@/data/abroad-tests.json`.

- [ ] **Step 3: Research the 18-22 tests**

Use `WebSearch` and `WebFetch` to research (exact ids and kinds):

| id | name | kind |
|---|---|---|
| `ielts` | IELTS Academic | english |
| `toefl` | TOEFL iBT | english |
| `pte` | PTE Academic | english |
| `duolingo` | Duolingo English Test | english |
| `sat` | SAT (Digital) | aptitude |
| `act` | ACT | aptitude |
| `tolc` | TOLC (Italian university admission) | aptitude |
| `tr-yos` | TR-YÖS (Turkey foreign student exam) | aptitude |
| `gre` | GRE General Test | graduate |
| `gmat` | GMAT Focus Edition | graduate |
| `testdaf` | TestDaF | language |
| `goethe` | Goethe-Zertifikat (B2/C1) | language |
| `osd` | ÖSD (Austrian German) | language |
| `cils` | CILS (Italian) | language |
| `celi` | CELI (Italian) | language |
| `topik` | TOPIK (Korean) | language |
| `hsk` | HSK (Chinese) | language |
| `nt2` | NT2 Staatsexamen (Dutch) | language |
| `bipa` | BIPA (Indonesian) | language |

That is 19 tests — matches the 4/4/2/9 distribution. For EACH test record: official name, `short`, `countries` (which of the 13 countries require/accept it — cross-check against the `requiredTests` ids you set in Task 2 and fix Task 2 if the research contradicts it), 2-6 pattern sections (section/content/duration from the official format page), `feePkr` + `feeNote` (Pakistan-centre fees where available — British Council/AEO for IELTS, ETS for TOEFL/GRE; hedged note where fees vary), frequency, validity, competitive score for top universities, 3+ prep tips, 2+ prep resources (official + trusted), 1+ official source URL.

**URL verification rule (mandatory):** `WebFetch` every URL before adding it. Drop unverifiable URLs. Official domains to prefer: ielts.org, ets.org, pearsonpte.com, englishtest.duolingo.com, collegeboard.org (satsuite), act.org, gmac.com (mba.com), testdaf.de, goethe.de, osd.at, cils.unistrasi.it, cvcl.it, topik.go.kr, chinesetest.cn, studyinturkiye.gov.tr, cisiaonline.it, staatsexamensnt2.nl, bipa.kemdikbud.go.id.

**Facts rule (mandatory):** no invented fees or pattern details — use hedged language ("approx.", "typical") where centres vary.

- [ ] **Step 4: Write `src/data/abroad-tests.json`**

Top-level shape: `{ "dataYear": 2026, "tests": [ ...19 entries matching AbroadTest... ] }`.

Anchor example (verify every fact during research and correct anything outdated):

```json
{
  "id": "ielts",
  "name": "IELTS Academic",
  "short": "IELTS",
  "kind": "english",
  "countries": ["germany", "austria", "italy", "south-korea", "turkey", "china", "indonesia", "usa", "uk", "ireland", "lithuania", "netherlands", "hungary"],
  "pattern": [
    { "section": "Listening", "content": "4 recordings, 40 questions", "duration": "30 minutes" },
    { "section": "Reading", "content": "3 long passages, 40 questions", "duration": "60 minutes" },
    { "section": "Writing", "content": "2 tasks (report + essay)", "duration": "60 minutes" },
    { "section": "Speaking", "content": "3-part face-to-face interview", "duration": "11-14 minutes" }
  ],
  "feePkr": 59000,
  "feeNote": "Varies by centre; around PKR 59,000 in 2026 (British Council/AEO)",
  "frequency": "Multiple times per month",
  "validity": "2 years",
  "competitiveScore": "7.0+ for top universities",
  "prep": {
    "tips": [
      "Take at least 2 full timed mock tests before the real sitting",
      "Practice Writing Task 2 essays with the official band descriptors",
      "Do Listening practice with British/Australian accents, not just American"
    ],
    "resources": [
      { "label": "IELTS.org official prep", "url": "https://ielts.org/test_takers_information/getting_ready" },
      { "label": "British Council Pakistan", "url": "https://www.britishcouncil.pk/exam/ielts" }
    ]
  },
  "sourceUrls": ["https://ielts.org"]
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/data/abroad-tests.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 6: Lint + type check**

Run: `npx eslint src/data/abroad-tests.test.ts`
Expected: no errors.

Run: `npx tsc --noEmit`
Expected: exit 0.

---

### Task 5: Safar knowledge base + persona in `lib/ai.ts`

**Files:**
- Create: `src/data/abroad-chatbot-knowledge.test.ts`
- Create: `src/data/abroad-chatbot-knowledge.ts`
- Modify: `src/lib/ai.ts`
- Modify: `src/app/api/chat/route.ts`

- [ ] **Step 1: Write the knowledge base test (will fail — file does not exist yet)**

Create `src/data/abroad-chatbot-knowledge.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { abroadChatbotKnowledge } from "@/data/abroad-chatbot-knowledge";

describe("abroad-chatbot-knowledge.ts", () => {
  it("has a YYYY-MM-DD updatedAt", () => {
    expect(abroadChatbotKnowledge.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("has at least 8 topics with unique ids", () => {
    expect(abroadChatbotKnowledge.topics.length).toBeGreaterThanOrEqual(8);
    const ids = abroadChatbotKnowledge.topics.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every topic has a title and at least 3 facts", () => {
    for (const t of abroadChatbotKnowledge.topics) {
      expect(t.title.length, t.id).toBeGreaterThan(2);
      expect(t.facts.length, t.id).toBeGreaterThanOrEqual(3);
    }
  });

  it("every fact has a substantive text and an https source URL", () => {
    for (const t of abroadChatbotKnowledge.topics) {
      for (const f of t.facts) {
        expect(f.text.length, t.id).toBeGreaterThan(20);
        expect(f.source.startsWith("https://"), `${t.id}:${f.source}`).toBe(true);
      }
    }
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/data/abroad-chatbot-knowledge.test.ts`
Expected: FAIL — cannot resolve `@/data/abroad-chatbot-knowledge`.

- [ ] **Step 3: Write the knowledge base**

Create `src/data/abroad-chatbot-knowledge.ts` — this is the file the USER edits to "train" Safar. Open with a guidance comment block (it is a `.ts` file so comments survive), then the typed data:

```ts
/**
 * ============================================================
 *  SAFAR'S KNOWLEDGE BASE — EDIT THIS FILE TO TRAIN THE BOT
 * ============================================================
 *  HOW IT WORKS:
 *  - Every chat request injects this entire file into Safar's
 *    system prompt (see src/lib/ai.ts). Safar answers from it
 *    and cites each fact's `source` URL.
 *  - To teach Safar something new: add a fact object
 *    `{ text: "...", source: "https://..." }` inside a topic,
 *    or add a whole new topic.
 *  - Keep facts short and factual. Every fact MUST carry the
 *    URL it came from — Safar cites it in its answers.
 *  - After editing, restart `next dev` (the prompt is built at
 *    server start) and run `npx vitest run src/data/abroad-chatbot-knowledge.test.ts`.
 *  - DO NOT put secrets or personal data here — it is sent to
 *    the AI model with every chat message.
 * ============================================================
 */

export interface KnowledgeFact {
  text: string;
  source: string; // URL
}

export interface KnowledgeTopic {
  id: string;
  title: string;
  facts: KnowledgeFact[];
}

export const abroadChatbotKnowledge: {
  updatedAt: string;
  topics: KnowledgeTopic[];
} = {
  updatedAt: "2026-08-27",
  topics: [
    {
      id: "visa-process",
      title: "Student visa process (general)",
      facts: [
        // each fact: researched, short, hedged where time-varying, source URL verified
      ],
    },
    // + at least 7 more topics:
    // "documents" (core document checklist),
    // "bank-statements" (proof of funds, blocked accounts, sponsor rules),
    // "money-questions" (cost overview per country, hedged),
    // "tests" (which test for which country, scores, booking),
    // "scholarships" (how to find/apply, HEC + flagship programs overview),
    // "interviews" (visa interview tips),
    // "country-notes" (one short fact block per country: language, tuition snapshot, post-study work),
    // "scams-safety" (agent/visa scams, how to verify offers)
  ],
};
```

Fill every topic with researched facts using the same sources you verified in Tasks 2-4 plus official embassy/immigration pages. Every fact: `text` of 1-3 sentences (hedged where time-varying: "around", "typically", "as of 2026"), `source` URL verified via `WebFetch`. Cross-check facts against the JSON data you already wrote — the knowledge base and the pages must not contradict each other.

- [ ] **Step 4: Run the knowledge base test**

Run: `npx vitest run src/data/abroad-chatbot-knowledge.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Add the Safar persona to `src/lib/ai.ts`**

Make these three edits to the existing file (do not touch the other personas):

Edit 1 — extend the persona union:

```ts
export interface ChatContext {
  persona: "rahbar" | "study" | "essay" | "cv" | "safar";
```

Edit 2 — add the import at the top (after the existing imports):

```ts
import { abroadChatbotKnowledge } from "@/data/abroad-chatbot-knowledge";
```

Edit 3 — add the knowledge formatter and the `safar` prompt entry. Insert the formatter above `PERSONA_PROMPTS` and add the `safar:` key at the end of the `PERSONA_PROMPTS` object (after `cv: ...`):

```ts
function formatKnowledgeBase(): string {
  return abroadChatbotKnowledge.topics
    .map(
      (t) =>
        `## ${t.title}\n${t.facts.map((f) => `- ${f.text} [source: ${f.source}]`).join("\n")}`
    )
    .join("\n\n");
}

const SAFAR_KNOWLEDGE = formatKnowledgeBase();
```

```ts
  safar: `You are "Safar" (سفر), the study-abroad assistant for aftermediate, a career-counseling platform for Pakistani students. You help with visa processes, documents, bank statements, money questions, tests, scholarships, and country guidance for these study destinations: Germany, Austria, Italy, South Korea, Turkey, China, Indonesia, USA, UK, Ireland, Lithuania, Netherlands, Hungary.

Tone: warm, concise, scannable. Plain English with occasional Urdu phrases where natural. Use bullet points for checklists.

KNOWLEDGE BASE — authored by the site owner. Treat it as your primary, authoritative source for facts. When you use a fact from it, cite its source URL in your reply:
${SAFAR_KNOWLEDGE}

Grounding rules:
- Answer from the knowledge base first.
- If the knowledge base does not cover the question, say so honestly and point to the site page that helps (Country Explorer /abroad/countries, Scholarships /abroad/scholarships, Test Prep /abroad/test-prep, Financial Planner /abroad/planner) or the relevant official source.
- Never fabricate fees, deadlines, or visa rules. For time-varying figures use hedged language ("around", "typically", "as of 2026").
- Academic study questions → redirect to Ustaad (/study). Site navigation questions → redirect to Rahbar.
- Always end with one concrete next step.`,
```

- [ ] **Step 6: Extend the persona union in `src/app/api/chat/route.ts`**

Replace the persona cast line:

```ts
    const persona = (body.persona as "rahbar" | "study" | "essay" | "cv") || "rahbar";
```

with:

```ts
    const persona = (body.persona as "rahbar" | "study" | "essay" | "cv" | "safar") || "rahbar";
```

- [ ] **Step 7: Run all tests, lint, and type check**

Run: `npx vitest run src/data/abroad-chatbot-knowledge.test.ts`
Expected: PASS, 4 tests.

Run: `npx eslint src/data/abroad-chatbot-knowledge.ts src/data/abroad-chatbot-knowledge.test.ts src/lib/ai.ts src/app/api/chat/route.ts`
Expected: no errors.

Run: `npx tsc --noEmit`
Expected: exit 0.

---
### Task 6: Sidebar Education Abroad links

**Files:**
- Modify: `src/components/sidebar.tsx`

- [ ] **Step 1: Add the 5 new links to the Education Abroad group**

Edit `src/components/sidebar.tsx`:

Edit 1 — extend the lucide import (add `Globe`, `Medal`, `BookOpenCheck`, `Bot`, `Calculator` to the existing list):

```tsx
import {
  Compass,
  Target,
  Rocket,
  Wallet,
  FileText,
  TrendingUp,
  User,
  BookOpen,
  Sparkles,
  GraduationCap,
  ClipboardList,
  Award,
  BarChart3,
  Globe,
  Medal,
  BookOpenCheck,
  Bot,
  Calculator,
} from "lucide-react";
```

Edit 2 — replace the "Education Abroad" group's links array:

```tsx
  {
    label: "Education Abroad",
    links: [
      { href: "/abroad/countries", label: "Countries", icon: Globe },
      { href: "/abroad/scholarships", label: "Scholarships", icon: Medal },
      { href: "/abroad/test-prep", label: "Test Prep", icon: BookOpenCheck },
      { href: "/abroad/assistant", label: "Safar", icon: Bot },
      { href: "/abroad/planner", label: "Planner", icon: Calculator },
      { href: "/money", label: "Money", icon: Wallet },
      { href: "/convince", label: "Convince", icon: FileText },
      { href: "/study", label: "Ustaad", icon: BookOpen },
    ],
  },
```

- [ ] **Step 2: Verify the mobile nav picks the links up automatically**

`src/components/top-nav.tsx` renders `groups.flatMap((g) => g.links)` — no change needed there. The 5 new links will appear in the horizontally scrollable mobile nav.

Run: `npx eslint src/components/sidebar.tsx`
Expected: no errors.

Run: `npx tsc --noEmit`
Expected: exit 0.

---

### Task 7: Country Explorer (countries-explorer + route)

**Files:**
- Create: `src/components/abroad/countries-explorer.tsx`
- Create: `src/app/(app)/abroad/countries/page.tsx`

- [ ] **Step 1: Create the explorer component**

Create `src/components/abroad/countries-explorer.tsx`:

```tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ChevronDown, ExternalLink, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  cheapestCountry,
  compareCountries,
  filterCountries,
  lowestVisaFeeCountry,
  monthlyLivingTotal,
  mostGenerousPostStudyWork,
  sortCountries,
} from "@/lib/abroad-filters";
import { formatPkr } from "@/lib/abroad-planner";
import type { AbroadCountry, AbroadRegion } from "@/lib/types";
import json from "@/data/abroad-countries.json";

const data = json as unknown as { dataYear: number; countries: AbroadCountry[] };

const REGION_FILTERS: { value: AbroadRegion | "all"; label: string }[] = [
  { value: "all", label: "All regions" },
  { value: "europe", label: "Europe" },
  { value: "asia", label: "Asia" },
  { value: "north-america", label: "North America" },
];

const REGION_LABEL: Record<AbroadRegion, string> = {
  europe: "Europe",
  asia: "Asia",
  "north-america": "North America",
};

const LEVEL_LABEL: Record<"ug" | "masters" | "phd", string> = {
  ug: "Bachelor's",
  masters: "Master's",
  phd: "PhD",
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-saffron/40 bg-saffron/10 text-saffron"
          : "border-line bg-surface text-muted hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card-glass rounded-2xl p-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">{label}</p>
      <p className="mt-1 text-lg font-bold text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{sub}</p>
    </div>
  );
}

function CostLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-xs">
      <span className="text-muted">{label}</span>
      <span className="font-mono text-ink">{value}</span>
    </div>
  );
}

function CompareTable({
  countries,
  onClear,
}: {
  countries: AbroadCountry[];
  onClear: () => void;
}) {
  const rows: { label: string; get: (c: AbroadCountry) => string }[] = [
    { label: "Region", get: (c) => REGION_LABEL[c.region] },
    { label: "Language", get: (c) => c.language },
    { label: "Tuition — Bachelor's", get: (c) => `${formatPkr(c.tuition.ug.min)} – ${formatPkr(c.tuition.ug.max)}/yr` },
    { label: "Tuition — Master's", get: (c) => `${formatPkr(c.tuition.masters.min)} – ${formatPkr(c.tuition.masters.max)}/yr` },
    { label: "Tuition — PhD", get: (c) => `${formatPkr(c.tuition.phd.min)} – ${formatPkr(c.tuition.phd.max)}/yr` },
    { label: "Living (big city)", get: (c) => `${formatPkr(monthlyLivingTotal(c, "big"))}/mo` },
    { label: "Visa fee", get: (c) => formatPkr(c.visa.feePkr) },
    { label: "Visa processing", get: (c) => c.visa.processingTime },
    { label: "Post-study work", get: (c) => c.postStudyWork },
    { label: "Required tests", get: (c) => c.requiredTests.map((t) => t.toUpperCase()).join(", ") },
    { label: "Top fields", get: (c) => c.topFields.slice(0, 3).join(", ") },
    { label: "Pros", get: (c) => c.pros.join(" · ") },
    { label: "Cons", get: (c) => c.cons.join(" · ") },
  ];
  return (
    <div className="card-glass overflow-hidden rounded-2xl border-saffron/30">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="text-sm font-bold text-ink">
          Comparing {countries.length} countries
        </p>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-ink"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr className="border-b border-line">
              <th className="px-4 py-2 font-semibold text-faint"> </th>
              {countries.map((c) => (
                <th key={c.id} className="px-4 py-2 font-bold text-ink">
                  {c.flag} {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-line/60 last:border-0">
                <td className="px-4 py-2 align-top font-semibold text-faint">{row.label}</td>
                {countries.map((c) => (
                  <td key={c.id} className="px-4 py-2 align-top text-muted">
                    {row.get(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 first:mt-0">
      <h4 className="text-[11px] font-semibold uppercase tracking-widest text-faint">{title}</h4>
      <div id={id} className="mt-2">
        {children}
      </div>
    </section>
  );
}

function CountryCard({
  c,
  open,
  compare,
  onToggle,
  onToggleCompare,
}: {
  c: AbroadCountry;
  open: boolean;
  compare: boolean;
  onToggle: () => void;
  onToggleCompare: () => void;
}) {
  const panelId = `country-panel-${c.id}`;
  const triggerId = `country-trigger-${c.id}`;
  const bigCity = c.living.bigCity;
  const smallCity = c.living.smallCity;
  const bigTotal = monthlyLivingTotal(c, "big");
  return (
    <div className="card-glass overflow-hidden rounded-2xl">
      <div className="flex items-center gap-3 p-5">
        <h3 className="min-w-0 flex-1">
          <button
            type="button"
            id={triggerId}
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={panelId}
            className="flex w-full items-center gap-4 text-left"
          >
            <span className="text-2xl">{c.flag}</span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-bold text-ink">{c.name}</span>
                <Badge variant="muted">{REGION_LABEL[c.region]}</Badge>
                <Badge variant={c.tuition.masters.max === 0 ? "emerald" : "info"}>
                  {c.tuition.masters.max === 0 ? "No tuition" : "Paid tuition"}
                </Badge>
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted">
                {c.capital} · {c.language} · 1 {c.currency.code} ≈ PKR {Math.round(c.currency.toPkr)}
              </span>
            </span>
            <ChevronDown
              className={cn("h-4 w-4 shrink-0 text-faint transition-transform", open && "rotate-180")}
            />
          </button>
        </h3>
        <button
          type="button"
          aria-pressed={compare}
          onClick={onToggleCompare}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            compare
              ? "border-saffron/40 bg-saffron/10 text-saffron"
              : "border-line text-muted hover:text-ink"
          )}
        >
          {compare && <Check className="h-3 w-3" />}
          Compare
        </button>
      </div>

      <div id={panelId} hidden={!open} role="region" aria-labelledby={triggerId} className="border-t border-line p-5">
        <p className="text-sm leading-relaxed text-muted">{c.intro}</p>

        <Section id={`${c.id}-visa`} title="Student visa">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="saffron">{c.visa.type}</Badge>
            <span className="font-mono text-xs text-ink">{formatPkr(c.visa.feePkr)}</span>
            <span className="text-xs text-muted">· {c.visa.processingTime}</span>
          </div>
          <ul className="mt-3 space-y-1.5">
            {c.visa.keyPoints.map((kp) => (
              <li key={kp} className="flex gap-2 text-xs text-muted">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
                {kp}
              </li>
            ))}
          </ul>
        </Section>

        <Section id={`${c.id}-intakes`} title="Intakes">
          <div className="flex flex-wrap gap-2">
            {c.intakes.map((i) => (
              <Badge key={i} variant="muted">{i}</Badge>
            ))}
          </div>
        </Section>

        <Section id={`${c.id}-tuition`} title="Tuition per year (PKR)">
          <div className="overflow-hidden rounded-lg border border-line">
            {(Object.keys(c.tuition) as ("ug" | "masters" | "phd")[]).map((level) => (
              <CostLine
                key={level}
                label={LEVEL_LABEL[level]}
                value={`${formatPkr(c.tuition[level].min)} – ${formatPkr(c.tuition[level].max)}`}
              />
            ))}
          </div>
        </Section>

        <Section id={`${c.id}-living`} title="Monthly living costs (PKR)">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-surface-2/60 p-3">
              <p className="text-xs font-semibold text-ink">Big city · {formatPkr(bigTotal)}/mo</p>
              <div className="mt-2">
                <CostLine label="Rent" value={formatPkr(bigCity.rent)} />
                <CostLine label="Food" value={formatPkr(bigCity.food)} />
                <CostLine label="Transport" value={formatPkr(bigCity.transport)} />
                <CostLine label="Utilities" value={formatPkr(bigCity.utilities)} />
                <CostLine label="Misc" value={formatPkr(bigCity.misc)} />
              </div>
            </div>
            <div className="rounded-lg bg-surface-2/60 p-3">
              <p className="text-xs font-semibold text-ink">Small city · {formatPkr(monthlyLivingTotal(c, "small"))}/mo</p>
              <div className="mt-2">
                <CostLine label="Rent" value={formatPkr(smallCity.rent)} />
                <CostLine label="Food" value={formatPkr(smallCity.food)} />
                <CostLine label="Transport" value={formatPkr(smallCity.transport)} />
                <CostLine label="Utilities" value={formatPkr(smallCity.utilities)} />
                <CostLine label="Misc" value={formatPkr(smallCity.misc)} />
              </div>
            </div>
          </div>
        </Section>

        <Section id={`${c.id}-one-time`} title="One-time costs (PKR)">
          <div className="overflow-hidden rounded-lg border border-line">
            <CostLine label="Application fee" value={formatPkr(c.oneTime.applicationFee)} />
            <CostLine label="Visa fee" value={formatPkr(c.oneTime.visaFee)} />
            <CostLine label="Health insurance" value={formatPkr(c.oneTime.insurance)} />
            <CostLine label="Flight (round trip)" value={formatPkr(c.oneTime.flight)} />
          </div>
        </Section>

        <Section id={`${c.id}-docs`} title="Documents checklist">
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {c.documents.map((d) => (
              <li key={d} className="flex gap-2 text-xs text-muted">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
                {d}
              </li>
            ))}
          </ul>
        </Section>

        <Section id={`${c.id}-tests`} title="Required tests">
          <div className="flex flex-wrap gap-2">
            {c.requiredTests.map((t) => (
              <Link
                key={t}
                href={`/abroad/test-prep?country=${c.id}`}
                className="rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-saffron/40 hover:text-ink"
              >
                {t.toUpperCase()} →
              </Link>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-faint">Opens the Test Prep page filtered to {c.name}.</p>
        </Section>

        <Section id={`${c.id}-pathway`} title="Pathway to admission">
          <ol className="space-y-3">
            {c.pathway.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-saffron/15 font-mono text-[10px] font-bold text-saffron">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{step.title}</p>
                  <p className="text-xs text-muted">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section id={`${c.id}-work`} title="After graduation">
          <p className="text-sm text-ink">{c.postStudyWork}</p>
        </Section>

        <Section id={`${c.id}-pros-cons`} title="Pros & cons">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-emerald">Pros</p>
              <ul className="mt-1.5 space-y-1">
                {c.pros.map((p) => (
                  <li key={p} className="flex gap-2 text-xs text-muted">
                    <span className="text-emerald">+</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-danger">Cons</p>
              <ul className="mt-1.5 space-y-1">
                {c.cons.map((con) => (
                  <li key={con} className="flex gap-2 text-xs text-muted">
                    <span className="text-danger">–</span>
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
          {c.sources.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-saffron hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CountriesExplorer() {
  const [query, setQuery] = React.useState("");
  const [region, setRegion] = React.useState<AbroadRegion | "all">("all");
  const [sort, setSort] = React.useState<"name" | "cheapest">("name");
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [compareIds, setCompareIds] = React.useState<string[]>([]);

  const filtered = sortCountries(filterCountries(data.countries, { query, region }), sort);

  const cheapest = cheapestCountry(data.countries);
  const bestWork = mostGenerousPostStudyWork(data.countries);
  const lowestVisa = lowestVisaFeeCountry(data.countries);
  const compareList = compareCountries(data.countries, compareIds);

  function toggleCompare(id: string) {
    setCompareIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= 3
          ? prev
          : [...prev, id]
    );
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Cheapest overall"
          value={`${cheapest.flag} ${cheapest.name}`}
          sub={`≈ ${formatPkr(monthlyLivingTotal(cheapest, "big") + (cheapest.tuition.ug.min + cheapest.tuition.ug.max) / 2)}/mo living + UG tuition`}
        />
        <StatCard
          label="Best post-study work"
          value={`${bestWork.flag} ${bestWork.name}`}
          sub={`${bestWork.postStudyWorkMonths} months — ${bestWork.postStudyWork}`}
        />
        <StatCard
          label="Lowest visa fee"
          value={`${lowestVisa.flag} ${lowestVisa.name}`}
          sub={`${formatPkr(lowestVisa.visa.feePkr)} student visa fee`}
        />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <Input
            className="pl-9"
            placeholder="Search by country, capital, or field..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {REGION_FILTERS.map((r) => (
            <Chip key={r.value} active={region === r.value} onClick={() => setRegion(r.value)}>
              {r.label}
            </Chip>
          ))}
          <span className="mx-1 hidden h-4 w-px bg-line sm:block" />
          <Chip active={sort === "name"} onClick={() => setSort("name")}>
            A–Z
          </Chip>
          <Chip active={sort === "cheapest"} onClick={() => setSort("cheapest")}>
            Cheapest first
          </Chip>
        </div>
        {compareIds.length >= 2 && (
          <p className="text-xs text-muted">
            {compareIds.length}/3 selected — pick up to 3 to compare side by side.
          </p>
        )}
      </div>

      {compareList.length >= 2 && (
        <div className="mt-5">
          <CompareTable countries={compareList} onClear={() => setCompareIds([])} />
        </div>
      )}

      <div className="mt-5 space-y-4">
        {filtered.length === 0 && (
          <div className="card-glass rounded-2xl p-8 text-center">
            <p className="text-sm text-muted">No countries match these filters.</p>
          </div>
        )}
        {filtered.map((c) => (
          <CountryCard
            key={c.id}
            c={c}
            open={openId === c.id}
            compare={compareIds.includes(c.id)}
            onToggle={() => setOpenId(openId === c.id ? null : c.id)}
            onToggleCompare={() => toggleCompare(c.id)}
          />
        ))}
      </div>

      <p className="mt-8 font-mono text-[11px] text-faint">
        Data compiled {data.dataYear}. Fees change per cycle — verify on official pages before applying.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create the page wrapper**

Create `src/app/(app)/abroad/countries/page.tsx`:

```tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { CountriesExplorer } from "@/components/abroad/countries-explorer";

export default function AbroadCountriesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="animate-reveal flex items-center gap-2">
        <Badge variant="saffron">Education Abroad</Badge>
        <span className="font-mono text-xs text-faint">study destinations</span>
      </div>
      <h1
        className="animate-reveal mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl"
        style={{ animationDelay: "60ms" }}
      >
        Compare 13 study destinations, side by side.
      </h1>
      <p
        className="animate-reveal mt-2 max-w-xl text-muted"
        style={{ animationDelay: "120ms" }}
      >
        Tuition, living costs, visa rules, documents, and the full pathway for each country —
        every figure sourced from official pages.
      </p>
      <div className="animate-reveal mt-8" style={{ animationDelay: "180ms" }}>
        <CountriesExplorer />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx eslint src/components/abroad/countries-explorer.tsx "src/app/(app)/abroad/countries/page.tsx"`
Expected: no errors.

Run: `npx tsc --noEmit`
Expected: exit 0.

Run: `npm test`
Expected: PASS — all existing tests still green (Task 1-4 tests included).

- [ ] **Step 4: Manual check**

Run: `npm run dev` and open `http://localhost:3000/abroad/countries`. Verify: stat strip shows 3 correct cards; search filters; region chips filter; "Cheapest first" reorders; accordions open/close one at a time; compare mode works with 2 and 3 selections and clears; "Required tests" chips link to `/abroad/test-prep?country=<id>`; sources open in new tabs; the 375px viewport does not overflow horizontally. Kill the dev server when done.

---
### Task 8: Abroad Scholarships page (explorer component + route)

**Files:**
- Create: `src/components/abroad/abroad-scholarships-explorer.tsx`
- Create: `src/app/(app)/abroad/scholarships/page.tsx`

- [ ] **Step 1: Create the explorer component**

Create `src/components/abroad/abroad-scholarships-explorer.tsx`:

```tsx
"use client";

import * as React from "react";
import { ChevronDown, ExternalLink, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { filterAbroadScholarships } from "@/lib/abroad-filters";
import type { AbroadCountry, AbroadScholarship, AbroadScholarshipCategory } from "@/lib/types";
import sJson from "@/data/abroad-scholarships.json";
import cJson from "@/data/abroad-countries.json";

const data = sJson as unknown as { dataYear: number; scholarships: AbroadScholarship[] };
const countryData = cJson as unknown as { countries: AbroadCountry[] };
const COUNTRY_NAMES = new Map(countryData.countries.map((c) => [c.id, c.name]));

const CATEGORY_TABS: { value: AbroadScholarshipCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "hec", label: "HEC Pakistan" },
  { value: "host-government", label: "Host Government" },
  { value: "university-specific", label: "University-specific" },
  { value: "merit-based", label: "Merit-based" },
  { value: "need-based", label: "Need-based" },
];

const LEVELS: { value: AbroadScholarship["level"] | "all"; label: string }[] = [
  { value: "all", label: "All levels" },
  { value: "bachelors", label: "Bachelors" },
  { value: "masters", label: "Masters" },
  { value: "phd", label: "PhD" },
];

function categoryCount(cat: AbroadScholarshipCategory | "all"): number {
  if (cat === "all") return data.scholarships.length;
  return data.scholarships.filter((s) => s.category === cat).length;
}

function countryLabel(c: string): string {
  if (c === "multiple") return "Multiple countries";
  return COUNTRY_NAMES.get(c) ?? c;
}

function ScholarshipCard({
  s,
  open,
  onToggle,
}: {
  s: AbroadScholarship;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = `scholarship-panel-${s.id}`;
  const triggerId = `scholarship-trigger-${s.id}`;
  return (
    <div className="card-glass overflow-hidden rounded-2xl">
      <h3>
        <button
          type="button"
          id={triggerId}
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center gap-4 p-5 text-left"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-bold text-ink">{s.name}</span>
              <Badge variant={s.coverage === "full" ? "emerald" : "saffron"}>
                {s.coverage === "full" ? "Full funding" : "Partial funding"}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted">
              {s.funder} · {s.level === "multiple" ? "All levels" : s.level} ·{" "}
              {s.countries.map(countryLabel).join(", ")}
            </p>
          </div>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-faint transition-transform", open && "rotate-180")}
          />
        </button>
      </h3>

      <div id={panelId} hidden={!open} role="region" aria-labelledby={triggerId} className="border-t border-line p-5">
        <p className="text-sm text-ink">{s.coverageDetail}</p>

        <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-faint">
          Eligibility (Pakistan-specific)
        </p>
        <ul className="mt-2 space-y-1.5">
          {s.eligibility.map((e) => (
            <li key={e} className="flex gap-2 text-xs text-muted">
              <span className="text-saffron">•</span>
              {e}
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Badge variant="muted">Deadline: {s.deadline}</Badge>
        </div>

        <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-faint">
          How to apply
        </p>
        <ol className="mt-2 space-y-2">
          {s.howToApply.map((step, i) => (
            <li key={step} className="flex gap-2 text-xs text-muted">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-saffron/15 font-mono text-[9px] font-bold text-saffron">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
          {s.sourceUrls.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-saffron hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Official page
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AbroadScholarshipsExplorer() {
  const [category, setCategory] = React.useState<AbroadScholarshipCategory | "all">("all");
  const [country, setCountry] = React.useState<string>("all");
  const [level, setLevel] = React.useState<AbroadScholarship["level"] | "all">("all");
  const [query, setQuery] = React.useState("");
  const [openId, setOpenId] = React.useState<string | null>(null);

  const filtered = filterAbroadScholarships(data.scholarships, { category, country, level, query });

  const groups =
    category === "all"
      ? CATEGORY_TABS.filter((t) => t.value !== "all").map((t) => ({
          label: t.label,
          items: filtered.filter((s) => s.category === t.value),
        }))
      : [{ label: CATEGORY_TABS.find((t) => t.value === category)?.label ?? "", items: filtered }];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {CATEGORY_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            aria-pressed={category === t.value}
            onClick={() => setCategory(t.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              category === t.value
                ? "border-saffron/40 bg-saffron/10 text-saffron"
                : "border-line bg-surface text-muted hover:text-ink"
            )}
          >
            {t.label} ({categoryCount(t.value)})
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <Input
            className="pl-9"
            placeholder="Search by name, funder, or eligibility..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="h-10 rounded-lg border border-line bg-surface-2 px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-saffron/50"
        >
          <option value="all">All countries</option>
          {countryData.countries.map((c) => (
            <option key={c.id} value={c.id}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              type="button"
              aria-pressed={level === l.value}
              onClick={() => setLevel(l.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                level === l.value
                  ? "border-saffron/40 bg-saffron/10 text-saffron"
                  : "border-line bg-surface text-muted hover:text-ink"
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-8">
        {groups.every((g) => g.items.length === 0) && (
          <div className="card-glass rounded-2xl p-8 text-center">
            <p className="text-sm text-muted">No scholarships match these filters.</p>
          </div>
        )}
        {groups.map(
          (g) =>
            g.items.length > 0 && (
              <section key={g.label}>
                <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-faint">
                  {g.label} · {g.items.length}
                </h2>
                <div className="space-y-4">
                  {g.items.map((s) => (
                    <ScholarshipCard
                      key={s.id}
                      s={s}
                      open={openId === s.id}
                      onToggle={() => setOpenId(openId === s.id ? null : s.id)}
                    />
                  ))}
                </div>
              </section>
            )
        )}
      </div>

      <p className="mt-8 font-mono text-[11px] text-faint">
        Data compiled {data.dataYear}. Deadlines are approximate — always confirm on the official
        program page before applying.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create the page wrapper**

Create `src/app/(app)/abroad/scholarships/page.tsx`:

```tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { AbroadScholarshipsExplorer } from "@/components/abroad/abroad-scholarships-explorer";

export default function AbroadScholarshipsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="animate-reveal flex items-center gap-2">
        <Badge variant="saffron">Education Abroad</Badge>
        <span className="font-mono text-xs text-faint">funding your degree</span>
      </div>
      <h1
        className="animate-reveal mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl"
        style={{ animationDelay: "60ms" }}
      >
        Every scholarship a Pakistani student should know.
      </h1>
      <p
        className="animate-reveal mt-2 max-w-xl text-muted"
        style={{ animationDelay: "120ms" }}
      >
        HEC foreign programs, host-government awards, university scholarships, and merit/need
        schemes — with official links, not agents&apos; promises.
      </p>
      <div className="animate-reveal mt-8" style={{ animationDelay: "180ms" }}>
        <AbroadScholarshipsExplorer />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx eslint src/components/abroad/abroad-scholarships-explorer.tsx "src/app/(app)/abroad/scholarships/page.tsx"`
Expected: no errors.

Run: `npx tsc --noEmit`
Expected: exit 0.

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Manual check**

Run: `npm run dev` and open `http://localhost:3000/abroad/scholarships`. Verify: HEC tab is first and shows its count; tabs filter; country select and level chips filter; search works; cards expand with eligibility, how-to-apply, and official links; empty state shows when filters match nothing; 375px viewport does not overflow. Kill the dev server when done.

---

### Task 9: Test Prep Hub (explorer component + server route with `?country=`)

**Files:**
- Create: `src/components/abroad/test-prep-explorer.tsx`
- Create: `src/app/(app)/abroad/test-prep/page.tsx`

- [ ] **Step 1: Create the explorer component**

Create `src/components/abroad/test-prep-explorer.tsx`:

```tsx
"use client";

import * as React from "react";
import { ChevronDown, ExternalLink, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { filterAbroadTests, testsForCountry } from "@/lib/abroad-filters";
import { formatPkr } from "@/lib/abroad-planner";
import type { AbroadCountry, AbroadTest, AbroadTestKind } from "@/lib/types";
import tJson from "@/data/abroad-tests.json";
import cJson from "@/data/abroad-countries.json";

const data = tJson as unknown as { dataYear: number; tests: AbroadTest[] };
const countryData = cJson as unknown as { countries: AbroadCountry[] };

const KIND_TABS: { value: AbroadTestKind | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "english", label: "English" },
  { value: "aptitude", label: "Aptitude" },
  { value: "graduate", label: "Graduate" },
  { value: "language", label: "Language" },
];

const KIND_LABEL: Record<AbroadTestKind, string> = {
  english: "English proficiency",
  aptitude: "Aptitude / admission",
  graduate: "Graduate admission",
  language: "Country language",
};

function kindCount(kind: AbroadTestKind | "all"): number {
  if (kind === "all") return data.tests.length;
  return data.tests.filter((t) => t.kind === kind).length;
}

function TestCard({
  t,
  open,
  onToggle,
}: {
  t: AbroadTest;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = `test-panel-${t.id}`;
  const triggerId = `test-trigger-${t.id}`;
  return (
    <div className="card-glass overflow-hidden rounded-2xl">
      <h3>
        <button
          type="button"
          id={triggerId}
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center gap-4 p-5 text-left"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-bold text-ink">{t.short}</span>
              <Badge variant="muted">{KIND_LABEL[t.kind]}</Badge>
              <Badge variant="saffron">{t.competitiveScore}</Badge>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted">{t.name}</p>
          </div>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-faint transition-transform", open && "rotate-180")}
          />
        </button>
      </h3>

      <div id={panelId} hidden={!open} role="region" aria-labelledby={triggerId} className="border-t border-line p-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Test pattern</p>
        <div className="mt-2 overflow-hidden rounded-lg border border-line">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line bg-surface-2/60">
                <th className="px-3 py-2 font-semibold text-faint">Section</th>
                <th className="px-3 py-2 font-semibold text-faint">Content</th>
                <th className="px-3 py-2 font-semibold text-faint">Duration</th>
              </tr>
            </thead>
            <tbody>
              {t.pattern.map((p) => (
                <tr key={p.section} className="border-b border-line/60 last:border-0">
                  <td className="px-3 py-2 font-medium text-ink">{p.section}</td>
                  <td className="px-3 py-2 text-muted">{p.content}</td>
                  <td className="px-3 py-2 font-mono text-muted">{p.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-surface-2/60 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">Fee</p>
            <p className="mt-1 font-mono text-sm text-ink">{formatPkr(t.feePkr)}</p>
            <p className="mt-0.5 text-[11px] text-muted">{t.feeNote}</p>
          </div>
          <div className="rounded-lg bg-surface-2/60 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">Frequency</p>
            <p className="mt-1 text-sm text-ink">{t.frequency}</p>
            <p className="mt-0.5 text-[11px] text-muted">Validity: {t.validity}</p>
          </div>
          <div className="rounded-lg bg-surface-2/60 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">Competitive score</p>
            <p className="mt-1 text-sm font-semibold text-saffron">{t.competitiveScore}</p>
          </div>
        </div>

        <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-faint">How to prepare</p>
        <ol className="mt-2 space-y-2">
          {t.prep.tips.map((tip, i) => (
            <li key={tip} className="flex gap-2 text-xs text-muted">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-saffron/15 font-mono text-[9px] font-bold text-saffron">
                {i + 1}
              </span>
              {tip}
            </li>
          ))}
        </ol>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
          {t.prep.resources.map((r) => (
            <a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-saffron hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              {r.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TestPrepExplorer({ initialCountry }: { initialCountry: string | null }) {
  const validInitial =
    initialCountry && countryData.countries.some((c) => c.id === initialCountry)
      ? initialCountry
      : "all";
  const [kind, setKind] = React.useState<AbroadTestKind | "all">("all");
  const [country, setCountry] = React.useState<string>(validInitial);
  const [query, setQuery] = React.useState("");
  const [openId, setOpenId] = React.useState<string | null>(null);

  const filtered = filterAbroadTests(data.tests, { kind, country, query });
  const required = country === "all" ? [] : testsForCountry(data.tests, country);
  const countryName = countryData.countries.find((c) => c.id === country)?.name;

  return (
    <div>
      <div className="card-glass rounded-2xl p-4">
        <label htmlFor="which-tests" className="text-xs font-semibold uppercase tracking-widest text-faint">
          Which tests do I need?
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            id="which-tests"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="h-10 rounded-lg border border-line bg-surface-2 px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-saffron/50"
          >
            <option value="all">All countries</option>
            {countryData.countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
          {country !== "all" && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted">{countryName} requires / accepts:</span>
              {required.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setOpenId(t.id)}
                  className="rounded-full border border-saffron/40 bg-saffron/10 px-3 py-1 text-xs font-medium text-saffron transition-colors hover:bg-saffron/20"
                >
                  {t.short}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {KIND_TABS.map((k) => (
          <button
            key={k.value}
            type="button"
            aria-pressed={kind === k.value}
            onClick={() => setKind(k.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              kind === k.value
                ? "border-saffron/40 bg-saffron/10 text-saffron"
                : "border-line bg-surface text-muted hover:text-ink"
            )}
          >
            {k.label} ({kindCount(k.value)})
          </button>
        ))}
      </div>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <Input
          className="pl-9"
          placeholder="Search tests..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="mt-5 space-y-4">
        {filtered.length === 0 && (
          <div className="card-glass rounded-2xl p-8 text-center">
            <p className="text-sm text-muted">No tests match these filters.</p>
          </div>
        )}
        {filtered.map((t) => (
          <TestCard
            key={t.id}
            t={t}
            open={openId === t.id}
            onToggle={() => setOpenId(openId === t.id ? null : t.id)}
          />
        ))}
      </div>

      <p className="mt-8 font-mono text-[11px] text-faint">
        Data compiled {data.dataYear}. Fees and formats change — confirm on the official test site before booking.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create the server page wrapper (reads `?country=` from searchParams)**

Create `src/app/(app)/abroad/test-prep/page.tsx`:

```tsx
import { Badge } from "@/components/ui/badge";
import { TestPrepExplorer } from "@/components/abroad/test-prep-explorer";

export default async function AbroadTestPrepPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const params = await searchParams;
  const initialCountry = typeof params.country === "string" ? params.country : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="animate-reveal flex items-center gap-2">
        <Badge variant="saffron">Education Abroad</Badge>
        <span className="font-mono text-xs text-faint">tests & preparation</span>
      </div>
      <h1
        className="animate-reveal mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl"
        style={{ animationDelay: "60ms" }}
      >
        Every test between you and a foreign degree.
      </h1>
      <p
        className="animate-reveal mt-2 max-w-xl text-muted"
        style={{ animationDelay: "120ms" }}
      >
        IELTS to TOPIK: patterns, fees in PKR, scoring, and how to prepare — from official
        test bodies, not coaching academies.
      </p>
      <div className="animate-reveal mt-8" style={{ animationDelay: "180ms" }}>
        <TestPrepExplorer initialCountry={initialCountry} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx eslint src/components/abroad/test-prep-explorer.tsx "src/app/(app)/abroad/test-prep/page.tsx"`
Expected: no errors.

Run: `npx tsc --noEmit`
Expected: exit 0.

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Manual check**

Run: `npm run dev`. Verify: `http://localhost:3000/abroad/test-prep` shows the helper with "All countries"; choosing Germany lists its required tests and the chips open the matching card; `http://localhost:3000/abroad/test-prep?country=germany` pre-selects Germany (the Countries page links land here); kind tabs filter; search works; cards expand with pattern table, fees, prep tips, resources; 375px viewport does not overflow. Kill the dev server when done.

---
### Task 10: Safar AI Assistant page (chat component + route)

**Files:**
- Create: `src/components/abroad/safar-assistant.tsx`
- Create: `src/app/(app)/abroad/assistant/page.tsx`

- [ ] **Step 1: Create the chat component**

Create `src/components/abroad/safar-assistant.tsx` (full-page chat; adapts the streaming pattern from `src/components/rahbar-drawer.tsx` with `persona: "safar"`):

```tsx
"use client";

import * as React from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const GREETING =
  "Salam! I'm Safar (سفر) — your study-abroad assistant. Ask me about visa processes, documents, bank statements, money, tests, scholarships, or any of the 13 destination countries.";

const STORAGE_KEY = "aftermediate:safar-chat";

const SUGGESTIONS = [
  "What documents do I need for a student visa?",
  "How much bank statement do I need to show?",
  "Which countries are cheapest for Pakistani students?",
  "How do I prepare for a visa interview?",
  "What tests do I need for Germany?",
];

function loadHistory(): Msg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
}

export function SafarAssistant() {
  const [messages, setMessages] = React.useState<Msg[]>(() =>
    loadHistory().length > 0 ? loadHistory() : [{ role: "assistant", content: GREETING }]
  );
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  async function send(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || streaming) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setStreaming(true);
    setMessages([...next, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          persona: "safar",
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok || !res.body) throw new Error("failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages([...next, { role: "assistant", content: acc }]);
      }
    } catch {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: "Sorry, I hit a snag. Try again in a moment — or check the pages on the left while you wait.",
        },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="card-glass mx-auto flex h-[70vh] max-w-3xl flex-col overflow-hidden rounded-2xl">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-saffron/10">
          <Sparkles className="h-4 w-4 text-saffron" />
        </div>
        <div>
          <p className="text-sm font-bold text-ink">Safar · سفر</p>
          <p className="text-[11px] text-muted">Study-abroad assistant · answers from a curated knowledge base</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                m.role === "user" ? "bg-saffron text-background" : "bg-surface-2 text-ink"
              )}
            >
              {m.content || (streaming && <Loader2 className="h-4 w-4 animate-spin" />)}
            </div>
          </div>
        ))}

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-full border border-line bg-surface-2 px-3 py-1.5 text-xs text-muted transition-colors hover:border-saffron/40 hover:text-ink"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about visas, documents, money, tests…"
            className="h-11 flex-1 rounded-lg border border-line bg-surface-2 px-3.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-saffron/50"
          />
          <button
            type="button"
            onClick={() => send()}
            disabled={streaming || !input.trim()}
            className="grid h-11 w-11 place-items-center rounded-lg bg-saffron text-background disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-faint">
          Safar answers from a curated knowledge base and cites sources. Always double-check on official pages.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the page wrapper**

Create `src/app/(app)/abroad/assistant/page.tsx`:

```tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { SafarAssistant } from "@/components/abroad/safar-assistant";

export default function AbroadAssistantPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="animate-reveal flex items-center gap-2">
        <Badge variant="saffron">Education Abroad</Badge>
        <span className="font-mono text-xs text-faint">ask anything</span>
      </div>
      <h1
        className="animate-reveal mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl"
        style={{ animationDelay: "60ms" }}
      >
        Safar (سفر): your study-abroad guide.
      </h1>
      <p
        className="animate-reveal mt-2 max-w-xl text-muted"
        style={{ animationDelay: "120ms" }}
      >
        Visa questions, document checklists, bank statements, money, tests — ask in plain
        words. Every answer comes from a curated knowledge base with sources cited.
      </p>
      <div className="animate-reveal mt-8" style={{ animationDelay: "180ms" }}>
        <SafarAssistant />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx eslint src/components/abroad/safar-assistant.tsx "src/app/(app)/abroad/assistant/page.tsx"`
Expected: no errors.

Run: `npx tsc --noEmit`
Expected: exit 0.

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Manual check**

Run: `npm run dev` and open `http://localhost:3000/abroad/assistant`. Verify: greeting shows; suggestion chips send; streaming answers render incrementally and cite sources; Enter sends; history persists across reload (localStorage `aftermediate:safar-chat`); a broken network (or missing GOOGLE_API_KEY) shows the friendly error message instead of a crash. Kill the dev server when done.

---

### Task 11: Financial Planner page (planner component + route)

**Files:**
- Create: `src/components/abroad/financial-planner.tsx`
- Create: `src/app/(app)/abroad/planner/page.tsx`

- [ ] **Step 1: Create the planner component**

Create `src/components/abroad/financial-planner.tsx`:

```tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { firstYearCost, formatPkr, LIFESTYLE_MULTIPLIERS, savingsTimeline, yearlyProjection } from "@/lib/abroad-planner";
import { monthlyLivingTotal } from "@/lib/abroad-filters";
import type { AbroadCountry, AbroadTest, CityTier, DegreeLevel, Lifestyle } from "@/lib/types";
import cJson from "@/data/abroad-countries.json";
import tJson from "@/data/abroad-tests.json";

const countryData = cJson as unknown as { dataYear: number; countries: AbroadCountry[] };
const testData = tJson as unknown as { tests: AbroadTest[] };

const LEVELS: { value: DegreeLevel; label: string }[] = [
  { value: "ug", label: "Bachelor's" },
  { value: "masters", label: "Master's" },
  { value: "phd", label: "PhD" },
];

const TIERS: { value: CityTier; label: string }[] = [
  { value: "big", label: "Big city" },
  { value: "small", label: "Small city" },
];

const LIFESTYLES: { value: Lifestyle; label: string }[] = [
  { value: "frugal", label: "Frugal" },
  { value: "moderate", label: "Moderate" },
  { value: "comfortable", label: "Comfortable" },
];

function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            value === o.value
              ? "border-saffron/40 bg-saffron/10 text-saffron"
              : "border-line bg-surface text-muted hover:text-ink"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function BreakdownRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-line/60 py-2 text-sm last:border-0",
        strong && "font-bold text-ink"
      )}
    >
      <span className={strong ? "text-ink" : "text-muted"}>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

export function FinancialPlanner() {
  const [countryId, setCountryId] = React.useState("germany");
  const [level, setLevel] = React.useState<DegreeLevel>("masters");
  const [tier, setTier] = React.useState<CityTier>("big");
  const [lifestyle, setLifestyle] = React.useState<Lifestyle>("moderate");
  const [tuitionT, setTuitionT] = React.useState(0.5);
  const [savings, setSavings] = React.useState("");
  const [currency, setCurrency] = React.useState<"pkr" | "local">("pkr");

  const country = countryData.countries.find((c) => c.id === countryId) ?? countryData.countries[0];
  const breakdown = firstYearCost(country, level, tier, lifestyle, tuitionT, testData.tests);
  const projection = yearlyProjection(breakdown, 4);
  const maxYear = Math.max(...projection);
  const monthly = monthlyLivingTotal(country, tier) * LIFESTYLE_MULTIPLIERS[lifestyle];
  const livingM = country.living[tier === "big" ? "bigCity" : "smallCity"];
  const savingsNum = Number(savings);
  const timeline = savingsNum > 0 ? savingsTimeline(savingsNum, breakdown.total) : null;
  const showLocal = currency === "local";

  function fmt(n: number): string {
    if (showLocal) {
      const local = n / country.currency.toPkr;
      return `${country.currency.symbol}${local.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }
    return formatPkr(n);
  }

  const budgetRows = [
    { label: "Rent", value: livingM.rent * LIFESTYLE_MULTIPLIERS[lifestyle] },
    { label: "Food", value: livingM.food * LIFESTYLE_MULTIPLIERS[lifestyle] },
    { label: "Transport", value: livingM.transport * LIFESTYLE_MULTIPLIERS[lifestyle] },
    { label: "Utilities", value: livingM.utilities * LIFESTYLE_MULTIPLIERS[lifestyle] },
    { label: "Misc", value: livingM.misc * LIFESTYLE_MULTIPLIERS[lifestyle] },
  ];

  const range = country.tuition[level];

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-glass rounded-2xl p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Your plan</p>

          <label htmlFor="planner-country" className="mt-4 block text-xs font-medium text-muted">
            Country
          </label>
          <select
            id="planner-country"
            value={countryId}
            onChange={(e) => setCountryId(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-line bg-surface-2 px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-saffron/50"
          >
            {countryData.countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>

          <p className="mt-4 text-xs font-medium text-muted">Degree level</p>
          <div className="mt-1">
            <ChoiceChips options={LEVELS} value={level} onChange={setLevel} />
          </div>

          <p className="mt-4 text-xs font-medium text-muted">City tier</p>
          <div className="mt-1">
            <ChoiceChips options={TIERS} value={tier} onChange={setTier} />
          </div>

          <p className="mt-4 text-xs font-medium text-muted">Lifestyle</p>
          <div className="mt-1">
            <ChoiceChips options={LIFESTYLES} value={lifestyle} onChange={setLifestyle} />
          </div>

          <label htmlFor="planner-tuition" className="mt-4 block text-xs font-medium text-muted">
            Tuition ({fmt(range.min)} – {fmt(range.max)}/yr)
          </label>
          <input
            id="planner-tuition"
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(tuitionT * 100)}
            onChange={(e) => setTuitionT(Number(e.target.value) / 100)}
            className="mt-1 w-full accent-saffron"
          />
          <p className="mt-1 font-mono text-xs text-ink">Selected: {fmt(breakdown.tuition)}/yr</p>

          <label htmlFor="planner-savings" className="mt-4 block text-xs font-medium text-muted">
            Monthly savings (PKR)
          </label>
          <input
            id="planner-savings"
            type="number"
            min={0}
            value={savings}
            onChange={(e) => setSavings(e.target.value)}
            placeholder="e.g. 100000"
            className="mt-1 h-10 w-full rounded-lg border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-saffron/50"
          />
        </div>

        <div className="space-y-4">
          <div className="card-glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
                First-year total
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-pressed={currency === "pkr"}
                  onClick={() => setCurrency("pkr")}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    currency === "pkr"
                      ? "border-saffron/40 bg-saffron/10 text-saffron"
                      : "border-line text-muted hover:text-ink"
                  )}
                >
                  PKR
                </button>
                <button
                  type="button"
                  aria-pressed={currency === "local"}
                  onClick={() => setCurrency("local")}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    currency === "local"
                      ? "border-saffron/40 bg-saffron/10 text-saffron"
                      : "border-line text-muted hover:text-ink"
                  )}
                >
                  {country.currency.code}
                </button>
              </div>
            </div>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-ink">{fmt(breakdown.total)}</p>
            <p className="mt-0.5 text-xs text-muted">
              {country.name} · {LEVELS.find((l) => l.value === level)?.label} ·{" "}
              {TIERS.find((t) => t.value === tier)?.label.toLowerCase()} · {lifestyle} lifestyle
            </p>
            <div className="mt-4">
              <BreakdownRow label="Tuition" value={fmt(breakdown.tuition)} />
              <BreakdownRow label="Living (12 months)" value={fmt(breakdown.living)} />
              <BreakdownRow label="Visa fee" value={fmt(breakdown.visaFee)} />
              <BreakdownRow label="Application fee" value={fmt(breakdown.applicationFee)} />
              <BreakdownRow label="Insurance" value={fmt(breakdown.insurance)} />
              <BreakdownRow label="Flight" value={fmt(breakdown.flight)} />
              <BreakdownRow label="Tests" value={fmt(breakdown.testFees)} />
              <BreakdownRow label="Total" value={fmt(breakdown.total)} strong />
            </div>
          </div>

          <div className="card-glass rounded-2xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
              Monthly budget ({lifestyle})
            </p>
            <div className="mt-2">
              {budgetRows.map((r) => (
                <BreakdownRow key={r.label} label={r.label} value={fmt(r.value)} />
              ))}
              <BreakdownRow label="Total / month" value={fmt(monthly)} strong />
            </div>
          </div>
        </div>
      </div>

      <div className="card-glass mt-4 rounded-2xl p-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
          4-year projection (6% tuition inflation)
        </p>
        <div className="mt-4 space-y-3">
          {projection.map((y, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-12 shrink-0 font-mono text-xs text-muted">Year {i + 1}</span>
              <div className="h-6 flex-1 overflow-hidden rounded bg-surface-2">
                <div
                  className="h-6 rounded bg-saffron/70"
                  style={{ width: `${Math.max(4, (y / maxYear) * 100)}%` }}
                />
              </div>
              <span className="w-24 shrink-0 text-right font-mono text-xs text-ink">{fmt(y)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card-glass mt-4 rounded-2xl p-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Savings timeline</p>
        {savingsNum <= 0 ? (
          <p className="mt-2 text-sm text-muted">Enter how much you can save monthly to see your timeline.</p>
        ) : timeline ? (
          <p className="mt-2 text-sm text-ink">
            Saving {formatPkr(savingsNum)}/month → first year funded in{" "}
            <span className="font-bold text-saffron">{timeline.months} months</span> (≈{" "}
            {timeline.yearsMonths}).
          </p>
        ) : null}
      </div>

      <p className="mt-6 font-mono text-[11px] text-faint">
        Rates as of {country.currency.rateAsOf}. Estimates only — verify costs on official pages before applying.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create the page wrapper**

Create `src/app/(app)/abroad/planner/page.tsx`:

```tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { FinancialPlanner } from "@/components/abroad/financial-planner";

export default function AbroadPlannerPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="animate-reveal flex items-center gap-2">
        <Badge variant="saffron">Education Abroad</Badge>
        <span className="font-mono text-xs text-faint">know your numbers</span>
      </div>
      <h1
        className="animate-reveal mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl"
        style={{ animationDelay: "60ms" }}
      >
        What studying abroad actually costs.
      </h1>
      <p
        className="animate-reveal mt-2 max-w-xl text-muted"
        style={{ animationDelay: "120ms" }}
      >
        First-year breakdown, a 4-year projection, a monthly budget, and how long it will
        take you to save for it — in PKR or the local currency.
      </p>
      <div className="animate-reveal mt-8" style={{ animationDelay: "180ms" }}>
        <FinancialPlanner />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx eslint src/components/abroad/financial-planner.tsx "src/app/(app)/abroad/planner/page.tsx"`
Expected: no errors.

Run: `npx tsc --noEmit`
Expected: exit 0.

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Manual check**

Run: `npm run dev` and open `http://localhost:3000/abroad/planner`. Verify: changing country/level/tier/lifestyle/slider updates every figure; tuition slider endpoints match the country's tuition range; 4-year bars grow with inflation; currency toggle switches every figure to the local currency with the right symbol; savings guard shows the hint at 0/empty and the timeline otherwise; 375px viewport does not overflow. Kill the dev server when done.

---

### Task 12: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the complete test suite**

Run: `npm test`
Expected: PASS — 105 pre-existing tests + 47 lib tests (30 filters + 17 planner) + 16 countries + 9 scholarships + 9 tests-data + 4 knowledge base = 190 tests, 0 failures.

- [ ] **Step 2: Lint the whole project**

Run: `npm run lint`
Expected: no new errors (2 pre-existing warnings in untouched files are acceptable — confirm no errors in any touched file).

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Production build**

Run: `npm run build`
Expected: build succeeds; route table includes the 5 new routes `/abroad/countries`, `/abroad/scholarships`, `/abroad/test-prep`, `/abroad/assistant`, `/abroad/planner` alongside the 22 existing routes.

- [ ] **Step 5: Browser verification (desktop)**

Run: `npm run dev`, then verify:
1. Sidebar shows all 8 "Education Abroad" links in order (Countries, Scholarships, Test Prep, Safar, Planner, Money, Convince, Ustaad) and all 5 new pages load with clean console.
2. Mobile nav (below lg, ~375px) scrolls horizontally and includes all 5 new links.
3. Countries: stat strip, search, region chips, cheapest-first sort, accordion, compare (2 and 3 selections), required-test links land on Test Prep pre-filtered.
4. Scholarships: HEC tab first, all tabs/country/level/search filters work, cards expand, empty state renders.
5. Test Prep: helper panel works; `?country=germany` pre-selects; kind tabs; card details.
6. Safar: greeting, suggestions, streaming response (requires a valid GOOGLE_API_KEY in `.env.local`; if absent, confirm the friendly error path), history persists.
7. Planner: all inputs drive outputs; currency toggle; savings guard; bars render.
8. Regression: `/pakistan/*` pages, Dashboard, and Rahbar drawer still work.

- [ ] **Step 6: Report**

Summarize for the user: test/build/lint results, any research substitutions made during data tasks (flagship programs replaced because they were unverifiable), and the one-line reminder that editing `src/data/abroad-chatbot-knowledge.ts` "trains" Safar (restart dev server after edits).
