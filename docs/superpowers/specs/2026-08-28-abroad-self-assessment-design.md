# Abroad Self-Assessment Mock Test Platform — Design Spec

Date: 2026-08-28
Status: Approved by user
Reference: Pakistan self-assessment platform (same engine, parameterized for abroad tests)
Inspiration: ieltsonlinetests.com adapted for Pakistani students preparing for international exams

## 1. Summary

An interactive, timed mock-exam platform at `/abroad/self-assessment` for international standardized tests, mirroring the existing Pakistan self-assessment architecture. The same generic engine (`src/lib/practice.ts`, `exam-runner.tsx`, `exam-results.tsx`, `practice-catalog.tsx`) is reused with optional `tests` and `basePath` props — no forking, no duplication.

**Proof of concept scope (this spec):** IELTS + SAT banks, the abroad catalog route, the abroad `[testId]` route, a category-group filter replacing stream filters, sidebar link in the Education Abroad group, and the dashboard card already works (it reads `profile.practice` which stores across all testIds). The catalog lists **8+** international tests; tests without a bank show "question bank in preparation."

Expansion plan: TOEFL, GRE, GMAT, PTE, Duolingo, ACT, Cambridge English in follow-up batches — each is a pure content task (new bank JSON + registering in the banks map, zero engine changes).

## 2. Confirmed decisions

| Decision | Outcome |
| --- | --- |
| POC tests | IELTS (80 MCQ Qs: Listening + Reading) and SAT (98 MCQ Qs: all sections) |
| Non-MCQ handling | IELTS Writing/Speaking listed on the intro card as "not auto-graded — practice offline with the official prompts." Bank covers only MCQ sections. |
| Catalog organization | Category group chips: English Proficiency, Graduate Admission, Undergraduate Admission. Stream filters are not used (they only apply to Pakistani entry tests). |
| Architecture | Parameterize existing components: `PracticeCatalog` accepts optional `tests`/`basePath`; `ExamRunner` accepts optional `test` prop. Pakistan routes pass nothing and work identically. |
| Footer disclaimer | "Practice platform — not affiliated with ETS, British Council, College Board, or any testing body. Test patterns change per cycle; confirm on official sources." |
| Question sourcing | Same hybrid approach: official sample papers (cited), bank-sourced past-paper-style (platform URL cited), original practice questions (labeled `practice`). Every question carries provenance. |
| Attempt storage | Already works — `profile.practice` stores attempts by `testId`; `PracticeAttempt` has `testId` field; the dashboard `PracticeSummary` card reads from it and shows results for ALL tests (Pakistan + abroad). No schema changes needed. |
| Profile column | Already added in the previous session — `practice jsonb` is on `profiles`, `ProfileSync` selects/upserts it, sidebar link pattern already done. |
| Auth | Open to guests and signed-in users (same as every `(app)` page). |

## 3. Architecture

```
src/data/abroad-tests.json              abroad test definitions (EntryTest[])   (+ .test.ts)
src/data/practice-ielts.json            bank: IELTS Listening + Reading (80 Qs)  (+ .test.ts)
src/data/practice-sat.json              bank: SAT (98 Qs)                        (+ .test.ts)
src/lib/practice.ts                     + abroadTests export + catalogAbroad()
src/components/practice/practice-catalog.tsx   + optional tests/basePath props
src/components/practice/exam-runner.tsx        + optional test prop
src/app/(app)/abroad/self-assessment/page.tsx              catalog page (client wrapper)
src/app/(app)/abroad/self-assessment/[testId]/page.tsx      route wrapper (server, generateStaticParams)
src/components/sidebar.tsx              + "Self Assessment" link in Education Abroad
```

No API routes, no database reads for content.

### 3.1 Component parameterization

```tsx
// practice-catalog.tsx — props change
export function PracticeCatalog({
  tests: testsProp,
  basePath = "/pakistan/self-assessment",
}: {
  tests?: EntryTest[];
  basePath?: string;
}) {
  const items = testsProp ? buildCatalog(testsProp, banks) : catalog();
  // When testsProp is undefined, stream filter shown (Pakistan).
  // When testsProp is provided, category filter shown (abroad) with category: "english-proficiency" | "graduate-admission" | "undergraduate-admission"
  // All internal links use basePath + "/" + test.id
}

// exam-runner.tsx — props change
export function ExamRunner({
  testId,
  test: testProp,
}: {
  testId: string;
  test?: EntryTest;
}) {
  const test = testProp ?? findTest(testId);  // findTest falls back to catalog()
  // All internal "Back to" links use a computed basePath:
  const basePath = testProp ? "/abroad/self-assessment" : "/pakistan/self-assessment";
}
```

### 3.2 Catalog category filter

When `tests` array is provided (abroad mode), replace stream filter chips with category group chips:

- "All"
- "English Proficiency" (tests with `category: "english-proficiency"`)
- "Graduate Admission" (`category: "graduate-admission"`)
- "Undergraduate Admission" (`category: "undergraduate-admission"`)

The `abroad-tests.json` EntryTest entries carry a `category: string` field. The `EntryTest` type in `types.ts` gains `category?: string` (backward compatible — existing Pakistan tests simply won't have it). Chips use the same `aria-pressed` styling as stream chips.

## 4. Tests data (`src/data/abroad-tests.json`)

Same `EntryTest` shape as `entry-tests.json` plus an optional `category` field:

```jsonc
{
  "dataYear": 2026,
  "tests": [
    {
      "id": "ielts",
      "name": "IELTS — International English Language Testing System",
      "short": "IELTS",
      "category": "english-proficiency",
      "conductingBody": "British Council / IDP / Cambridge Assessment English",
      "acceptedBy": ["10,000+ institutions worldwide including UK, Australia, Canada, New Zealand, US"],
      "fee": "USD 215–250 (approx. PKR 60,000–70,000 at 2026 rates)",
      "frequency": "Multiple dates per month at test centres across Pakistan",
      "validity": "2 years",
      "pattern": [
        { "section": "Listening", "questions": 40, "marks": 40, "time": "30 minutes" },
        { "section": "Reading", "questions": 40, "marks": 40, "time": "60 minutes" },
        { "section": "Writing", "time": "60 minutes" },
        { "section": "Speaking", "time": "11–14 minutes" }
      ],
      "syllabus": [...],
      "sourceUrls": ["https://ielts.org", "https://takeielts.britishcouncil.org"],
      "note": "MCQ mock covers Listening (40) + Reading (40) only. Writing and Speaking are not auto-graded — practice offline with official prompts."
    }
    // ... SAT, TOEFL, GRE, GMAT, PTE, Duolingo, ACT, Cambridge
  ]
}
```

### 4.1 Complete test catalog (8 tests listed, 2 built in POC)

| Test | Category | Pattern | Auto-gradeable | POC |
|------|----------|---------|---------------|-----|
| IELTS | English Proficiency | Listening 40+Reading 40+Writing+Speaking | 80/40+40=80 Qs | Yes |
| SAT | Undergraduate Admission | R&W 54+Math 44=98 | 98 Qs | Yes |
| TOEFL | English Proficiency | Reading 20-30+Listening 28-39+Speaking+Writing | ~58 MCQ Qs | No |
| PTE | English Proficiency | Speaking&Writing+Reading+Listening | Mixed, ~30 MCQ | No |
| Duolingo | English Proficiency | Adaptive (Literacy+Conversation+Production) | Not replicable | No |
| GRE | Graduate Admission | Verbal 27+Quant 27+Analytical Writing | 54 Qs | No |
| GMAT | Graduate Admission | Quant 21+Verbal 23+Data Insights 20 | 64 Qs | No |
| ACT | Undergraduate Admission | English 75+Math 60+Reading 40+Science 40 | 215 Qs | No |

Duolingo is listed but marked with a note: "Computer-adaptive test — not replicable as a static mock. Visit englishtest.duolingo.com for the official practice test."

## 5. IELTS bank (`src/data/practice-ielts.json`)

**Scope:** Listening (40 Qs, 4 recordings) + Reading (40 Qs, 3 passages). The engine presents all 80 questions in a unified timed flow (90 min total). In the real test, Listening + Reading are back-to-back.

**Marking:**
```jsonc
"marking": {
  "perQuestionMarks": 1,
  "correctMarks": 1,
  "negativeMarks": 0,
  "totalMarks": 80,
  "note": "No negative marking. IELTS band scores are a 1–9 scale combining all four sections. Your percentage here is an approximation of Listening + Reading readiness, not a band score."
},
"benchmarks": [
  { "label": "Band 7.0 · Good user", "percent": 75 },
  { "label": "Band 6.5 · Competent user", "percent": 65 },
  { "label": "Band 6.0 · Modest user", "percent": 55 }
]
```

**Sections:**
- `listening`: 40 Qs (4 recordings with 10 Qs each → 4 sub-sections labeled Listening-1 through Listening-4)
- `reading`: 40 Qs (3 passages with 13-14 Qs each → labeled Reading-1 through Reading-3)

**Question types (mix across sections):** Multiple choice, matching headings, true/false/not given, sentence completion, diagram labelling, short answer. All represented as 4-option MCQs in the bank (TFNG mapped to "True" / "False" / "Not Given" / "Can't tell" as 4-option). Each question has a `sourceUrls` reference to the official Cambridge IELTS practice materials or British Council sample tests.

**Quick mode:** stride-2 = 40 Qs, ~45 min.

### 5.1 IELTS academic vs general training

The POC covers the **Academic** format (most common for Pakistani university applicants). General Training listed in the notes as "Use the same Listening mock; Reading and Writing differ — available in a future update."

## 6. SAT bank (`src/data/practice-sat.json`)

**Scope:** Full SAT (Digital SAT format from 2024 onward). 98 questions, 134 min.

**Marking:**
```jsonc
"marking": {
  "perQuestionMarks": 1,
  "correctMarks": 1,
  "negativeMarks": 0,
  "totalMarks": 98,
  "note": "No negative marking (College Board policy since 2016). SAT reports a 200–800 scaled score per section; your raw percentage here is a practice estimate, not an official score."
},
"benchmarks": [
  { "label": "1400 (75th percentile approx)", "percent": 87.5 },
  { "label": "1200 (50th percentile approx)", "percent": 75 },
  { "label": "1000 (25th percentile approx)", "percent": 62.5 }
]
```

**Sections:**
- `reading-writing`: 54 Qs, 64 min. Passages from literature, history/social studies, science; reading comprehension + grammar/writing questions (standard English conventions, expression of ideas).
- `math`: 44 Qs, 70 min. Algebra, problem-solving, advanced math, geometry/trigonometry. All questions are MCQs (the digital SAT uses MCQ-only; no grid-ins for the practice mock).

**Quick mode:** stride-2 = 50 Qs, ~67 min.

### 6.1 SAT calculator policy

Math section allows calculator (the digital SAT has a built-in Desmos calculator). The mock mentions: "Calculators are allowed on all Math questions. Use the Desmos calculator at desmos.com/scientific."

## 7. UI changes

### 7.1 Abroad catalog page

Same header pattern as Pakistan: `Badge variant="saffron"` "Abroad" (not "Pakistan"), h1 "Self Assessment", sub about international test preparation.

Category group chips replace stream chips. Styling is identical (`aria-pressed`, saffron active, same `rounded-full border` classes). Footer disclaimer uses the abroad variant.

### 7.2 Exam intro — IELTS specific

The intro card for IELTS:
- Pattern table shows all 4 sections (Listening, Reading, Writing, Speaking) with marks only for MCQ sections
- A prominent info badge: "This mock covers Listening and Reading (80 MCQs). Writing and Speaking are not auto-graded."
- The "Choose your format" mode cards still offer Full (80 Qs / 90 min) and Quick (40 Qs / ~45 min) for the MCQ sections
- No Writing/Speaking prompts in the bank — those sections are listed for information only

### 7.3 Exam intro — SAT specific

- Pattern table shows Reading & Writing (54 Qs, 64 min) and Math (44 Qs, 70 min) — all MCQ
- Calculator policy noted
- Benchmark chips showing percentile approximations (1400/1200/1000)

### 7.4 Sidebar

Education Abroad group gets a new link inserted after Test Prep, before Ivy League:
```
{ href: "/abroad/self-assessment", label: "Self Assessment", icon: PenLine }
```

## 8. Conventions & quality bar

- Same repo conventions as Pakistan version: `card-glass`, design tokens, `animate-reveal`, canonical ARIA, `type="button"`, no setState-in-effect (timer tick excepted), no nested component definitions
- Data honesty: every IELTS question carries an `explanation` and `sourceUrls` to official Cambridge/British Council materials; SAT questions cite College Board sample questions or are labeled `practice` with College Board syllabus URLs
- Band/score caveats on every benchmark and the score hero — no claim that a practice percentage equals an official band or scaled score
- The intro screen for every abroad test shows a provenance note: how the bank was assembled, which sections are covered, any caveats

## 9. Edge cases

- Duolingo English Test: listed in the catalog with a special note (computer-adaptive, not replicable). The `[testId]` route for "duolingo" renders a custom explanation panel (no Begin button).
- IELTS Writing/Speaking: the route page shows these sections with a "practice offline" note — the `InPreparationPanel` variant for partial coverage.
- Same transient storage rules as Pakistan: `ActiveExam` and `StoredResult` keys are shared between domains. If someone has a Pakistan exam in progress and starts an abroad one, the existing discard-banner system handles it (the runner checks `active.testId` match).
- The `bank.marking.note` on IELTS and SAT carries the score caveat in its `note` field — it appears automatically on the intro card.

## 10. Testing

Bank tests follow the same pattern as `practice-banks.test.ts`:
- Import `abroad-tests.json`; assert per-section counts match the pattern
- Per-question: unique ids, 4 options, valid correct index, non-empty stem + explanation, provenance enum, https sourceUrls, valid section reference

Lib tests: `catalogAbroad()` returns correct ready/preparation statuses. No new lib tests needed for the engine — it's the same code path.

## 11. Expansion path (post-POC)

| Batch | Tests | Effort |
|-------|-------|--------|
| 2 | TOEFL + PTE | ~130 Qs TOEFL (Reading+Listening), ~50 Qs PTE — both have mixed-format challenges |
| 3 | GRE + GMAT | 54 + 64 Qs, fully MCQ, straightforward banks |
| 4 | ACT | 215 Qs (largest single bank), all MCQ but many questions to author |
| 5 | Duolingo | Not replicable as static mock — special informational panel only |

## 12. Out of scope

Speaking/Writing auto-grading, adaptive difficulty, proctoring, cross-device exam resume, score conversion to official band/scaled scores, AI essay feedback, PDF certificate generation.