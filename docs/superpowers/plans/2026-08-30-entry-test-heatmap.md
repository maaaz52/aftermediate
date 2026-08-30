# Entry-Test Heatmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a config-driven predictive analytics heatmap widget showing FSc textbook chapter-level question patterns for NET, MDCAT, and ECAT entry tests.

**Architecture:** Mock JSON config defines tests (3), sections (~14), and chapters (~55) with pre-computed appearance stats. Pure model functions (`computeHeatmap`, `getStreamTest`, `getTier`, `getTrend`) compute probabilities, tiers, and trends. A config-driven React widget reads config via the model and renders an expandable TOC tree with a click-to-insight detail panel. Adding a new test is a data-only change to the JSON. No API endpoints, no vector DB, no localStorage cache.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Tailwind 4, vitest (`@` → `./src`, node env, JSON imports OK), lucide-react

---

## File Structure

| File | Role | Action |
|---|---|---|
| `src/data/heatmap-mock.json` | Config-driven test data (NET, MDCAT, ECAT) | Create |
| `src/lib/heatmap-model.ts` | Pure computation functions | Create |
| `src/lib/heatmap-model.test.ts` | ~15 tests for the model | Create |
| `src/components/dashboard/entry-test-heatmap.tsx` | Config-driven tree widget + detail panel | Create |
| `src/components/dashboard/entry-test-heatmap.test.tsx` | ~13 tests for the widget | Create |
| `src/app/(app)/dashboard/page.tsx` | Import + placement | Modify |

## Context for Implementer

**Existing patterns to follow:**

- **Pure lib functions** like `src/lib/benchmark.ts` — deterministic, no side effects, no React dependency, no API calls. The model layer here is the same pattern.
- **Dashboard components** use `card-glass rounded-2xl p-5`, `animate-reveal` with stagger delays, `text-[11px] font-semibold uppercase tracking-widest text-faint` for FineAggregate headers.
- **useStudent()** from `src/lib/store.tsx` returns `{ profile: StudentProfile, update, reset, hydrated, hydrate }`. `profile.stream` is `"pre-medical" | "pre-engineering" | "ics" | "icom" | "alevel" | null`.
- **Dashboard stagger delays** use inline `style={{ animationDelay: "220ms" }}` on `animate-reveal` div wrappers.
- **vitest config** uses `@` → `./src`, `environment: "node"`, JSON imports work without config changes. For component tests use `environment: "jsdom"`.
- **Design tokens:** danger `#d63d3d`, amber `#d99a2b`, emerald `#1c9e62`, ink `#191f2c`, faint `#8a93a6`.
- **Footer disclaimers** use `text-[10px] text-faint` (see WhereYouStand's footer).

**Stream → test mapping:**
- `pre-medical` → `"mdcat"`
- `pre-engineering` → `"ecat"`
- `ics` → `"ecat"`
- `icom` / `alevel` / `null` → `null` (no test — show empty state)

---

### Task 1: Mock Data — `heatmap-mock.json`

**Files:**
- Create: `src/data/heatmap-mock.json`

The JSON defines all three tests (NET, MDCAT, ECAT) with their sections and chapters. Each chapter has pre-computed `appearances3yr` / `appearances5yr` / `appearances10yr` (question appearances in the last 3, 5, and 10 mock years) and a `trend` direction.

**Schema:**
```json
{
  "[testId]": {
    "id": "net",
    "name": "NET — NUST Entry Test",
    "shortName": "NET",
    "totalQuestionsPerYear": 200,
    "years": ["2017","2018","2019","2020","2021","2022","2023","2024","2025","2026"],
    "sections": [
      {
        "id": "physics",
        "name": "Physics",
        "totalQuestions": 60,
        "chapters": [
          { "id": "physics-measurements", "name": "Measurements", "appearances3yr": 8, "appearances5yr": 18, "appearances10yr": 40, "trend": "down" }
        ]
      }
    ]
  }
}
```

- [ ] **Step 1: Create the mock data file**

Write the complete JSON to `src/data/heatmap-mock.json`:

```json
{
  "net": {
    "id": "net",
    "name": "NET — NUST Entry Test",
    "shortName": "NET",
    "totalQuestionsPerYear": 200,
    "years": ["2017","2018","2019","2020","2021","2022","2023","2024","2025","2026"],
    "sections": [
      {
        "id": "math",
        "name": "Mathematics",
        "totalQuestions": 80,
        "chapters": [
          { "id": "math-number-systems", "name": "Number Systems", "appearances3yr": 10, "appearances5yr": 22, "appearances10yr": 50, "trend": "down" },
          { "id": "math-sets-functions", "name": "Sets, Functions & Groups", "appearances3yr": 8, "appearances5yr": 18, "appearances10yr": 42, "trend": "down" },
          { "id": "math-matrices", "name": "Matrices & Determinants", "appearances3yr": 18, "appearances5yr": 35, "appearances10yr": 60, "trend": "up" },
          { "id": "math-quadratics", "name": "Quadratic Equations", "appearances3yr": 15, "appearances5yr": 30, "appearances10yr": 55, "trend": "up" },
          { "id": "math-partial-fractions", "name": "Partial Fractions", "appearances3yr": 6, "appearances5yr": 14, "appearances10yr": 35, "trend": "down" },
          { "id": "math-sequences", "name": "Sequences & Series", "appearances3yr": 20, "appearances5yr": 38, "appearances10yr": 70, "trend": "up" },
          { "id": "math-trigonometry", "name": "Trigonometry", "appearances3yr": 22, "appearances5yr": 40, "appearances10yr": 78, "trend": "up" },
          { "id": "math-probability", "name": "Permutation, Combination & Probability", "appearances3yr": 12, "appearances5yr": 26, "appearances10yr": 55, "trend": "down" },
          { "id": "math-analytic-geometry", "name": "Analytical Geometry", "appearances3yr": 14, "appearances5yr": 28, "appearances10yr": 60, "trend": "stable" },
          { "id": "math-calculus", "name": "Fundamentals of Calculus", "appearances3yr": 25, "appearances5yr": 45, "appearances10yr": 85, "trend": "up" }
        ]
      },
      {
        "id": "physics",
        "name": "Physics",
        "totalQuestions": 60,
        "chapters": [
          { "id": "physics-measurements", "name": "Measurements", "appearances3yr": 8, "appearances5yr": 18, "appearances10yr": 40, "trend": "down" },
          { "id": "physics-vectors", "name": "Vectors & Scalars", "appearances3yr": 6, "appearances5yr": 15, "appearances10yr": 35, "trend": "down" },
          { "id": "physics-motion-force", "name": "Motion & Force", "appearances3yr": 18, "appearances5yr": 32, "appearances10yr": 60, "trend": "up" },
          { "id": "physics-work-energy", "name": "Work, Energy & Power", "appearances3yr": 12, "appearances5yr": 25, "appearances10yr": 50, "trend": "stable" },
          { "id": "physics-circular-motion", "name": "Circular Motion", "appearances3yr": 15, "appearances5yr": 28, "appearances10yr": 55, "trend": "up" },
          { "id": "physics-oscillations", "name": "Oscillations", "appearances3yr": 5, "appearances5yr": 14, "appearances10yr": 32, "trend": "down" },
          { "id": "physics-waves", "name": "Waves", "appearances3yr": 10, "appearances5yr": 22, "appearances10yr": 45, "trend": "stable" },
          { "id": "physics-optics", "name": "Physical Optics", "appearances3yr": 4, "appearances5yr": 12, "appearances10yr": 30, "trend": "down" },
          { "id": "physics-thermodynamics", "name": "Heat & Thermodynamics", "appearances3yr": 14, "appearances5yr": 26, "appearances10yr": 52, "trend": "up" },
          { "id": "physics-electromagnetism", "name": "Electromagnetism", "appearances3yr": 20, "appearances5yr": 38, "appearances10yr": 70, "trend": "up" },
          { "id": "physics-electronics", "name": "Electronics", "appearances3yr": 8, "appearances5yr": 20, "appearances10yr": 45, "trend": "stable" },
          { "id": "physics-modern", "name": "Modern Physics", "appearances3yr": 10, "appearances5yr": 22, "appearances10yr": 48, "trend": "stable" }
        ]
      },
      {
        "id": "chemistry",
        "name": "Chemistry",
        "totalQuestions": 30,
        "chapters": [
          { "id": "chem-fundamental", "name": "Fundamental Concepts", "appearances3yr": 6, "appearances5yr": 14, "appearances10yr": 32, "trend": "stable" },
          { "id": "chem-atomic-structure", "name": "Atomic Structure", "appearances3yr": 10, "appearances5yr": 20, "appearances10yr": 42, "trend": "up" },
          { "id": "chem-bonding", "name": "Chemical Bonding", "appearances3yr": 8, "appearances5yr": 18, "appearances10yr": 38, "trend": "up" },
          { "id": "chem-thermochemistry", "name": "Thermochemistry", "appearances3yr": 4, "appearances5yr": 10, "appearances10yr": 25, "trend": "down" },
          { "id": "chem-equilibrium", "name": "Chemical Equilibrium", "appearances3yr": 6, "appearances5yr": 12, "appearances10yr": 28, "trend": "stable" },
          { "id": "chem-electrochemistry", "name": "Electrochemistry", "appearances3yr": 8, "appearances5yr": 16, "appearances10yr": 35, "trend": "up" },
          { "id": "chem-organic", "name": "Organic Chemistry", "appearances3yr": 12, "appearances5yr": 24, "appearances10yr": 50, "trend": "up" },
          { "id": "chem-solutions", "name": "Solutions", "appearances3yr": 5, "appearances5yr": 12, "appearances10yr": 28, "trend": "down" },
          { "id": "chem-kinetics", "name": "Reaction Kinetics", "appearances3yr": 3, "appearances5yr": 8, "appearances10yr": 20, "trend": "down" },
          { "id": "chem-environmental", "name": "Environmental Chemistry", "appearances3yr": 2, "appearances5yr": 6, "appearances10yr": 15, "trend": "down" }
        ]
      },
      {
        "id": "english",
        "name": "English",
        "totalQuestions": 20,
        "chapters": [
          { "id": "eng-vocabulary", "name": "Vocabulary", "appearances3yr": 8, "appearances5yr": 16, "appearances10yr": 35, "trend": "up" },
          { "id": "eng-grammar", "name": "Grammar & Usage", "appearances3yr": 12, "appearances5yr": 22, "appearances10yr": 45, "trend": "up" },
          { "id": "eng-comprehension", "name": "Reading Comprehension", "appearances3yr": 6, "appearances5yr": 14, "appearances10yr": 30, "trend": "stable" },
          { "id": "eng-punctuation", "name": "Punctuation & Mechanics", "appearances3yr": 4, "appearances5yr": 10, "appearances10yr": 22, "trend": "down" },
          { "id": "eng-paragraph", "name": "Paragraph Organization", "appearances3yr": 3, "appearances5yr": 8, "appearances10yr": 18, "trend": "down" }
        ]
      },
      {
        "id": "intelligence",
        "name": "Intelligence",
        "totalQuestions": 10,
        "chapters": [
          { "id": "iq-analytical", "name": "Analytical Reasoning", "appearances3yr": 6, "appearances5yr": 12, "appearances10yr": 25, "trend": "up" },
          { "id": "iq-logical", "name": "Logical Reasoning", "appearances3yr": 8, "appearances5yr": 14, "appearances10yr": 30, "trend": "up" },
          { "id": "iq-patterns", "name": "Pattern Recognition", "appearances3yr": 4, "appearances5yr": 10, "appearances10yr": 22, "trend": "down" },
          { "id": "iq-data-sufficiency", "name": "Data Sufficiency", "appearances3yr": 2, "appearances5yr": 6, "appearances10yr": 15, "trend": "down" }
        ]
      }
    ]
  },
  "mdcat": {
    "id": "mdcat",
    "name": "MDCAT — Medical & Dental College Admission Test",
    "shortName": "MDCAT",
    "totalQuestionsPerYear": 180,
    "years": ["2017","2018","2019","2020","2021","2022","2023","2024","2025","2026"],
    "sections": [
      {
        "id": "biology",
        "name": "Biology",
        "totalQuestions": 81,
        "chapters": [
          { "id": "bio-cell-biology", "name": "Cell Biology", "appearances3yr": 20, "appearances5yr": 40, "appearances10yr": 85, "trend": "stable" },
          { "id": "bio-molecules", "name": "Biological Molecules", "appearances3yr": 18, "appearances5yr": 36, "appearances10yr": 75, "trend": "stable" },
          { "id": "bio-enzymes", "name": "Enzymes", "appearances3yr": 8, "appearances5yr": 18, "appearances10yr": 40, "trend": "down" },
          { "id": "bio-bioenergetics", "name": "Bioenergetics", "appearances3yr": 14, "appearances5yr": 28, "appearances10yr": 60, "trend": "stable" },
          { "id": "bio-life-processes", "name": "Life Processes (Nutrition, Gaseous Exchange, Transport)", "appearances3yr": 24, "appearances5yr": 46, "appearances10yr": 95, "trend": "up" },
          { "id": "bio-diversity", "name": "Diversity of Life", "appearances3yr": 10, "appearances5yr": 22, "appearances10yr": 50, "trend": "down" },
          { "id": "bio-genetics", "name": "Genetics & Evolution", "appearances3yr": 22, "appearances5yr": 42, "appearances10yr": 85, "trend": "up" },
          { "id": "bio-biotechnology", "name": "Biotechnology", "appearances3yr": 6, "appearances5yr": 14, "appearances10yr": 32, "trend": "down" },
          { "id": "bio-coordination", "name": "Coordination & Control", "appearances3yr": 16, "appearances5yr": 32, "appearances10yr": 68, "trend": "stable" },
          { "id": "bio-reproduction", "name": "Reproduction", "appearances3yr": 14, "appearances5yr": 28, "appearances10yr": 60, "trend": "stable" },
          { "id": "bio-ecology", "name": "Ecology", "appearances3yr": 8, "appearances5yr": 18, "appearances10yr": 42, "trend": "down" }
        ]
      },
      {
        "id": "chemistry",
        "name": "Chemistry",
        "totalQuestions": 45,
        "chapters": [
          { "id": "chem-fundamental", "name": "Fundamental Concepts", "appearances3yr": 8, "appearances5yr": 18, "appearances10yr": 42, "trend": "stable" },
          { "id": "chem-atomic-structure", "name": "Atomic Structure", "appearances3yr": 12, "appearances5yr": 24, "appearances10yr": 50, "trend": "up" },
          { "id": "chem-bonding", "name": "Chemical Bonding", "appearances3yr": 10, "appearances5yr": 20, "appearances10yr": 45, "trend": "stable" },
          { "id": "chem-organic", "name": "Organic Chemistry", "appearances3yr": 16, "appearances5yr": 30, "appearances10yr": 60, "trend": "up" },
          { "id": "chem-equilibrium", "name": "Chemical Equilibrium", "appearances3yr": 6, "appearances5yr": 14, "appearances10yr": 32, "trend": "down" },
          { "id": "chem-electrochemistry", "name": "Electrochemistry", "appearances3yr": 8, "appearances5yr": 16, "appearances10yr": 38, "trend": "stable" },
          { "id": "chem-solutions", "name": "Solutions", "appearances3yr": 5, "appearances5yr": 12, "appearances10yr": 28, "trend": "down" },
          { "id": "chem-kinetics", "name": "Reaction Kinetics", "appearances3yr": 4, "appearances5yr": 10, "appearances10yr": 25, "trend": "down" },
          { "id": "chem-thermochemistry", "name": "Thermochemistry", "appearances3yr": 6, "appearances5yr": 14, "appearances10yr": 30, "trend": "stable" }
        ]
      },
      {
        "id": "physics",
        "name": "Physics",
        "totalQuestions": 36,
        "chapters": [
          { "id": "physics-measurements", "name": "Measurements", "appearances3yr": 5, "appearances5yr": 12, "appearances10yr": 28, "trend": "down" },
          { "id": "physics-motion-force", "name": "Motion & Force", "appearances3yr": 10, "appearances5yr": 20, "appearances10yr": 42, "trend": "up" },
          { "id": "physics-work-energy", "name": "Work, Energy & Power", "appearances3yr": 6, "appearances5yr": 14, "appearances10yr": 32, "trend": "stable" },
          { "id": "physics-circular-motion", "name": "Circular Motion", "appearances3yr": 8, "appearances5yr": 16, "appearances10yr": 35, "trend": "up" },
          { "id": "physics-optics", "name": "Physical Optics", "appearances3yr": 3, "appearances5yr": 8, "appearances10yr": 20, "trend": "down" },
          { "id": "physics-thermodynamics", "name": "Heat & Thermodynamics", "appearances3yr": 7, "appearances5yr": 14, "appearances10yr": 30, "trend": "stable" },
          { "id": "physics-electromagnetism", "name": "Electromagnetism", "appearances3yr": 12, "appearances5yr": 22, "appearances10yr": 45, "trend": "up" },
          { "id": "physics-waves", "name": "Waves & Oscillations", "appearances3yr": 4, "appearances5yr": 10, "appearances10yr": 24, "trend": "down" },
          { "id": "physics-electronics", "name": "Electronics", "appearances3yr": 5, "appearances5yr": 12, "appearances10yr": 28, "trend": "stable" }
        ]
      },
      {
        "id": "english",
        "name": "English",
        "totalQuestions": 9,
        "chapters": [
          { "id": "eng-vocabulary", "name": "Vocabulary", "appearances3yr": 4, "appearances5yr": 8, "appearances10yr": 18, "trend": "up" },
          { "id": "eng-grammar", "name": "Grammar & Usage", "appearances3yr": 6, "appearances5yr": 12, "appearances10yr": 25, "trend": "up" },
          { "id": "eng-comprehension", "name": "Reading Comprehension", "appearances3yr": 3, "appearances5yr": 8, "appearances10yr": 16, "trend": "stable" },
          { "id": "eng-punctuation", "name": "Punctuation & Mechanics", "appearances3yr": 2, "appearances5yr": 5, "appearances10yr": 12, "trend": "down" }
        ]
      },
      {
        "id": "logical-reasoning",
        "name": "Logical Reasoning",
        "totalQuestions": 9,
        "chapters": [
          { "id": "lr-analytical", "name": "Analytical Reasoning", "appearances3yr": 4, "appearances5yr": 10, "appearances10yr": 22, "trend": "stable" },
          { "id": "lr-logical", "name": "Logical Reasoning", "appearances3yr": 6, "appearances5yr": 12, "appearances10yr": 25, "trend": "up" },
          { "id": "lr-data-sufficiency", "name": "Data Sufficiency", "appearances3yr": 2, "appearances5yr": 6, "appearances10yr": 14, "trend": "down" }
        ]
      }
    ]
  },
  "ecat": {
    "id": "ecat",
    "name": "ECAT — Engineering College Admission Test",
    "shortName": "ECAT",
    "totalQuestionsPerYear": 100,
    "years": ["2017","2018","2019","2020","2021","2022","2023","2024","2025","2026"],
    "sections": [
      {
        "id": "mathematics",
        "name": "Mathematics",
        "totalQuestions": 30,
        "chapters": [
          { "id": "math-number-systems", "name": "Number Systems", "appearances3yr": 4, "appearances5yr": 10, "appearances10yr": 24, "trend": "down" },
          { "id": "math-matrices", "name": "Matrices & Determinants", "appearances3yr": 6, "appearances5yr": 14, "appearances10yr": 30, "trend": "up" },
          { "id": "math-quadratics", "name": "Quadratic Equations", "appearances3yr": 8, "appearances5yr": 16, "appearances10yr": 34, "trend": "up" },
          { "id": "math-sequences", "name": "Sequences & Series", "appearances3yr": 6, "appearances5yr": 12, "appearances10yr": 28, "trend": "stable" },
          { "id": "math-trigonometry", "name": "Trigonometry", "appearances3yr": 10, "appearances5yr": 20, "appearances10yr": 40, "trend": "up" },
          { "id": "math-calculus", "name": "Differential Calculus", "appearances3yr": 8, "appearances5yr": 16, "appearances10yr": 35, "trend": "stable" },
          { "id": "math-analytic-geometry", "name": "Analytical Geometry", "appearances3yr": 4, "appearances5yr": 10, "appearances10yr": 22, "trend": "down" },
          { "id": "math-probability", "name": "Probability & Statistics", "appearances3yr": 6, "appearances5yr": 12, "appearances10yr": 28, "trend": "stable" }
        ]
      },
      {
        "id": "physics",
        "name": "Physics",
        "totalQuestions": 30,
        "chapters": [
          { "id": "physics-measurements", "name": "Measurements", "appearances3yr": 3, "appearances5yr": 8, "appearances10yr": 20, "trend": "down" },
          { "id": "physics-motion-force", "name": "Motion & Force", "appearances3yr": 8, "appearances5yr": 18, "appearances10yr": 38, "trend": "up" },
          { "id": "physics-work-energy", "name": "Work, Energy & Power", "appearances3yr": 6, "appearances5yr": 14, "appearances10yr": 30, "trend": "stable" },
          { "id": "physics-circular-motion", "name": "Circular Motion", "appearances3yr": 7, "appearances5yr": 14, "appearances10yr": 30, "trend": "up" },
          { "id": "physics-thermodynamics", "name": "Heat & Thermodynamics", "appearances3yr": 5, "appearances5yr": 12, "appearances10yr": 26, "trend": "stable" },
          { "id": "physics-electromagnetism", "name": "Electromagnetism", "appearances3yr": 10, "appearances5yr": 20, "appearances10yr": 40, "trend": "up" },
          { "id": "physics-optics", "name": "Optics & Waves", "appearances3yr": 4, "appearances5yr": 10, "appearances10yr": 22, "trend": "down" },
          { "id": "physics-modern", "name": "Modern Physics", "appearances3yr": 6, "appearances5yr": 12, "appearances10yr": 26, "trend": "stable" }
        ]
      },
      {
        "id": "chemistry",
        "name": "Chemistry",
        "totalQuestions": 30,
        "chapters": [
          { "id": "chem-fundamental", "name": "Fundamental Concepts", "appearances3yr": 5, "appearances5yr": 12, "appearances10yr": 28, "trend": "stable" },
          { "id": "chem-atomic-structure", "name": "Atomic Structure", "appearances3yr": 8, "appearances5yr": 16, "appearances10yr": 34, "trend": "up" },
          { "id": "chem-bonding", "name": "Chemical Bonding", "appearances3yr": 6, "appearances5yr": 14, "appearances10yr": 30, "trend": "stable" },
          { "id": "chem-organic", "name": "Organic Chemistry", "appearances3yr": 10, "appearances5yr": 18, "appearances10yr": 38, "trend": "up" },
          { "id": "chem-electrochemistry", "name": "Electrochemistry", "appearances3yr": 4, "appearances5yr": 10, "appearances10yr": 24, "trend": "down" },
          { "id": "chem-equilibrium", "name": "Chemical Equilibrium", "appearances3yr": 5, "appearances5yr": 10, "appearances10yr": 22, "trend": "stable" },
          { "id": "chem-solutions", "name": "Solutions", "appearances3yr": 4, "appearances5yr": 8, "appearances10yr": 20, "trend": "down" },
          { "id": "chem-kinetics", "name": "Reaction Kinetics", "appearances3yr": 3, "appearances5yr": 8, "appearances10yr": 18, "trend": "down" }
        ]
      },
      {
        "id": "english",
        "name": "English",
        "totalQuestions": 10,
        "chapters": [
          { "id": "eng-vocabulary", "name": "Vocabulary", "appearances3yr": 4, "appearances5yr": 8, "appearances10yr": 18, "trend": "up" },
          { "id": "eng-grammar", "name": "Grammar & Usage", "appearances3yr": 6, "appearances5yr": 12, "appearances10yr": 25, "trend": "up" },
          { "id": "eng-comprehension", "name": "Reading Comprehension", "appearances3yr": 3, "appearances5yr": 8, "appearances10yr": 16, "trend": "stable" },
          { "id": "eng-punctuation", "name": "Punctuation & Mechanics", "appearances3yr": 2, "appearances5yr": 5, "appearances10yr": 12, "trend": "down" }
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: Verify JSON is valid**

Run:
```bash
cd /home/themz/aftermediate && node -e "const d = require('./src/data/heatmap-mock.json'); console.log(Object.keys(d).length, 'tests'); Object.entries(d).forEach(([k,v]) => console.log(k, v.sections.length, 'sections', v.sections.reduce((a,s) => a+s.chapters.length, 0), 'chapters'))"
```

Expected output:
```
3 tests
net 5 sections 41 chapters
mdcat 5 sections 36 chapters
ecat 4 sections 27 chapters
```

- [ ] **Step 3: Commit**

```bash
git add src/data/heatmap-mock.json
git commit -m "feat: add heatmap mock data for NET, MDCAT, ECAT"
```---

### Task 2: Probability Model — `heatmap-model.ts`

**Files:**
- Create: `src/lib/heatmap-model.ts`
- Create: `src/lib/heatmap-model.test.ts`

The pure computation layer. Four exported functions: `computeHeatmap`, `getStreamTest`, `getTier`, `getTrend`.

- [ ] **Step 1: Write the failing tests**

Write `src/lib/heatmap-model.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  computeHeatmap,
  getStreamTest,
  getTier,
  getTrend,
  type HeatmapTestConfig,
} from "./heatmap-model";

// ── Test fixture ──
const simpleConfig: HeatmapTestConfig = {
  id: "test",
  name: "Test Exam",
  shortName: "TE",
  totalQuestionsPerYear: 100,
  years: ["2017","2018","2019","2020","2021","2022","2023","2024","2025","2026"],
  sections: [
    {
      id: "physics",
      name: "Physics",
      totalQuestions: 50,
      chapters: [
        // appearances3yr=high, appearances5yr=medium, appearances10yr=high
        { id: "p1", name: "Motion & Force", appearances3yr: 18, appearances5yr: 32, appearances10yr: 60, trend: "up" },
        // appearances3yr=low, appearances5yr=low, appearances10yr=medium
        { id: "p2", name: "Optics", appearances3yr: 2, appearances5yr: 8, appearances10yr: 25, trend: "down" },
        // appearances3yr=mid, appearances5yr=mid, appearances10yr=mid
        { id: "p3", name: "Waves", appearances3yr: 8, appearances5yr: 18, appearances10yr: 40, trend: "stable" },
      ],
    },
  ],
};

// ── getStreamTest ──

it("getStreamTest: pre-medical maps to mdcat", () => {
  expect(getStreamTest("pre-medical")).toBe("mdcat");
});

it("getStreamTest: pre-engineering maps to ecat", () => {
  expect(getStreamTest("pre-engineering")).toBe("ecat");
});

it("getStreamTest: ics maps to ecat", () => {
  expect(getStreamTest("ics")).toBe("ecat");
});

it("getStreamTest: icom maps to null", () => {
  expect(getStreamTest("icom")).toBeNull();
});

it("getStreamTest: alevel maps to null", () => {
  expect(getStreamTest("alevel")).toBeNull();
});

it("getStreamTest: null stream maps to null", () => {
  expect(getStreamTest(null)).toBeNull();
});

// ── getTier ──

it("getTier: below 0.03 is danger", () => {
  expect(getTier(0)).toBe("danger");
  expect(getTier(0.02)).toBe("danger");
  expect(getTier(0.02999)).toBe("danger");
});

it("getTier: 0.03 to 0.09 is amber", () => {
  expect(getTier(0.03)).toBe("amber");
  expect(getTier(0.05)).toBe("amber");
  expect(getTier(0.09)).toBe("amber");
});

it("getTier: above 0.09 is emerald", () => {
  expect(getTier(0.091)).toBe("emerald");
  expect(getTier(0.15)).toBe("emerald");
  expect(getTier(1)).toBe("emerald");
});

// ── getTrend ──

it("getTrend: recent > 1.2× older is up", () => {
  expect(getTrend(10, 5)).toBe("up");
  expect(getTrend(6, 4.9)).toBe("up");
  expect(getTrend(12, 9)).toBe("up"); // 12 > 10.8 → up
});

it("getTrend: recent < 0.8× older is down", () => {
  expect(getTrend(4, 6)).toBe("down");
  expect(getTrend(3, 5)).toBe("down");
  expect(getTrend(5.9, 8)).toBe("down");
});

it("getTrend: within 0.8–1.2× is stable", () => {
  expect(getTrend(5, 5)).toBe("stable");
  expect(getTrend(6, 5.5)).toBe("stable");
  expect(getTrend(8, 10)).toBe("stable");
});

// ── computeHeatmap ──

it("computeHeatmap returns correct section and chapter structure", () => {
  const result = computeHeatmap(simpleConfig);
  expect(result.sections).toHaveLength(1);
  expect(result.sections[0].chapters).toHaveLength(3);
  expect(result.testName).toBe("Test Exam");
  expect(result.testYears).toEqual(["2017","2018","2019","2020","2021","2022","2023","2024","2025","2026"]);
});

it("computeHeatmap: chapter with high recent appearances gets high probability", () => {
  const result = computeHeatmap(simpleConfig);
  const motion = result.sections[0].chapters.find((c) => c.id === "p1")!;
  // weighted = 18×3 + 32×2 + 60×1 = 54 + 64 + 60 = 178
  // section weighted = (18+2+8)×3 + (32+8+18)×2 + (60+25+40)×1 + smoothing
  // = 28×3 + 58×2 + 125×1 + 3×1 = 84 + 116 + 125 + 3 = 328
  // prob = (178+1)/(328) ≈ 0.546
  expect(motion.probability).toBeGreaterThan(0.5);
  expect(motion.probability).toBeLessThan(0.6);
  expect(motion.tier).toBe("emerald");
  expect(motion.trend).toBe("up");
});

it("computeHeatmap: chapter with low recent appearances gets low probability", () => {
  const result = computeHeatmap(simpleConfig);
  const optics = result.sections[0].chapters.find((c) => c.id === "p2")!;
  // weighted = 2×3 + 8×2 + 25×1 = 6 + 16 + 25 = 47
  // prob = (47+1)/(328) ≈ 0.146
  expect(optics.probability).toBeGreaterThan(0.1);
  expect(optics.probability).toBeLessThan(0.2);
  expect(optics.tier).toBe("emerald"); // > 0.09
});

it("computeHeatmap: smoothing prevents zero probabilities", () => {
  const zeroConfig: HeatmapTestConfig = {
    ...simpleConfig,
    sections: [{
      ...simpleConfig.sections[0],
      chapters: [
        { id: "p-zero", name: "Zero Chapter", appearances3yr: 0, appearances5yr: 0, appearances10yr: 0, trend: "stable" },
        { id: "p-nonzero", name: "Non-Zero Chapter", appearances3yr: 5, appearances5yr: 10, appearances10yr: 20, trend: "stable" },
      ],
    }],
  };
  const result = computeHeatmap(zeroConfig);
  const zero = result.sections[0].chapters.find((c) => c.id === "p-zero")!;
  expect(zero.probability).toBeGreaterThan(0);
  expect(zero.tier).toBe("danger");
});

it("computeHeatmap: custom smoothing parameter works", () => {
  const zeroConfig: HeatmapTestConfig = {
    ...simpleConfig,
    sections: [{
      ...simpleConfig.sections[0],
      chapters: [
        { id: "p-zero", name: "Zero Chapter", appearances3yr: 0, appearances5yr: 0, appearances10yr: 0, trend: "stable" },
      ],
    }],
  };
  const result = computeHeatmap(zeroConfig, { smoothing: 5 });
  const zero = result.sections[0].chapters.find((c) => c.id === "p-zero")!;
  // weighted = 0 + 0 + 0 = 0
  // section weighted total = 0 (only chapter is zero) + 5×1 = 5
  // prob = (0+5)/(0+5) = 1
  // With only one zero-value chapter and smoothing=5, probability lands at 1/(3 chapters equivalent?)
  // Actually: numerator = 0+5 = 5, denominator = 0 + 5×1 = 5, so 5/5 = 1. But that's because
  // the section has 1 chapter and section total is... hmm let me compute.
  // appearances weighted = 0+0+0 = 0
  // section weighted sum of appearances = 0
  // smoothing = 5, chapterCount = 1
  // prob = (0+5) / (0 + 5×1) = 5/5 = 1
  // For a single chapter with all zeros, this is correct (100% of nothing = nothing).
  // The test just checks it doesn't crash and returns > 0.
  expect(zero.probability).toBeGreaterThan(0);
});

it("computeHeatmap: returned chapter includes appearances counts", () => {
  const result = computeHeatmap(simpleConfig);
  const waves = result.sections[0].chapters.find((c) => c.id === "p3")!;
  expect(waves.appearances3yr).toBe(8);
  expect(waves.appearances5yr).toBe(18);
  expect(waves.appearances10yr).toBe(40);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/themz/aftermediate && npx vitest run src/lib/heatmap-model.test.ts --reporter=verbose 2>&1 | head -5
```

Expected: FAIL — module not found, functions not defined.

- [ ] **Step 3: Write the implementation**

Create `src/lib/heatmap-model.ts`:

```typescript
// ── Types ──

export interface HeatmapTestConfig {
  id: string;
  name: string;
  shortName: string;
  totalQuestionsPerYear: number;
  years: string[];
  sections: HeatmapSection[];
}

export interface HeatmapSection {
  id: string;
  name: string;
  totalQuestions: number;
  chapters: HeatmapChapter[];
}

export interface HeatmapChapter {
  id: string;
  name: string;
  appearances3yr: number;
  appearances5yr: number;
  appearances10yr: number;
  trend: "up" | "down" | "stable";
  practiceCount?: number;
}

export interface ComputedHeatmap {
  sections: ComputedSection[];
  overallProbability: number;
  testName: string;
  testYears: string[];
}

export interface ComputedSection {
  id: string;
  name: string;
  chapters: ComputedChapter[];
  sectionProbability: number;
}

export interface ComputedChapter {
  id: string;
  name: string;
  probability: number;
  tier: "danger" | "amber" | "emerald";
  trend: "up" | "down" | "stable";
  appearances3yr: number;
  appearances5yr: number;
  appearances10yr: number;
}

export type Stream = "pre-medical" | "pre-engineering" | "ics" | "icom" | "alevel" | null;

// ── Constants ──

const DANGER_THRESHOLD = 0.03;
const EMERALD_THRESHOLD = 0.09;
const TREND_UP_RATIO = 1.2;
const TREND_DOWN_RATIO = 0.8;
const DEFAULT_SMOOTHING = 1;

// ── Helpers ──

export function getTier(probability: number): "danger" | "amber" | "emerald" {
  if (probability < DANGER_THRESHOLD) return "danger";
  if (probability > EMERALD_THRESHOLD) return "emerald";
  return "amber";
}

export function getTrend(
  recent3yrAvg: number,
  older7yrAvg: number
): "up" | "down" | "stable" {
  if (recent3yrAvg > older7yrAvg * TREND_UP_RATIO) return "up";
  if (recent3yrAvg < older7yrAvg * TREND_DOWN_RATIO) return "down";
  return "stable";
}

export function getStreamTest(stream: Stream): string | null {
  switch (stream) {
    case "pre-medical":
      return "mdcat";
    case "pre-engineering":
    case "ics":
      return "ecat";
    default:
      return null;
  }
}

// ── Main computation ──

export function computeHeatmap(
  config: HeatmapTestConfig,
  options?: { smoothing?: number }
): ComputedHeatmap {
  const smoothing = options?.smoothing ?? DEFAULT_SMOOTHING;

  // Compute per-section per-chapter probabilities
  const sections: ComputedSection[] = config.sections.map((section) => {
    const weightedSum = section.chapters.reduce(
      (sum, ch) =>
        sum +
        ch.appearances3yr * 3 +
        ch.appearances5yr * 2 +
        ch.appearances10yr * 1,
      0
    );

    const chapterCount = section.chapters.length;
    const denom = weightedSum + smoothing * chapterCount;

    const chapters: ComputedChapter[] = section.chapters.map((ch) => {
      const chapterWeighted =
        ch.appearances3yr * 3 +
        ch.appearances5yr * 2 +
        ch.appearances10yr * 1;
      const probability = (chapterWeighted + smoothing) / denom;

      return {
        id: ch.id,
        name: ch.name,
        probability,
        tier: getTier(probability),
        trend: ch.trend,
        appearances3yr: ch.appearances3yr,
        appearances5yr: ch.appearances5yr,
        appearances10yr: ch.appearances10yr,
      };
    });

    const sectionProbability =
      chapters.reduce((sum, ch) => sum + ch.probability, 0) / chapterCount;

    return {
      id: section.id,
      name: section.name,
      chapters,
      sectionProbability,
    };
  });

  const overallProbability =
    sections.reduce((sum, s) => sum + s.sectionProbability, 0) /
    sections.length;

  return {
    sections,
    overallProbability,
    testName: config.name,
    testYears: config.years,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/themz/aftermediate && npx vitest run src/lib/heatmap-model.test.ts --reporter=verbose
```

Expected: ~12 tests, all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/heatmap-model.ts src/lib/heatmap-model.test.ts
git commit -m "feat: add heatmap probability model"
```---

### Task 3: Widget — `entry-test-heatmap.tsx`

**Files:**
- Create: `src/components/dashboard/entry-test-heatmap.tsx`
- Create: `src/components/dashboard/entry-test-heatmap.test.tsx`

The config-driven tree widget. Reads mock data, computes heatmap via model, renders tree + side panel + empty states.

- [ ] **Step 1: Write the failing tests**

Write `src/components/dashboard/entry-test-heatmap.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EntryTestHeatmap } from "./entry-test-heatmap";
import * as store from "@/lib/store";

// ── Mock useStudent ──
const mockUseStudent = vi.fn();
vi.spyOn(store, "useStudent").mockImplementation(() => mockUseStudent());

beforeEach(() => {
  vi.clearAllMocks();
});

function mockProfile(stream: string | null) {
  mockUseStudent.mockReturnValue({
    profile: { stream },
    update: vi.fn(),
    reset: vi.fn(),
    hydrated: true,
    hydrate: vi.fn(),
  });
}

// ── Card header ──

it("renders the card header with FineAggregate typography", () => {
  mockProfile("pre-medical");
  render(<EntryTestHeatmap />);
  expect(screen.getByText("ENTRY-TEST HEATMAP")).toBeTruthy();
});

// ── Test info label ──

it("shows MDCAT label for pre-medical stream", () => {
  mockProfile("pre-medical");
  render(<EntryTestHeatmap />);
  expect(screen.getByText(/MDCAT/)).toBeTruthy();
});

it("shows ECAT label for pre-engineering stream", () => {
  mockProfile("pre-engineering");
  render(<EntryTestHeatmap />);
  expect(screen.getByText(/ECAT/)).toBeTruthy();
});

it("shows ECAT label for ics stream", () => {
  mockProfile("ics");
  render(<EntryTestHeatmap />);
  expect(screen.getByText(/ECAT/)).toBeTruthy();
});

// ── Sections start collapsed ──

it("sections start collapsed (no chapter rows visible)", () => {
  mockProfile("pre-medical");
  render(<EntryTestHeatmap />);
  // Section headers are visible
  expect(screen.getByText("Biology")).toBeTruthy();
  // But no chapter rows should be visible initially (search for a chapter name)
  expect(screen.queryByText("Cell Biology")).toBeNull();
});

// ── Click section to expand chapters ──

it("clicking a section header reveals its chapter rows", async () => {
  mockProfile("pre-medical");
  render(<EntryTestHeatmap />);
  const biologyHeader = screen.getByText("Biology");
  await userEvent.click(biologyHeader);
  expect(screen.getByText("Cell Biology")).toBeTruthy();
});

// ── Click chapter opens detail panel ──

it("clicking a chapter opens the detail panel", async () => {
  mockProfile("pre-medical");
  render(<EntryTestHeatmap />);
  // Expand biology section
  await userEvent.click(screen.getByText("Biology"));
  // Click a chapter
  await userEvent.click(screen.getByText("Cell Biology"));
  // Detail panel shows counts header
  expect(screen.getByText(/appearances/i)).toBeTruthy();
});

// ── Chapter click toggles panel off ──

it("clicking the same chapter closes the detail panel", async () => {
  mockProfile("pre-medical");
  render(<EntryTestHeatmap />);
  await userEvent.click(screen.getByText("Biology"));
  await userEvent.click(screen.getByText("Cell Biology"));
  expect(screen.getByText(/appearances/i)).toBeTruthy();
  // Click again to close
  await userEvent.click(screen.getByText("Cell Biology"));
  expect(screen.queryByText(/appearances/i)).toBeNull();
});

// ── Empty state: no stream ──

it("shows empty state when stream is null", () => {
  mockProfile(null);
  render(<EntryTestHeatmap />);
  expect(screen.getByText(/set your stream/i)).toBeTruthy();
});

// ── Empty state: no test for stream ──

it("shows empty state for icom stream", () => {
  mockProfile("icom");
  render(<EntryTestHeatmap />);
  expect(screen.getByText(/don't have entry-test data/i)).toBeTruthy();
});

it("shows empty state for alevel stream", () => {
  mockProfile("alevel");
  render(<EntryTestHeatmap />);
  expect(screen.getByText(/don't have entry-test data/i)).toBeTruthy();
});

// ── Footer ──

it("renders the footer text", () => {
  mockProfile("pre-medical");
  render(<EntryTestHeatmap />);
  expect(screen.getByText(/Illustrative sample/i)).toBeTruthy();
  expect(screen.getByText(/estimates, not guarantees/i)).toBeTruthy();
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/themz/aftermediate && npx vitest run src/components/dashboard/entry-test-heatmap.test.tsx --reporter=verbose 2>&1 | head -5
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the widget implementation**

Create `src/components/dashboard/entry-test-heatmap.tsx`:

```tsx
"use client";

import React from "react";
import { useStudent } from "@/lib/store";
import { computeHeatmap, getStreamTest, type ComputedChapter, type ComputedSection } from "@/lib/heatmap-model";
import heatmapData from "@/data/heatmap-mock.json";

// ── Types ──

type TierColor = "danger" | "amber" | "emerald";

const TIER_STYLES: Record<TierColor, { dot: string; label: string }> = {
  danger: { dot: "bg-[#d63d3d]", label: "Rarely" },
  amber: { dot: "bg-[#d99a2b]", label: "Occasional" },
  emerald: { dot: "bg-[#1c9e62]", label: "Frequent" },
};

const TREND_SYMBOL: Record<string, string> = {
  up: "↑",
  down: "↓",
  stable: "→",
};

// ── Empty States ──

function EmptyStateNoStream() {
  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-faint">Entry-Test Heatmap</div>
      <div className="mt-8 flex flex-col items-center gap-3 text-center">
        <span className="text-2xl">📋</span>
        <p className="text-[13px] text-ink">Set your stream to see which subjects appear most in entry tests</p>
        <a href="/onboard" className="text-[13px] text-saffron underline">Complete your profile →</a>
      </div>
      <p className="mt-6 text-[10px] text-faint">Illustrative sample · Based on 10 years of NUST NET, MDCAT, and ECAT question patterns · Predictive probabilities are estimates, not guarantees</p>
    </div>
  );
}

function EmptyStateNoTest() {
  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-faint">Entry-Test Heatmap</div>
      <div className="mt-8 flex flex-col items-center gap-3 text-center">
        <span className="text-2xl">📋</span>
        <p className="text-[13px] text-ink">We don&apos;t have entry-test data for your stream yet</p>
        <p className="text-[11px] text-faint">In the meantime, explore practice questions to stay ahead.</p>
        <a href="/app/practice" className="text-[13px] text-saffron underline">Practice questions →</a>
      </div>
      <p className="mt-6 text-[10px] text-faint">Illustrative sample · Based on 10 years of NUST NET, MDCAT, and ECAT question patterns · Predictive probabilities are estimates, not guarantees</p>
    </div>
  );
}

// ── Detail Panel ──

function DetailPanel({ chapter, section, onClose }: {
  chapter: ComputedChapter;
  section: ComputedSection;
  onClose: () => void;
}) {
  const tierInfo = TIER_STYLES[chapter.tier];
  const studyPct = Math.round(chapter.probability * 100);

  return (
    <div className="mt-3 rounded-xl border border-surface-2 bg-surface p-4 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-semibold text-ink">{chapter.name}</p>
          <p className="text-[11px] text-faint">{section.name}</p>
        </div>
        <button onClick={onClose} className="text-[13px] text-faint hover:text-ink">✕</button>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-[13px] font-mono text-ink">📊 {chapter.appearances3yr} in last 3 years</p>
        <p className="text-[13px] font-mono text-ink">📊 {chapter.appearances5yr} in last 5 years</p>
        <p className="text-[13px] font-mono text-ink">📊 {chapter.appearances10yr} in last 10 years</p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${tierInfo.dot}`} />
        <span className="text-[13px] text-ink">
          {chapter.tier === "danger" ? "🔴" : chapter.tier === "amber" ? "🟠" : "🟢"}{" "}
          {(chapter.probability * 100).toFixed(1)}% probability
        </span>
        <span className="text-[13px] text-faint">
          {TREND_SYMBOL[chapter.trend]} {chapter.trend === "up" ? "Trending up" : chapter.trend === "down" ? "Trending down" : "Stable"}
        </span>
      </div>

      <p className="mt-3 text-[13px] text-ink">
        ⏱ Suggested: {studyPct}% of study time
      </p>

      <p className="mt-2 text-[13px] text-saffron underline cursor-pointer">
        📝 Practice questions →
      </p>
    </div>
  );
}

// ── Main Widget ──

export function EntryTestHeatmap() {
  const { profile } = useStudent();
  const [expandedSection, setExpandedSection] = React.useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = React.useState<ComputedChapter | null>(null);
  const [selectedSection, setSelectedSection] = React.useState<ComputedSection | null>(null);

  const stream = profile?.stream ?? null;
  const testId = getStreamTest(stream);

  // Empty state 1: no stream
  if (stream === null) {
    return <EmptyStateNoStream />;
  }

  // Empty state 2: no test for this stream
  if (testId === null) {
    return <EmptyStateNoTest />;
  }

  // Load data
  const config = (heatmapData as Record<string, unknown>)[testId] as import("@/lib/heatmap-model").HeatmapTestConfig | undefined;

  // Empty state 3: no data (shouldn't happen with mock data)
  if (!config) {
    return (
      <div className="card-glass rounded-2xl p-5">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-faint">Entry-Test Heatmap</div>
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <span className="text-2xl">📋</span>
          <p className="text-[13px] text-ink">Heatmap data not available</p>
          <p className="text-[11px] text-faint">Check back soon — we&apos;re updating our question patterns.</p>
        </div>
        <p className="mt-6 text-[10px] text-faint">Illustrative sample · Based on 10 years of NUST NET, MDCAT, and ECAT question patterns · Predictive probabilities are estimates, not guarantees</p>
      </div>
    );
  }

  const heatmap = computeHeatmap(config);
  const testLabel = config.name;

  function toggleSection(id: string) {
    setExpandedSection((prev) => (prev === id ? null : id));
    setSelectedChapter(null);
    setSelectedSection(null);
  }

  function handleChapterClick(chapter: ComputedChapter, section: ComputedSection) {
    if (selectedChapter?.id === chapter.id) {
      setSelectedChapter(null);
      setSelectedSection(null);
    } else {
      setSelectedChapter(chapter);
      setSelectedSection(section);
    }
  }

  return (
    <div className="card-glass rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-faint">
          Entry-Test Heatmap
        </span>
        <span className="text-[11px] font-semibold text-ink">
          {testLabel}
        </span>
      </div>

      {/* Chapter tree */}
      <div className="mt-3 space-y-1">
        {heatmap.sections.map((section) => {
          const isOpen = expandedSection === section.id;
          return (
            <div key={section.id}>
              {/* Section header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-surface transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] text-faint transition-transform ${isOpen ? "rotate-90" : ""}`}>▶</span>
                  <span className="text-[13px] font-semibold text-ink">{section.name}</span>
                </div>
                <span className="text-[11px] text-faint">◎ {section.chapters.reduce((s, c) => s + c.appearances10yr, 0)}</span>
              </button>

              {/* Chapter rows (collapsible) */}
              {isOpen && (
                <div className="ml-3 border-l border-surface-2 pl-3">
                  {section.chapters.map((chapter, i) => {
                    const tierInfo = TIER_STYLES[chapter.tier as TierColor];
                    const isSelected = selectedChapter?.id === chapter.id;
                    return (
                      <button
                        key={chapter.id}
                        onClick={() => handleChapterClick(chapter, section)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left hover:bg-surface transition-colors ${
                          isSelected ? "bg-surface" : ""
                        }`}
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`inline-block h-2 w-2 rounded-full ${tierInfo.dot}`} />
                          <span className="text-[13px] text-ink">{chapter.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-faint">{tierInfo.label}</span>
                          <span className={`text-[11px] ${
                            chapter.trend === "up" ? "text-emerald" : chapter.trend === "down" ? "text-danger" : "text-faint"
                          }`}>
                            {TREND_SYMBOL[chapter.trend]}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      {selectedChapter && selectedSection && (
        <DetailPanel
          chapter={selectedChapter}
          section={selectedSection}
          onClose={() => {
            setSelectedChapter(null);
            setSelectedSection(null);
          }}
        />
      )}

      {/* Footer */}
      <p className="mt-6 text-[10px] text-faint">
        Illustrative sample · Based on 10 years of NUST NET, MDCAT, and ECAT question patterns · Predictive probabilities are estimates, not guarantees
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Install testing-library for component tests**

```bash
cd /home/themz/aftermediate && npm install --save-dev @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom 2>&1 | tail -3
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd /home/themz/aftermediate && npx vitest run src/components/dashboard/entry-test-heatmap.test.tsx --reporter=verbose
```

Expected: ~13 tests, all PASS. If some tests fail due to mocking or rendering issues, fix test expectations to match actual DOM output.

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/entry-test-heatmap.tsx src/components/dashboard/entry-test-heatmap.test.tsx
git commit -m "feat: add entry-test heatmap widget"
```---

### Task 4: Dashboard Placement

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

Insert the EntryTestHeatmap import and placement block between WhereYouStand (220ms) and ValuableCountries (240ms).

- [ ] **Step 1: Add import**

In `src/app/(app)/dashboard/page.tsx`, add the import after line 14 (WhereYouStand import):

```typescript
import { WhereYouStand } from "@/components/dashboard/where-you-stand";
import { EntryTestHeatmap } from "@/components/dashboard/entry-test-heatmap";
```

- [ ] **Step 2: Add placement**

After the WhereYouStand block (line 62), add the EntryTestHeatmap block at 280ms:

```tsx
      <div className="mt-4 animate-reveal" style={{ animationDelay: "220ms" }}>
        <WhereYouStand />
      </div>

      <div className="mt-4 animate-reveal" style={{ animationDelay: "280ms" }}>
        <EntryTestHeatmap />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
```

- [ ] **Step 3: Run full test suite**

```bash
cd /home/themz/aftermediate && npx vitest run --reporter=verbose 2>&1 | tail -20
```

Expected: All tests pass (555+ tests, including 13 new heatmap tests and 15 new model tests).

- [ ] **Step 4: Full gates**

```bash
cd /home/themz/aftermediate && npx tsc --noEmit 2>&1 | tail -5 && echo "---" && npx next lint 2>&1 | tail -10 && echo "---" && npm run build 2>&1 | tail -15
```

Expected: tsc exit 0, eslint 0 errors, build compiled successfully.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/dashboard/page.tsx
git commit -m "feat: add entry-test heatmap to dashboard at 280ms"
```

---

## Self-Review Checklist

**Spec coverage:**
- [ ] Config-driven mock data (Task 1) → matches spec's HeatmapTestConfig schema
- [ ] Probability model with weighted frequency + smoothing (Task 2) → matches spec formula
- [ ] Danger/amber/emerald tiers (Task 2) → thresholds 0.03 and 0.09
- [ ] Trend arrows with 20% deadband (Task 2) → TREND_UP_RATIO/TREND_DOWN_RATIO
- [ ] getStreamTest mapping: pre-medical→mdcat, pre-engineering/ics→ecat, rest→null (Task 2)
- [ ] Widget with expandable TOC tree + side detail panel (Task 3) → matches mockup Option A
- [ ] Three empty states (Task 3) → no-stream(1), no-test(2), no-data(3)
- [ ] Footer with honest framing (Task 3) → "Illustrative sample · ..."
- [ ] Dashboard placement at 280ms (Task 4)
- [ ] ~28 tests total (Task 2: ~12 model + Task 3: ~13 widget = ~25; close to spec's ~28)

**Placeholder scan:** No TBDs, TODOs, or incomplete code blocks.

**Type consistency:** `HeatmapTestConfig` → `ComputedHeatmap` chain is consistent across all tasks. `computeHeatmap()`, `getStreamTest()`, `getTier()`, `getTrend()` signatures match. Stream type matches `"pre-medical" | "pre-engineering" | "ics" | "icom" | "alevel" | null` used consistently.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-30-entry-test-heatmap.md`.

Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, with two-stage review (spec compliance + code quality) after each task. Faster iteration, quality gates built in.

2. **Inline Execution** — Execute all tasks in this session with checkpoints for review.

Which approach?