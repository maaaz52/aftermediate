# Entry-Test Heatmap Design

> **Feature:** The 10-Year Entry Test "Cheat Code" Heatmap — predictive analytics that transform static past-paper patterns into an interactive, chapter-level heatmap overlaid on FSc textbook tables of contents.

## Overview

An interactive dashboard widget that shows students which FSc textbook chapters appear most frequently in their entry test (NET / MDCAT / ECAT), with probability tiers (danger/amber/emerald), trend arrows, and a click-to-insight detail panel with study-time recommendations.

### Architecture

- **Config-driven data model:** mock JSON defines test → sections → chapters with pre-computed appearance stats. Adding a new test is a data-only change.
- **Pure computation layer:** `heatmap-model.ts` — deterministic, no API, no state, no localStorage.
- **Standalone widget:** `entry-test-heatmap.tsx` — card-glass container with expandable TOC tree + side detail panel.
- **No visible test switcher:** widget auto-picks the test from the student's stream. Test name shown as a quiet informational label.
- **No recharts, no API endpoints, no vector DB.** Pure local math on mock data.

### Scope

**In scope (MVP):**
- `src/data/heatmap-mock.json` — config for NET, MDCAT, ECAT (~60 chapters across 3 tests)
- `src/lib/heatmap-model.ts` — computeHeatmap, getStreamTest, getTier, getTrend + ~15 tests
- `src/components/dashboard/entry-test-heatmap.tsx` — widget + ~13 tests
- Dashboard placement at 280ms between WhereYouStand and ValuableCountries
- Three empty states

**Future (documented, not built):**
- Real data ingestion via Supabase pgvector
- Supabase API endpoint replacing mock JSON
- Additional tests (FUNGAT, LCAT, IBA, etc.) as data config blocks
- Historical trend line charts
- User interaction tracking (which chapters users clicked)

### Data Honesty

- The data is an illustrative sample modeled on past-paper patterns. Widget footer uses the approved honest framing. Honest labeling consistent with WhereYouStand's "modeled from 2025 closing merit data" footer.
- The practice bank data has `provenance: "practice"` — the heatmap footer acknowledges the data is modeled, not scraped.

---

## Data Model

### `src/data/heatmap-mock.json`

```typescript
interface HeatmapTestConfig {
  id: string;
  name: string;
  shortName: string;
  sections: HeatmapSection[];
  totalQuestionsPerYear: number;
  years: string[];
}

interface HeatmapSection {
  id: string;
  name: string;
  totalQuestions: number;
  chapters: HeatmapChapter[];
}

interface HeatmapChapter {
  id: string;
  name: string;                    // e.g. "Motion & Force"
  appearances3yr: number;          // appearances in last 3 mock years
  appearances5yr: number;          // appearances in last 5 mock years
  appearances10yr: number;         // appearances in all 10 mock years
  trend: "up" | "down" | "stable";
  practiceCount?: number;          // matching questions in practice bank
}
```

**Chapter naming:** Textbook-authentic but general — names familiar to any board (Punjab, Sindh, KPK, Balochistan). Not locked to a single province's textbook. English/intelligence use skill-area names (Vocabulary, Grammar, Reading Comprehension, Logical Reasoning, etc.).

**Tests included (MVP):**

| Test | Sections | Questions/yr | Chapters |
|---|---|---|---|
| NET — NUST Entry Test | Math(80), Physics(60), Chemistry(30), English(20), Intelligence(10) | 200 | ~20 |
| MDCAT — Medical & Dental College Admission Test | Biology(81), Chemistry(45), Physics(36), English(9), Logical Reasoning(9) | 180 | ~20 |
| ECAT — Engineering College Admission Test | English(10), Mathematics(30), Physics(30), Chemistry(30) | 100 | ~15 |

---

## Probability Model

### `src/lib/heatmap-model.ts`

Pure computation layer. No state, no side effects, no React dependency.

**`computeHeatmap(config, options?)`** — Main entry point.
- Input: `HeatmapTestConfig` + optional smoothing parameter (default: 1)
- Output: `ComputedHeatmap` with per-section and per-chapter probabilities

**Weighted frequency formula:**

```
weightedAppearances = app3yr × 3 + app5yr × 2 + app10yr × 1
sectionWeightedTotal = sectionTotal3yr × 3 + sectionTotal5yr × 2 + sectionTotal10yr × 1
probability = (weightedAppearances + smoothing) / (sectionWeightedTotal + smoothing × chapterCount)
```

- Recent years (3yr) weighted 3×, middle years (5yr-3yr=2yr) weighted 2×, oldest years weighted 1×
- Laplace smoothing (+1 per chapter) prevents zero probabilities for unseen chapters

**Color tiers:**

| Tier | Token | Range | Label |
|---|---|---|---|
| 🔴 Danger | `#d63d3d` | probability < 3% | "Ask rarely" |
| 🟡 Amber | `#d99a2b` | 3% ≤ probability ≤ 9% | "Ask occasionally" |
| 🟢 Emerald | `#1c9e62` | probability > 9% | "Ask frequently" |

**Trend calculation:**

```
recent3yrAvg = sum(app3yr) / 3
older7yrAvg = sum(app10yr - app3yr) / 7

trend = recent3yrAvg > older7yrAvg × 1.2 → "up"
        recent3yrAvg < older7yrAvg × 0.8 → "down"
        else → "stable"
```

20% deadband avoids flickering on tiny fluctuations.

**Return types:**

```typescript
interface ComputedHeatmap {
  sections: ComputedSection[];
  overallProbability: number;
  testName: string;
  testYears: string[];
}

interface ComputedSection {
  id: string;
  name: string;
  chapters: ComputedChapter[];
  sectionProbability: number;
}

interface ComputedChapter {
  id: string;
  name: string;
  probability: number;
  tier: "danger" | "amber" | "emerald";
  trend: "up" | "down" | "stable";
  appearances3yr: number;
  appearances5yr: number;
  appearances10yr: number;
}
```

**Exported functions:**
- `computeHeatmap(config, options?)` — full computation
- `getStreamTest(stream: Stream | null): string | null` — stream → test ID: `pre-medical→"mdcat"`, `pre-engineering→"ecat"`, `ics→"ecat"`, `icom/alevel/null→null`
- `getTier(probability): "danger" | "amber" | "emerald"` — pure tier lookup with threshold constants
- `getTrend(recent3yrAvg, older7yrAvg): "up" | "down" | "stable"` — pure trend calculation

### Model tests (~15)

- computeHeatmap returns correct probabilities for known inputs (manually verify math)
- Smoothing prevents zero probabilities
- Tier thresholds: 0.02→danger, 0.05→amber, 0.15→emerald
- Trend direction: up/down/stable for known arrays
- getStreamTest: pre-medical→mdcat, pre-engineering→ecat, icom→null
- getTier: edge cases at boundaries (0.03, 0.09)
- Laplace smoothing value matches pseudo-count expectations

---

## Widget

### `src/components/dashboard/entry-test-heatmap.tsx`

**Layout (tree + side panel):**

```
┌─────────────────────────────────────────────────┐
│  ENTRY-TEST HEATMAP              MDCAT — Medical │  ← FineAggregate header
│                                                 │
│  Section row (collapsible) → Physics     ◎ 36 Qs│
│    ├ Measurements                   🟢 ↑        │
│    ├ Cell Biology                   🟡 →        │
│    ├ Genetics & Evolution           🔴 ↓        │
│    └ ...                                         │
│                                                 │
│  Section row → Chemistry              ◎ 45 Qs   │
│  Section row → Physics                ◎ 45 Qs   │
│  ...                                           │
│                                                 │
│  ┌──────── SIDE PANEL (on chapter click) ──┐   │
│  │  Motion & Force                          │   │
│  │  Physics · ECAT                          │   │
│  │                                           │   │
│  │  🔴 2 in last 3 years                    │   │
│  │  🔴 7 in last 5 years                    │   │
│  │  🔴 15 in last 10 years                  │   │
│  │                                           │   │
│  │  4.2% average probability                 │   │
│  │  ↗️ Trending up                          │   │
│  │                                           │   │
│  │  Suggested study time: 5% of prep         │   │
│  │                                           │   │
│  │  📝 3 practice questions →                │   │
│  └───────────────────────────────────────────┘   │
│                                                 │
│  Based on 10 years of ... · Predictive prob...  │  ← Footer
└─────────────────────────────────────────────────┘
```

**Container:** `card-glass rounded-2xl p-5` (same as WhereYouStand, DailySprint)

**Tree behavior:**
- Sections start collapsed — shows only section header rows with question counts
- Click section header → expands to show chapter rows with fade-in stagger (`animate-reveal`, 50ms per row)
- Chapter rows show: name + color dot (danger/amber/emerald) + trend arrow (↑/→/↓)
- Click chapter → opens side panel
- Click same chapter or panel close button → dismisses panel

**Side panel behavior:**
- Slides in from right within the card (CSS transition, no overlay)
- Shows: chapter name, section + test context, 3/5/10-year counts, probability %, trend, study-time recommendation, practice questions link
- "Practice questions →" link: navigates to practice with section+topic pre-filtered
- Close button (×) top-right

**Color indicators per chapter row:**
- 🔴 red dot + "rarely" (≤3% probability)
- 🟡 amber dot + "occasional" (3–9%)
- 🟢 green dot + "frequent" (>9%)
- Trend arrow suffix (↑ / → / ↓)

**Typography (FineAggregate standard):**
- Header label: `text-[11px] font-semibold uppercase tracking-widest text-faint`
- Test name label: `text-[11px] font-semibold text-ink`
- Chapter row: `text-[13px] text-ink`
- Section header: `text-[13px] font-semibold text-ink`
- Side panel counts: `text-[13px] font-mono text-ink`
- Footer: `text-[10px] text-faint`

**Stream → test logic (inside widget):**

```typescript
const { profile } = useStudent();
const testId = getStreamTest(profile.stream);
// null → empty state
```

**Test info label in header:**
- Shows the test's full name based on which test config is loaded
- Styled as plain text, no background, no border, no click interaction
- "MDCAT — Medical & Dental College Admission Test"

### Empty states

**1. No stream (onboarding not completed):**
- Icon + "Set your stream to see which subjects appear most in entry tests"
- CTA: "Complete your profile →" links to onboard wizard

**2. No test for stream (icom, alevel, no-stream):**
- Icon + "We don't have entry-test data for your stream yet"
- Subtext: "In the meantime, explore practice questions to stay ahead."
- Link to practice

**3. No data (config missing):**
- Icon + "Heatmap data not available"
- Subtext: "Check back soon — we're updating our question patterns."

All empty states: card-glass frame, header intact, footer intact.

### Footer

```
Illustrative sample · Based on 10 years of NUST NET, MDCAT, and ECAT question patterns · Predictive probabilities are estimates, not guarantees
```

Per data honesty: "Illustrative sample · Based on 10 years of NUST NET, MDCAT, and ECAT question patterns · Predictive probabilities are estimates, not guarantees"

### Widget tests (~13)

- Renders card header with FineAggregate typography
- Shows correct test label for pre-medical profile (MDCAT)
- Shows correct test label for pre-engineering profile (ECAT)
- Sections start collapsed (no chapter rows visible)
- Click section → expands chapter rows
- Click chapter → opens detail panel
- Detail panel shows counts and probability
- Click different chapter → panel updates
- Click same chapter → panel closes
- Tiers render correct color dots (danger/amber/emerald)
- Empty state 1 (no stream) shown when profile.stream is null
- Empty state 2 (no test for stream) shown for icom
- Empty state 3 (no data) shown when config is missing
- Footer text is present and correct

---

## Dashboard Integration

### Placement (`src/app/(app)/dashboard/page.tsx`)

```tsx
// After WhereYouStand (220ms), before ValuableCountries grid (240ms)
<div className="mt-4 animate-reveal" style={{ animationDelay: "280ms" }}>
  <EntryTestHeatmap />
</div>
```

Full-width card (same as WhereYouStand's layout), inside the main dashboard column.

### Practice linking

In the detail panel's "practice questions →" link:
- Uses `getBank(testId)` to find the relevant practice bank
- Filters by section + topic (if topic matches a practice question topic)
- Falls back to section-level filter if no topic match
- Opens the practice view with pre-applied filter (client-side navigation)

---

## Test Strategy

| File | Tests | Focus |
|---|---|---|
| `src/lib/heatmap-model.test.ts` | ~15 | Probability math, tiers, trends, stream mapping, smoothing |
| `src/components/dashboard/entry-test-heatmap.test.tsx` | ~13 | Render states, interaction, empty states, tier colors |

All tests: vitest, same config as existing test files (`@` alias, node env, JSON import support).

---

## Future Work

- When real vectorized past-paper data lands in Supabase, replace `heatmap-mock.json` with an API-backed data source. The `HeatmapTestConfig` interface stays the same — only the data source changes.
- Additional tests (FUNGAT, LCAT, IBA, GIKI, COMSATS, PIEAS, AKU, abroad tests) added as config blocks in the mock JSON.
- Interaction tracking: log which chapters students click most → feed into content prioritization.
- Historical trend sparklines in the detail panel.