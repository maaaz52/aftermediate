# Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/dashboard` into an organized Modern-SaaS-style dashboard: profile summary, coarse/fine aggregate cards, "most valuable countries" predictor (rule-based + AI insight), study-abroad summary, compact best-fit fields, and a slim Rahbar banner.

**Architecture:** Pure logic (aggregate standing, field ranking) lives in `src/lib/` with vitest coverage. Static country-demand data lives in `src/data/demand.json` + a new `/api/demand` route that augments it with Gemini one-liners (cached 7 days in localStorage). UI is composed from small client components under `src/components/dashboard/`, styled with existing theme tokens (`saffron`, `emerald`, `amber`, `surface`, `line`) using the SaaS card pattern (`card-glass` + rounded-2xl + soft shadow). The dashboard page is a thin composition layer with staggered entrance animations.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS 4 (v4 gradient syntax `bg-linear-to-r`), lucide-react, Vercel AI SDK + Google Gemini, vitest (already present in the repo, run via `npx vitest run`).

**Design spec:** `docs/superpowers/specs/2026-08-26-dashboard-redesign-design.md`

**Note on commits:** No `git commit` steps are included — this repo's workflow defers commits to explicit user request. If commits are wanted, run them after each task's verification passes.

---

### Task 1: `overallStanding` aggregate (coarse) + tests

**Files:**
- Modify: `src/lib/aggregates.ts` (append at end)
- Test: `src/lib/aggregates.test.ts` (append)

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/aggregates.test.ts`:

```ts
import { overallStanding } from "@/lib/aggregates";

describe("overallStanding", () => {
  it("weights FSc 60% and Matric 40%", () => {
    const s = overallStanding({
      matricObtained: 900, matricTotal: 1100,
      fscObtained: 880, fscTotal: 1100,
    });
    // FSc 80% · Matric 81.82% → 0.6*80 + 0.4*81.82
    expect(s.value).toBeCloseTo(0.6 * 80 + 0.4 * (900 / 1100) * 100, 4);
  });

  it("labels the percentile band correctly", () => {
    const perfect = overallStanding({
      matricObtained: 1100, matricTotal: 1100,
      fscObtained: 1100, fscTotal: 1100,
    });
    expect(perfect.label).toBe("top 1%");

    const mid = overallStanding({
      matricObtained: 500, matricTotal: 1100,
      fscObtained: 550, fscTotal: 1100,
    });
    // value ≈ 48.2 → below the 60% cutoff → top 80%
    expect(mid.label).toBe("top 80%");
  });

  it("returns 0 when totals are missing", () => {
    const s = overallStanding({
      matricObtained: 0, matricTotal: 0,
      fscObtained: 0, fscTotal: 0,
    });
    expect(s.value).toBe(0);
  });
});
```

Note: the existing test file imports `import { describe, expect, it } from "vitest";` once at the top — do NOT add a second import line; just add `import { overallStanding } from "@/lib/aggregates";` next to the existing aggregates import (merge into the existing import statement at line 2).

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /home/themz/aftermediate && npx vitest run src/lib/aggregates.test.ts`
Expected: FAIL — `overallStanding is not a function` / type error.

- [ ] **Step 3: Implement `overallStanding`**

Append to `src/lib/aggregates.ts`:

```ts
export interface Standing {
  value: number; // 0-100 weighted score
  percentile: number; // approximate national percentile rank
  label: string; // "top 12%" style band
}

/**
 * Coarse "overall standing": FSc 60% + Matric 40%, marks only.
 * Entry test intentionally ignored — this is the pre-test ballpark.
 */
export function overallStanding(m: Marks): Standing {
  const fscPct = pct(m.fscObtained, m.fscTotal);
  const matPct = pct(m.matricObtained, m.matricTotal);
  const value = fscPct * 0.6 + matPct * 0.4;

  if (value >= 95) return { value, percentile: 99, label: "top 1%" };
  if (value >= 90) return { value, percentile: 95, label: "top 5%" };
  if (value >= 85) return { value, percentile: 90, label: "top 10%" };
  if (value >= 80) return { value, percentile: 80, label: "top 20%" };
  if (value >= 70) return { value, percentile: 60, label: "top 40%" };
  if (value >= 60) return { value, percentile: 40, label: "top 60%" };
  return { value, percentile: 20, label: "top 80%" };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /home/themz/aftermediate && npx vitest run src/lib/aggregates.test.ts`
Expected: PASS (all 5 tests across both describes).

---

### Task 2: `DemandCountry` type + `demand.json` data + `STREAM_LABEL`

**Files:**
- Modify: `src/lib/types.ts` (append `DemandCountry` interface)
- Create: `src/data/demand.json`
- Modify: `src/lib/data.ts` (append `STREAM_LABEL` export)
- Test: `src/data/demand.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `src/data/demand.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import demand from "@/data/demand.json";
import type { DemandCountry, Stream } from "@/lib/types";

const streams: Stream[] = ["pre-medical", "pre-engineering", "ics", "icom", "alevel"];

describe("demand data", () => {
  it("covers every stream with exactly 3 countries", () => {
    for (const s of streams) {
      const list = (demand as Record<Stream, DemandCountry[]>)[s];
      expect(list, `missing stream ${s}`).toBeDefined();
      expect(list).toHaveLength(3);
    }
  });

  it("scores are 0-100 and every country has a flag and reason", () => {
    for (const s of streams) {
      for (const c of (demand as Record<Stream, DemandCountry[]>)[s]) {
        expect(c.score).toBeGreaterThanOrEqual(0);
        expect(c.score).toBeLessThanOrEqual(100);
        expect(c.flag).not.toBe("");
        expect(c.reason.length).toBeGreaterThan(10);
        expect(c.focus).not.toBe("");
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/themz/aftermediate && npx vitest run src/data/demand.test.ts`
Expected: FAIL — cannot find module `@/data/demand.json`.

- [ ] **Step 3: Add the `DemandCountry` type**

Append to `src/lib/types.ts`:

```ts
export interface DemandCountry {
  country: string;
  flag: string;
  score: number; // 0-100, mix of job demand + post-study work rights
  reason: string; // static one-line insight (fallback when AI unavailable)
  focus: string; // in-demand specializations, e.g. "Mechanical / Electrical"
}
```

- [ ] **Step 4: Create `src/data/demand.json`**

```json
{
  "pre-engineering": [
    { "country": "Germany", "flag": "🇩🇪", "score": 94, "reason": "EU Blue Card pathway and a chronic engineer shortage make hiring fast and visa-friendly.", "focus": "Mechanical / Electrical" },
    { "country": "Canada", "flag": "🇨🇦", "score": 88, "reason": "Express Entry tech draws plus a 3-year post-study work permit for engineering grads.", "focus": "Software / Civil" },
    { "country": "UAE", "flag": "🇦🇪", "score": 76, "reason": "Tax-free income with a construction and infrastructure boom, close to home.", "focus": "Civil / Electrical" }
  ],
  "pre-medical": [
    { "country": "Germany", "flag": "🇩🇪", "score": 90, "reason": "Formal physician-recognition pathway with an ageing population that needs doctors.", "focus": "General Medicine" },
    { "country": "United Kingdom", "flag": "🇬🇧", "score": 85, "reason": "NHS has a long-standing doctor shortage and a structured PLAB registration route.", "focus": "General Practice" },
    { "country": "Australia", "flag": "🇦🇺", "score": 82, "reason": "AHPRA pathway with regional demand and 2-4 years of post-study work rights.", "focus": "GP / Anaesthesia" }
  ],
  "ics": [
    { "country": "Germany", "flag": "🇩🇪", "score": 92, "reason": "IT specialist visa with 130k+ open tech roles; English-friendly for developers.", "focus": "Software Development" },
    { "country": "Canada", "flag": "🇨🇦", "score": 90, "reason": "Express Entry tech draws and a 3-year PGWP for CS and IT graduates.", "focus": "Software / Data" },
    { "country": "United States", "flag": "🇺🇸", "score": 84, "reason": "STEM OPT extends work permission to 3 years for computing graduates.", "focus": "Software / Data" }
  ],
  "icom": [
    { "country": "UAE", "flag": "🇦🇪", "score": 88, "reason": "A finance and accounting hub with tax-free salaries and strong ACCA demand.", "focus": "Accounting / Finance" },
    { "country": "United Kingdom", "flag": "🇬🇧", "score": 80, "reason": "Graduate Route gives 2 years to find work after a UK business degree.", "focus": "Finance / Management" },
    { "country": "Australia", "flag": "🇦🇺", "score": 78, "reason": "2-4 year post-study work with steady demand for accounting professionals.", "focus": "Accounting" }
  ],
  "alevel": [
    { "country": "United Kingdom", "flag": "🇬🇧", "score": 89, "reason": "A-Levels map directly to UK university entry, plus the 2-year Graduate Route.", "focus": "Any — degree-led" },
    { "country": "Canada", "flag": "🇨🇦", "score": 87, "reason": "PGWP after any accredited degree, with Express Entry as a clear PR path.", "focus": "Any — degree-led" },
    { "country": "Australia", "flag": "🇦🇺", "score": 85, "reason": "2-4 year post-study work rights with strong university partnerships.", "focus": "Any — degree-led" }
  ]
}
```

- [ ] **Step 5: Add `STREAM_LABEL` to `src/lib/data.ts`**

First add `Stream` to the existing type-only import at the top of `data.ts` (lines 1-8 currently import `AbroadDestination, Course, Major, RealityCheck, Scholarship, University` — `Stream` is NOT yet imported, the `STREAM_LABEL` record will not compile without it):

```ts
import type {
  AbroadDestination,
  Course,
  Major,
  RealityCheck,
  Scholarship,
  Stream,
  University,
} from "./types";
```

Then append to `src/lib/data.ts` (after the `data` export):

```ts
export const STREAM_LABEL: Record<Stream, string> = {
  "pre-medical": "FSc Pre-Medical",
  "pre-engineering": "FSc Pre-Engineering",
  ics: "ICS",
  icom: "I.Com",
  alevel: "A-Levels",
};
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd /home/themz/aftermediate && npx vitest run src/data/demand.test.ts`
Expected: PASS (2 tests).

---

### Task 3: `bestFields` ranking + tests

**Files:**
- Create: `src/lib/recommend.ts`
- Test: `src/lib/recommend.test.ts` (create)

- [ ] **Step 1: Write the failing tests**

Create `src/lib/recommend.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { bestFields } from "@/lib/recommend";
import type { Major } from "@/lib/types";

function major(id: string, field: string, demand: Major["demand"], high: number): Major {
  return {
    id, name: id, field, emoji: "", tagline: "", streams: [], demand,
    salaryRange: { low: 0, high, currency: "PKR/mo", note: "" },
    whyNow: { value: "", year: "", source: "", source_url: "" },
    description: "", skillTree: [], dayInLife: [], courses: [], universities: [], realityCheck: "",
  };
}

describe("bestFields", () => {
  it("ranks interest-matched majors first", () => {
    const majors = [
      major("accounting", "Business", "low", 100),
      major("cs", "Technology", "high", 600),
      major("electrical", "Engineering", "medium", 350),
    ];
    const out = bestFields(majors, ["Technology & Coding"], 5);
    expect(out[0].id).toBe("cs");
    expect(out).toHaveLength(3);
  });

  it("breaks ties by salary when interests are empty", () => {
    const majors = [
      major("cs", "Technology", "high", 600),
      major("ai", "Technology", "high", 700),
    ];
    const out = bestFields(majors, [], 5);
    expect(out[0].id).toBe("ai");
  });

  it("respects the limit", () => {
    const majors = [
      major("cs", "Technology", "high", 600),
      major("ai", "Technology", "high", 700),
      major("data-science", "Technology", "medium", 600),
    ];
    expect(bestFields(majors, [], 2)).toHaveLength(2);
  });

  it("never returns more majors than given", () => {
    const majors = [major("cs", "Technology", "high", 600)];
    expect(bestFields(majors, [], 5)).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /home/themz/aftermediate && npx vitest run src/lib/recommend.test.ts`
Expected: FAIL — cannot find module `@/lib/recommend`.

- [ ] **Step 3: Implement `bestFields`**

Create `src/lib/recommend.ts`:

```ts
import type { Major } from "@/lib/types";

/** Maps quiz interest labels to major `field` values. */
const INTEREST_FIELDS: Record<string, string[]> = {
  "Medicine & Healthcare": ["Healthcare", "Life Sciences", "HealthTech"],
  "Technology & Coding": ["Technology", "HealthTech", "Finance + Tech"],
  "Engineering & Machines": ["Engineering"],
  "Business & Finance": ["Business", "Finance + Tech"],
  "Data & Numbers": ["Technology", "Finance + Tech"],
  "Research & Science": ["Life Sciences", "Healthcare", "Engineering", "Technology"],
  "Building Things": ["Engineering", "Technology"],
  "Helping People": ["Healthcare", "Business"],
  "Design & Creativity": ["Technology", "Business"],
  "Teaching & Mentoring": ["Healthcare", "Technology", "Business"],
  "Writing & Communication": ["Business", "Finance + Tech"],
  "Leadership": ["Business", "Finance + Tech"],
};

const DEMAND_RANK: Record<Major["demand"], number> = { high: 2, medium: 1, low: 0 };

/**
 * Rank majors for the dashboard's "best-fit fields" strip:
 * 1. interest overlap with the student's quiz interests (2 pts each)
 * 2. demand (high > medium > low)
 * 3. top-end salary as the final tie-breaker
 */
export function bestFields(majors: Major[], interests: string[], limit = 5): Major[] {
  return [...majors]
    .map((m) => {
      const match = interests.filter((i) => INTEREST_FIELDS[i]?.includes(m.field)).length;
      return { m, score: match * 2 + DEMAND_RANK[m.demand] };
    })
    .sort((a, b) => b.score - a.score || b.m.salaryRange.high - a.m.salaryRange.high)
    .slice(0, limit)
    .map(({ m }) => m);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /home/themz/aftermediate && npx vitest run src/lib/recommend.test.ts`
Expected: PASS (4 tests).

---

### Task 4: `/api/demand` route (AI insights)

**Files:**
- Create: `src/app/api/demand/route.ts`

- [ ] **Step 1: Implement the route**

Create `src/app/api/demand/route.ts`:

```ts
import { generateStructured } from "@/lib/ai";
import type { Stream } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `You are a global labor-market analyst for a Pakistani career guidance platform.
For the given student stream, interests and countries, write ONE short insight line (max 14 words) per country explaining why it is a strong destination for THIS student.
Ground it in concrete facts: visa route, skill shortage, salary, post-study work rights.
Return strict JSON only: {"insights":[{"country":"...","insight":"..."}]}. No markdown, no extra text.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const stream = body.stream as Stream;
    const interests = (body.interests ?? []) as string[];
    const countries = (body.countries ?? []) as string[];

    if (!stream || !Array.isArray(countries) || countries.length === 0) {
      return new Response(JSON.stringify({ error: "stream and countries are required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const result = await generateStructured<{ insights: { country: string; insight: string }[] }>(
      `Stream: ${stream}\nInterests: ${interests.join(", ") || "none given"}\nCountries: ${countries.join(", ")}`,
      SYSTEM
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("demand insight error", err);
    return new Response(JSON.stringify({ error: "Failed to generate insights" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
```

- [ ] **Step 2: Verify the route compiles**

Run: `cd /home/themz/aftermediate && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Smoke-test the route with a live request**

Run:
```bash
curl -s -X POST http://localhost:3000/api/demand \
  -H "content-type: application/json" \
  -d '{"stream":"pre-engineering","interests":["Technology & Coding"],"countries":["Germany","Canada","UAE"]}'
```
Expected: `200` with `{"insights":[{"country":"Germany","insight":"..."},...]}` (requires the dev server from Task 6's verification to be running, or restart `npm run dev` first if the route was added while it was up — Next dev picks up new routes automatically).
If the Gemini key is invalid/absent, expect `500 {"error":"Failed to generate insights"}` — the client falls back to static reasons, so this is acceptable.

---

### Task 5: Global card style + dashboard components

**Files:**
- Modify: `src/app/globals.css` (append `.card-glass`)
- Create: `src/components/dashboard/profile-summary.tsx`
- Create: `src/components/dashboard/coarse-aggregate.tsx`
- Create: `src/components/dashboard/fine-aggregate.tsx`
- Create: `src/components/dashboard/valuable-countries.tsx`
- Create: `src/components/dashboard/study-abroad-summary.tsx`
- Create: `src/components/dashboard/best-fields.tsx`
- Create: `src/components/dashboard/rahbar-banner.tsx`

- [ ] **Step 1: Add `.card-glass` to globals.css**

Append to `src/app/globals.css` (after the `.pixel-border` rule):

```css
.card-glass {
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  box-shadow: 0 1px 3px rgba(25, 31, 44, 0.07);
  transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
}
```

(Also fixes the pre-existing `card-glass` references in merit/career pages that were never defined.)

- [ ] **Step 2: Create `profile-summary.tsx`**

```tsx
"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useStudent } from "@/lib/store";
import { STREAM_LABEL } from "@/lib/data";
import { pct } from "@/lib/aggregates";

export function ProfileSummary() {
  const { profile } = useStudent();
  const stream = profile.stream ?? "pre-engineering";
  const q = profile.quiz;
  const fscPct = pct(profile.marks.fscObtained, profile.marks.fscTotal);
  const matPct = pct(profile.marks.matricObtained, profile.marks.matricTotal);
  const initial = (profile.name || "S").trim().charAt(0).toUpperCase();
  const entry = profile.marks.entryTestObtained
    ? `${(q.entryTest ?? "test").toUpperCase()}: ${profile.marks.entryTestObtained}/${profile.marks.entryTestTotal ?? 200}`
    : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
      <div className="card-glass flex items-center gap-4 rounded-2xl p-5">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-linear-to-br from-saffron to-saffron-soft text-lg font-bold text-white">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-ink">{profile.name || "Student"}</p>
          <p className="truncate text-xs text-muted">
            {[q.city, q.province, q.examYear ? `Class of ${q.examYear}` : null].filter(Boolean).join(" · ") || "Location not set"}
          </p>
          <p className="truncate text-xs text-muted">
            {q.budgetMonthly ? `Budget PKR ${Math.round(q.budgetMonthly / 1000)}k/mo` : "Budget not set"}
            {q.canRelocate
              ? ` · ${q.canRelocate === "yes" ? "can relocate" : q.canRelocate === "in-province" ? "in-province only" : "staying home"}`
              : ""}
          </p>
        </div>
      </div>

      <div className="card-glass rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Profile summary</p>
          <Link href="/profile" className="text-xs font-medium text-saffron hover:underline">
            Edit profile →
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="saffron">{STREAM_LABEL[stream]}</Badge>
          {fscPct > 0 && <Badge variant="muted" className="font-mono">FSc {fscPct.toFixed(1)}%</Badge>}
          {matPct > 0 && <Badge variant="muted" className="font-mono">Matric {matPct.toFixed(1)}%</Badge>}
          {entry && <Badge variant="emerald" className="font-mono">{entry}</Badge>}
          {profile.interests.slice(0, 3).map((i) => (
            <Badge key={i} variant="info">{i}</Badge>
          ))}
          {q.needsScholarship === "must" && <Badge variant="danger">Needs scholarship</Badge>}
          {q.needsScholarship === "helpful" && <Badge variant="emerald">Scholarship helps</Badge>}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `coarse-aggregate.tsx`**

```tsx
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CountUp } from "@/components/count-up";
import { overallStanding } from "@/lib/aggregates";
import { useStudent } from "@/lib/store";

export function CoarseAggregate() {
  const { profile } = useStudent();
  if (!profile.marks.fscTotal) return null;
  const standing = overallStanding(profile.marks);

  return (
    <div className="card-glass rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Coarse · Overall standing</p>
        <span className="rounded-full bg-emerald/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald">
          {standing.label}
        </span>
      </div>
      <div className="mt-2 flex items-end gap-1.5">
        <CountUp value={standing.value} decimals={1} className="font-mono text-4xl font-bold text-ink" />
        <span className="mb-1 text-lg font-semibold text-saffron">%</span>
      </div>
      <svg viewBox="0 0 160 28" className="mt-2 h-7 w-full" aria-hidden="true">
        <polyline
          points="0,24 20,21 40,23 60,17 80,19 100,13 120,15 140,9 160,7"
          fill="none" stroke="var(--color-saffron)" strokeWidth="2"
        />
        <polygon
          points="0,24 20,21 40,23 60,17 80,19 100,13 120,15 140,9 160,7 160,28 0,28"
          fill="var(--color-saffron)" opacity="0.07"
        />
      </svg>
      <p className="mt-1 text-xs text-muted">Ballpark from FSc + Matric only — entry test not included.</p>
      <Link href="/merit" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-saffron hover:underline">
        See exact merit <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Create `fine-aggregate.tsx`**

```tsx
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useStudent } from "@/lib/store";
import { nustAggregate, fastAggregate, mdcatAggregate } from "@/lib/aggregates";
import type { AggregateResult } from "@/lib/aggregates";

const BAR_GRADIENTS = [
  "bg-linear-to-r from-saffron to-saffron-soft",
  "bg-linear-to-r from-emerald to-emerald/70",
  "bg-linear-to-r from-amber to-amber/70",
];

function BreakdownRow({
  name, weight, value, gradient, hasTest,
}: {
  name: string;
  weight: number;
  value: number;
  gradient: string;
  hasTest: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{name} · {weight}%</span>
        <span className="font-mono font-semibold text-ink">{hasTest ? value.toFixed(1) : "—"}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full ${gradient} transition-all duration-700`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

export function FineAggregate() {
  const { profile } = useStudent();
  const stream = profile.stream ?? "pre-engineering";
  const marks = profile.marks;
  const hasTest = !!marks.entryTestObtained;

  let results: AggregateResult[] = [];
  if (stream === "pre-medical") results = [mdcatAggregate(marks)];
  else if (stream !== "icom") results = [nustAggregate(marks), fastAggregate(marks)];

  return (
    <div className="card-glass rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Fine · Formula breakdown</p>

      {results.length > 0 ? (
        <>
          <div className="mt-4 space-y-3">
            {results[0].breakdown.map((b, i) => (
              <BreakdownRow
                key={b.component}
                name={b.component}
                weight={b.weight}
                value={b.contribution}
                gradient={BAR_GRADIENTS[i % BAR_GRADIENTS.length]}
                hasTest={hasTest}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
            <span className="text-xs text-muted">{results[0].name} aggregate</span>
            <span className="font-mono text-lg font-bold text-ink">{results[0].value.toFixed(1)}%</span>
          </div>
          {results[1] && (
            <p className="mt-2 text-xs text-muted">
              {results[1].name}: <span className="font-mono font-semibold text-ink">{results[1].value.toFixed(1)}%</span>
            </p>
          )}
        </>
      ) : (
        <p className="mt-3 text-sm text-muted">
          No standard aggregate formula for I.Com — merit depends on each university&apos;s entry test.
        </p>
      )}

      <Link href="/merit" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-saffron hover:underline">
        {hasTest ? "Full breakdown" : "Add your entry test score"} <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
```

- [ ] **Step 5: Create `valuable-countries.tsx`**

```tsx
"use client";

import * as React from "react";
import demand from "@/data/demand.json";
import { useStudent } from "@/lib/store";
import type { DemandCountry, Stream } from "@/lib/types";
import { cn } from "@/lib/utils";

const CACHE_KEY = "aftermediate:demand-insights";
const TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

interface Cached {
  stream: string;
  insights: Record<string, string>;
  fetchedAt: number;
}

function scoreTone(score: number) {
  if (score >= 85) return "text-emerald";
  if (score >= 70) return "text-amber";
  return "text-muted";
}

export function ValuableCountries() {
  const { profile } = useStudent();
  const stream = (profile.stream ?? "pre-engineering") as Stream;
  const countries = (demand as Record<Stream, DemandCountry[]>)[stream] ?? [];
  const [insights, setInsights] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as Cached;
        if (cached.stream === stream && Date.now() - cached.fetchedAt < TTL) {
          setInsights(cached.insights);
          return;
        }
      }
    } catch {
      // corrupt cache — ignore and refetch
    }

    setLoading(true);
    fetch("/api/demand", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        stream,
        interests: profile.interests,
        countries: countries.map((c) => c.country),
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("demand insight failed"))))
      .then((data: { insights: { country: string; insight: string }[] }) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (const i of data.insights) map[i.country] = i.insight;
        setInsights(map);
        try {
          const cached: Cached = { stream, insights: map, fetchedAt: Date.now() };
          localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
        } catch {
          // storage full — insights still work for this session
        }
      })
      .catch(() => {
        // keep static reasons — no user-visible error
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [stream, profile.interests, countries]);

  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Where you&apos;re most valuable</p>
        <span className="rounded-full bg-amber/15 px-2 py-0.5 text-[10px] font-semibold text-amber">✦ AI insight</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {countries.map((c) => (
          <div
            key={c.country}
            className="rounded-xl border border-line bg-surface-2/40 p-3 text-center transition-colors hover:border-saffron/40"
          >
            <div className="text-2xl">{c.flag}</div>
            <p className="mt-1 text-sm font-semibold text-ink">{c.country}</p>
            <p className={cn("font-mono text-xs font-bold", scoreTone(c.score))}>● {c.score} demand</p>
            <p className="mt-1.5 text-[11px] leading-snug text-muted">
              {loading && !insights[c.country] ? (
                <span className="animate-pulse">Thinking…</span>
              ) : (
                insights[c.country] ?? c.reason
              )}
            </p>
            <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-faint">{c.focus}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create `study-abroad-summary.tsx`**

```tsx
"use client";

import Link from "next/link";
import { data } from "@/lib/data";

export function StudyAbroadSummary() {
  const top = data.destinations.slice(0, 3);

  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Study abroad · summary</p>
        <Link href="/money" className="text-xs font-medium text-saffron hover:underline">Money page →</Link>
      </div>
      <div className="mt-3 space-y-1">
        {top.map((d) => (
          <div
            key={d.country}
            className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-2/60"
          >
            <span className="text-lg">{d.flag}</span>
            <span className="w-24 truncate text-sm font-semibold text-ink">{d.country}</span>
            <span className="hidden rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted md:inline">
              {d.approxStudents} students
            </span>
            <span className="ml-auto rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-medium text-emerald">
              {d.postStudyWork}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Create `best-fields.tsx`**

```tsx
"use client";

import Link from "next/link";
import { bestFields } from "@/lib/recommend";
import { getMajorsByStream } from "@/lib/data";
import { useStudent } from "@/lib/store";
import { cn } from "@/lib/utils";

const demandChip: Record<string, string> = {
  high: "bg-emerald/10 text-emerald",
  medium: "bg-amber/10 text-amber",
  low: "bg-surface-2 text-muted",
};

export function BestFields() {
  const { profile } = useStudent();
  const stream = profile.stream ?? "pre-engineering";
  const fields = bestFields(getMajorsByStream(stream), profile.interests, 5);

  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Best-fit fields for your stream</p>
        <Link href="/career" className="text-xs font-medium text-saffron hover:underline">All fields →</Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {fields.map((m) => (
          <Link
            key={m.id}
            href={`/career/${m.id}`}
            className="group rounded-xl border border-line bg-surface-2/40 p-3 text-center transition-all hover:-translate-y-0.5 hover:border-saffron/40 hover:shadow-sm"
          >
            <div className="text-2xl">{m.emoji}</div>
            <p className="mt-1.5 text-xs font-bold leading-tight text-ink group-hover:text-saffron">{m.name}</p>
            <span className={cn("mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", demandChip[m.demand])}>
              {m.demand} demand
            </span>
            <p className="mt-1 font-mono text-[10px] text-muted">
              {Math.round(m.salaryRange.low / 1000)}–{Math.round(m.salaryRange.high / 1000)}k
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Create `rahbar-banner.tsx`**

```tsx
"use client";

import { Sparkles, ArrowRight } from "lucide-react";

export function RahbarBanner() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-linear-to-r from-saffron to-saffron-soft px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2 text-sm font-semibold text-white">
        <Sparkles className="h-4 w-4 shrink-0" /> Stuck? Ask Rahbar — your AI counselor, grounded in Pakistani data.
      </p>
      <button
        onClick={() => document.dispatchEvent(new CustomEvent("open-rahbar"))}
        className="inline-flex items-center gap-1.5 self-start rounded-lg bg-white px-4 py-2 text-xs font-bold text-saffron transition-transform hover:-translate-y-0.5 sm:self-auto"
      >
        Ask Rahbar <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
```

- [ ] **Step 9: Type-check everything so far**

Run: `cd /home/themz/aftermediate && npx tsc --noEmit`
Expected: no errors.

---

### Task 6: Rewrite the dashboard page

**Files:**
- Rewrite: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Replace the page content**

Replace the entire contents of `src/app/(app)/dashboard/page.tsx` with:

```tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { ProfileSummary } from "@/components/dashboard/profile-summary";
import { CoarseAggregate } from "@/components/dashboard/coarse-aggregate";
import { FineAggregate } from "@/components/dashboard/fine-aggregate";
import { ValuableCountries } from "@/components/dashboard/valuable-countries";
import { StudyAbroadSummary } from "@/components/dashboard/study-abroad-summary";
import { BestFields } from "@/components/dashboard/best-fields";
import { RahbarBanner } from "@/components/dashboard/rahbar-banner";
import { useStudent } from "@/lib/store";
import { STREAM_LABEL } from "@/lib/data";
import { pct } from "@/lib/aggregates";

export default function DashboardPage() {
  const { profile } = useStudent();
  const stream = profile.stream ?? "pre-engineering";
  const fscPct = pct(profile.marks.fscObtained, profile.marks.fscTotal);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="animate-reveal">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="saffron">{STREAM_LABEL[stream]}</Badge>
          {fscPct > 0 && <Badge variant="emerald" className="font-mono">{fscPct.toFixed(1)}%</Badge>}
        </div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          Salam{profile.name ? `, ${profile.name}` : ""} 👋
        </h1>
        <p className="mt-1 text-sm text-muted">Here&apos;s where you stand today.</p>
      </div>

      <div className="mt-6 animate-reveal" style={{ animationDelay: "60ms" }}>
        <ProfileSummary />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="animate-reveal" style={{ animationDelay: "120ms" }}>
          <CoarseAggregate />
        </div>
        <div className="animate-reveal" style={{ animationDelay: "180ms" }}>
          <FineAggregate />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="animate-reveal" style={{ animationDelay: "240ms" }}>
          <ValuableCountries />
        </div>
        <div className="animate-reveal" style={{ animationDelay: "300ms" }}>
          <StudyAbroadSummary />
        </div>
      </div>

      <div className="mt-4 animate-reveal" style={{ animationDelay: "360ms" }}>
        <BestFields />
      </div>

      <div className="mt-4 animate-reveal" style={{ animationDelay: "420ms" }}>
        <RahbarBanner />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the page compiles**

Run: `cd /home/themz/aftermediate && npx tsc --noEmit`
Expected: no errors.

---

### Task 7: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run all unit tests**

Run: `cd /home/themz/aftermediate && npx vitest run`
Expected: ALL PASS — aggregates.test.ts (5), demand.test.ts (2), recommend.test.ts (4), plus any pre-existing tests (quiz.test.ts, merge-profile.test.ts).

- [ ] **Step 2: Production build**

Run: `cd /home/themz/aftermediate && npm run build`
Expected: `✓ Compiled successfully` and all routes (`/`, `/dashboard`, `/merit`, `/career`, `/money`, `/convince`, `/trends`, `/onboard`, `/login`) build without errors.

- [ ] **Step 3: Manual browser checklist** (dev server on http://localhost:3000)

Verify against a logged-in profile with completed onboarding (stream = pre-engineering, marks filled, interests selected):

1. `/dashboard` shows: header (Salam + stream badge + FSc%), profile summary card with chips, coarse card with count-up number + "top X%" chip + sparkline, fine card with 3 gradient bars + NUST aggregate + FAST line, valuable-countries with 3 country tiles (static reason first, then AI insight after ~2-5s if API key works), study-abroad with 3 rows, 5 best-fit field tiles, gradient Rahbar banner
2. Click "Ask Rahbar" → drawer opens (existing `open-rahbar` event)
3. Links: coarse/fine → `/merit`; study abroad → `/money`; best fields → `/career/{id}`; edit profile → `/profile`
4. Switch stream to `icom` in profile → fine card shows "No standard aggregate formula for I.Com" text
5. Reload the page → AI insights render instantly from localStorage cache (no "Thinking…" flicker)
6. Narrow the window to <640px → all grids collapse to single column, no overflow
7. `/merit` and `/career` pages still show their cards (now with the newly-defined `.card-glass` shadow) — no visual regression

- [ ] **Step 4: Cleanup**

If the visual-companion server (port 55157) is no longer needed:
```bash
bash /home/themz/.qoder/plugins/cache/qoder-marketplace/superpowers/5.1.0/skills/brainstorming/scripts/stop-server.sh /home/themz/aftermediate/.superpowers/brainstorm/78906-1787751942
```
Add `.superpowers/` to `.gitignore` if the mockups should not be committed.

---

## Self-Review Notes

- **Spec coverage:** Profile summary → Task 5.2 · Coarse (60/40 + percentile) → Task 1 + Task 5.3 · Fine (breakdown bars, icom fallback, entry-test CTA) → Task 5.4 · Most valuable (hybrid, cache, fallback) → Task 2 + Task 4 + Task 5.5 · Study abroad top-3 → Task 5.6 · Best-fit 5 tiles interest-first → Task 3 + Task 5.7 · Slim Rahbar banner → Task 5.8 · Motion (count-up, sparkline, gradient bars, stagger, shimmer, hover lift) → Tasks 5-6 · Drop reality-check/tool cards/big Rahbar → Task 6 rewrite.
- **Type consistency:** `Standing` (Task 1) used in `coarse-aggregate.tsx` (Task 5.3) as `overallStanding(...)` return; `DemandCountry` (Task 2) used in `demand.json` test and `valuable-countries.tsx`; `bestFields(majors, interests, limit)` signature consistent between Task 3 and Task 5.7; `STREAM_LABEL` (Task 2) used in `profile-summary.tsx` + page (Task 6); `AggregateResult` imported from `@/lib/aggregates` matches existing exports.
- **Gradient syntax:** Tailwind v4 — `bg-linear-to-r` / `bg-linear-to-br` with `from-{token}`/`to-{token}` (token-based stops work because `--color-saffron` etc. are defined in `@theme`).
