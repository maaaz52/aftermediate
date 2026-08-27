# Education Abroad Pages — Design Spec

**Date:** 2026-08-27
**Status:** Approved by user (all 5 design sections)
**Follows:** [Pakistan Pages design](2026-08-26-pakistan-pages-design.md) — same architecture, same data-honesty rules

## 1. Overview & Goals

Build five new interactive pages under the "Education Abroad" sidebar section, helping Pakistani students who want to study abroad:

1. **Country Explorer** — compare 13 popular study destinations with a complete per-country guide (process, pathway, fees, documents)
2. **Abroad Scholarships** — 50-70 scholarships available to Pakistani students, grouped by category, HEC programs included and prominent
3. **Test Prep Hub** — every compulsory test for studying abroad (SAT, IELTS, country-specific), with pattern, process, and prep method
4. **Safar AI Assistant** — a dedicated chatbot page for visa/document/money questions, grounded in a user-editable knowledge base
5. **Financial Planner** — interactive first-year cost calculator per country with 4-year projection and savings timeline

**Core principles (unchanged from Pakistan build):**
- Every page interactive — no blog-style walls of text
- Every figure backed by a source; sources shown with the information
- No false information: URL verification mandatory during implementation; conservative hedges where figures vary

## 2. Countries

All 13 (user-selected): Germany, Austria, Italy, South Korea, Turkey, China, Indonesia, USA, UK, Ireland, Lithuania, Netherlands, Hungary.

Region enum for filters: `europe` (Germany, Austria, Italy, UK, Ireland, Lithuania, Netherlands, Hungary), `asia` (South Korea, Turkey, China, Indonesia), `north-america` (USA).

## 3. Routes & Sidebar

| Route | Page | Sidebar label |
|---|---|---|
| `/abroad/countries` | Country Explorer | Countries |
| `/abroad/scholarships` | Abroad Scholarships | Scholarships |
| `/abroad/test-prep` | Test Prep Hub | Test Prep |
| `/abroad/assistant` | Safar AI Assistant | Safar |
| `/abroad/planner` | Financial Planner | Planner |

Sidebar "Education Abroad" section order (8 links): Countries, Scholarships, Test Prep, Safar, Planner, Money, Convince, Ustaad. "Education in Pakistan" section keeps its own "Scholarships" link — the section headings disambiguate.

## 4. Data Layer

Static curated data files + pure helper libs + interactive client components. No new infrastructure, no live APIs.

### 4.1 `src/data/abroad-countries.json`

Top-level: `{ dataYear: 2026, countries: AbroadCountry[] }` — exactly 13 entries.

```ts
// src/lib/types.ts additions
export type AbroadRegion = "europe" | "asia" | "north-america";

export interface AbroadCurrency {
  code: string;        // "EUR"
  name: string;        // "Euro"
  symbol: string;      // "€"
  toPkr: number;       // 1 unit = X PKR
  rateAsOf: string;    // "2026-08"
}

export interface CostRange { min: number; max: number } // PKR

export interface MonthlyLiving {
  rent: number; food: number; transport: number; utilities: number; misc: number; // PKR/month
}

export interface AbroadOneTime {
  applicationFee: number; visaFee: number; insurance: number; flight: number; // PKR
}

export interface AbroadCountry {
  id: string;                // "germany"
  name: string;              // "Germany"
  flag: string;              // "🇩🇪"
  region: AbroadRegion;
  intro: string;             // 2-3 sentences: profile overview
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
```

Costs live ONLY here — the Country Explorer fee section and the Financial Planner both read this file (single source of truth).

### 4.2 `src/data/abroad-scholarships.json`

Top-level: `{ dataYear: 2026, scholarships: AbroadScholarship[] }` — 50-70 entries.

```ts
export type AbroadScholarshipCategory =
  | "hec"                 // HEC Pakistan foreign programs
  | "host-government"     // Fulbright, Chevening, DAAD, GKS, CSC, Stipendium Hungaricum, Türkiye Burslari, etc.
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
```

HEC programs (e.g., HEC Foreign Scholarships for MS/PhD, Commonwealth Scholarships, Stipendium Hungaricum where HEC is the nominating agency) must be included; the HEC tab is first in the UI. The exact HEC program list is determined and verified during the data task.

### 4.3 `src/data/abroad-tests.json`

Top-level: `{ dataYear: 2026, tests: AbroadTest[] }` — 18-22 entries.

```ts
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

Coverage: English (IELTS, TOEFL, PTE, Duolingo English Test), US aptitude (SAT, ACT), graduate (GRE, GMAT), language/country-specific (TestDaF, Goethe-Zertifikat, ÖSD, CILS/CELI, TOPIK, HSK, TR-YÖS, TOLC, NT2, Indonesian BIPA, Hungarian, Lithuanian — final list determined and verified during the data task).

### 4.4 `src/data/abroad-chatbot-knowledge.ts`

The user-editable knowledge base that "trains" Safar. A typed `.ts` file (not JSON) so it supports guidance comments.

```ts
export interface KnowledgeFact { text: string; source: string } // source = URL
export interface KnowledgeTopic { id: string; title: string; facts: KnowledgeFact[] }

export const abroadChatbotKnowledge: {
  updatedAt: string;      // "2026-08-27"
  topics: KnowledgeTopic[];
} = { /* visa, documents, bank statements, money, tests, interviews, country notes... */ };
```

Editing this file = training the bot. Every fact carries its source URL; Safar cites it in answers.

### 4.5 `src/lib/abroad-filters.ts` (pure, tested)

```ts
filterCountries(list, { query?: string; region?: AbroadRegion | "all" }): AbroadCountry[]
sortCountries(list, by: "cheapest" | "name"): AbroadCountry[]  // cheapest = living bigCity + tuition ug midpoint, ascending
compareCountries(list, ids: string[]): AbroadCountry[]         // preserves ids order
filterAbroadScholarships(list, { category?, country?, level?, query? }): AbroadScholarship[]
filterAbroadTests(list, { kind?, country?, query? }): AbroadTest[]
testsForCountry(list, countryId: string): AbroadTest[]
```

### 4.6 `src/lib/abroad-planner.ts` (pure, tested)

```ts
export type CityTier = "big" | "small";
export type Lifestyle = "frugal" | "moderate" | "comfortable";
export type DegreeLevel = "ug" | "masters" | "phd";

monthlyLivingTotal(c: AbroadCountry, tier: CityTier): number
// LIFESTYLE_MULTIPLIERS = { frugal: 0.85, moderate: 1.0, comfortable: 1.25 } — applies to living only

firstYearCost(c, level, tier, lifestyle, tuitionT: number): FirstYearBreakdown
// tuitionT = 0..1 slider position on the level's CostRange
// breakdown: { tuition, living, visaFee, applicationFee, insurance, flight, testFees, total }
// living = monthlyLivingTotal × 12 × lifestyle multiplier
// testFees = sum of feePkr of testsForCountry(requiredTests)

yearlyProjection(breakdown, years = 4, tuitionInflation = 0.06): number[]
// year y total = tuition × (1 + inflation)^(y-1) + non-tuition costs (flat)

savingsTimeline(monthlySavingsPkr: number, targetPkr: number): { months: number; yearsMonths: string } | null
// null if monthlySavings <= 0; Math.ceil(target / monthlySavings)

formatPkr(n: number): string  // "PKR 6.0M", "PKR 850k" — consistent with site's k-notation
```

## 5. Page Designs

All pages follow the established visual system: `card-glass`, saffron accents, `animate-reveal` heroes (60/120/180ms), h3-wrapped accordion triggers with `aria-expanded`/`aria-controls` and always-mounted `hidden` panels, `aria-pressed` chips, `type="button"` everywhere, external links `target="_blank" rel="noreferrer"`, render-time state adjustment (no useEffect setState — repo lint rule).

### 5.1 Country Explorer — `src/components/abroad/countries-explorer.tsx`

- Stat strip: cheapest country overall, most generous post-study work, lowest visa fee (helper-derived)
- Search + region chips + "Cheapest first" sort toggle
- **Compare mode**: checkboxes on cards; when 2-3 selected → side-by-side comparison table (tuition per level, living, visa fee, required tests, post-study work, pros/cons) with a "Clear" control
- Accordion cards (one open at a time): intro, visa block (type, fee, processing, key points), intakes, tuition by level, living (big vs small city), one-time costs, documents checklist, required tests (link to Test Prep filtered by country), numbered pathway, post-study work, pros/cons, labeled sources
- Footer: "Data compiled {dataYear}. Fees change per cycle — verify on official pages."

### 5.2 Abroad Scholarships — `src/components/abroad/abroad-scholarships-explorer.tsx`

- Category tabs with counts, HEC first: HEC Pakistan / Host Government / University-specific / Merit-based / Need-based
- Country chips + level chips + search
- Cards grouped under category headings; each card: funder badge, coverage badge (full=emerald, partial=saffron), countries, eligibility snapshot, deadline, expandable how-to-apply steps, official link(s)
- Empty state: "No scholarships match these filters."

### 5.3 Test Prep Hub — `src/components/abroad/test-prep-explorer.tsx`

- **"Which tests do I need?" helper**: country select → lists that country's required tests (uses `testsForCountry`); accepts a `?country=` query param so the Country Explorer's "required tests" links pre-filter the page
- Kind chips (English / Aptitude / Graduate / Language) + country chips + search
- Accordion cards: pattern table (section, content, duration), fee + note, frequency, validity, competitive-score badge, numbered prep tips, prep resources with links, official sources

### 5.4 Safar — `src/components/abroad/safar-assistant.tsx` + `/abroad/assistant/page.tsx`

- Full-page chat (streaming via existing `/api/chat` with `persona: "safar"`), Rahbar-style bubbles
- Suggestion chips: visa questions, document checklists, bank statements, interview prep, country-specific
- Local chat history (localStorage, key `aftermediate:safar-chat`)
- Footer note: "Safar answers from a curated knowledge base and cites sources. Always double-check on official pages."

### 5.5 Financial Planner — `src/components/abroad/financial-planner.tsx` + `/abroad/planner/page.tsx`

- Inputs: country select, degree level, city tier, lifestyle, tuition slider (min→max), monthly savings (PKR)
- Outputs:
  - First-year total + stacked breakdown lines (tuition, living, visa, application, insurance, flight, tests)
  - 4-year projection — simple bar visualization from `yearlyProjection`
  - Monthly budget (rent/food/transport/utilities/misc for chosen tier + lifestyle)
  - Savings timeline: "Saving PKR X/month → ready in N months (≈ Y years Z months)"
  - Currency toggle: PKR ↔ local currency via `currency.toPkr`
- Guard: monthly savings ≤ 0 → "Enter how much you can save monthly" hint instead of a result
- Footer: "Rates as of {rateAsOf}. Estimates only — verify costs on official pages."

## 6. AI Persona: Safar

- Extend `ChatContext["persona"]` union in `src/lib/ai.ts` with `"safar"`
- `PERSONA_PROMPTS.safar`: identity ("Safar (سفر), study-abroad assistant for Pakistani students"), warm concise bilingual tone
- Grounding rules baked into the system prompt:
  - Answer from the injected knowledge base; cite each fact's source URL
  - If the knowledge base lacks coverage: say so honestly, point to the relevant site page (Country Explorer / Test Prep / Scholarships / Planner) or official source
  - Redirect rules: academic study questions → Ustaad (`/study`); site navigation → Rahbar
  - Never fabricate fees, deadlines, or visa rules; use hedged language for time-varying figures
- Injection: `lib/ai.ts` imports `abroadChatbotKnowledge` server-side; the full knowledge base (text form) is appended to the system prompt. Gemini Flash's large context window makes whole-file injection safe (the file stays a compact facts file, not essays)
- `/api/chat` route: no structural change — accepts the new persona string and passes through

## 7. Data Collection & Verification Rules (mandatory)

1. Every entry in the 3 data JSONs has `sourceUrls` (or `sources`) — no figure without a source
2. During implementation, each URL must be opened/verified (WebFetch; search-snippet fallback for bot-blocked pages) — as in the Pakistan data tasks
3. Fees are ranges or hedged single values with "as of 2026" / "X cycle" labels; deadlines hedged ("approx.") — they change per cycle
4. PKR conversions use each country's `toPkr` + `rateAsOf`; rates gathered from a consistent date window during research
5. No fabricated rankings, fees, or requirements; when official sources conflict or are bot-blocked, document the substitution in the task report
6. Example scholarship/test names listed in this spec are candidates to verify, not final facts — the data tasks verify each against official sources and may substitute equivalent verifiable programs

## 8. Testing Strategy

- Data schema tests (per file): exact 13 countries with complete cost structure + sources; scholarships 50-70, valid category enum, every entry has official link; tests file 18-22, valid kind enum, prep steps + sources; knowledge base: non-empty topics, every fact has a source URL
- Lib tests (TDD): `abroad-filters` (filter/sort/compare/testsForCountry) and `abroad-planner` (totals, lifestyle multipliers, inflation projection, savings timeline guards, formatPkr)
- Final verification task: full test suite, lint, production build (5 new routes), browser checks of every interaction (compare mode, HEC tab, test helper, chat streaming, planner outputs), responsive + mobile nav

## 9. Edge Cases

- Empty filter results → "No X match" states everywhere
- Planner: zero/negative savings, slider at min/max, currency toggle rounding
- Compare mode: fewer than 2 or more than 3 selections
- Chat: API failure → friendly retry message; streaming interruption handled
- Unknown country/test id in helper inputs → helpers filter to known ids only
- Large PKR amounts formatted via `formatPkr` (k/M notation)

## 10. Out of Scope

Live currency-rate APIs; admin panel for editing data (user edits files directly); ML fine-tuning; document upload/OCR; visa application submission; payments; deadline email alerts; countries beyond the 13 listed.

## 11. Implementation Phases (for the plan)

1. Types + `abroad-filters` lib + `abroad-planner` lib + tests
2. `abroad-countries.json` + tests
3. `abroad-scholarships.json` + tests
4. `abroad-tests.json` + tests
5. `abroad-chatbot-knowledge.ts` + Safar persona in `lib/ai.ts`
6. Sidebar update (5 new links)
7. Countries page
8. Scholarships page
9. Test Prep page
10. Safar page
11. Planner page
12. Full verification
