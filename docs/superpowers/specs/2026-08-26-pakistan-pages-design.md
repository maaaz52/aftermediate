# Education in Pakistan Pages — Design Spec

**Date:** 2026-08-26
**Status:** Approved

## Goal

Add an "Education in Pakistan" content section to the aftermediate app: restructure the sidebar into two labeled categories (Pakistan / Abroad) and build 4 interactive, data-backed pages under `/pakistan/*` — Universities, Entry Tests Hub, Local Scholarships, and Local Scope & Salary Insights.

**Core principle (from user):** make education exposure easily accessible to every Pakistani student who has no idea what to do after matric. Never overwhelm, never complicate — every page must leave the student with a clear picture. No blog-like walls of text; everything is cards, tables, filters, and scannable blocks.

## Decisions Locked In (brainstorming)

1. **Sidebar:** Option A — Dashboard & Profile stay at top as app shell; two labeled sections below ("Education in Pakistan" / "Education Abroad"); existing pages distributed into sections.
2. **Routes:** Option A — `/pakistan/*` prefix for all new pages (mirrors sidebar structure, leaves room for future `/abroad/*` pages).
3. **Data approach:** Static curated JSON in `src/data/` + interactive "use client" page components (matches existing codebase pattern; no backend).
4. **Universities page:** Option B — single page with expandable accordion cards (no per-university detail routes).
5. **Salary page:** Option C — hybrid: key-stat cards + experience tabs + sortable table + freelancing vs govt comparison.
6. **All pages interactive** — search, filters, tabs, sortable tables, expandable cards. This is a global requirement, not just for the salary page.
7. **Data sourcing:** every data entry researched from official websites with `sourceUrls` and a `dataYear`. Salary figures are labeled estimates compiled from public salary-report sources.

## Sidebar Spec

File: `src/components/sidebar.tsx`

Replace the flat `links` array with three groups:

```
Core (no label, top):
  Dashboard → /dashboard (Compass icon)
  Profile → /profile (User icon)

"Education in Pakistan" (section label):
  Universities → /pakistan/universities (new)
  Entry Tests → /pakistan/entry-tests (new)
  Scholarships → /pakistan/scholarships (new)
  Salary & Scope → /pakistan/salary-insights (new)
  Merit → /merit (existing)
  Career → /career (existing)
  Trends → /trends (existing)

"Education Abroad" (section label):
  Money → /money (existing)
  Convince → /convince (existing)
  Ustaad → /study (existing)

"Talk to Rahbar" button stays pinned at the bottom (existing behavior).
```

Visual: section labels use the existing `font-mono text-[10px] uppercase tracking-widest text-faint` style (same as current "Menu" label). Active-link styling unchanged (saffron bg + saffron text). Icons for new links: Universities → `GraduationCap`, Entry Tests → `ClipboardList`, Scholarships → `Award`, Salary & Scope → `BarChart3` (all from lucide-react, already a dependency).

## Routes Spec

New folder: `src/app/(app)/pakistan/`

- `page.tsx` files:
  - `src/app/(app)/pakistan/universities/page.tsx`
  - `src/app/(app)/pakistan/entry-tests/page.tsx`
  - `src/app/(app)/pakistan/scholarships/page.tsx`
  - `src/app/(app)/pakistan/salary-insights/page.tsx`
- All pages inherit the `(app)` layout (sidebar + topnav + RahbarDrawer). No new layout files.
- No changes to `src/proxy.ts` (user-owned file; matcher already covers all routes generically).
- Pages may be "use client" (needed for interactivity + `useStudent` stream awareness).

## Data Layer Spec

All new files in `src/data/`. All entries carry `sourceUrls: string[]` (official links) and the file object carries `dataYear: number` (year data was compiled). Research happens during implementation via WebSearch/WebFetch against official sites (HEC, PMC, NTS, university admission pages, provincial endowment funds, salary report aggregators). No fabricated links — if a link cannot be verified, the entry is omitted.

### 1. `src/data/pakistan-universities.json`

Top-level shape: `{ "dataYear": 2026, "universities": [...] }`

Exactly 12 universities: NUST, FAST-NUCES, LUMS, GIKI, IBA Karachi, COMSATS, UET Lahore, NED, QAU, PIEAS, Punjab University, AKU.

```ts
interface PakistanUniversity {
  id: string;            // "nust", "lums", ...
  name: string;          // full name
  short: string;         // "NUST"
  city: string;
  type: "public" | "private";
  streams: Stream[];     // subset of pre-medical | pre-engineering | ics | icom | alevel
  ranking: {
    label: string;       // "QS World #334" | "HEC #2" | "Unranked internationally"
    sourceUrl: string;
  };
  entryTest: string;     // "NET" | "ECAT" | "SAT/LCAT" | ...
  intro: string;         // 2-3 sentence introduction (plain, no fluff)
  admissionSteps: { title: string; detail: string }[]; // numbered steps, 4-6 items
  fees: {
    summary: string;     // "~PKR 175k/year (BS programs)"
    programFees?: { program: string; perYear: number; note?: string }[];
    sourceUrl: string;
  };
  bestFields: { field: string; why: string }[]; // 3-4 fields with one-line reasons
  sourceUrls: string[];  // official admission page + fee page
}
```

### 2. `src/data/pakistan-scholarships.json`

Top-level shape: `{ "dataYear": 2026, "scholarships": [...] }`

Categories (enum): `"hec" | "need-based" | "merit-based" | "university-specific" | "provincial"`.

Target scope (~24-30 scholarships):
- **HEC general:** Ehsaas Undergraduate Scholarship, HEC Need-Based Scholarship, HEC Merit Scholarship (when active).
- **Need-based:** Pakistan Bait-ul-Mal, Ehsaas/PEEF need streams, university financial-aid programs flagged as need-based.
- **Merit-based:** PEEF Merit, provincial education endowments merit streams, PIEAS/NUST merit awards.
- **University-specific:** LUMS NOP, IBA financial aid + merit, GIKI scholarships, NUST need-based + merit, FAST scholarships, COMSATS scholarships, AKU financial assistance, PU need-based.
- **Provincial:** PEEF (Punjab), Sindh Education Endowment, KPK Ehsaas/education endowment, Balochistan education endowment, AJK/Gilgit-Baltistan programs.

```ts
interface PakistanScholarship {
  id: string;
  name: string;
  category: "hec" | "need-based" | "merit-based" | "university-specific" | "provincial";
  funder: string;
  level: string;            // "Undergraduate" | "All levels" | ...
  coverage: string;         // "Full tuition + stipend" etc.
  eligibility: string[];    // bullet criteria, 2-5 items
  deadline: string;         // "Annually Feb–May" | "Cycle-based" — never fake exact dates
  sourceUrl: string;        // official page (single most relevant)
  note?: string;            // e.g. "For FSc students with 60%+ marks"
}
```

### 3. `src/data/salary-fields.json`

Top-level shape: `{ "dataYear": 2026, "disclaimer": "Salary ranges are estimates compiled from public sources...", "fields": [...], "careerPaths": {...} }`

~12 fields covering the majors used across the app: Software Engineering, Data Science, Medicine, Dentistry, Civil Engineering, Electrical Engineering, Mechanical Engineering, Accounting & Finance, Business & Marketing, Law, Architecture, Education.

```ts
interface SalaryField {
  id: string;
  name: string;
  emoji: string;
  stream: Stream[];            // which streams lead here
  salaries: {                  // PKR/month, entry = 0-2 yr, mid = 3-5, senior = 6+
    entry: [number, number];
    mid: [number, number];
    senior: [number, number];
  };
  demand: "high" | "medium" | "low";
  growth: number;              // % per year (approximate, sourced)
  stability: "high" | "medium" | "low";
  notes?: string;              // one-line context e.g. "Govt jobs dominate entry level"
  sources: string[];           // public salary-report sources
}
```

`careerPaths` comparison block (freelancing vs govt vs private):

```ts
interface CareerPath {
  id: "freelancing" | "government" | "private";
  name: string;
  emoji: string;
  pros: string[];
  cons: string[];
  incomeRange: string;     // "USD 300-3000+/month (varies wildly)"
  bestFor: string;         // one-line guidance
}
```

### 4. `src/data/entry-tests.json`

Top-level shape: `{ "dataYear": 2026, "tests": [...] }`

Cover every test a 12th-passed student can take (target ~12): MDCAT (PMC), ECAT (UET), NET (NUST), FUNGAT/NU entry test (FAST), SAT + LCAT (LUMS), IBA entry test, GIKI entry test, COMSATS NTS/NAT-based test, NTS NAT (general), PIEAS entry test, AKU entry test, HEC Law Admission Test (LAT).

```ts
interface EntryTest {
  id: string;                 // "mdcat", "net", ...
  name: string;               // "MDCAT — Medical & Dental College Admission Test"
  short: string;              // "MDCAT"
  streams: Stream[];          // which streams this test is for
  conductingBody: string;     // "PMC" | "NUST" | "UET" | "NTS" | ...
  acceptedBy: string[];       // universities accepting this test
  fee: string;                // "PKR 6,000 (2024 cycle)" — with year, never fake
  frequency: string;          // "Once a year (Nov)" | "Multiple cycles"
  validity: string;           // "1 year" | "2 years"
  pattern: { section: string; questions?: number; marks?: number; time?: string }[];
  syllabus: { subject: string; topics: string[] }[];   // subject-wise topics
  howToApply: string[];       // numbered steps, 3-5 items
  sourceUrls: string[];       // official PMC/NTS/university pages
  note?: string;
}
```

## Page Specs

Shared conventions for all 4 pages:
- Header block: title + one-line subtitle + (where relevant) a small "Sources" footer linking official pages.
- Stream-aware default filter: read `profile.stream` from `useStudent()`; pre-select that stream's filter if known, else "All". User can always switch.
- Responsive: cards grid collapses 3→2→1 columns; tables get horizontal scroll below `sm`.
- Entrance animation: reuse `animate-reveal` + staggered delays (same pattern as dashboard).
- All interactive state is local React state — no new API routes, no persistence.

### 1. Universities (`/pakistan/universities`)

Components (in `src/components/pakistan/`):
- `universities-explorer.tsx` — the interactive client component: search input, stream filter chips, type filter (All/Public/Private), accordion card list.
- Card (collapsed): initial-letter avatar, short name, city · type, ranking label, entry test chip, "best for" summary line.
- Card (expanded): intro paragraph → numbered admission steps → fee summary + optional program-fee mini-table → ranking badge with source → best-field chips with one-line "why" → official link button(s).
- Exactly one card expanded at a time (accordion).
- Search matches name, short, city, bestFields.

### 2. Entry Tests Hub (`/pakistan/entry-tests`)

- `entry-tests-explorer.tsx` — stream filter chips (Pre-Medical / Pre-Engineering / ICS / I.Com / A-Levels / All) + expandable test cards.
- Card (collapsed): short name, conducting body, streams badge, "accepted by N universities".
- Card (expanded): pattern table (section / questions / marks / time), subject-wise syllabus lists, fee, frequency, validity, how-to-apply steps, official source links.

### 3. Local Scholarships (`/pakistan/scholarships`)

- `scholarships-explorer.tsx` — category tabs (All / HEC / Need-based / Merit-based / University-specific / Provincial) + search + optional level filter.
- Scholarships grouped under category headings (grouped layout, per user requirement); tabs filter which groups render.
- Card: name, funder, coverage badge (emerald), eligibility bullets, deadline chip, official link button.

### 4. Salary & Scope (`/pakistan/salary-insights`)

- `salary-explorer.tsx` — hybrid layout:
  1. Three key-stat cards computed from data: highest-paying field (senior max), fastest-growing field (max growth), most stable (stability=high + demand=high, first by senior salary).
  2. Experience tabs (Entry / Mid / Senior) switching the salary column in the table.
  3. Sortable table: Field | Salary (active tab) | Demand (badge + bar) | Growth | Stability. Sort by clicking column headers; default sort by salary desc.
  4. "Freelancing vs Government vs Private" comparison cards using `careerPaths` (pros/cons lists, income range, best-for line).
  5. Disclaimer footnote: salary ranges are estimates; links to sources.

## Testing Spec

New test files (vitest, matching existing style — pure data/schema tests, no DOM):

- `src/data/pakistan-universities.test.ts` — 12 universities; unique ids; every entry has non-empty name/short/city/intro/sourceUrls; admissionSteps 3-6 items; fees.summary non-empty; bestFields 3-4 items; ranking.label + sourceUrl non-empty; type/streams enums valid; every `sourceUrls` entry starts with `https://`.
- `src/data/pakistan-scholarships.test.ts` — unique ids; category in enum; coverage/eligibility/deadline/sourceUrl non-empty; ≥20 scholarships; at least one scholarship in each of the 5 categories; https:// check on sourceUrl.
- `src/data/salary-fields.test.ts` — ≥10 fields; salaries entry ≤ mid ≤ senior monotonic non-decreasing mins and maxs; demand/growth/stability enums valid; growth within -10..+50; careerPaths has exactly freelancing/government/private with non-empty pros/cons; https:// check on sources.
- `src/data/entry-tests.test.ts` — unique ids; ≥12 tests; streams enums valid; conductingBody non-empty; pattern + syllabus arrays non-empty; syllabus topics non-empty; sourceUrls https://; MDCAT/ECAT/NET/LCAT/LAT ids present (core tests must exist).
- `src/lib/pakistan-filters.test.ts` — pure helper tests for the shared filter/sort functions extracted into `src/lib/pakistan-filters.ts` (filter by stream/type/category/text, sort by salary/name/demand) so page components stay thin.

## Edge Cases

- No profile / unknown stream → filters default to "All", nothing hidden.
- Data file with an entry missing optional fields (programFees, note, notes) → UI must render gracefully.
- Mobile: accordion cards full-width; tables scroll horizontally; tabs wrap.
- The `(app)` layout redirects unauthenticated/quiz-incomplete users to `/onboard` — new pages live under it, so no auth handling needed in the pages themselves.

## Out of Scope (next phase)

- Education Abroad section pages (user will specify later).
- Changes to `src/proxy.ts`, dashboard, or existing Merit/Career/Trends/Money/Convince/Ustaad pages (only their sidebar placement changes).
- Live-updating data (snapshot data is acceptable; `dataYear` marks freshness).
