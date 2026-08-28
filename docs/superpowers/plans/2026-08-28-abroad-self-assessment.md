# Abroad Self-Assessment Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a timed mock-exam platform at `/abroad/self-assessment` for international standardized tests, reusing the same generic engine as the Pakistan self-assessment.

**Architecture:** Parameterize existing components with optional props — no forking. `PracticeCatalog` gets optional `tests`/`basePath`, `ExamRunner` gets optional `test`. New data file `abroad-tests.json` mirrors `entry-tests.json` shape plus a `category` field for group filters.

**Tech Stack:** Next.js 16.3.2 App Router, React 19, Tailwind 4, vitest, lucide-react

---

### Task 1: Add `category` to EntryTest type + create abroad-tests.json

**Files:**
- Modify: `src/lib/types.ts`
- Create: `src/data/abroad-tests.json`

- [ ] **Step 1: Add optional `category` to EntryTest**

In `src/lib/types.ts`, find `export interface EntryTest` and add `category?: string;` after the existing fields (before the closing brace).

- [ ] **Step 2: Create abroad-tests.json**

Create `src/data/abroad-tests.json` with 8 international tests. Structure:

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
      "syllabus": [
        { "subject": "Listening", "topics": ["Conversations and monologues in everyday contexts", "Academic lectures and discussions", "Following instructions and identifying key information", "Recognising speaker attitude and purpose"] },
        { "subject": "Reading", "topics": ["Reading for gist and main ideas", "Reading for detail and specific information", "Understanding logical argument and writer opinion", "Recognising features of academic texts"] }
      ],
      "howToApply": ["Register on the British Council or IDP website", "Choose test type (Academic or General Training)", "Select test date and centre in Pakistan", "Pay the test fee and confirm your booking"],
      "sourceUrls": ["https://ielts.org", "https://takeielts.britishcouncil.org", "https://ielts.idp.com/pakistan"],
      "note": "MCQ mock covers Listening (40) + Reading (40) only. Writing and Speaking are not auto-graded — practice offline with official prompts."
    },
    {
      "id": "sat",
      "name": "SAT — Scholastic Assessment Test",
      "short": "SAT",
      "category": "undergraduate-admission",
      "conductingBody": "College Board",
      "acceptedBy": ["4,000+ colleges and universities in the US and abroad"],
      "fee": "USD 60 (approx. PKR 16,680 at 2026 rates); additional fees for international test centres",
      "frequency": "7 times per year (March, May, June, August, October, November, December)",
      "validity": "5 years",
      "pattern": [
        { "section": "Reading & Writing", "questions": 54, "marks": 54, "time": "64 minutes" },
        { "section": "Math", "questions": 44, "marks": 44, "time": "70 minutes" }
      ],
      "syllabus": [
        { "subject": "Reading & Writing", "topics": ["Information and ideas: reading comprehension, main ideas, details, inferences", "Craft and structure: vocabulary in context, text structure, purpose", "Expression of ideas: rhetoric, organization, transitions", "Standard English conventions: grammar, punctuation, usage"] },
        { "subject": "Math", "topics": ["Algebra: linear equations, systems, inequalities", "Problem-solving and data analysis: ratios, proportions, statistics", "Advanced math: quadratics, polynomials, functions", "Geometry and trigonometry: circles, triangles, trigonometric ratios"] }
      ],
      "howToApply": ["Create a College Board account at sat.org", "Register for a test date and select a test centre in Pakistan", "Upload a photo and pay the registration fee", "Download your admission ticket before test day"],
      "sourceUrls": ["https://sat.org", "https://collegereadiness.collegeboard.org/sat", "https://satsuite.collegeboard.org/sat/whats-on-the-test"],
      "note": "Digital SAT format (2024+). All sections are MCQ and fully auto-gradeable. SAT reports a 200–800 scale per section; your percentage here is a practice estimate."
    },
    {
      "id": "toefl",
      "name": "TOEFL iBT — Test of English as a Foreign Language",
      "short": "TOEFL",
      "category": "english-proficiency",
      "conductingBody": "Educational Testing Service (ETS)",
      "acceptedBy": ["11,500+ institutions in 160+ countries including the US, Canada, UK, Australia"],
      "fee": "USD 180–240 (approx. PKR 50,000–67,000 at 2026 rates)",
      "frequency": "Multiple dates per month at test centres across Pakistan + Home Edition",
      "validity": "2 years",
      "pattern": [
        { "section": "Reading", "questions": 20, "marks": 20, "time": "35 minutes" },
        { "section": "Listening", "questions": 28, "marks": 28, "time": "36 minutes" },
        { "section": "Speaking", "time": "16 minutes" },
        { "section": "Writing", "time": "29 minutes" }
      ],
      "syllabus": [
        { "subject": "Reading", "topics": ["Reading academic passages", "Understanding vocabulary in context", "Identifying main ideas and details", "Making inferences and rhetorical purposes"] },
        { "subject": "Listening", "topics": ["Academic lectures and discussions", "Conversations on campus", "Understanding speaker intent and organization"] }
      ],
      "howToApply": ["Create an ETS account and register for TOEFL iBT", "Select a test centre in Pakistan or choose the Home Edition", "Pay the test fee and confirm registration", "Take the test at the centre or from home"],
      "sourceUrls": ["https://ets.org/toefl", "https://toefl.org"],
      "note": "Question bank in preparation."
    },
    {
      "id": "gre",
      "name": "GRE — Graduate Record Examination",
      "short": "GRE",
      "category": "graduate-admission",
      "conductingBody": "Educational Testing Service (ETS)",
      "acceptedBy": ["Thousands of graduate and business schools worldwide"],
      "fee": "USD 220 (approx. PKR 61,160 at 2026 rates)",
      "frequency": "Multiple dates per year at test centres across Pakistan + at-home testing",
      "validity": "5 years",
      "pattern": [
        { "section": "Verbal Reasoning", "questions": 27, "marks": 27, "time": "41 minutes" },
        { "section": "Quantitative Reasoning", "questions": 27, "marks": 27, "time": "47 minutes" },
        { "section": "Analytical Writing", "time": "30 minutes" }
      ],
      "syllabus": [
        { "subject": "Verbal Reasoning", "topics": ["Reading comprehension", "Text completion", "Sentence equivalence", "Critical reasoning"] },
        { "subject": "Quantitative Reasoning", "topics": ["Arithmetic and number properties", "Algebra and equation solving", "Geometry and coordinate geometry", "Data analysis and statistics"] }
      ],
      "howToApply": ["Create an ETS account and register for the GRE", "Select a test centre in Pakistan or choose at-home testing", "Pay the test fee and confirm registration", "Download the ETS browser for at-home testing"],
      "sourceUrls": ["https://ets.org/gre", "https://takethegre.com"],
      "note": "Question bank in preparation."
    },
    {
      "id": "gmat",
      "name": "GMAT — Graduate Management Admission Test",
      "short": "GMAT",
      "category": "graduate-admission",
      "conductingBody": "Graduate Management Admission Council (GMAC)",
      "acceptedBy": ["7,000+ graduate business programmes worldwide"],
      "fee": "USD 275 (approx. PKR 76,450 at 2026 rates)",
      "frequency": "Year-round at test centres + online (GMAT Focus Edition)",
      "validity": "5 years",
      "pattern": [
        { "section": "Quantitative Reasoning", "questions": 21, "marks": 21, "time": "45 minutes" },
        { "section": "Verbal Reasoning", "questions": 23, "marks": 23, "time": "45 minutes" },
        { "section": "Data Insights", "questions": 20, "marks": 20, "time": "45 minutes" }
      ],
      "syllabus": [
        { "subject": "Quantitative", "topics": ["Algebra and linear equations", "Ratios, rates and percentages", "Number properties and word problems", "Data sufficiency strategy"] },
        { "subject": "Verbal", "topics": ["Reading comprehension", "Critical reasoning", "Sentence correction"] },
        { "subject": "Data Insights", "topics": ["Data sufficiency", "Multi-source reasoning", "Table and graph analysis", "Two-part analysis"] }
      ],
      "howToApply": ["Create a GMAC account at mba.com", "Register for GMAT Focus Edition", "Select a test centre in Pakistan or schedule online", "Pay the test fee and confirm"],
      "sourceUrls": ["https://mba.com/exams/gmat-focus-edition", "https://gmacexperience.com"],
      "note": "Question bank in preparation."
    },
    {
      "id": "pte",
      "name": "PTE Academic — Pearson Test of English",
      "short": "PTE",
      "category": "english-proficiency",
      "conductingBody": "Pearson PLC",
      "acceptedBy": ["3,000+ institutions globally including UK, Australia, New Zealand, Canada"],
      "fee": "USD 180–210 (approx. PKR 50,000–58,000 at 2026 rates)",
      "frequency": "Year-round at test centres across Pakistan + at-home testing",
      "validity": "2 years",
      "pattern": [
        { "section": "Speaking & Writing", "time": "54–67 minutes" },
        { "section": "Reading", "time": "29–30 minutes" },
        { "section": "Listening", "time": "30–43 minutes" }
      ],
      "syllabus": [
        { "subject": "Reading", "topics": ["Reading and writing fill in the blanks", "Multiple choice single and multiple answer", "Re-order paragraphs"] },
        { "subject": "Listening", "topics": ["Summarise spoken text", "Multiple choice", "Fill in the blanks", "Select missing word"] }
      ],
      "howToApply": ["Create a Pearson PTE account and register", "Select a test centre in Pakistan or choose at-home", "Pay the test fee and confirm registration", "Complete the test day check-in procedures"],
      "sourceUrls": ["https://pearsonpte.com", "https://pearsonpte.com/the-test/format"],
      "note": "Question bank in preparation."
    },
    {
      "id": "duolingo",
      "name": "Duolingo English Test",
      "short": "Duolingo",
      "category": "english-proficiency",
      "conductingBody": "Duolingo, Inc.",
      "acceptedBy": ["4,500+ institutions globally"],
      "fee": "USD 59 (approx. PKR 16,400 at 2026 rates)",
      "frequency": "On-demand, anytime, from home",
      "validity": "2 years",
      "pattern": [
        { "section": "Adaptive: Literacy", "time": "60 minutes (variable, computer-adaptive)" },
        { "section": "Adaptive: Conversation", "time": "60 minutes (variable, computer-adaptive)" },
        { "section": "Adaptive: Comprehension", "time": "60 minutes (variable, computer-adaptive)" },
        { "section": "Adaptive: Production", "time": "60 minutes (variable, computer-adaptive)" }
      ],
      "syllabus": [
        { "subject": "Overview", "topics": ["Computer-adaptive format — difficulty adjusts in real time based on performance", "Not replicable as a static mock exam", "Visit englishtest.duolingo.com for the official free practice test"] }
      ],
      "howToApply": ["Create an account at englishtest.duolingo.com", "Ensure you have a computer with a camera and microphone", "Take the test anytime from home with proctoring", "Share your verified score with institutions for free"],
      "sourceUrls": ["https://englishtest.duolingo.com", "https://englishtest.duolingo.com/faq"],
      "note": "Computer-adaptive test — not replicable as a static mock. Visit englishtest.duolingo.com for the official practice test."
    },
    {
      "id": "act",
      "name": "ACT — American College Test",
      "short": "ACT",
      "category": "undergraduate-admission",
      "conductingBody": "ACT, Inc.",
      "acceptedBy": ["All US colleges and universities that accept the SAT"],
      "fee": "USD 68 (approx. PKR 18,900 at 2026 rates); USD 103 with writing",
      "frequency": "6 times per year (usually September, October, December, February, April, June)",
      "validity": "5 years",
      "pattern": [
        { "section": "English", "questions": 75, "marks": 75, "time": "45 minutes" },
        { "section": "Mathematics", "questions": 60, "marks": 60, "time": "60 minutes" },
        { "section": "Reading", "questions": 40, "marks": 40, "time": "35 minutes" },
        { "section": "Science", "questions": 40, "marks": 40, "time": "35 minutes" },
        { "section": "Writing (optional)", "time": "40 minutes" }
      ],
      "syllabus": [
        { "subject": "English", "topics": ["Production of writing", "Knowledge of language", "Conventions of standard English"] },
        { "subject": "Mathematics", "topics": ["Pre-algebra and elementary algebra", "Intermediate algebra and coordinate geometry", "Plane geometry and trigonometry"] },
        { "subject": "Reading", "topics": ["Key ideas and details", "Craft and structure", "Integration of knowledge and ideas"] },
        { "subject": "Science", "topics": ["Data representation", "Research summaries", "Conflicting viewpoints"] }
      ],
      "howToApply": ["Create a MyACT account", "Register for a test date and select a centre", "Upload a photo and pay the test fee", "Download your admission ticket"],
      "sourceUrls": ["https://act.org", "https://act.org/content/act/en/products-and-services/the-act.html"],
      "note": "Question bank in preparation."
    }
  ]
}
```

- [ ] **Step 3: Verify JSON is valid**

Run: `cd /home/themz/aftermediate && node -e "JSON.parse(require('fs').readFileSync('src/data/abroad-tests.json','utf8')); console.log('VALID')"`
Expected: `VALID`

---

### Task 2: Register abroad tests in practice.ts

**Files:**
- Modify: `src/lib/practice.ts`

- [ ] **Step 1: Add import and exports**

In `src/lib/practice.ts`, after the existing imports:

```ts
import abroadJson from "@/data/abroad-tests.json";
```

After the `export const entryTests = ...` block:

```ts
export const abroadTests = (
  abroadJson as unknown as { dataYear: number; tests: EntryTest[] }
).tests;

export function catalogAbroad(): CatalogItem[] {
  return buildCatalog(abroadTests, banks);
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd /home/themz/aftermediate && npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -10`
Expected: no errors (exit 0)

---

### Task 3: Parameterize PracticeCatalog with optional tests/basePath props

**Files:**
- Modify: `src/components/practice/practice-catalog.tsx`

- [ ] **Step 1: Update the function signature and imports**

Change the export from `PracticeCatalog()` to:

```tsx
export function PracticeCatalog({
  tests: testsProp,
  basePath = "/pakistan/self-assessment",
}: {
  tests?: EntryTest[];
  basePath?: string;
}) {
```

- [ ] **Step 2: Update `items` sourcing**

Replace `const items = catalog();` with:

```tsx
const items = React.useMemo(
  () => (testsProp ? buildCatalog(testsProp, banks) : catalog()),
  [testsProp]
);
```

And import `buildCatalog` from `@/lib/practice` if not already imported. Also import `banks` from `@/lib/practice`.

Actually, `buildCatalog` needs both `tests` and `banks`. Let me check the current imports. The file currently imports: `catalog, bestPercent, attemptsFor` from `@/lib/practice`. I need to add `buildCatalog, banks`.

No wait — `banks` isn't exported currently from practice.ts. Let me check...

Actually `banks` IS exported — it's `export const banks`. But the catalog component doesn't use it directly. The `catalog()` function already handles the merge internally. For the abroad version, I need to call `buildCatalog(tests, banks)` with the provided tests.

So: import `buildCatalog, banks` in addition to the existing imports.

- [ ] **Step 3: Replace hard-coded `/pakistan/self-assessment` with dynamic `basePath`**

Find the `ReadyCard` component's link:
```tsx
<Link href={`/pakistan/self-assessment/${test.id}`}>
```
Change to:
```tsx
<Link href={`${basePath}/${test.id}`}>
```

But `ReadyCard` is a child component inside practice-catalog.tsx. It needs access to `basePath`. Two options:
a. Pass `basePath` as a prop to `ReadyCard` and `PreparationCard`
b. Compute the href inside the main component and pass it as a prop

Option a is simpler. Add `basePath` prop to both `ReadyCard` and `PreparationCard`, use it in their Links.

- [ ] **Step 4: Add category filter for abroad mode**

The stream filter is only relevant for Pakistan tests. When `testsProp` is provided (abroad mode), render category group chips instead:

```tsx
const CATEGORY_LABEL: Record<string, string> = {
  "english-proficiency": "English Proficiency",
  "graduate-admission": "Graduate Admission",
  "undergraduate-admission": "Undergraduate Admission",
};
```

After the existing stream filter block, add a conditional:

```tsx
{/* Category filter (abroad mode) */}
{testsProp && (
  <div className="animate-reveal mb-6 flex flex-wrap gap-2" style={{ animationDelay: "60ms" }}>
    <button
      type="button"
      onClick={() => setCategory("all")}
      aria-pressed={category === "all"}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        category === "all"
          ? "border-saffron/40 bg-saffron/10 text-saffron"
          : "border-line bg-surface text-muted hover:text-ink",
      )}
    >
      All
    </button>
    {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
      <button
        key={key}
        type="button"
        onClick={() => setCategory(key)}
        aria-pressed={category === key}
        className={cn(
          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
          category === key
            ? "border-saffron/40 bg-saffron/10 text-saffron"
            : "border-line bg-surface text-muted hover:text-ink",
        )}
      >
        {label}
      </button>
    ))}
  </div>
)}
```

When `testsProp` is undefined (Pakistan mode), show the existing stream filter. When provided, show the category filter.

For the filtering logic, when abroad mode, items are filtered by category (a `category` state variable). When Pakistan mode, they're filtered by stream (existing `stream` state variable).

Add state: `const [category, setCategory] = React.useState<string>("all");`

- [ ] **Step 5: Update the filtering logic**

Replace:
```tsx
const filtered =
    stream === "all"
      ? items
      : items.filter((i) => i.test.streams.includes(stream));
```

With:
```tsx
const filtered = React.useMemo(() => {
  if (testsProp) {
    // abroad: filter by category
    return category === "all"
      ? items
      : items.filter((i) => "category" in i.test && (i.test as any).category === category);
  }
  // Pakistan: filter by stream
  return stream === "all"
    ? items
    : items.filter((i) => i.test.streams.includes(stream));
}, [items, testsProp, category, stream]);
```

Actually, we need to be more careful. The `category` field is on the JSON data, but `EntryTest` type doesn't know about it yet (we added `category?: string` in Task 1). Since we added optional `category?` to EntryTest, we can safely use:

```tsx
const filtered = React.useMemo(() => {
  if (testsProp) {
    return category === "all"
      ? items
      : items.filter((i) => i.test.category === category);
  }
  return stream === "all"
    ? items
    : items.filter((i) => i.test.streams.includes(stream));
}, [items, testsProp, category, stream]);
```

- [ ] **Step 6: Update footer disclaimer to be dynamic**

Replace the static footer:
```tsx
<p className="...">
  Practice platform &mdash; not affiliated with PM&DC, NUST, or any conducting body.
</p>
```

With:
```tsx
<p className="...">
  {testsProp
    ? "Practice platform — not affiliated with ETS, British Council, College Board, or any testing body. Test patterns change per cycle; confirm on official sources."
    : "Practice platform — not affiliated with PM&DC, NUST, or any conducting body. Patterns change per cycle; confirm on official sources."}
</p>
```

- [ ] **Step 7: Update empty state text**

Replace "No self-assessment tests for this stream yet." with:
```tsx
{testsProp
  ? "No self-assessment tests in this category yet."
  : "No self-assessment tests for this stream yet."}
```

- [ ] **Step 8: Verify typecheck**

Run: `cd /home/themz/aftermediate && npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -10`
Expected: exit 0

---

### Task 4: Parameterize ExamRunner with optional test prop

**Files:**
- Modify: `src/components/practice/exam-runner.tsx`

- [ ] **Step 1: Update function signature**

Change:
```tsx
export function ExamRunner({ testId }: { testId: string })
```
To:
```tsx
export function ExamRunner({ testId, test: testProp }: { testId: string; test?: EntryTest })
```

- [ ] **Step 2: Update test resolution**

Replace `const test = findTest(testId);` with:
```tsx
const test = testProp ?? findTest(testId);
```

- [ ] **Step 3: Fix dynamic base path**

Add a `basePath` variable:
```tsx
const basePath = testProp ? "/abroad/self-assessment" : "/pakistan/self-assessment";
```

Update the three hard-coded `/pakistan/self-assessment` paths:
1. Line 121: `<Link href="/pakistan/self-assessment">` → `<Link href={basePath}>`
2. Line 122: `← Back to all tests` (same link as above)
3. Line 657: `<Link href="/pakistan/self-assessment">` → `<Link href={basePath}>`

- [ ] **Step 4: Update the disclaimer in IntroPhase**

In the `IntroPhase` component, find the footer and make it dynamic. The `IntroPhase` currently receives `bank` and `test` props but not a domain flag. Since `IntroPhase` already receives the test, it can't know the domain context directly. But we can derive it: if the test has no `streams` array (or minimal length), it's an abroad test.

Actually, the simplest approach: pass a `basePath` prop to `IntroPhase`.

```tsx
function IntroPhase({
  test,
  bank,
  mode,
  onModeChange,
  onBegin,
  active,
  onResume,
  onDiscard,
  basePath,
}: {
  // ...existing props...
  basePath: string;
}) {
```

And in the `IntroPhase` footer:
```tsx
<p className="mt-10 text-xs text-faint">
  {basePath === "/abroad/self-assessment"
    ? "Practice platform — not affiliated with ETS, British Council, College Board, or any testing body. Test patterns change per cycle; confirm on official sources."
    : "Practice platform — not affiliated with PM&DC, NUST, or any conducting body. Patterns change per cycle; confirm on official sources."}
</p>
```

And in the `InPreparationPanel` back link:
```tsx
<Link href={basePath}>
```

And in the main component (not found/error state):
```tsx
<Link href={basePath}>
```

- [ ] **Step 5: Pass `basePath` to `IntroPhase` in main render**

Find the `<IntroPhase` invocation and add `basePath={basePath}`.

- [ ] **Step 6: Verify typecheck**

Run: `cd /home/themz/aftermediate && npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -10`
Expected: exit 0

---

### Task 5: Create abroad route pages

**Files:**
- Create: `src/app/(app)/abroad/self-assessment/page.tsx`
- Create: `src/app/(app)/abroad/self-assessment/[testId]/page.tsx`

- [ ] **Step 1: Create abroad catalog page**

Create `src/app/(app)/abroad/self-assessment/page.tsx`:

```tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { PracticeCatalog } from "@/components/practice/practice-catalog";
import { abroadTests } from "@/lib/practice";

export default function AbroadSelfAssessmentPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="animate-reveal flex items-center gap-2">
        <Badge variant="saffron">Abroad</Badge>
        <span className="font-mono text-xs text-faint">international tests</span>
      </div>
      <h1
        className="animate-reveal mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl"
        style={{ animationDelay: "60ms" }}
      >
        Self Assessment
      </h1>
      <p
        className="animate-reveal mt-2 max-w-xl text-muted"
        style={{ animationDelay: "120ms" }}
      >
        Timed mock exams for international standardized tests &mdash; practice
        with IELTS, SAT, and more under real exam conditions.
      </p>
      <div
        className="animate-reveal mt-8"
        style={{ animationDelay: "180ms" }}
      >
        <PracticeCatalog tests={abroadTests} basePath="/abroad/self-assessment" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create abroad [testId] route page**

Create `src/app/(app)/abroad/self-assessment/[testId]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { abroadTests } from "@/lib/practice";
import { ExamRunner } from "@/components/practice/exam-runner";

export function generateStaticParams() {
  return abroadTests.map((test) => ({ testId: test.id }));
}

export default async function AbroadSelfAssessmentTestPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;
  const test = abroadTests.find((t) => t.id === testId);
  if (!test) {
    notFound();
  }
  return <ExamRunner testId={testId} test={test} />;
}
```

- [ ] **Step 3: Verify typecheck**

Run: `cd /home/themz/aftermediate && npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -10`
Expected: exit 0

---

### Task 6: Update sidebar

**Files:**
- Modify: `src/components/sidebar.tsx`

- [ ] **Step 1: Add Self Assessment link**

In the Education Abroad group (around line 57-65), add a "Self Assessment" link after "Test Prep" and before "Ivy League":

```tsx
      { href: "/abroad/test-prep", label: "Test Prep", icon: BookOpenCheck },
      { href: "/abroad/self-assessment", label: "Self Assessment", icon: PenLine },
      { href: "/abroad/ivy-league", label: "Ivy League", icon: Landmark },
```

The `PenLine` icon is already imported (from the Pakistan sidebar edit in the previous session — verify it exists in the imports).

Check the imports at the top of `sidebar.tsx` — `PenLine` should already be imported from `lucide-react`. If not, add it.

---

### Task 7: Build IELTS and SAT question banks (parallel content agents)

**Files:**
- Create: `src/data/practice-ielts.json` (80 questions)
- Create: `src/data/practice-sat.json` (98 questions)

**Strategy:** Use 4 parallel content agents (same pattern as the Pakistan self-assessment):
- Agent A: IELTS Listening (40 Qs, 4 recordings × 10 Qs)
- Agent B: IELTS Reading (40 Qs, 3 passages)
- Agent C: SAT Reading & Writing (54 Qs)
- Agent D: SAT Math (44 Qs)

Then merge into final JSON files with spec metadata.

#### Agent prompt for IELTS Listening (40 Qs)

Dispatch a GeneralPurpose agent targeting `src/data/practice-part-ielts-listening.json`. Author 40 listening comprehension MCQs for IELTS Academic. Follow the same question format as `src/data/practice-net.json` (PracticeQuestion shape: id, section, topic, difficulty, stem, options[4], correct, explanation, provenance, sourceUrls).

- 4 listening sub-sections (Listening-1 through Listening-4), 10 Qs each
- Topics: everyday conversations, academic lectures, discussions, directions/talks
- Provenance: `practice` with sourceUrls to `https://takeielts.britishcouncil.org` and `https://ielts.org`
- Section in the question object: `"listening"`
- Each question simulates a listening comprehension item (the stem describes the audio scenario since audio can't be embedded)

#### Agent prompt for IELTS Reading (40 Qs)

Dispatch a GeneralPurpose agent targeting `src/data/practice-part-ielts-reading.json`. Author 40 reading comprehension MCQs for IELTS Academic. 

- 3 passages (Reading-1, Reading-2, Reading-3) — passage topics: science, history/society, opinion/argument
- Question types: multiple choice, matching headings to paragraphs, true/false/not given (as 4 options: True/False/Not Given/Can't Tell), sentence completion
- Section: `"reading"`
- Provenance: `practice` with sourceUrls to Cambridge IELTS practice materials and British Council sample tests

#### Agent prompt for SAT Reading & Writing (54 Qs)

Dispatch a GeneralPurpose agent targeting `src/data/practice-part-sat-rw.json`. Author 54 SAT Reading & Writing MCQs.

- Reading passages (literature, history/social studies, science) with comprehension and vocabulary-in-context questions
- Writing questions (grammar, punctuation, rhetoric, organization) as standalone or passage-based
- Section: `"reading-writing"`
- Provenance: `practice` with sourceUrls to `https://satsuite.collegeboard.org/sat/whats-on-the-test` and College Board sample questions

#### Agent prompt for SAT Math (44 Qs)

Dispatch a GeneralPurpose agent targeting `src/data/practice-part-sat-math.json`. Author 44 SAT Math MCQs.

- Topics: algebra, problem-solving and data analysis, advanced math, geometry/trigonometry
- All questions MCQ (4 options) — no grid-in questions for the practice mock
- Section: `"math"`
- Provenance: `practice` with sourceUrls to `https://satsuite.collegeboard.org/sat/whats-on-the-test`

#### Merge step

After all 4 agents complete, write and run a merge script:

```js
const fs = require("fs");
const D = "src/data/";

function read(f) { return JSON.parse(fs.readFileSync(D + f, "utf8")); }

// IELTS: Listening 40 + Reading 40 = 80 Qs
const ieltsParts = [read("practice-part-ielts-listening.json"), read("practice-part-ielts-reading.json")];
const allIelts = ieltsParts.flatMap(p => p.questions);

const ieltsBank = {
  testId: "ielts",
  schemaVersion: 1,
  provenance: {
    note: "Practice questions written to the official IELTS Academic syllabus (British Council/IDP). Listening: 4 sections with 10 questions each covering everyday and academic contexts. Reading: 3 passages covering scientific, historical and argumentative texts with multiple question types.",
    sources: ["https://ielts.org", "https://takeielts.britishcouncil.org", "https://ielts.idp.com/pakistan"]
  },
  durationMinutes: 90,
  marking: {
    perQuestionMarks: 1,
    correctMarks: 1,
    negativeMarks: 0,
    totalMarks: 80,
    note: "No negative marking. IELTS band scores are a 1–9 scale combining all four sections. Your percentage here is an approximation of Listening + Reading readiness, not a band score."
  },
  benchmarks: [
    { label: "Band 7.0 · Good user", percent: 75 },
    { label: "Band 6.5 · Competent user", percent: 65 },
    { label: "Band 6.0 · Modest user", percent: 55 }
  ],
  sections: [
    { id: "listening", name: "Listening", questionCount: 40 },
    { id: "reading", name: "Reading", questionCount: 40 }
  ],
  questions: allIelts
};

fs.writeFileSync(D + "practice-ielts.json", JSON.stringify(ieltsBank, null, 2));

// SAT: Reading & Writing 54 + Math 44 = 98 Qs
const satParts = [read("practice-part-sat-rw.json"), read("practice-part-sat-math.json")];
const allSat = satParts.flatMap(p => p.questions);

const satBank = {
  testId: "sat",
  schemaVersion: 1,
  provenance: {
    note: "Practice questions written to the official SAT (Digital SAT 2024+) syllabus by College Board. Reading & Writing: passages covering literature, history/social studies, and science plus standard English conventions. Math: algebra, problem-solving, advanced math, and geometry/trigonometry at the official difficulty distribution.",
    sources: ["https://satsuite.collegeboard.org/sat/whats-on-the-test", "https://sat.org"]
  },
  durationMinutes: 134,
  marking: {
    perQuestionMarks: 1,
    correctMarks: 1,
    negativeMarks: 0,
    totalMarks: 98,
    note: "No negative marking (College Board policy since 2016). SAT reports a 200–800 scale per section; your raw percentage here is a practice estimate, not an official score."
  },
  benchmarks: [
    { label: "1400 (75th percentile approx)", percent: 87.5 },
    { label: "1200 (50th percentile approx)", percent: 75 },
    { label: "1000 (25th percentile approx)", percent: 62.5 }
  ],
  sections: [
    { id: "reading-writing", name: "Reading & Writing", questionCount: 54 },
    { id: "math", name: "Math", questionCount: 44 }
  ],
  questions: allSat
};

fs.writeFileSync(D + "practice-sat.json", JSON.stringify(satBank, null, 2));

// Clean up parts
["practice-part-ielts-listening.json", "practice-part-ielts-reading.json",
 "practice-part-sat-rw.json", "practice-part-sat-math.json"].forEach(f => {
  try { fs.unlinkSync(D + f); } catch {}
});

// Validate
for (const [name, bank] of [["ielts", ieltsBank], ["sat", satBank]]) {
  const qs = bank.questions;
  const invalid = qs.filter(q => !q.id || !q.stem || !q.options || q.options.length !== 4 || typeof q.correct !== "number" || !q.explanation || !q.provenance || !Array.isArray(q.sourceUrls));
  console.log(`${name}: ${qs.length} Qs, invalid=${invalid.length}`);
}

console.log("DONE");
```

#### Register in practice.ts

After merge, add the two new banks to the `banks` map in `practice.ts`:

```ts
import ieltsJson from "@/data/practice-ielts.json";
import satJson from "@/data/practice-sat.json";

const ieltsBank = ieltsJson as unknown as PracticeBank;
const satBank = satJson as unknown as PracticeBank;

export const banks: Record<string, PracticeBank> = {
  net: netBank,
  mdcat: mdcatBank,
  ielts: ieltsBank,
  sat: satBank,
};
```

---

### Task 8: Bank validation tests

**Files:**
- Create: `src/data/practice-banks-abroad.test.ts`

- [ ] **Step 1: Create bank tests**

```tsx
import { describe, expect, it } from "vitest";
import ieltsBank from "./practice-ielts.json";
import satBank from "./practice-sat.json";

interface BankQuestion {
  id: string; section: string; topic: string; difficulty: string;
  stem: string; options: string[]; correct: number;
  explanation: string; provenance: string; sourceUrls: string[];
}

interface Bank {
  testId: string; schemaVersion: number;
  provenance: { note: string; sources: string[] };
  durationMinutes: number;
  marking: {
    perQuestionMarks: number; correctMarks: number;
    negativeMarks: number; totalMarks: number; note: string;
  };
  benchmarks: { label: string; percent: number }[];
  sections: { id: string; name: string; questionCount: number }[];
  questions: BankQuestion[];
}

const banks: Record<string, Bank> = {
  ielts: ieltsBank as unknown as Bank,
  sat: satBank as unknown as Bank,
};

const SCHEMA: Record<string, { sections: Record<string, number>; duration: number }> = {
  ielts: { sections: { listening: 40, reading: 40 }, duration: 90 },
  sat: { sections: { "reading-writing": 54, math: 44 }, duration: 134 },
};

describe("Abroad practice banks", () => {
  for (const [testId, bank] of Object.entries(banks)) {
    const schema = SCHEMA[testId];

    describe(testId, () => {
      it("has correct total questions", () => {
        const total = Object.values(schema.sections).reduce((a, b) => a + b, 0);
        expect(bank.questions.length).toBe(total);
      });

      it("has correct duration", () => {
        expect(bank.durationMinutes).toBe(schema.duration);
      });

      it("has correct section question counts", () => {
        for (const [secId, count] of Object.entries(schema.sections)) {
          expect(bank.questions.filter((q) => q.section === secId).length).toBe(count);
        }
      });

      it("has valid testId", () => {
        expect(bank.testId).toBe(testId);
      });

      it("has schemaVersion", () => {
        expect(bank.schemaVersion).toBe(1);
      });

      it("has provenance with sources", () => {
        expect(bank.provenance.note).toBeTruthy();
        expect(bank.provenance.sources.length).toBeGreaterThan(0);
      });

      it("has marking with correctMarks and negativeMarks", () => {
        expect(typeof bank.marking.correctMarks).toBe("number");
        expect(typeof bank.marking.negativeMarks).toBe("number");
        expect(bank.marking.perQuestionMarks).toBe(1);
      });

      it("has all sections referenced in questions", () => {
        const sectionIds = new Set(bank.sections.map((s) => s.id));
        for (const q of bank.questions) {
          expect(sectionIds.has(q.section)).toBe(true);
        }
      });

      it("has valid questions", () => {
        const ids = new Set<string>();
        for (const q of bank.questions) {
          expect(q.id).toBeTruthy();
          expect(ids.has(q.id)).toBe(false);
          ids.add(q.id);
          expect(q.stem).toBeTruthy();
          expect(q.options.length).toBe(4);
          expect(q.correct).toBeGreaterThanOrEqual(0);
          expect(q.correct).toBeLessThanOrEqual(3);
          expect(q.explanation).toBeTruthy();
          expect(["easy", "medium", "hard"]).toContain(q.difficulty);
          expect(["official-sample", "past-paper", "practice"]).toContain(q.provenance);
          expect(q.sourceUrls.length).toBeGreaterThan(0);
          for (const url of q.sourceUrls) {
            expect(url.startsWith("https://")).toBe(true);
          }
          expect(q.topic).toBeTruthy();
        }
      });
    });
  }
});
```

- [ ] **Step 2: Run tests**

Run: `cd /home/themz/aftermediate && npx vitest run src/data/practice-banks-abroad.test.ts`
Expected: all tests pass

---

### Task 9: Full verification

- [ ] **Step 1: Run all tests**

Run: `cd /home/themz/aftermediate && npx vitest run`
Expected: all tests pass (previous + abroad bank tests)

- [ ] **Step 2: TypeScript check**

Run: `cd /home/themz/aftermediate && npx tsc --noEmit`
Expected: exit 0

- [ ] **Step 3: ESLint on new files**

Run:
```bash
cd /home/themz/aftermediate && npx eslint src/components/practice/practice-catalog.tsx src/components/practice/exam-runner.tsx "src/app/(app)/abroad/self-assessment/" src/components/sidebar.tsx 2>&1
```
Expected: no errors

- [ ] **Step 4: Production build**

Run: `cd /home/themz/aftermediate && npx next build 2>&1 | tail -20`
Expected: build succeeds, `/abroad/self-assessment` listed as static, `[testId]` listed as SSG with 8 generated paths