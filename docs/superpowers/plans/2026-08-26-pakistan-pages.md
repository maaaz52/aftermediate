# Education in Pakistan Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the sidebar into two labeled sections and build 4 interactive, data-backed pages under `/pakistan/*` (Universities, Entry Tests, Scholarships, Salary & Scope) sourced from official websites.

**Architecture:** Static curated JSON in `src/data/` (researched with official `sourceUrls`) + pure filter/sort helpers in `src/lib/pakistan-filters.ts` (unit-tested) + "use client" explorer components in `src/components/pakistan/` consumed by thin page routes under `src/app/(app)/pakistan/`. No new API routes, no backend.

**Tech Stack:** Next.js 16 App Router (Turbopack), React 19, Tailwind CSS 4, lucide-react icons, vitest (node env, `src/**/*.test.ts`).

**Workflow notes (important):**
- **NO git commits.** The user's workflow is working-tree-only on `main`. Do not run `git commit` at any step.
- `npm test` = `vitest run` (all tests). For one file: `npx vitest run <path>`.
- `npm run lint` = eslint over the project. For one file: `npx eslint <file>`.
- Type check: `npx tsc --noEmit`.
- Do NOT touch `src/proxy.ts` (user-owned).
- The `(app)` layout already handles auth/quiz gating — new pages inherit it and need no auth logic.

---

## File Structure Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `src/lib/types.ts` | Append 6 new interfaces (Pakistan data types) |
| Create | `src/lib/pakistan-filters.ts` | Pure filter/sort functions (no React) |
| Create | `src/lib/pakistan-filters.test.ts` | Unit tests for filter/sort functions |
| Modify | `src/components/sidebar.tsx` | Grouped two-section navigation |
| Create | `src/data/pakistan-universities.json` | 12 universities (researched) |
| Create | `src/data/pakistan-universities.test.ts` | Schema validation tests |
| Create | `src/data/pakistan-scholarships.json` | 24+ scholarships (researched) |
| Create | `src/data/pakistan-scholarships.test.ts` | Schema validation tests |
| Create | `src/data/salary-fields.json` | 12 fields + 3 career paths (researched) |
| Create | `src/data/salary-fields.test.ts` | Schema validation tests |
| Create | `src/data/entry-tests.json` | 12 entry tests (researched) |
| Create | `src/data/entry-tests.test.ts` | Schema validation tests |
| Create | `src/components/pakistan/universities-explorer.tsx` | Search + filters + accordion cards |
| Create | `src/components/pakistan/entry-tests-explorer.tsx` | Stream filter + expandable test cards |
| Create | `src/components/pakistan/scholarships-explorer.tsx` | Category tabs + grouped cards |
| Create | `src/components/pakistan/salary-explorer.tsx` | Stats + tabs + sortable table + comparison |
| Create | `src/app/(app)/pakistan/universities/page.tsx` | Thin page wrapper |
| Create | `src/app/(app)/pakistan/entry-tests/page.tsx` | Thin page wrapper |
| Create | `src/app/(app)/pakistan/scholarships/page.tsx` | Thin page wrapper |
| Create | `src/app/(app)/pakistan/salary-insights/page.tsx` | Thin page wrapper |

---

### Task 1: Pakistan data types + filter/sort helper library

**Files:**
- Modify: `src/lib/types.ts` (append at end)
- Create: `src/lib/pakistan-filters.ts`
- Create: `src/lib/pakistan-filters.test.ts`

- [ ] **Step 1: Append types to `src/lib/types.ts`**

Append the following to the end of the existing file (do not modify existing content; the file already exports `Stream` at the top, which these interfaces reuse):

```ts
export type ScholarshipCategory =
  | "hec"
  | "need-based"
  | "merit-based"
  | "university-specific"
  | "provincial";

export interface PakistanUniversity {
  id: string;
  name: string;
  short: string;
  city: string;
  type: "public" | "private";
  streams: Stream[];
  ranking: { label: string; sourceUrl: string };
  entryTest: string;
  intro: string;
  admissionSteps: { title: string; detail: string }[];
  fees: {
    summary: string;
    programFees?: { program: string; perYear: number; note?: string }[];
    sourceUrl: string;
  };
  bestFields: { field: string; why: string }[];
  sourceUrls: string[];
}

export interface PakistanScholarship {
  id: string;
  name: string;
  category: ScholarshipCategory;
  funder: string;
  level: string;
  coverage: string;
  eligibility: string[];
  deadline: string;
  sourceUrl: string;
  note?: string;
}

export type SalaryLevel = "entry" | "mid" | "senior";

export interface SalaryField {
  id: string;
  name: string;
  emoji: string;
  streams: Stream[];
  salaries: Record<SalaryLevel, [number, number]>; // [min, max] PKR/month
  demand: "high" | "medium" | "low";
  growth: number; // % per year (approximate)
  stability: "high" | "medium" | "low";
  notes?: string;
  sources: string[];
}

export interface CareerPath {
  id: "freelancing" | "government" | "private";
  name: string;
  emoji: string;
  pros: string[];
  cons: string[];
  incomeRange: string;
  bestFor: string;
}

export interface EntryTest {
  id: string;
  name: string;
  short: string;
  streams: Stream[];
  conductingBody: string;
  acceptedBy: string[];
  fee: string;
  frequency: string;
  validity: string;
  pattern: { section: string; questions?: number; marks?: number; time?: string }[];
  syllabus: { subject: string; topics: string[] }[];
  howToApply: string[];
  sourceUrls: string[];
  note?: string;
}
```

- [ ] **Step 2: Write the failing tests for the helper library**

Create `src/lib/pakistan-filters.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  fastestGrowingField,
  filterEntryTests,
  filterScholarships,
  filterUniversities,
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
      { ...fields[0], id: "a", salaries: { entry: [50, 100], mid: [50, 100], senior: [100, 300] } },
      { ...fields[0], id: "b", salaries: { entry: [50, 100], mid: [50, 100], senior: [80, 300] } },
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
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/lib/pakistan-filters.test.ts`
Expected: FAIL — `Cannot find module '@/lib/pakistan-filters'` (types.ts edit alone cannot make the module exist).

- [ ] **Step 4: Implement `src/lib/pakistan-filters.ts`**

```ts
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
  if (stream === "all") return list;
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
      const haystack = [s.name, s.funder, s.level, ...s.eligibility].join(" ").toLowerCase();
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

export function highestPayingField(list: SalaryField[]): SalaryField {
  return sortSalaryFields(list, "senior", "desc")[0];
}

export function fastestGrowingField(list: SalaryField[]): SalaryField {
  return [...list].sort((a, b) => b.growth - a.growth)[0];
}

export function mostStableField(list: SalaryField[]): SalaryField {
  const stable = list.filter((f) => f.stability === "high");
  const highDemandStable = stable.filter((f) => f.demand === "high");
  const pool = highDemandStable.length > 0 ? highDemandStable : stable;
  return sortSalaryFields(pool, "senior", "desc")[0];
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/pakistan-filters.test.ts`
Expected: PASS, 21 tests (after review hardening: a decoy mostStableField test was added and the tie-break fixture was reordered — see the Self-Review Notes at the end).

- [ ] **Step 6: Lint + type check**

Run: `npx eslint src/lib/pakistan-filters.ts src/lib/pakistan-filters.test.ts src/lib/types.ts`
Expected: no errors.

Run: `npx tsc --noEmit`
Expected: exit 0, no output.

---

### Task 2: Sidebar restructure into two labeled sections

**Files:**
- Modify: `src/components/sidebar.tsx` (whole file)

- [ ] **Step 1: Rewrite `src/components/sidebar.tsx`**

Replace the entire file content with:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

type NavGroup = { label: string | null; links: NavLink[] };

const groups: NavGroup[] = [
  {
    label: null,
    links: [
      { href: "/dashboard", label: "Dashboard", icon: Compass },
      { href: "/profile", label: "Profile", icon: User },
    ],
  },
  {
    label: "Education in Pakistan",
    links: [
      { href: "/pakistan/universities", label: "Universities", icon: GraduationCap },
      { href: "/pakistan/entry-tests", label: "Entry Tests", icon: ClipboardList },
      { href: "/pakistan/scholarships", label: "Scholarships", icon: Award },
      { href: "/pakistan/salary-insights", label: "Salary & Scope", icon: BarChart3 },
      { href: "/merit", label: "Merit", icon: Target },
      { href: "/career", label: "Career", icon: Rocket },
      { href: "/trends", label: "Trends", icon: TrendingUp },
    ],
  },
  {
    label: "Education Abroad",
    links: [
      { href: "/money", label: "Money", icon: Wallet },
      { href: "/convince", label: "Convince", icon: FileText },
      { href: "/study", label: "Ustaad", icon: BookOpen },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-line bg-surface">
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.label ?? "core"} className={group.label ? "mt-6" : ""}>
            {group.label && (
              <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-widest text-faint">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.links.map((l) => {
                const active = pathname.startsWith(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-saffron/10 text-saffron"
                        : "text-muted hover:text-ink hover:bg-surface-2"
                    )}
                  >
                    <l.icon className="h-4 w-4 shrink-0" />
                    {l.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <button
          onClick={() => document.dispatchEvent(new CustomEvent("open-rahbar"))}
          className="mt-6 flex w-full items-center gap-3 rounded-lg border border-saffron/30 bg-saffron/5 px-3 py-2.5 text-sm font-medium text-saffron transition-colors hover:bg-saffron/10"
        >
          <Sparkles className="h-4 w-4 shrink-0" />
          Talk to Rahbar
        </button>
      </nav>
    </aside>
  );
}
```

Note: the nav now scrolls (`overflow-y-auto`) because it has more items.

- [ ] **Step 2: Lint + type check**

Run: `npx eslint src/components/sidebar.tsx`
Expected: no errors.

Run: `npx tsc --noEmit`
Expected: exit 0. (New routes do not exist yet, so do NOT run `next build` until the pages are created.)

- [ ] **Step 3: Sanity check on the dev server**

Run: `npm run dev` (background terminal) and open `http://localhost:3000/dashboard`.
Expected: sidebar shows Dashboard/Profile at top, then "Education in Pakistan" (Universities, Entry Tests, Scholarships, Salary & Scope, Merit, Career, Trends), then "Education Abroad" (Money, Convince, Ustaad), then the Rahbar button. Existing links still navigate.

---

### Task 3: pakistan-universities.json (12 researched universities) + schema tests

**Files:**
- Create: `src/data/pakistan-universities.test.ts`
- Create: `src/data/pakistan-universities.json`

- [ ] **Step 1: Write the schema test (will fail — JSON does not exist yet)**

Create `src/data/pakistan-universities.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import json from "@/data/pakistan-universities.json";
import type { PakistanUniversity, Stream } from "@/lib/types";

const data = json as unknown as { dataYear: number; universities: PakistanUniversity[] };
const STREAMS: Stream[] = ["pre-medical", "pre-engineering", "ics", "icom", "alevel"];
const REQUIRED = ["nust", "fast", "lums", "giki", "iba", "comsats"] as const;

describe("pakistan-universities.json", () => {
  it("has exactly 12 universities", () => {
    expect(data.universities).toHaveLength(12);
  });

  it("has a numeric dataYear of 2026", () => {
    expect(data.dataYear).toBe(2026);
  });

  it("includes the 6 required flagship universities", () => {
    const ids = data.universities.map((u) => u.id);
    for (const id of REQUIRED) expect(ids).toContain(id);
  });

  it("has unique ids", () => {
    const ids = data.universities.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every university has non-empty required string fields", () => {
    for (const u of data.universities) {
      expect(u.name.length).toBeGreaterThan(2);
      expect(u.short.length).toBeGreaterThan(1);
      expect(u.city.length).toBeGreaterThan(1);
      expect(u.intro.length).toBeGreaterThan(40);
      expect(u.entryTest.length).toBeGreaterThan(1);
    }
  });

  it("every university has valid type and non-empty valid streams", () => {
    for (const u of data.universities) {
      expect(["public", "private"]).toContain(u.type);
      expect(u.streams.length).toBeGreaterThan(0);
      for (const s of u.streams) expect(STREAMS).toContain(s);
    }
  });

  it("every university has 3-6 admission steps with title and detail", () => {
    for (const u of data.universities) {
      expect(u.admissionSteps.length).toBeGreaterThanOrEqual(3);
      expect(u.admissionSteps.length).toBeLessThanOrEqual(6);
      for (const step of u.admissionSteps) {
        expect(step.title.length).toBeGreaterThan(1);
        expect(step.detail.length).toBeGreaterThan(10);
      }
    }
  });

  it("every university has 3-4 best fields with why", () => {
    for (const u of data.universities) {
      expect(u.bestFields.length).toBeGreaterThanOrEqual(3);
      expect(u.bestFields.length).toBeLessThanOrEqual(4);
      for (const bf of u.bestFields) {
        expect(bf.field.length).toBeGreaterThan(1);
        expect(bf.why.length).toBeGreaterThan(10);
      }
    }
  });

  it("every university has ranking and fees with https source URLs", () => {
    for (const u of data.universities) {
      expect(u.ranking.label.length).toBeGreaterThan(1);
      expect(u.ranking.sourceUrl.startsWith("https://")).toBe(true);
      expect(u.fees.summary.length).toBeGreaterThan(1);
      expect(u.fees.sourceUrl.startsWith("https://")).toBe(true);
    }
  });

  it("every sourceUrls entry starts with https://", () => {
    for (const u of data.universities) {
      expect(u.sourceUrls.length).toBeGreaterThanOrEqual(1);
      for (const url of u.sourceUrls) expect(url.startsWith("https://")).toBe(true);
    }
  });

  it("programFees entries have positive perYear numbers", () => {
    for (const u of data.universities) {
      for (const pf of u.fees.programFees ?? []) {
        expect(pf.perYear).toBeGreaterThan(0);
        expect(pf.program.length).toBeGreaterThan(1);
      }
    }
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/data/pakistan-universities.test.ts`
Expected: FAIL — cannot resolve `@/data/pakistan-universities.json`.

- [ ] **Step 3: Research the 12 universities**

Use `WebSearch` and `WebFetch` to research these 12 universities (in this order, exact ids): `nust`, `fast`, `lums`, `giki`, `iba`, `comsats`, `uet`, `ned`, `qau`, `pieas`, `pu`, `aku`.

For EACH university, find and record:
1. **intro** — 2-3 plain sentences: founded, location(s), what it is known for. No marketing fluff.
2. **ranking** — QS World University Ranking (latest available) or "Unranked internationally" if absent, with the ranking source URL (topuniversities.com profile is acceptable).
3. **entryTest** — the actual admission test(s), e.g. NUST→"NET", FAST→"FAST-NUCES admission test", LUMS→"SAT/LCAT", UET→"ECAT", COMSATS→"NTS NAT", IBA→"IBA admission test", AKU→"AKU admission test", QAU/PU→"University test / NTS".
4. **admissionSteps** — 3-6 numbered steps from the official admission page: apply online, upload docs, take test, merit list, fee submission, orientation.
5. **fees** — `summary` (e.g. "~PKR 175k/year for BS programs") and, where the official page lists them, 2-4 `programFees` entries with per-year PKR for flagship BS programs. Use the fee page as `fees.sourceUrl`.
6. **bestFields** — 3-4 fields the university is genuinely known for, each with a one-line `why` grounded in reputation/programs (e.g. NUST → Engineering, Computing).
7. **streams** — which of pre-medical / pre-engineering / ics / icom / alevel the university's undergrad programs serve.

**URL verification rule (mandatory):** before adding ANY URL to the JSON, run `WebFetch` on it and confirm it resolves (200) to the expected official page. If a link cannot be verified, drop the URL — never guess a URL. Prefer official domains: nust.edu.pk, nu.edu.pk, lums.edu.pk, giki.edu.pk, iba.edu.pk, comsats.edu.pk, uet.edu.pk, neduet.edu.pk, qau.edu.pk, pieas.edu.pk, pu.edu.pk, aku.edu.

**Facts rule (mandatory):** if a fact (fee number, test name, deadline) cannot be confirmed on an official page, write a conservative value instead of inventing one (e.g. fees.summary "Check official fee page"; deadline-style strings like "Cycle-based"). Numbers you do confirm should note the year.

- [ ] **Step 4: Write `src/data/pakistan-universities.json`**

Top-level shape: `{ "dataYear": 2026, "universities": [ ...12 entries matching PakistanUniversity... ] }`.

Anchor example (verify every fact via the official NUST pages during research and correct anything outdated — this shows the exact shape):

```json
{
  "id": "nust",
  "name": "National University of Sciences & Technology",
  "short": "NUST",
  "city": "Islamabad",
  "type": "public",
  "streams": ["pre-engineering", "ics"],
  "ranking": { "label": "QS World #334", "sourceUrl": "https://www.topuniversities.com/universities/national-university-sciences-technology-nust-islamabad" },
  "entryTest": "NET (NUST Entry Test)",
  "intro": "Established in 1991, NUST is Pakistan's highest-ranked engineering university with campuses in Islamabad, Rawalpindi, Karachi, and Risalpur. It is known for computing (SEECS) and engineering schools (SMME, SCEE, SNS).",
  "admissionSteps": [
    { "title": "Register for NET", "detail": "Create an account on the NUST admissions portal and book a NET series slot." },
    { "title": "Take the NET", "detail": "Sit the computer-based NET (Maths, Physics, Chemistry, English, Intelligence)." },
    { "title": "Apply online", "detail": "Submit the online application with marks and NET score before the deadline." },
    { "title": "Merit list & selection", "detail": "Admission is granted on the aggregate: NET 75% + FSc 15% + Matric 10%." },
    { "title": "Fee submission", "detail": "Pay the first-semester fee to secure the seat." }
  ],
  "fees": {
    "summary": "~PKR 175,000/year for BS engineering programs",
    "sourceUrl": "https://nust.edu.pk/admissions/fee-structure/"
  },
  "bestFields": [
    { "field": "Engineering", "why": "SMME/SCEE are Pakistan's most sought-after engineering schools." },
    { "field": "Computing", "why": "SEECS BS CS has the highest closing merit in the country." },
    { "field": "Data Science", "why": "Strong research labs and industry placement in AI/data roles." }
  ],
  "sourceUrls": [
    "https://nust.edu.pk/admissions/undergraduates/",
    "https://nust.edu.pk/admissions/fee-structure/"
  ]
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/data/pakistan-universities.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 6: Lint + type check**

Run: `npx eslint src/data/pakistan-universities.test.ts`
Expected: no errors.

Run: `npx tsc --noEmit`
Expected: exit 0.

---

### Task 4: pakistan-scholarships.json (24+ researched scholarships) + schema tests

**Files:**
- Create: `src/data/pakistan-scholarships.test.ts`
- Create: `src/data/pakistan-scholarships.json`

- [ ] **Step 1: Write the schema test (will fail — JSON does not exist yet)**

Create `src/data/pakistan-scholarships.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import json from "@/data/pakistan-scholarships.json";
import type { PakistanScholarship, ScholarshipCategory } from "@/lib/types";

const data = json as unknown as { dataYear: number; scholarships: PakistanScholarship[] };
const CATEGORIES: ScholarshipCategory[] = [
  "hec",
  "need-based",
  "merit-based",
  "university-specific",
  "provincial",
];

describe("pakistan-scholarships.json", () => {
  it("has at least 24 scholarships", () => {
    expect(data.scholarships.length).toBeGreaterThanOrEqual(24);
  });

  it("has a numeric dataYear of 2026", () => {
    expect(data.dataYear).toBe(2026);
  });

  it("has unique ids", () => {
    const ids = data.scholarships.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers every category with at least one scholarship", () => {
    const present = new Set(data.scholarships.map((s) => s.category));
    for (const c of CATEGORIES) expect(present.has(c)).toBe(true);
  });

  it("every scholarship has a valid category", () => {
    for (const s of data.scholarships) expect(CATEGORIES).toContain(s.category);
  });

  it("every scholarship has non-empty required fields", () => {
    for (const s of data.scholarships) {
      expect(s.name.length).toBeGreaterThan(3);
      expect(s.funder.length).toBeGreaterThan(2);
      expect(s.level.length).toBeGreaterThan(2);
      expect(s.coverage.length).toBeGreaterThan(3);
      expect(s.deadline.length).toBeGreaterThan(2);
    }
  });

  it("every scholarship has 2-5 eligibility bullets", () => {
    for (const s of data.scholarships) {
      expect(s.eligibility.length).toBeGreaterThanOrEqual(2);
      expect(s.eligibility.length).toBeLessThanOrEqual(5);
      for (const e of s.eligibility) expect(e.length).toBeGreaterThan(5);
    }
  });

  it("every scholarship has a verified https sourceUrl", () => {
    for (const s of data.scholarships) {
      expect(s.sourceUrl.startsWith("https://")).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/data/pakistan-scholarships.test.ts`
Expected: FAIL — cannot resolve `@/data/pakistan-scholarships.json`.

- [ ] **Step 3: Research the scholarships**

Use `WebSearch` and `WebFetch` to research the following scholarship programs, assigned to their target categories (adjust the category ONLY if official material clearly shows a different fit; do not add new scholarships beyond this list unless one on the list is discontinued, in which case you may replace it with an equivalent active program):

**HEC general (target 4):**
1. `ehsaas-ug` — Ehsaas Undergraduate Scholarship (HEC + BISP). Source: hec.gov.pk scholarship pages.
2. `hec-need-based` — HEC Need-Based Scholarship Program.
3. `scottish` — Pakistan Scottish Scholarship Scheme (for women, funded by Scottish Government/British Council). Source: britishcouncil.pk.
4. `hec-merit` — HEC Merit Scholarship (verify current cycle status; if discontinued, replace with another active HEC scheme such as the HEC Engineering Talent Scholarship or mark note accordingly).

**Need-based (target 3):**
5. `baitulmal` — Pakistan Bait-ul-Mal Individual Financial Assistance. Source: pbm.gov.pk.
6. `alkhidmat` — Al-Khidmat Foundation Education Support. Source: alkhidmat.org.
7. `shahid-afridi` — Shahid Afridi Foundation Scholarships. Source: safoundation.org.

**Merit-based (target 3):**
8. `talent-farming` — Talent Farming/National talent schemes (verify via HEC or provincial bodies; if none active, use `pms-punjab` — Punjab Merit Scholarship via HEC/PHEC). Source: hec.gov.pk or phec.punjab.gov.pk.
9. `pemra` or equivalent private merit fund — verify and pick one real active program (e.g. Habib Bank Foundation merit awards). Source: official fund page.
10. `dar-us-sakina` or equivalent — if unverifiable, replace with the "Punjab Higher Education Commission merit scholarship". Never invent.

**University-specific (target 8):**
11. `nop` — LUMS National Outreach Programme. Source: nop.lums.edu.pk.
12. `iba-fa` — IBA financial assistance / NTHP. Source: iba.edu.pk.
13. `giki-fa` — GIKI scholarship/financial aid. Source: giki.edu.pk.
14. `nust-need` — NUST need-based scholarship. Source: nust.edu.pk.
15. `fast-scholarships` — FAST-NUCES scholarships. Source: nu.edu.pk.
16. `comsats-scholarships` — COMSATS scholarships. Source: comsats.edu.pk.
17. `aku-fa` — AKU financial assistance. Source: aku.edu.
18. `pu-need` — Punjab University need-based scholarships. Source: pu.edu.pk.

**Provincial (target 6):**
19. `peef` — Punjab Educational Endowment Fund. Source: peef.org.pk.
20. `sindh-endowment` — Sindh education endowment (via education dept, Govt. of Sindh). Source: official gov.pk page.
21. `kpk-endowment` — Khyber Pakhtunkhwa education endowment (KPKEF/Ehsaas KPK stream). Source: official gov.pk page.
22. `beef` — Balochistan Education Endowment Fund. Source: official gov.pk page.
23. `ajk-education` — AJK scholarship/endowment program. Source: official ajk gov page.
24. `gb-endowment` — Gilgit-Baltistan education endowment. Source: official gb gov page.

For EACH: record name, funder, level (focus undergraduate; include "Undergraduate" where applicable), coverage (what it pays), 2-5 eligibility bullets (domicile, marks, income criteria — from official page), deadline (use "Cycle-based", "Annually <months>", or a verified window — NEVER a made-up exact date), and the single most relevant official URL.

**URL verification rule (mandatory):** `WebFetch` every URL before adding it; only include URLs that resolve to the expected official page. No guessed links. If a program's official page cannot be found, drop the entry and substitute with another real, verifiable program so the total stays ≥24 and every category has ≥1.

- [ ] **Step 4: Write `src/data/pakistan-scholarships.json`**

Top-level shape: `{ "dataYear": 2026, "scholarships": [ ...≥24 entries matching PakistanScholarship... ] }`.

Anchor example (verify facts via official pages during research; shape is fixed):

```json
{
  "id": "ehsaas-ug",
  "name": "Ehsaas Undergraduate Scholarship",
  "category": "hec",
  "funder": "HEC + BISP (Government of Pakistan)",
  "level": "Undergraduate",
  "coverage": "Full tuition fee + monthly stipend",
  "eligibility": [
    "Pakistani national admitted to an HEC-recognized university",
    "Family income below the Ehsaas poverty threshold (verified via NADRA)",
    "Open to all provinces including AJK and Gilgit-Baltistan"
  ],
  "deadline": "Cycle-based (announced by HEC each year)",
  "sourceUrl": "https://www.hec.gov.pk/english/scholarshipsgrants/Pages/default.aspx",
  "note": "The largest need-based undergraduate program in Pakistan"
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/data/pakistan-scholarships.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 6: Lint + type check**

Run: `npx eslint src/data/pakistan-scholarships.test.ts`
Expected: no errors.

Run: `npx tsc --noEmit`
Expected: exit 0.

---

### Task 5: salary-fields.json (12 fields + 3 career paths) + schema tests

**Files:**
- Create: `src/data/salary-fields.test.ts`
- Create: `src/data/salary-fields.json`

- [ ] **Step 1: Write the schema test (will fail — JSON does not exist yet)**

Create `src/data/salary-fields.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import json from "@/data/salary-fields.json";
import type { CareerPath, SalaryField, Stream } from "@/lib/types";

const data = json as unknown as {
  dataYear: number;
  disclaimer: string;
  fields: SalaryField[];
  careerPaths: CareerPath[];
};
const STREAMS: Stream[] = ["pre-medical", "pre-engineering", "ics", "icom", "alevel"];
const LEVELS = ["entry", "mid", "senior"] as const;

describe("salary-fields.json", () => {
  it("has at least 10 fields", () => {
    expect(data.fields.length).toBeGreaterThanOrEqual(10);
  });

  it("has a numeric dataYear of 2026 and a non-empty disclaimer", () => {
    expect(data.dataYear).toBe(2026);
    expect(data.disclaimer.length).toBeGreaterThan(30);
  });

  it("has unique field ids", () => {
    const ids = data.fields.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every field has non-empty name, emoji, and valid streams", () => {
    for (const f of data.fields) {
      expect(f.name.length).toBeGreaterThan(2);
      expect(f.emoji.length).toBeGreaterThan(0);
      expect(f.streams.length).toBeGreaterThan(0);
      for (const s of f.streams) expect(STREAMS).toContain(s);
    }
  });

  it("every field has valid demand and stability enums", () => {
    for (const f of data.fields) {
      expect(["high", "medium", "low"]).toContain(f.demand);
      expect(["high", "medium", "low"]).toContain(f.stability);
    }
  });

  it("every field has monotonic non-decreasing salary ranges across levels", () => {
    for (const f of data.fields) {
      for (const level of LEVELS) {
        const [min, max] = f.salaries[level];
        expect(min).toBeGreaterThan(0);
        expect(max).toBeGreaterThan(min);
      }
      expect(f.salaries.entry[0]).toBeLessThanOrEqual(f.salaries.mid[0]);
      expect(f.salaries.mid[0]).toBeLessThanOrEqual(f.salaries.senior[0]);
      expect(f.salaries.entry[1]).toBeLessThanOrEqual(f.salaries.mid[1]);
      expect(f.salaries.mid[1]).toBeLessThanOrEqual(f.salaries.senior[1]);
    }
  });

  it("every field has growth between -10 and +50", () => {
    for (const f of data.fields) {
      expect(f.growth).toBeGreaterThanOrEqual(-10);
      expect(f.growth).toBeLessThanOrEqual(50);
    }
  });

  it("every field has https sources", () => {
    for (const f of data.fields) {
      expect(f.sources.length).toBeGreaterThanOrEqual(1);
      for (const url of f.sources) expect(url.startsWith("https://")).toBe(true);
    }
  });

  it("careerPaths contains exactly freelancing, government, and private", () => {
    const ids = data.careerPaths.map((c) => c.id).sort();
    expect(ids).toEqual(["freelancing", "government", "private"]);
  });

  it("at least one field has stability=high (precondition for mostStableField)", () => {
    expect(data.fields.some((f) => f.stability === "high")).toBe(true);
  });

  it("every career path has non-empty pros, cons, incomeRange, and bestFor", () => {
    for (const c of data.careerPaths) {
      expect(c.pros.length).toBeGreaterThanOrEqual(2);
      expect(c.cons.length).toBeGreaterThanOrEqual(2);
      expect(c.incomeRange.length).toBeGreaterThan(5);
      expect(c.bestFor.length).toBeGreaterThan(10);
      expect(c.emoji.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/data/salary-fields.test.ts`
Expected: FAIL — cannot resolve `@/data/salary-fields.json`.

- [ ] **Step 3: Research the salary data**

Use `WebSearch` to consult public salary-report sources for Pakistan — glassdoor.pk (Pakistan pages), payscale.com, salaryexplorer.com, rozee.pk salary insights, and LinkedIn Salary where indexed. (Pakistani salaries have no official government-published dataset; ranges are compiled estimates — that is why the file carries a `disclaimer`.)

Research exactly these 12 fields (ids fixed): `software-engineering` (💻), `data-science` (📊), `medicine` (🩺), `dentistry` (🦷), `civil-engineering` (🏗️), `electrical-engineering` (⚡), `mechanical-engineering` (⚙️), `accounting-finance` (📈), `business-marketing` (📣), `law` (⚖️), `architecture` (🏛️), `education` (📚).

For EACH field record:
- `streams` — which of pre-medical / pre-engineering / ics / icom / alevel lead to it (map sensibly: medicine/dentistry → pre-medical + alevel; engineering fields → pre-engineering + ics; accounting/business → icom + alevel + pre-engineering; law/education/architecture → open mix).
- `salaries` — PKR/month ranges for entry (0-2 yr), mid (3-5 yr), senior (6+ yr). Round to sensible 10k bands. Must satisfy the monotonic test.
- `demand` — high/medium/low based on hiring-activity signals from the sources.
- `growth` — approximate annual % (can be negative only if sources clearly show decline; otherwise 0-35).
- `stability` — high (government/regulated demand, e.g. medicine) / medium / low (project-based, e.g. some freelance-heavy fields).
- `sources` — 1-3 real, resolving public salary-report URLs (verify each with `WebFetch`).
- `notes` — one honest line where useful (e.g. "Govt jobs dominate entry level" for education).

Then research the 3 career paths (freelancing / government / private) with 2-4 pros, 2-4 cons, a realistic incomeRange string, and a one-line bestFor. Base figures on public reporting (PBS labour force data, freelance-platform reports, FPSC BPS scales) — never invent precise numbers; use ranges and hedges ("varies wildly").

**Verification rule (mandatory):** every `sources` URL must resolve via `WebFetch`. Only real, working URLs.

- [ ] **Step 4: Write `src/data/salary-fields.json`**

Top-level shape: `{ "dataYear": 2026, "disclaimer": "...", "fields": [...12 entries...], "careerPaths": [...3 entries...] }`.

Disclaimer text (use exactly):

```
"Salary ranges are estimates compiled from public salary-report sources and job postings. They are not official statistics. Actual pay varies by city, employer, and skill level."
```

Anchor example (verify figures against sources during research and adjust; shape is fixed):

```json
{
  "id": "software-engineering",
  "name": "Software Engineering",
  "emoji": "💻",
  "streams": ["pre-engineering", "ics"],
  "salaries": { "entry": [50, 120], "mid": [120, 250], "senior": [250, 500] },
  "demand": "high",
  "growth": 25,
  "stability": "medium",
  "notes": "Remote and freelance work raises the ceiling beyond local pay scales",
  "sources": ["https://www.glassdoor.com/Salaries/pakistan-software-engineer-salary-SRCH_IL.0,8_IN177.htm", "https://www.payscale.com/research/PK/Job=Software_Engineer/Salary"]
}
```

Career paths anchor (verify and adjust):

```json
{
  "id": "freelancing",
  "name": "Freelancing",
  "emoji": "💻",
  "pros": [
    "Earn in USD at international rates from anywhere in Pakistan",
    "No degree gate — portfolio and skill win the work",
    "Full control of hours and workload"
  ],
  "cons": [
    "Income swings month to month — no fixed salary",
    "No pension, medical insurance, or job security",
    "You handle your own taxes and client disputes"
  ],
  "incomeRange": "USD 200 – 5,000+/month (varies wildly by skill)",
  "bestFor": "Self-disciplined students in tech, design, and writing — pairs well with university."
}
```

The other two career paths (`government`, `private`) follow the same shape with their own researched content.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/data/salary-fields.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 6: Lint + type check**

Run: `npx eslint src/data/salary-fields.test.ts`
Expected: no errors.

Run: `npx tsc --noEmit`
Expected: exit 0.

---

### Task 6: entry-tests.json (12 entry tests) + schema tests

**Files:**
- Create: `src/data/entry-tests.test.ts`
- Create: `src/data/entry-tests.json`

- [ ] **Step 1: Write the schema test (will fail — JSON does not exist yet)**

Create `src/data/entry-tests.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import json from "@/data/entry-tests.json";
import type { EntryTest, Stream } from "@/lib/types";

const data = json as unknown as { dataYear: number; tests: EntryTest[] };
const STREAMS: Stream[] = ["pre-medical", "pre-engineering", "ics", "icom", "alevel"];
const CORE = ["mdcat", "ecat", "net", "fungat", "lcat", "lat"] as const;

describe("entry-tests.json", () => {
  it("has at least 12 tests", () => {
    expect(data.tests.length).toBeGreaterThanOrEqual(12);
  });

  it("has a numeric dataYear of 2026", () => {
    expect(data.dataYear).toBe(2026);
  });

  it("includes the 6 core tests", () => {
    const ids = data.tests.map((t) => t.id);
    for (const id of CORE) expect(ids).toContain(id);
  });

  it("has unique ids", () => {
    const ids = data.tests.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every test has non-empty required string fields and valid streams", () => {
    for (const t of data.tests) {
      expect(t.name.length).toBeGreaterThan(5);
      expect(t.short.length).toBeGreaterThan(1);
      expect(t.conductingBody.length).toBeGreaterThan(2);
      expect(t.fee.length).toBeGreaterThan(2);
      expect(t.frequency.length).toBeGreaterThan(2);
      expect(t.validity.length).toBeGreaterThan(2);
      expect(t.streams.length).toBeGreaterThan(0);
      for (const s of t.streams) expect(STREAMS).toContain(s);
    }
  });

  it("every test has a non-empty acceptedBy list", () => {
    for (const t of data.tests) {
      expect(t.acceptedBy.length).toBeGreaterThanOrEqual(1);
      for (const a of t.acceptedBy) expect(a.length).toBeGreaterThan(2);
    }
  });

  it("every test has a non-empty pattern with sections", () => {
    for (const t of data.tests) {
      expect(t.pattern.length).toBeGreaterThanOrEqual(2);
      for (const p of t.pattern) expect(p.section.length).toBeGreaterThan(1);
    }
  });

  it("every test has a non-empty syllabus with topics", () => {
    for (const t of data.tests) {
      expect(t.syllabus.length).toBeGreaterThanOrEqual(1);
      for (const s of t.syllabus) {
        expect(s.subject.length).toBeGreaterThan(1);
        expect(s.topics.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("every test has 3-5 howToApply steps", () => {
    for (const t of data.tests) {
      expect(t.howToApply.length).toBeGreaterThanOrEqual(3);
      expect(t.howToApply.length).toBeLessThanOrEqual(5);
      for (const step of t.howToApply) expect(step.length).toBeGreaterThan(10);
    }
  });

  it("every test has https sourceUrls", () => {
    for (const t of data.tests) {
      expect(t.sourceUrls.length).toBeGreaterThanOrEqual(1);
      for (const url of t.sourceUrls) expect(url.startsWith("https://")).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/data/entry-tests.test.ts`
Expected: FAIL — cannot resolve `@/data/entry-tests.json`.

- [ ] **Step 3: Research the 12 entry tests**

Use `WebSearch` and `WebFetch` to research these 12 tests (ids fixed):

| id | Test | Conducting body | Official source |
|---|---|---|---|
| `mdcat` | MDCAT | Pakistan Medical & Dental Council (PMDC) | pmdc.pk |
| `ecat` | ECAT (Engineering College Admission Test) | UET Lahore (on behalf of Punjab universities) | admission.uet.edu.pk |
| `net` | NET (NUST Entry Test) | NUST | nust.edu.pk |
| `fungat` | FAST-NUCES admission test (FUNGAT/NU) | FAST-NUCES | nu.edu.pk |
| `lcat` | LCAT (LUMS Common Admission Test) + SAT | LUMS | admissions.lums.edu.pk |
| `iba` | IBA admission test | IBA Karachi | iba.edu.pk |
| `giki` | GIKI admission test | GIKI | giki.edu.pk |
| `comsats` | COMSATS admission (NTS NAT based) | COMSATS via NTS | comsats.edu.pk |
| `nts-nat` | NTS NAT (National Aptitude Test) | NTS | nts.org.pk |
| `pieas` | PIEAS admission test | PIEAS | pieas.edu.pk |
| `aku` | AKU admission test | Aga Khan University | aku.edu |
| `lat` | LAT (Law Admission Test) | HEC | hec.gov.pk |

For EACH test record:
- `name` + `short` (e.g. "MDCAT — Medical & Dental College Admission Test" / "MDCAT").
- `streams` — who takes it (MDCAT→pre-medical; ECAT/NET/FUNGAT/GIKI/PIEAS/COMSATS→pre-engineering+ics; LCAT/IBA/NTS-NAT→wide; LAT→open).
- `conductingBody`, `acceptedBy` (list real universities/programs), `fee` (with cycle/year noted, e.g. "PKR 8,000 (2024 cycle)" — only if confirmed; otherwise "Announced per cycle"), `frequency` (e.g. "Once a year (Nov)" or "4 series/year"), `validity` (verified — e.g. MDCAT 2 years per current policy).
- `pattern` — sections with questions/marks/time where officially published (e.g. MDCAT: Biology 68 MCQs, Chemistry 54, Physics 54, English 18, Logical Reasoning 6 — 200 total, 3.5 hours; NET engineering: Maths 80, Physics 60, Chemistry 30, English 20, Intelligence 10 — 200 MCQs). Verify every number; if not published, include sections without counts.
- `syllabus` — subject-wise topics from the official syllabus document (2-6 topics per subject, honest topic names like "Cell biology, genetics, evolution").
- `howToApply` — 3-5 steps (register account → fill form → upload docs → pay fee → download admit card).
- `sourceUrls` — 1-3 official links (admission page, syllabus page, schedule page).

**Verification rule (mandatory):** `WebFetch` every source URL before adding it. No guessed URLs. Where a numeric detail (fee, question count) cannot be confirmed, omit the number and note the year/cycle instead — never invent figures.

- [ ] **Step 4: Write `src/data/entry-tests.json`**

Top-level shape: `{ "dataYear": 2026, "tests": [ ...12 entries matching EntryTest... ] }`.

Anchor example (verify every number via pmdc.pk during research; shape is fixed):

```json
{
  "id": "mdcat",
  "name": "MDCAT — Medical & Dental College Admission Test",
  "short": "MDCAT",
  "streams": ["pre-medical"],
  "conductingBody": "Pakistan Medical & Dental Council (PMDC)",
  "acceptedBy": ["All public and private medical and dental colleges in Pakistan"],
  "fee": "Announced per cycle (approx. PKR 8,000)",
  "frequency": "Once a year (September–November window)",
  "validity": "2 years",
  "pattern": [
    { "section": "Biology", "questions": 68, "marks": 68 },
    { "section": "Chemistry", "questions": 54, "marks": 54 },
    { "section": "Physics", "questions": 54, "marks": 54 },
    { "section": "English", "questions": 18, "marks": 18 },
    { "section": "Logical Reasoning", "questions": 6, "marks": 6 }
  ],
  "syllabus": [
    { "subject": "Biology", "topics": ["Cell biology", "Genetics and evolution", "Human physiology", "Ecology"] },
    { "subject": "Chemistry", "topics": ["Physical chemistry", "Organic chemistry", "Inorganic chemistry"] },
    { "subject": "Physics", "topics": ["Mechanics", "Waves and optics", "Electricity and magnetism", "Modern physics"] },
    { "subject": "English", "topics": ["Comprehension", "Vocabulary", "Grammar"] },
    { "subject": "Logical Reasoning", "topics": ["Critical thinking", "Deductive reasoning"] }
  ],
  "howToApply": [
    "Register online on the PMDC MDCAT portal with your CNIC/B-Form",
    "Fill the application form and select your preferred test city",
    "Upload your photograph and documents",
    "Pay the fee and download your admit card before the test date"
  ],
  "sourceUrls": ["https://pmdc.pk/"]
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/data/entry-tests.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 6: Lint + type check**

Run: `npx eslint src/data/entry-tests.test.ts`
Expected: no errors.

Run: `npx tsc --noEmit`
Expected: exit 0.

---

### Task 7: Universities page (explorer component + route)

**Files:**
- Create: `src/components/pakistan/universities-explorer.tsx`
- Create: `src/app/(app)/pakistan/universities/page.tsx`

- [ ] **Step 1: Create the explorer component**

Create `src/components/pakistan/universities-explorer.tsx`:

```tsx
"use client";

import * as React from "react";
import { ChevronDown, ExternalLink, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useStudent } from "@/lib/store";
import { filterUniversities } from "@/lib/pakistan-filters";
import type { PakistanUniversity, Stream } from "@/lib/types";
import json from "@/data/pakistan-universities.json";

const data = json as unknown as { dataYear: number; universities: PakistanUniversity[] };

const STREAM_FILTERS: { value: Stream | "all"; label: string }[] = [
  { value: "all", label: "All streams" },
  { value: "pre-medical", label: "Pre-Medical" },
  { value: "pre-engineering", label: "Pre-Engineering" },
  { value: "ics", label: "ICS" },
  { value: "icom", label: "I.Com" },
  { value: "alevel", label: "A-Levels" },
];

const TYPE_FILTERS: { value: "all" | "public" | "private"; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
];

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

function UniversityCard({
  u,
  open,
  onToggle,
}: {
  u: PakistanUniversity;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="card-glass overflow-hidden rounded-2xl">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-4 p-5 text-left"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-saffron/15 font-mono text-lg font-bold text-saffron">
          {u.short.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-ink">{u.short}</h3>
            <Badge variant="muted">{u.city}</Badge>
            <Badge variant={u.type === "public" ? "emerald" : "info"}>{u.type}</Badge>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted">{u.name}</p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="font-mono text-xs text-saffron">{u.ranking.label}</p>
          <p className="mt-0.5 text-[11px] text-faint">Test: {u.entryTest}</p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-faint transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="border-t border-line p-5">
          <p className="text-sm leading-relaxed text-muted">{u.intro}</p>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
                Admission process
              </p>
              <ol className="mt-3 space-y-3">
                {u.admissionSteps.map((step, i) => (
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
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
                  Ranking
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="saffron">{u.ranking.label}</Badge>
                  <a
                    href={u.ranking.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted underline-offset-2 hover:text-saffron hover:underline"
                  >
                    source
                  </a>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
                  Fees
                </p>
                <p className="mt-2 text-sm text-ink">{u.fees.summary}</p>
                {u.fees.programFees && u.fees.programFees.length > 0 && (
                  <div className="mt-2 overflow-hidden rounded-lg border border-line">
                    {u.fees.programFees.map((pf) => (
                      <div
                        key={pf.program}
                        className="flex items-center justify-between border-b border-line/60 px-3 py-2 text-xs last:border-0"
                      >
                        <span className="text-muted">{pf.program}</span>
                        <span className="font-mono text-ink">
                          PKR {pf.perYear.toLocaleString()}/yr
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
              Best for
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {u.bestFields.map((bf) => (
                <div key={bf.field} className="rounded-lg bg-surface-2/60 px-3 py-2">
                  <p className="text-sm font-semibold text-ink">{bf.field}</p>
                  <p className="mt-0.5 text-xs text-muted">{bf.why}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
            {u.sourceUrls.map((url) => (
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
      )}
    </div>
  );
}

export function UniversitiesExplorer() {
  const { profile } = useStudent();
  const [query, setQuery] = React.useState("");
  const [stream, setStream] = React.useState<Stream | "all">(profile.stream ?? "all");
  const [type, setType] = React.useState<"all" | "public" | "private">("all");
  const [openId, setOpenId] = React.useState<string | null>(null);

  const filtered = filterUniversities(data.universities, { query, stream, type });

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <Input
            className="pl-9"
            placeholder="Search by name, city, or field..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {STREAM_FILTERS.map((f) => (
          <Chip key={f.value} active={stream === f.value} onClick={() => setStream(f.value)}>
            {f.label}
          </Chip>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {TYPE_FILTERS.map((f) => (
          <Chip key={f.value} active={type === f.value} onClick={() => setType(f.value)}>
            {f.label}
          </Chip>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {filtered.map((u) => (
          <UniversityCard
            key={u.id}
            u={u}
            open={openId === u.id}
            onToggle={() => setOpenId(openId === u.id ? null : u.id)}
          />
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-faint">
            No universities match these filters.
          </p>
        )}
      </div>

      <p className="mt-6 text-xs text-faint">
        Data compiled {data.dataYear} from official university pages. Always confirm fees and
        deadlines on the official links before applying.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create the page route**

Create `src/app/(app)/pakistan/universities/page.tsx`:

```tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { UniversitiesExplorer } from "@/components/pakistan/universities-explorer";

export default function PakistanUniversitiesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="animate-reveal flex items-center gap-2">
        <Badge variant="saffron">Pakistan</Badge>
        <span className="font-mono text-xs text-faint">education at home</span>
      </div>
      <h1
        className="animate-reveal mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl"
        style={{ animationDelay: "60ms" }}
      >
        Pakistani universities, decoded.
      </h1>
      <p
        className="animate-reveal mt-2 max-w-xl text-muted"
        style={{ animationDelay: "120ms" }}
      >
        Admission steps, real fees, rankings, and the fields each university is actually known for —
        with official links, not academy gossip.
      </p>
      <div className="animate-reveal mt-8" style={{ animationDelay: "180ms" }}>
        <UniversitiesExplorer />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Lint + type check**

Run: `npx eslint src/components/pakistan/universities-explorer.tsx "src/app/(app)/pakistan/universities/page.tsx"`
Expected: no errors.

Run: `npx tsc --noEmit`
Expected: exit 0.

---

### Task 8: Scholarships page (explorer component + route)

**Files:**
- Create: `src/components/pakistan/scholarships-explorer.tsx`
- Create: `src/app/(app)/pakistan/scholarships/page.tsx`

- [ ] **Step 1: Create the explorer component**

Create `src/components/pakistan/scholarships-explorer.tsx`:

```tsx
"use client";

import * as React from "react";
import { ExternalLink, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { filterScholarships } from "@/lib/pakistan-filters";
import type { PakistanScholarship, ScholarshipCategory } from "@/lib/types";
import json from "@/data/pakistan-scholarships.json";

const data = json as unknown as { dataYear: number; scholarships: PakistanScholarship[] };

const CATEGORY_TABS: { value: ScholarshipCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "hec", label: "HEC" },
  { value: "need-based", label: "Need-based" },
  { value: "merit-based", label: "Merit-based" },
  { value: "university-specific", label: "University" },
  { value: "provincial", label: "Provincial" },
];

const GROUP_ORDER: ScholarshipCategory[] = [
  "hec",
  "need-based",
  "merit-based",
  "university-specific",
  "provincial",
];

const GROUP_META: Record<ScholarshipCategory, { title: string; blurb: string }> = {
  hec: {
    title: "HEC General",
    blurb: "National-level programs run by the Higher Education Commission.",
  },
  "need-based": {
    title: "Need-Based",
    blurb: "For students whose family income can't cover university — proof of need required.",
  },
  "merit-based": {
    title: "Merit-Based",
    blurb: "Awarded on marks, board position, or talent — income doesn't matter.",
  },
  "university-specific": {
    title: "University-Specific",
    blurb: "Run by individual universities for their own admitted students.",
  },
  provincial: {
    title: "Provincial",
    blurb: "Endowment funds and programs by provincial governments.",
  },
};

function ScholarshipCard({ s }: { s: PakistanScholarship }) {
  return (
    <div className="card-glass flex h-full flex-col rounded-2xl p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold text-ink">{s.name}</h3>
        <Badge variant="emerald">{s.coverage}</Badge>
      </div>
      <p className="mt-1 text-xs text-muted">
        {s.funder} · {s.level}
      </p>
      <ul className="mt-3 flex-1 space-y-1.5">
        {s.eligibility.map((e) => (
          <li key={e} className="flex gap-2 text-xs text-muted">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-saffron" />
            {e}
          </li>
        ))}
      </ul>
      {s.note && <p className="mt-3 text-[11px] italic text-faint">{s.note}</p>}
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        <span className="font-mono text-[11px] text-faint">{s.deadline}</span>
        <a
          href={s.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-saffron hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          Official page
        </a>
      </div>
    </div>
  );
}

export function ScholarshipsExplorer() {
  const [category, setCategory] = React.useState<ScholarshipCategory | "all">("all");
  const [query, setQuery] = React.useState("");

  const filtered = filterScholarships(data.scholarships, { category, query });
  const groups =
    category === "all"
      ? GROUP_ORDER
      : [category as ScholarshipCategory];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <Input
            className="pl-9"
            placeholder="Search by name, funder, or eligibility..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {CATEGORY_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setCategory(t.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              category === t.value
                ? "border-saffron/40 bg-saffron/10 text-saffron"
                : "border-line bg-surface text-muted hover:text-ink"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {groups.map((g) => {
        const items = filtered.filter((s) => s.category === g);
        if (items.length === 0) return null;
        const meta = GROUP_META[g];
        return (
          <section key={g} className="mt-8">
            <h2 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
              {meta.title}
            </h2>
            <p className="mt-1 text-sm text-muted">{meta.blurb}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((s) => (
                <ScholarshipCard key={s.id} s={s} />
              ))}
            </div>
          </section>
        );
      })}

      {filtered.length === 0 && (
        <p className="py-10 text-center text-sm text-faint">
          No scholarships match these filters.
        </p>
      )}

      <p className="mt-8 text-xs text-faint">
        Data compiled {data.dataYear} from official scholarship pages. Deadlines change every
        cycle — check the official link before applying.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create the page route**

Create `src/app/(app)/pakistan/scholarships/page.tsx`:

```tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { ScholarshipsExplorer } from "@/components/pakistan/scholarships-explorer";

export default function PakistanScholarshipsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="animate-reveal flex items-center gap-2">
        <Badge variant="saffron">Pakistan</Badge>
        <span className="font-mono text-xs text-faint">education at home</span>
      </div>
      <h1
        className="animate-reveal mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl"
        style={{ animationDelay: "60ms" }}
      >
        Every scholarship, one page.
      </h1>
      <p
        className="animate-reveal mt-2 max-w-xl text-muted"
        style={{ animationDelay: "120ms" }}
      >
        HEC, need-based, merit-based, university-specific, and provincial — grouped so you can find
        what applies to you in seconds. Every entry links to its official page.
      </p>
      <div className="animate-reveal mt-8" style={{ animationDelay: "180ms" }}>
        <ScholarshipsExplorer />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Lint + type check**

Run: `npx eslint src/components/pakistan/scholarships-explorer.tsx "src/app/(app)/pakistan/scholarships/page.tsx"`
Expected: no errors.

Run: `npx tsc --noEmit`
Expected: exit 0.

---

### Task 9: Entry Tests Hub (explorer component + route)

**Files:**
- Create: `src/components/pakistan/entry-tests-explorer.tsx`
- Create: `src/app/(app)/pakistan/entry-tests/page.tsx`

- [ ] **Step 1: Create the explorer component**

Create `src/components/pakistan/entry-tests-explorer.tsx`:

```tsx
"use client";

import * as React from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useStudent } from "@/lib/store";
import { STREAM_LABEL } from "@/lib/data";
import { filterEntryTests } from "@/lib/pakistan-filters";
import type { EntryTest, Stream } from "@/lib/types";
import json from "@/data/entry-tests.json";

const data = json as unknown as { dataYear: number; tests: EntryTest[] };

const STREAM_FILTERS: { value: Stream | "all"; label: string }[] = [
  { value: "all", label: "All" },
  ...(Object.keys(STREAM_LABEL) as Stream[]).map((s) => ({
    value: s,
    label: STREAM_LABEL[s],
  })),
];

function TestCard({
  t,
  open,
  onToggle,
}: {
  t: EntryTest;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="card-glass overflow-hidden rounded-2xl">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-4 p-5 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-ink">{t.short}</h3>
            <Badge variant="muted">{t.conductingBody}</Badge>
            <Badge variant="info">{t.streams.length} stream{t.streams.length > 1 ? "s" : ""}</Badge>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted">{t.name}</p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-faint transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="border-t border-line p-5">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg bg-surface-2/60 px-3 py-2">
              <p className="text-[10px] uppercase tracking-widest text-faint">Fee</p>
              <p className="mt-0.5 text-sm font-medium text-ink">{t.fee}</p>
            </div>
            <div className="rounded-lg bg-surface-2/60 px-3 py-2">
              <p className="text-[10px] uppercase tracking-widest text-faint">Frequency</p>
              <p className="mt-0.5 text-sm font-medium text-ink">{t.frequency}</p>
            </div>
            <div className="rounded-lg bg-surface-2/60 px-3 py-2">
              <p className="text-[10px] uppercase tracking-widest text-faint">Validity</p>
              <p className="mt-0.5 text-sm font-medium text-ink">{t.validity}</p>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
              Accepted by
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {t.acceptedBy.map((a) => (
                <Badge key={a} variant="muted">
                  {a}
                </Badge>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
              Pattern
            </p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-widest text-faint">
                    <th className="py-2 pr-4">Section</th>
                    <th className="py-2 pr-4">Questions</th>
                    <th className="py-2 pr-4">Marks</th>
                    <th className="py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {t.pattern.map((p) => (
                    <tr key={p.section} className="border-b border-line/60">
                      <td className="py-2 pr-4 font-medium text-ink">{p.section}</td>
                      <td className="py-2 pr-4 font-mono text-muted">{p.questions ?? "—"}</td>
                      <td className="py-2 pr-4 font-mono text-muted">{p.marks ?? "—"}</td>
                      <td className="py-2 font-mono text-muted">{p.time ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
              Syllabus
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {t.syllabus.map((s) => (
                <div key={s.subject} className="rounded-lg bg-surface-2/60 px-3 py-2">
                  <p className="text-sm font-semibold text-ink">{s.subject}</p>
                  <p className="mt-0.5 text-xs text-muted">{s.topics.join(" · ")}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
              How to apply
            </p>
            <ol className="mt-3 space-y-2">
              {t.howToApply.map((step, i) => (
                <li key={step} className="flex gap-3 text-sm text-muted">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-saffron/15 font-mono text-[10px] font-bold text-saffron">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {t.note && <p className="mt-4 text-[11px] italic text-faint">{t.note}</p>}

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
            {t.sourceUrls.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-saffron hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Official source
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function EntryTestsExplorer() {
  const { profile } = useStudent();
  const [stream, setStream] = React.useState<Stream | "all">(profile.stream ?? "all");
  const [openId, setOpenId] = React.useState<string | null>(null);

  const filtered = filterEntryTests(data.tests, stream);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {STREAM_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStream(f.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              stream === f.value
                ? "border-saffron/40 bg-saffron/10 text-saffron"
                : "border-line bg-surface text-muted hover:text-ink"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {filtered.map((t) => (
          <TestCard
            key={t.id}
            t={t}
            open={openId === t.id}
            onToggle={() => setOpenId(openId === t.id ? null : t.id)}
          />
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-faint">
            No entry tests for this stream yet.
          </p>
        )}
      </div>

      <p className="mt-6 text-xs text-faint">
        Data compiled {data.dataYear} from official test-conducting bodies. Patterns and fees
        change per cycle — confirm on the official source before registering.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create the page route**

Create `src/app/(app)/pakistan/entry-tests/page.tsx`:

```tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { EntryTestsExplorer } from "@/components/pakistan/entry-tests-explorer";

export default function PakistanEntryTestsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="animate-reveal flex items-center gap-2">
        <Badge variant="saffron">Pakistan</Badge>
        <span className="font-mono text-xs text-faint">education at home</span>
      </div>
      <h1
        className="animate-reveal mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl"
        style={{ animationDelay: "60ms" }}
      >
        Every entry test, one hub.
      </h1>
      <p
        className="animate-reveal mt-2 max-w-xl text-muted"
        style={{ animationDelay: "120ms" }}
      >
        MDCAT to LAT — pattern, syllabus, fee, and how to apply for every test a 12th-passed
        student can take, straight from the official conducting bodies.
      </p>
      <div className="animate-reveal mt-8" style={{ animationDelay: "180ms" }}>
        <EntryTestsExplorer />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Lint + type check**

Run: `npx eslint src/components/pakistan/entry-tests-explorer.tsx "src/app/(app)/pakistan/entry-tests/page.tsx"`
Expected: no errors.

Run: `npx tsc --noEmit`
Expected: exit 0.

---

### Task 10: Salary & Scope page (explorer component + route)

**Files:**
- Create: `src/components/pakistan/salary-explorer.tsx`
- Create: `src/app/(app)/pakistan/salary-insights/page.tsx`

- [ ] **Step 1: Create the explorer component**

Create `src/components/pakistan/salary-explorer.tsx`:

```tsx
"use client";

import * as React from "react";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  fastestGrowingField,
  highestPayingField,
  mostStableField,
  sortSalaryFields,
} from "@/lib/pakistan-filters";
import type { CareerPath, SalaryField, SalaryLevel } from "@/lib/types";
import json from "@/data/salary-fields.json";

const data = json as unknown as {
  dataYear: number;
  disclaimer: string;
  fields: SalaryField[];
  careerPaths: CareerPath[];
};

const LEVELS: { value: SalaryLevel; label: string }[] = [
  { value: "entry", label: "Entry (0-2 yr)" },
  { value: "mid", label: "Mid (3-5 yr)" },
  { value: "senior", label: "Senior (6+ yr)" },
];

const DEMAND_STYLE: Record<SalaryField["demand"], { label: string; variant: "emerald" | "saffron" | "muted" }> = {
  high: { label: "High", variant: "emerald" },
  medium: { label: "Medium", variant: "saffron" },
  low: { label: "Low", variant: "muted" },
};

const STABILITY_STYLE: Record<SalaryField["stability"], { label: string; variant: "emerald" | "saffron" | "muted" }> = {
  high: { label: "High", variant: "emerald" },
  medium: { label: "Medium", variant: "saffron" },
  low: { label: "Low", variant: "muted" },
};

function fmtRange(min: number, max: number): string {
  return `${min / 1000}k – ${max / 1000}k`;
}

function StatCard({ label, field, detail }: { label: string; field: SalaryField; detail: string }) {
  return (
    <div className="card-glass rounded-2xl p-5 text-center">
      <p className="text-[10px] uppercase tracking-widest text-faint">{label}</p>
      <p className="mt-2 text-2xl">{field.emoji}</p>
      <p className="mt-1 text-base font-bold text-ink">{field.name}</p>
      <p className="mt-1 font-mono text-xs text-saffron">{detail}</p>
    </div>
  );
}

export function SalaryExplorer() {
  const [level, setLevel] = React.useState<SalaryLevel>("entry");
  const [sortKey, setSortKey] = React.useState<"name" | "salary" | "growth">("salary");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");

  const topPay = highestPayingField(data.fields);
  const topGrowth = fastestGrowingField(data.fields);
  const topStable = mostStableField(data.fields);

  const toggleSort = (key: "name" | "salary" | "growth") => {
    if (sortKey === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  const rows = React.useMemo(() => {
    if (sortKey === "salary") return sortSalaryFields(data.fields, level, sortDir);
    const factor = sortDir === "desc" ? -1 : 1;
    return [...data.fields].sort((a, b) =>
      sortKey === "growth" ? (a.growth - b.growth) * factor : a.name.localeCompare(b.name) * factor
    );
  }, [level, sortKey, sortDir]);

  const SortHeader = ({
    label,
    k,
  }: {
    label: string;
    k: "name" | "salary" | "growth";
  }) => (
    <button
      type="button"
      onClick={() => toggleSort(k)}
      className="inline-flex items-center gap-1 hover:text-ink"
    >
      {label}
      <ArrowUpDown className={cn("h-3 w-3", sortKey === k ? "text-saffron" : "text-faint")} />
    </button>
  );

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Highest paying"
          field={topPay}
          detail={`${fmtRange(topPay.salaries.senior[0], topPay.salaries.senior[1])} senior`}
        />
        <StatCard label="Fastest growing" field={topGrowth} detail={`+${topGrowth.growth}%/yr`} />
        <StatCard label="Most stable" field={topStable} detail="high stability + high demand" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {LEVELS.map((l) => (
          <button
            key={l.value}
            type="button"
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

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-widest text-faint">
              <th className="py-3 pr-4">
                <SortHeader label="Field" k="name" />
              </th>
              <th className="py-3 pr-4">
                <SortHeader label={`Salary (PKR/mo)`} k="salary" />
              </th>
              <th className="py-3 pr-4">Demand</th>
              <th className="py-3 pr-4">
                <SortHeader label="Growth" k="growth" />
              </th>
              <th className="py-3">Stability</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => {
              const [min, max] = f.salaries[level];
              const demand = DEMAND_STYLE[f.demand];
              const stability = STABILITY_STYLE[f.stability];
              return (
                <tr key={f.id} className="border-b border-line/60">
                  <td className="py-3 pr-4">
                    <span className="mr-2">{f.emoji}</span>
                    <span className="font-medium text-ink">{f.name}</span>
                  </td>
                  <td className="py-3 pr-4 font-mono text-saffron">
                    {fmtRange(min, max)}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={demand.variant}>{demand.label}</Badge>
                  </td>
                  <td className="py-3 pr-4 font-mono text-emerald">+{f.growth}%</td>
                  <td className="py-3">
                    <Badge variant={stability.variant}>{stability.label}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
        Freelancing vs Government vs Private
      </h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {data.careerPaths.map((c) => (
          <div key={c.id} className="card-glass flex flex-col rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{c.emoji}</span>
              <h3 className="text-lg font-bold text-ink">{c.name}</h3>
            </div>
            <p className="mt-2 font-mono text-xs text-saffron">{c.incomeRange}</p>
            <ul className="mt-4 flex-1 space-y-1.5">
              {c.pros.map((p) => (
                <li key={p} className="flex gap-2 text-xs text-muted">
                  <span className="text-emerald">✓</span>
                  {p}
                </li>
              ))}
              {c.cons.map((x) => (
                <li key={x} className="flex gap-2 text-xs text-muted">
                  <span className="text-danger">✗</span>
                  {x}
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-line pt-3 text-xs text-faint">
              <span className="font-semibold text-muted">Best for:</span> {c.bestFor}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-faint">{data.disclaimer}</p>
      <p className="mt-1 text-xs text-faint">
        Compiled {data.dataYear}. Sources: {data.fields.flatMap((f) => f.sources).filter((v, i, a) => a.indexOf(v) === i).join(" · ")}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create the page route**

Create `src/app/(app)/pakistan/salary-insights/page.tsx`:

```tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { SalaryExplorer } from "@/components/pakistan/salary-explorer";

export default function PakistanSalaryPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="animate-reveal flex items-center gap-2">
        <Badge variant="saffron">Pakistan</Badge>
        <span className="font-mono text-xs text-faint">education at home</span>
      </div>
      <h1
        className="animate-reveal mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl"
        style={{ animationDelay: "60ms" }}
      >
        What a degree pays in Pakistan.
      </h1>
      <p
        className="animate-reveal mt-2 max-w-xl text-muted"
        style={{ animationDelay: "120ms" }}
      >
        Real salary ranges by field and experience level — plus the honest trade-off between
        freelancing, government, and private careers. Every figure links back to its source.
      </p>
      <div className="animate-reveal mt-8" style={{ animationDelay: "180ms" }}>
        <SalaryExplorer />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Lint + type check**

Run: `npx eslint src/components/pakistan/salary-explorer.tsx "src/app/(app)/pakistan/salary-insights/page.tsx"`
Expected: no errors.

Run: `npx tsc --noEmit`
Expected: exit 0.

---

### Task 11: Full verification (tests, build, lint, browser)

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all test files pass — the 39 pre-existing tests (aggregates, demand, recommend, quiz, merge-profile) plus the 21 filter tests plus 11 + 8 + 11 + 10 data-schema tests. Total expected: 100 tests passing.

- [ ] **Step 2: Run lint over the project**

Run: `npm run lint`
Expected: no errors, no warnings in new files.

- [ ] **Step 3: Run the production build**

Run: `npm run build`
Expected: build completes; new routes appear in the output: `/pakistan/universities`, `/pakistan/entry-tests`, `/pakistan/scholarships`, `/pakistan/salary-insights` (plus all 18 pre-existing routes). No type errors.

- [ ] **Step 4: Browser verification**

Start `npm run dev` in a background terminal, then verify with a browser agent on `http://localhost:3000`:

1. `/dashboard` — sidebar shows two labeled sections ("Education in Pakistan" with Universities/Entry Tests/Scholarships/Salary & Scope/Merit/Career/Trends; "Education Abroad" with Money/Convince/Ustaad), Dashboard/Profile at top, Rahbar button at bottom. No horizontal overflow; sidebar scrolls if needed.
2. `/pakistan/universities` — 12 accordion cards render; clicking a card expands it (intro, numbered admission steps, fee table, ranking badge, best-fields, official links); search filters; stream and type chips filter; expanding a second card collapses the first.
3. `/pakistan/scholarships` — cards grouped under category headings; tabs filter groups; search filters; every card has an official link.
4. `/pakistan/entry-tests` — stream chips filter; cards expand to show pattern table, syllabus, how-to-apply, official sources.
5. `/pakistan/salary-insights` — 3 stat cards, experience tabs switch salary column, table sorts on header click, 3 career-path comparison cards render pros/cons.
6. Responsive check at ~375px width: no horizontal page overflow; tables scroll within their containers.
7. Console: no React hydration errors, no 404s for new routes.

Fix any issues found and re-verify.

- [ ] **Step 5: Report**

Report final state: test count, build result, lint result, browser verification result. Changes remain uncommitted in the working tree (user's workflow — no commits).

---

## Self-Review Notes (completed by planner)

- **Spec coverage:** sidebar sections ✅ (Task 2), 4 data files with sourceUrls ✅ (Tasks 3-6), 4 interactive pages ✅ (Tasks 7-10), filter/sort helpers ✅ (Task 1), stream-aware default filter ✅ (Tasks 7, 9 use `profile.stream`), schema tests ✅ (Tasks 3-6), career-path comparison ✅ (Task 10), disclaimer + sources ✅ (Task 10 footer).
- **Type consistency:** `PakistanUniversity`, `PakistanScholarship`, `SalaryField`, `CareerPath`, `EntryTest`, `ScholarshipCategory`, `SalaryLevel` defined once in Task 1 and reused verbatim across tasks; helper names (`filterUniversities`, `filterEntryTests`, `filterScholarships`, `sortSalaryFields`, `highestPayingField`, `fastestGrowingField`, `mostStableField`) match between Task 1, its tests, and page components.
- **Test-count sanity:** Task 1 has 21 tests (filterUniversities 6, filterEntryTests 2, filterScholarships 4, sortSalaryFields 4, stat helpers 5 — one decoy test added during review hardening). Task 5 has 11 (one stability-high precondition test added during review hardening). Verification steps list counts per file; the total in Task 11 is a target, not an assertion — implementers should report the actual number.
