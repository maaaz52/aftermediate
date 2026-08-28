# Ivy League Page — Design Spec

Date: 2026-08-27 · Status: Approved design → writing this spec

## 1. Overview

A new page under the Education Abroad section dedicated exclusively to the eight Ivy League
universities (Harvard, Yale, Princeton, Columbia, Brown, Dartmouth, Cornell, UPenn), aimed at
Pakistani students who finished FSc / ICS / I.Com / A-Levels and want to apply.

The page must be interactive (not blog-like), follow the established design system
(card-glass, design tokens, ARIA accordion pattern, animate-reveal), and obey the project's
data-honesty rules: every statistic and claim carries a source URL, nothing is fabricated,
fees are hedged and converted to PKR at the shared currency window.

Decisions locked with the user:

- **Structure**: single route with tabbed sections (Profiles, Strategy, Financial Aid,
  Criteria, Stories, Resources). No per-university detail routes.
- **Success stories**: real, published Pakistani Ivy admits (news/official sources) with URLs;
  if fewer than 4 verifiable cases are found, add clearly-labeled illustrative composite
  profiles that are never presented as real people.
- **Financial aid**: full depth — per-school need-based policies for internationals, the
  no-merit-aid-at-Ivies fact, CSS Profile / ISFAA walkthrough, a "why no FAFSA for
  Pakistanis" explainer, and a listing of external merit scholarships open to Pakistanis.

## 2. Route & Navigation

- New route: `src/app/(app)/abroad/ivy-league/page.tsx` (client component wrapper, same
  shape as the other abroad pages).
- Sidebar (`src/components/sidebar.tsx`): add `{ href: "/abroad/ivy-league", label: "Ivy League",
  icon: Landmark }` to the **Education Abroad** group, after Test Prep.
- No changes to any other page or to the mobile nav (none of the abroad pages have mobile
  nav entries today).

## 3. Architecture

Static curated JSON + interactive client component, exactly like the existing abroad pages.

| File | Purpose |
| --- | --- |
| `src/data/ivy-league.json` | 8 university profiles with sourced admissions/aid data |
| `src/data/ivy-strategy.json` | Timeline, essay/rec/interview guidance with source URLs |
| `src/data/ivy-stories.json` | Real stories (sourced) + labeled illustrative profiles |
| `src/data/abroad-scholarships.json` | Extended: new entries + `ivyLeague` flag on relevant existing entries |
| `src/lib/ivy.ts` | Filter/sort/stat helpers; reuses `formatPkr` from `abroad-planner` |
| `src/components/abroad/ivy-explorer.tsx` | The page component with 6 tabs |
| `src/data/abroad-chatbot-knowledge.ts` | New "Ivy League Admissions" topic for Safar |

No server components, no API routes, no database. Do not touch `src/proxy.ts`.

## 4. Data Schemas

### 4.1 `ivy-league.json`

```ts
{
  rateAsOf: "2026-08",            // shared currency window — MUST match abroad-countries.json
  universities: [
    {
      id: "harvard",              // slug, unique across the 8
      name: "Harvard University",
      location: "Cambridge, Massachusetts, USA",
      founded: 1636,
      acceptanceRate: 3.4,        // percent, latest published cycle
      acceptanceRateCycle: "Class of 2029",  // hedges the number
      testingPolicy: "required" | "optional" | "flexible",  // current-cycle policy
      testingPolicyNote: "...",   // e.g. what "flexible" means at Yale
      satMid50: { math: "760-800", ebrw: "750-800" } | null, // null if not published
      actMid50: "34-36" | null,
      gpaBenchmark: "...",        // honest phrasing; no invented minimums
      english: {
        toeflMin: 100,            // null if school does not publish one
        ieltsMin: 7.5,
        duolingoMin: 130,
        exceptions: "..."         // waivers e.g. English-medium schooling
      },
      application: {
        platform: "Common App + supplements",
        feeUsd: 85,
        feePkr: 23630,            // computed at USD rate in rateAsOf window
        feeWaiver: "...",
        deadlines: { early: "Nov 1", regular: "Jan 1", cycleYear: "2025-2026" }
      },
      cost: {
        tuitionUsd: 59000,        // official published figure, cycle-year hedged
        tuitionPkr: 16402000,     // computed at USD rate in rateAsOf window
        totalCostUsd: 82000,      // tuition + fees + room & board + personal, where published
        totalCostPkr: 22796000,
        costCycle: "2025-2026"
      },
      financialAid: {
        intlPolicy: "need-blind" | "need-aware",  // for international applicants
        aidDetail: "...",         // loans vs grants, full-need policy, etc.
        avgAwardUsd: 65000,       // null if not published
        percentIntlAid: 55        // % of internationals receiving aid, null if unpublished
      },
      uniquePrograms: ["..."],    // 3-5 honest highlights
      notableFacts: ["..."],      // 2-4 sourced facts
      sources: {
        admissions: ["https://..."],   // non-empty for every stat above
        aid: ["https://..."],
        cost: ["https://..."],         // tuition / total cost figures
        english: ["https://..."]
      }
    }
  ]
}
```

Rules:

- Exactly 8 universities, ids unique, all 8 names fixed by the user.
- Every numeric stat must have a corresponding URL in `sources` (WebFetch-verified official
  pages first; search-snippet fallback for bot-blocked official domains, as done for the
  countries/scholarships datasets).
- Testing policy varies by school and changes often — verify the **current admissions cycle**
  for each of the 8 via official pages; when in conflict with outdated articles, official wins.
- Acceptance rates change yearly: always carry `acceptanceRateCycle` and never present the
  number without it.
- `feePkr` uses the same USD→PKR rate as `abroad-countries.json` (`rateAsOf "2026-08"`).

### 4.2 `ivy-strategy.json`

```ts
{
  timeline: [
    {
      id: "fsc-year-1",
      phase: "FSc Year 1",
      title: "...",
      steps: ["..."],            // concrete actions
      sourceUrls: ["..."]        // required where a step cites a deadline/prompt/platform
    }
  ],
  essays: { tips: ["..."], sourceUrls: ["..."] },
  recommendations: { tips: ["..."], sourceUrls: ["..."] },
  interviews: { tips: ["..."], sourceUrls: ["..."] }
}
```

- Timeline phases are grade-based for Pakistani students: FSc/ICS Year 1 → Year 2 →
  application summer → final year. A-Levels mentioned where the path differs.
- Essay section references the Common App prompt (with its source) and each school's
  supplements; no invented prompts.
- Interview section covers alumni interview programs and recorded-interview platforms
  only where the school documents them.

### 4.3 `ivy-stories.json`

```ts
{
  stories: [
    {
      id: "...",
      type: "real" | "illustrative",
      name: "...",               // real name only when type === "real"
      school: "...",             // target university name
      year: "...",               // admission year (real) or "illustrative"
      background: "...",         // short honest narrative
      challenges: ["..."],
      keyFactors: ["..."],       // why it worked
      sourceUrl: "https://..." | null   // REQUIRED for real; null for illustrative
    }
  ]
}
```

- Real stories: researched from news outlets (Dawn, The Express Tribune, The News),
  university news pages, or official organization posts. Minimum 3-4 verifiable; if research
  comes up short, fill with illustrative profiles.
- Illustrative profiles must be labeled on the card ("Illustrative profile — not a real
  person") and use realistic-but-generic backgrounds; never a real name.
- No statistics inside stories without a source URL.

### 4.4 `abroad-scholarships.json` extension

- Add `ivyLeague: true` to every existing entry a Pakistani student can use for an Ivy
  (e.g. Fulbright, EducationUSA Opportunity Funds, USEFP-administered programs — verified
  eligibility first).
- Add new external merit-scholarship entries aimed at US/Ivy applicants, following the
  existing entry schema exactly (sourceUrls, hedged deadlines, PKR values).
- Update `abroad-scholarships.test.ts` expectations if the entry count changes.
- The main Scholarships page UI is unchanged (no new tabs there — out of scope).

## 5. Page Design — `ivy-explorer.tsx`

Header block (Badge "Education Abroad" + h1 "Ivy League" + one-line honest subtitle),
followed by a tab bar. Tabs use `role="tablist"` / `aria-selected` and keep each panel
mounted (consistent with the repo's ARIA practices). Tabs:

1. **Profiles** — stat cards on top (most competitive, most generous aid, lowest sticker
   price in PKR, average acceptance across the 8); search input; testing-policy filter chips
   (`aria-pressed`); 8 expandable school cards using the canonical accordion pattern
   (`<h3><button aria-expanded aria-controls>` + always-mounted `hidden` panel +
   `role="region"`). Card body shows all §4.1 fields, PKR conversions, and source links
   (`target="_blank" rel="noreferrer"`).
2. **Strategy** — accordion sections: Timeline (phase cards), Essays, Recommendations,
   Interviews. Procedural text stays in accordions, never a wall of text.
3. **Financial Aid** — (a) per-school aid matrix: need-blind vs need-aware for
   internationals, avg award, % receiving aid; (b) "Why no FAFSA?" explainer card —
   FAFSA is for US citizens/eligible non-citizens; Pakistanis file the CSS Profile
   (school-by-school: some accept ISFAA instead) + IDOC documents; (c) external merit
   scholarships list filtered from `abroad-scholarships.json` with `ivyLeague: true`,
   reusing the existing scholarship-card visuals; (d) PKR conversions of tuition and aid.
4. **Criteria** — per-school test expectations in a sortable table: SAT/ACT policy, SAT/ACT
   mid-50%, TOEFL/IELTS/Duolingo minimums, GPA benchmark, acceptance rate with cycle.
   Rows link to the school's sources.
5. **Stories** — real-story cards (name, school, year, background, key factors, source link)
   first; illustrative profiles after, visually distinct and labeled.
6. **Resources** — grouped link cards: official admissions sites (all 8), Common App, CSS
   Profile, USEFP Pakistan, EducationUSA, official test sites (College Board, ACT, ETS),
   alumni/mentorship organizations verified to exist. Every card has a URL; no invented
   organizations.

State: `activeTab`, per-tab filter state. No setState in useEffect, no nested component
definitions. Empty states: "No universities match these filters."

## 6. Safar Knowledge Base

Add a "Ivy League Admissions" topic to `src/data/abroad-chatbot-knowledge.ts` (~8 facts):
what need-blind means for internationals, CSS Profile vs FAFSA, current testing policies at
the schools, fee/waiver basics, links to the Ivy page. Every fact URL must be one already
used in the data JSONs (no new URLs in the knowledge base). Update the `.test.ts` for the
knowledge base if it asserts topic counts.

## 7. Data Honesty Rules (binding)

1. Every statistic/claim has a `sourceUrl` or `sourceUrls` entry — verified via WebFetch;
   search snippets only as fallback for bot-blocked official domains (mirroring the
   countries/scholarships datasets).
2. No fabricated people, numbers, deadlines, or organizations. If research cannot verify a
   figure, omit it or hedge it explicitly.
3. Acceptance rates always carry the cycle year. Deadlines always carry the cycle year.
4. PKR conversions use the shared window `rateAsOf "2026-08"` (USD 278, EUR 324, GBP 378)
   — identical to `abroad-countries.json`.
5. SAT/ACT policies: official university pages for the current cycle win over third-party
   articles. Conflicts are resolved in favor of official + most recent.
6. No invented admission success stories — illustrative profiles are labeled and generic.

## 8. Design-System Conventions (must match)

- Classes: `card-glass rounded-2xl`, tokens only (`text-ink/muted/faint`, `border-line`,
  `bg-surface/surface-2`, `saffron/emerald/danger/info`).
- `animate-reveal` with 60/120/180ms delays on header blocks.
- Accordions: `<h3><button aria-expanded aria-controls>` + always-mounted `hidden` panel +
  `role="region"`; chips: `aria-pressed`; buttons: `type="button"`; external links:
  `target="_blank" rel="noreferrer"`.
- JSON imports cast: `import data from "@/data/ivy-league.json"; const d = data as unknown as {...}`.

## 9. Testing

- `src/data/ivy-league.test.ts` — exactly 8 entries, unique ids, required fields present,
  `rateAsOf === "2026-08"`, acceptanceRate 0-100 with non-empty cycle, testingPolicy in
  enum, every stat group has non-empty https `sources`, feePkr = feeUsd × 278 rounded.
- `src/data/ivy-strategy.test.ts` — 4 sections non-empty, each sourceUrls array contains
  only https URLs, timeline phases ordered.
- `src/data/ivy-stories.test.ts` — at least 2 real stories, each with an https sourceUrl;
  illustrative stories have `sourceUrl === null` and no real-person naming; total stories
  (real + illustrative) at least 4.
- `src/lib/ivy.test.ts` — filter/stat/scholarship-filter helpers.
- `abroad-scholarships.test.ts` — updated for any count changes; new entries validated.
- Commands: `npm test` (vitest), `npx tsc --noEmit`, `npx eslint <file>`, `npm run build`.

## 10. Out of Scope

- Per-university detail routes. Changes to the main Scholarships page UI.
- AI essay writing on the Ivy page (existing essay persona stays where it is).
- Application tracking/reminders, cost calculators beyond PKR conversions.
- Any change to `src/proxy.ts` or the auth/quiz flow.

## 11. Edge Cases

- Filters matching zero schools → explicit empty state, tabs remain usable.
- Optional fields (null SAT ranges, unpublished aid) → card sections hide gracefully.
- Illustrative story count adjusts to whatever real stories research yields (3-6 total).
- Mobile: tab bar scrolls horizontally; tables collapse to stacked rows on small screens.
