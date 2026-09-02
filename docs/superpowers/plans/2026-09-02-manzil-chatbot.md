# Manzil A.I Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the Manzil persona a real knowledge base — derived from the Pakistani universities / entry-tests / scholarships JSON plus four hand-authored guidance topics — and wire it into the existing BM25 chat pipeline, replacing the frontend's canned replies.

**Architecture:** A pure derivation module (`src/lib/pakistan-facts.ts`) turns the three existing JSON datasets into `KnowledgeTopic[]`. A knowledge-base module (`src/data/pakistan-chatbot-knowledge.ts`) merges those with four authored guidance topics and exports one `KnowledgeBase`. Four small edits register the persona. Nothing in `/api/chat` changes — the route is persona-agnostic.

**Tech Stack:** TypeScript, Next.js 16 (App Router), vitest, existing BM25 retrieval in `src/lib/knowledge.ts`.

**Spec:** `docs/superpowers/specs/2026-09-02-manzil-chatbot-design.md`

## Global Constraints

- **Do NOT commit.** The user has explicitly deferred all commits: "we will commit everything later when done." Every task ends with a verification step instead of a commit step. Do not run `git commit`, `git add`, or create branches.
- **Node comes from nvm.** System node is v18 and too old. Start every shell with:
  `export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"`
- **Known-bad test baseline.** `src/components/builder/builder.test.tsx` > "AI Polish turns raw notes into 3 polished bullets after the 600ms animation" fails at HEAD, unrelated to this work. The suite is also flaky under default parallelism (observed 8, then 20, then 3 failures on identical code). Use `npx vitest run --no-file-parallelism` for any full-suite run and compare against that baseline rather than expecting green.
- **Every fact must carry an `https://` source.** Retrieved facts are printed into the model's prompt with their URL for citation.
- **Never manufacture precision the JSON does not have.** Scholarship deadlines read "Cycle-based (announced by HEC each year)"; MDCAT's fee reads "Announced per cycle (PKR 9,000 local centres in the 2025 cycle)". Copy such fields verbatim into fact text. Never compute, round, or infer a concrete date from a vague one. A bot inventing a scholarship deadline costs a student a year.
- **Every derived fact must name its own subject.** BM25 scores individual facts; `topicId` is metadata that does not participate in matching. A fact reading "tuition is PKR X per semester" is unreachable by any query. It must read "NUST (National University of Sciences & Technology), Islamabad …".
- **Explicit interfaces for JSON, never inferred types.** `programFees` is present on only 6 of 12 university records, so TypeScript infers a union across heterogeneous members and naive property access fails to compile. Every task below declares its own record interface and casts the import once.
- **`KnowledgeFact` and `KnowledgeTopic` are exported from `src/data/abroad-chatbot-knowledge.ts`.** That is where the existing types live and where `src/lib/knowledge.ts` imports them from. Import them from there; do not redefine them.

---

### Task 1: Derive university topics

**Files:**
- Create: `src/lib/pakistan-facts.ts`
- Create: `src/lib/pakistan-facts.test.ts`

**Interfaces:**
- Consumes: `KnowledgeFact`, `KnowledgeTopic` from `@/data/abroad-chatbot-knowledge`; `pakistan-universities.json`.
- Produces: `deriveUniversityTopics(): KnowledgeTopic[]` — one topic per university, id `uni-<record.id>` (e.g. `uni-nust`), four facts each.

- [ ] **Step 1: Write the failing test**

Create `src/lib/pakistan-facts.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { deriveUniversityTopics } from "@/lib/pakistan-facts";
import universitiesJson from "@/data/pakistan-universities.json";

const universities = universitiesJson.universities;

describe("deriveUniversityTopics", () => {
  const topics = deriveUniversityTopics();

  it("produces one topic per university in the dataset", () => {
    expect(topics).toHaveLength(universities.length);
    expect(topics.map((t) => t.id)).toContain("uni-nust");
  });

  it("gives every topic a title and at least one fact", () => {
    for (const topic of topics) {
      expect(topic.title.length, topic.id).toBeGreaterThan(0);
      expect(topic.facts.length, topic.id).toBeGreaterThan(0);
    }
  });

  it("names its subject in every fact, so BM25 can reach it", () => {
    // topicId is metadata and does not participate in matching: a fact that
    // does not say which university it describes is unreachable by any query.
    for (const uni of universities) {
      const topic = topics.find((t) => t.id === `uni-${uni.id}`);
      expect(topic, uni.id).toBeDefined();
      for (const fact of topic!.facts) {
        expect(fact.text, `${uni.id}: "${fact.text.slice(0, 60)}…"`).toContain(uni.short);
      }
    }
  });

  it("carries an https source on every fact", () => {
    for (const topic of topics) {
      for (const fact of topic.facts) {
        expect(fact.source, `${topic.id}: ${fact.text.slice(0, 40)}`).toMatch(/^https:\/\//);
      }
    }
  });

  it("states fees, admission steps and strengths for NUST", () => {
    const nust = topics.find((t) => t.id === "uni-nust")!;
    const all = nust.facts.map((f) => f.text).join(" ");
    expect(all).toContain("216,750");
    expect(all).toContain("NET");
    expect(all).toContain("SEECS");
  });

  it("keeps every fact short enough to sit in a prompt", () => {
    for (const topic of topics) {
      for (const fact of topic.facts) {
        expect(fact.text.length, `${topic.id}: ${fact.text.slice(0, 40)}`).toBeLessThan(900);
      }
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; npx vitest run src/lib/pakistan-facts.test.ts
```

Expected: FAIL — cannot resolve `@/lib/pakistan-facts`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/pakistan-facts.ts`:

```typescript
/**
 * ============================================================
 *  MANZIL'S DERIVED FACTS — GENERATED FROM THE SITE'S OWN DATA
 * ============================================================
 *  Manzil does not get a hand-written copy of the universities,
 *  entry tests and scholarships: it reads the same JSON the
 *  explorer pages render. Correct a fee on the Universities page
 *  and Manzil quotes the corrected fee, with no second file to
 *  remember.
 *
 *  Two rules hold every function below together:
 *  1. Every fact names its own subject. BM25 scores facts, not
 *     topics, so "tuition is PKR X" is unreachable — it must say
 *     which university it is about.
 *  2. Vague source fields stay vague. Where the JSON says
 *     "announced per cycle", the fact says that too. Never turn
 *     a cycle-based deadline into a concrete date.
 *
 *  This module is pure: no AI SDK, no Supabase, no next/*.
 */

import type { KnowledgeFact, KnowledgeTopic } from "@/data/abroad-chatbot-knowledge";
import universitiesJson from "@/data/pakistan-universities.json";

interface ProgramFee {
  program: string;
  perYear: number;
  note: string;
}

interface UniversityRecord {
  id: string;
  name: string;
  short: string;
  city: string;
  type: string;
  entryTest: string;
  intro: string;
  ranking: { label: string; sourceUrl: string };
  admissionSteps: { title: string; detail: string }[];
  // Present on only half the records, hence optional — inferring this from
  // the JSON module yields a union that will not compile against `.map`.
  fees: { summary: string; programFees?: ProgramFee[]; sourceUrl: string };
  bestFields: { field: string; why: string }[];
  sourceUrls: string[];
}

const universities = (universitiesJson as { universities: UniversityRecord[] }).universities;

/** "NUST (National University of Sciences & Technology), Islamabad" */
function subjectOf(uni: UniversityRecord): string {
  return `${uni.short} (${uni.name}), ${uni.city}`;
}

function universityFacts(uni: UniversityRecord): KnowledgeFact[] {
  const subject = subjectOf(uni);

  const programLines = (uni.fees.programFees ?? [])
    .map((p) => ` ${p.program}: PKR ${p.perYear.toLocaleString("en-US")} per year (${p.note}).`)
    .join("");

  return [
    {
      text: `${subject} is a ${uni.type} sector university. ${uni.intro} Ranking: ${uni.ranking.label}. Its entry test is ${uni.entryTest}.`,
      source: uni.ranking.sourceUrl,
    },
    {
      text: `Admission to ${subject} goes through ${uni.entryTest}. Steps: ${uni.admissionSteps
        .map((s) => `${s.title} — ${s.detail}`)
        .join(" ")}`,
      source: uni.sourceUrls[0],
    },
    {
      text: `${subject} fees — ${uni.fees.summary}.${programLines}`,
      source: uni.fees.sourceUrl,
    },
    {
      text: `${subject} is strongest in ${uni.bestFields
        .map((f) => `${f.field} (${f.why})`)
        .join(" ")}`,
      source: uni.sourceUrls[0],
    },
  ];
}

export function deriveUniversityTopics(): KnowledgeTopic[] {
  return universities.map((uni) => ({
    id: `uni-${uni.id}`,
    title: `${uni.short} — ${uni.name}, ${uni.city}`,
    facts: universityFacts(uni),
  }));
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; npx vitest run src/lib/pakistan-facts.test.ts
```

Expected: PASS, 6 tests.

- [ ] **Step 5: Verify types compile**

```bash
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; npx tsc --noEmit
```

Expected: no output. Do not commit (see Global Constraints).

---

### Task 2: Derive entry-test topics

**Files:**
- Modify: `src/lib/pakistan-facts.ts`
- Modify: `src/lib/pakistan-facts.test.ts`

**Interfaces:**
- Consumes: `entry-tests.json`; the `subjectOf` pattern from Task 1.
- Produces: `deriveEntryTestTopics(): KnowledgeTopic[]` — one topic per test, id `test-<record.id>` (e.g. `test-mdcat`), four facts each.

**Boundary note:** each test record carries a `syllabus` array of subject topics. That is Ustaad's domain (test *content*), not Manzil's (test *logistics*). Do **not** derive facts from `syllabus`. Derive from `conductingBody`, `acceptedBy`, `fee`, `frequency`, `validity`, `pattern`, `howToApply` and `note`.

- [ ] **Step 1: Write the failing test**

Append to `src/lib/pakistan-facts.test.ts`:

```typescript
import { deriveEntryTestTopics } from "@/lib/pakistan-facts";
import entryTestsJson from "@/data/entry-tests.json";

const tests = entryTestsJson.tests;

describe("deriveEntryTestTopics", () => {
  const topics = deriveEntryTestTopics();

  it("produces one topic per entry test", () => {
    expect(topics).toHaveLength(tests.length);
    expect(topics.map((t) => t.id)).toContain("test-mdcat");
  });

  it("names its subject in every fact", () => {
    for (const test of tests) {
      const topic = topics.find((t) => t.id === `test-${test.id}`);
      expect(topic, test.id).toBeDefined();
      for (const fact of topic!.facts) {
        expect(fact.text, `${test.id}: "${fact.text.slice(0, 60)}…"`).toContain(test.short);
      }
    }
  });

  it("carries an https source on every fact", () => {
    for (const topic of topics) {
      for (const fact of topic.facts) {
        expect(fact.source, topic.id).toMatch(/^https:\/\//);
      }
    }
  });

  it("copies a cycle-based fee verbatim instead of inventing a number", () => {
    const mdcat = topics.find((t) => t.id === "test-mdcat")!;
    const all = mdcat.facts.map((f) => f.text).join(" ");
    expect(all).toContain("Announced per cycle");
    expect(all).toContain("Biology");
  });

  it("leaves syllabus topics to Ustaad", () => {
    // Manzil covers test logistics; concept teaching belongs to /study.
    const mdcat = topics.find((t) => t.id === "test-mdcat")!;
    const all = mdcat.facts.map((f) => f.text).join(" ");
    expect(all).not.toContain("Cell structure and biological molecules");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; npx vitest run src/lib/pakistan-facts.test.ts
```

Expected: FAIL — `deriveEntryTestTopics` is not exported.

- [ ] **Step 3: Write the implementation**

Add to `src/lib/pakistan-facts.ts`:

```typescript
import entryTestsJson from "@/data/entry-tests.json";

interface EntryTestRecord {
  id: string;
  name: string;
  short: string;
  conductingBody: string;
  acceptedBy: string[];
  fee: string;
  frequency: string;
  validity: string;
  pattern: { section: string; questions: number; marks: number; time: string }[];
  howToApply: string[];
  sourceUrls: string[];
  note: string;
}

const entryTests = (entryTestsJson as { tests: EntryTestRecord[] }).tests;

function entryTestFacts(test: EntryTestRecord): KnowledgeFact[] {
  const src = test.sourceUrls[0];
  return [
    {
      text: `${test.short} (${test.name}) is conducted by ${test.conductingBody}. Accepted by: ${test.acceptedBy.join("; ")}.`,
      source: src,
    },
    {
      // fee, frequency and validity are copied verbatim — several are
      // deliberately cycle-based and must not be sharpened into dates.
      text: `${test.short} fee: ${test.fee}. Frequency: ${test.frequency}. Score validity: ${test.validity}.`,
      source: src,
    },
    {
      text: `${test.short} paper pattern — ${test.pattern
        .map((p) => `${p.section}: ${p.questions} questions, ${p.marks} marks`)
        .join("; ")}. ${test.note}`,
      source: src,
    },
    {
      text: `How to apply for ${test.short}: ${test.howToApply.join(" ")}`,
      source: test.sourceUrls[test.sourceUrls.length - 1],
    },
  ];
}

export function deriveEntryTestTopics(): KnowledgeTopic[] {
  return entryTests.map((test) => ({
    id: `test-${test.id}`,
    title: `${test.short} — ${test.name}`,
    facts: entryTestFacts(test),
  }));
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; npx vitest run src/lib/pakistan-facts.test.ts
```

Expected: PASS, 11 tests.

- [ ] **Step 5: Verify types compile**

```bash
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; npx tsc --noEmit
```

Expected: no output.

---

### Task 3: Derive scholarship topics

**Files:**
- Modify: `src/lib/pakistan-facts.ts`
- Modify: `src/lib/pakistan-facts.test.ts`

**Interfaces:**
- Consumes: `pakistan-scholarships.json`.
- Produces: `deriveScholarshipTopics(): KnowledgeTopic[]` — one topic per `category` value, id `scholarships-<category>`. The five categories present are `need-based`, `hec`, `merit-based`, `university-specific`, `provincial`. Each of the 24 scholarships contributes exactly one fact to its category's topic.

**Note:** `note` is absent on 14 of the 24 records — treat it as optional. Every other field is present on all 24.

- [ ] **Step 1: Write the failing test**

Append to `src/lib/pakistan-facts.test.ts`:

```typescript
import { deriveScholarshipTopics } from "@/lib/pakistan-facts";
import scholarshipsJson from "@/data/pakistan-scholarships.json";

const scholarships = scholarshipsJson.scholarships;

describe("deriveScholarshipTopics", () => {
  const topics = deriveScholarshipTopics();

  it("groups scholarships by their existing category field", () => {
    const categories = [...new Set(scholarships.map((s) => s.category))];
    expect(topics).toHaveLength(categories.length);
    for (const category of categories) {
      expect(topics.map((t) => t.id)).toContain(`scholarships-${category}`);
    }
  });

  it("turns every scholarship into exactly one fact, dropping none", () => {
    const factCount = topics.reduce((n, t) => n + t.facts.length, 0);
    expect(factCount).toBe(scholarships.length);
  });

  it("names each scholarship in its own fact", () => {
    const all = topics.flatMap((t) => t.facts).map((f) => f.text);
    for (const s of scholarships) {
      expect(all.some((text) => text.includes(s.name)), s.id).toBe(true);
    }
  });

  it("carries an https source on every fact", () => {
    for (const topic of topics) {
      for (const fact of topic.facts) {
        expect(fact.source, topic.id).toMatch(/^https:\/\//);
      }
    }
  });

  it("copies a cycle-based deadline verbatim instead of inventing a date", () => {
    // The single worst failure this feature can produce is a confident,
    // invented deadline. Pin the vague wording through to the fact.
    const need = topics.find((t) => t.id === "scholarships-need-based")!;
    const ehsaas = need.facts.find((f) => f.text.includes("Ehsaas Undergraduate"))!;
    expect(ehsaas.text).toContain("Cycle-based");
    expect(ehsaas.text).not.toMatch(/\b\d{1,2} (January|February|March|April|May|June|July|August|September|October|November|December)\b/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; npx vitest run src/lib/pakistan-facts.test.ts
```

Expected: FAIL — `deriveScholarshipTopics` is not exported.

- [ ] **Step 3: Write the implementation**

Add to `src/lib/pakistan-facts.ts`:

```typescript
import scholarshipsJson from "@/data/pakistan-scholarships.json";

interface ScholarshipRecord {
  id: string;
  name: string;
  category: string;
  funder: string;
  level: string;
  coverage: string;
  eligibility: string[];
  deadline: string;
  sourceUrl: string;
  note?: string; // absent on 14 of 24 records
}

const scholarships = (scholarshipsJson as { scholarships: ScholarshipRecord[] }).scholarships;

const CATEGORY_TITLES: Record<string, string> = {
  "need-based": "Need-Based Scholarships in Pakistan",
  hec: "HEC Scholarships",
  "merit-based": "Merit-Based Scholarships in Pakistan",
  "university-specific": "University-Specific Scholarships",
  provincial: "Provincial Government Scholarships",
};

function scholarshipFact(s: ScholarshipRecord): KnowledgeFact {
  const tail = s.note ? ` ${s.note}.` : "";
  return {
    // `deadline` is copied verbatim: most read "Cycle-based (announced by
    // HEC each year)" and must never be sharpened into a concrete date.
    text: `${s.name} — funded by ${s.funder} for ${s.level} students. Covers: ${s.coverage}. Eligibility: ${s.eligibility.join("; ")}. Deadline: ${s.deadline}.${tail}`,
    source: s.sourceUrl,
  };
}

export function deriveScholarshipTopics(): KnowledgeTopic[] {
  const byCategory = new Map<string, KnowledgeFact[]>();
  for (const s of scholarships) {
    const facts = byCategory.get(s.category) ?? [];
    facts.push(scholarshipFact(s));
    byCategory.set(s.category, facts);
  }
  return [...byCategory].map(([category, facts]) => ({
    id: `scholarships-${category}`,
    title: CATEGORY_TITLES[category] ?? `${category} scholarships in Pakistan`,
    facts,
  }));
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; npx vitest run src/lib/pakistan-facts.test.ts
```

Expected: PASS, 16 tests.

- [ ] **Step 5: Verify types compile**

```bash
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; npx tsc --noEmit
```

Expected: no output.

---

### Task 4: Authored guidance topics and the assembled knowledge base

**Files:**
- Create: `src/data/pakistan-chatbot-knowledge.ts`
- Create: `src/data/pakistan-chatbot-knowledge.test.ts`

**Interfaces:**
- Consumes: `deriveUniversityTopics()`, `deriveEntryTestTopics()`, `deriveScholarshipTopics()` from Task 1–3.
- Produces: `pakistanChatbotKnowledge: { updatedAt: string; topics: KnowledgeTopic[] }` — the shape `KNOWLEDGE_BASES` consumes. Authored topic ids: `choosing-where-to-apply`, `merit-strategy`, `scholarship-strategy`, `admission-safety`.

- [ ] **Step 1: Write the failing test**

Create `src/data/pakistan-chatbot-knowledge.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { pakistanChatbotKnowledge } from "@/data/pakistan-chatbot-knowledge";

const { topics, updatedAt } = pakistanChatbotKnowledge;
const AUTHORED = [
  "choosing-where-to-apply",
  "merit-strategy",
  "scholarship-strategy",
  "admission-safety",
];

describe("pakistanChatbotKnowledge", () => {
  it("carries a reviewed date the prompt can print", () => {
    expect(updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("merges the derived topics with the four authored ones", () => {
    const ids = topics.map((t) => t.id);
    expect(ids).toContain("uni-nust");
    expect(ids).toContain("test-mdcat");
    expect(ids).toContain("scholarships-hec");
    for (const id of AUTHORED) expect(ids).toContain(id);
  });

  it("gives every authored topic real substance", () => {
    for (const id of AUTHORED) {
      const topic = topics.find((t) => t.id === id)!;
      expect(topic.facts.length, id).toBeGreaterThanOrEqual(3);
      for (const fact of topic.facts) {
        expect(fact.text.length, id).toBeGreaterThan(60);
      }
    }
  });

  it("sources every fact in the whole base over https", () => {
    for (const topic of topics) {
      for (const fact of topic.facts) {
        expect(fact.source, `${topic.id}: ${fact.text.slice(0, 40)}`).toMatch(/^https:\/\//);
      }
    }
  });

  it("keeps every fact in the whole base short enough for a prompt", () => {
    // Retrieved facts are printed into the system prompt verbatim, so a
    // runaway derived fact inflates every request that retrieves it.
    for (const topic of topics) {
      for (const fact of topic.facts) {
        expect(fact.text.length, `${topic.id}: ${fact.text.slice(0, 40)}`).toBeLessThan(900);
      }
    }
  });

  it("uses a unique id per topic", () => {
    const ids = topics.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; npx vitest run src/data/pakistan-chatbot-knowledge.test.ts
```

Expected: FAIL — cannot resolve `@/data/pakistan-chatbot-knowledge`.

- [ ] **Step 3: Write the implementation**

Create `src/data/pakistan-chatbot-knowledge.ts`. The authored facts below are the starting corpus; each carries a real source URL.

```typescript
/**
 * ============================================================
 *  MANZIL'S KNOWLEDGE BASE — STUDY INSIDE PAKISTAN
 * ============================================================
 *  Two halves:
 *  - DERIVED: universities, entry tests and scholarships are read
 *    from the same JSON the explorer pages render, via
 *    src/lib/pakistan-facts.ts. Do not hand-copy those facts here
 *    — fix the JSON and both the page and the bot update together.
 *  - AUTHORED (below): the judgment questions no dataset answers.
 *    Add facts as `{ text, source }`; every fact needs a real URL,
 *    because Manzil cites it.
 *
 *  If Manzil keeps missing a question, do not reword the fact —
 *  add the student's vocabulary to ALIAS in src/lib/knowledge.ts
 *  under the topic's id.
 *
 *  Bump `updatedAt` when you review the authored facts.
 *  DO NOT put secrets or personal data here — retrieved facts are
 *  sent to the AI model with every chat message.
 * ============================================================
 */

import type { KnowledgeTopic } from "@/data/abroad-chatbot-knowledge";
import {
  deriveEntryTestTopics,
  deriveScholarshipTopics,
  deriveUniversityTopics,
} from "@/lib/pakistan-facts";

const HEC_RECOGNISED = "https://www.hec.gov.pk/english/universities/pages/recognised.aspx";
const HEC_SCHOLARSHIPS = "https://www.hec.gov.pk/english/scholarshipsgrants/pages/default.aspx";

const authoredTopics: KnowledgeTopic[] = [
  {
    id: "choosing-where-to-apply",
    title: "Choosing Where to Apply — Public vs Private",
    facts: [
      {
        text: "Public sector universities charge far lower tuition than private ones but close at much higher merit, so a realistic list mixes both: one or two aspirational public options, a mid-tier public option, and a private option you could actually afford if merit does not land.",
        source: HEC_RECOGNISED,
      },
      {
        text: "Apply to several universities, not one. Entry tests and merit lists run on different calendars, so applying widely costs application fees but protects against a single closing merit moving against you in one bad year.",
        source: HEC_RECOGNISED,
      },
      {
        text: "For students moving city, hostel availability and cost belong in the budget from the start: hostel, mess and travel home can add substantially to the advertised tuition, and universities do not guarantee on-campus hostel seats to every admitted student.",
        source: HEC_RECOGNISED,
      },
      {
        text: "A degree's value depends more on the department than the university's overall name. Check which faculties a university is actually known for before paying a premium for the brand.",
        source: HEC_RECOGNISED,
      },
    ],
  },
  {
    id: "merit-strategy",
    title: "Merit, Aggregates and What to Do If You Miss",
    facts: [
      {
        text: "Merit in Pakistan is an aggregate, not your FSc percentage alone. Universities weigh the entry test heavily — NUST computes NET 75% + FSc 15% + Matric 10% — so a strong test score can outweigh an average FSc, and a weak test score is rarely rescued by good marks.",
        source: "https://ugadmissions.nust.edu.pk/",
      },
      {
        text: "Closing merit moves every year with the applicant pool and paper difficulty. Treat last year's closing merit as a guide with a margin, not a threshold to hit exactly.",
        source: HEC_RECOGNISED,
      },
      {
        text: "Missing merit at one university is not the end of the cycle. Second and third merit lists move as admitted students confirm seats elsewhere, so keep checking the portal and keep the fee ready before the confirmation deadline.",
        source: HEC_RECOGNISED,
      },
      {
        text: "If no list moves far enough, the realistic options are a related programme at the same university, the same programme at a less competitive university, or repeating the entry test next cycle. Repeating only helps where the test — not the FSc marks — was the weak half of the aggregate, since FSc marks are fixed.",
        source: HEC_RECOGNISED,
      },
    ],
  },
  {
    id: "scholarship-strategy",
    title: "Actually Winning a Scholarship, Not Just Finding One",
    facts: [
      {
        text: "Most need-based scholarships in Pakistan are applied for after you hold an admission offer, through the university's own financial aid office rather than directly to the funder. Securing admission comes first; the funding application follows it.",
        source: HEC_SCHOLARSHIPS,
      },
      {
        text: "Need-based applications are decided largely on documented family income, so the paperwork is the application: CNICs, income certificates or salary slips, utility bills and bank statements. Applications are commonly rejected for incomplete documents rather than for insufficient need.",
        source: HEC_SCHOLARSHIPS,
      },
      {
        text: "Most programmes bar holding two awards at once, so read the stacking rules before accepting the first offer — a smaller scholarship accepted early can disqualify you from a larger one later in the cycle.",
        source: HEC_SCHOLARSHIPS,
      },
      {
        text: "Scholarship cycles are announced per year and deadlines are short once opened. Assemble the document set before the cycle opens rather than after, and check the official page directly instead of relying on forwarded messages.",
        source: HEC_SCHOLARSHIPS,
      },
    ],
  },
  {
    id: "admission-safety",
    title: "Recognition, Fake Institutes and Admission Scams",
    facts: [
      {
        text: "Before paying any institute, confirm it appears on HEC's list of recognised universities and degree-awarding institutions, and that the specific programme is recognised. A degree from an unrecognised institute is not accepted for government jobs, HEC scholarships or further study.",
        source: HEC_RECOGNISED,
      },
      {
        text: "No agent can guarantee admission or a scholarship. Universities admit on published merit and funders award on published criteria, so a guaranteed seat in exchange for a fee is a scam regardless of the paperwork shown.",
        source: HEC_RECOGNISED,
      },
      {
        text: "Pay fees only into the university's official bank account through its own challan or portal, never into a personal account, and keep the receipt. Verify a fee demand on the university's official website or admissions office before transferring.",
        source: HEC_RECOGNISED,
      },
      {
        text: "Affiliation is not the same as recognition. Some institutes advertise affiliation with a recognised university for one programme while offering others with no such standing, so check the specific programme rather than the institute's general claim.",
        source: HEC_RECOGNISED,
      },
    ],
  },
];

export const pakistanChatbotKnowledge: {
  updatedAt: string;
  topics: KnowledgeTopic[];
} = {
  updatedAt: "2026-09-02",
  topics: [
    ...deriveUniversityTopics(),
    ...deriveEntryTestTopics(),
    ...deriveScholarshipTopics(),
    ...authoredTopics,
  ],
};
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; npx vitest run src/data/pakistan-chatbot-knowledge.test.ts
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Verify types compile**

```bash
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; npx tsc --noEmit
```

Expected: no output.

---

### Task 5: Register the Manzil persona

**Files:**
- Modify: `src/lib/chat-request.ts:1-9` (the `PERSONAS` array)
- Modify: `src/lib/chat-prompt.ts:18` (the `PERSONA_PROMPTS` record)
- Modify: `src/lib/knowledge.ts:101-104` (`KNOWLEDGE_BASES`) and `src/lib/knowledge.ts:47` (`ALIAS`)
- Modify: `src/lib/chat-prompt.test.ts`

**Interfaces:**
- Consumes: `pakistanChatbotKnowledge` from Task 4.
- Produces: `"manzil"` as a valid `Persona` everywhere; `KNOWLEDGE_BASES.manzil`; four ALIAS rows keyed to the authored topic ids.

**Order matters:** `PERSONA_PROMPTS` is a total `Record<Persona, string>`, so adding `"manzil"` to `PERSONAS` will not compile until the prompt exists. Do Step 3 and Step 4 together before type-checking.

- [ ] **Step 1: Write the failing test**

Append to `src/lib/chat-prompt.test.ts`:

```typescript
describe("Manzil's prompt", () => {
  it("is registered as a persona with a knowledge base", () => {
    expect(PERSONAS).toContain("manzil");
    expect(KNOWLEDGE_BASES.manzil).toBeDefined();
  });

  it("names the bots it must defer to, so the four do not overlap", () => {
    const prompt = PERSONA_PROMPTS.manzil;
    expect(prompt).toContain("Ustaad");
    expect(prompt).toContain("Safar");
    expect(prompt).toContain("Rahbar");
  });

  it("stays under the prompt size ceiling", () => {
    expect(PERSONA_PROMPTS.manzil.length).toBeLessThan(4000);
  });
});
```

That file already imports `PERSONAS` and `PERSONA_PROMPTS`. Extend its knowledge import to bring in `KNOWLEDGE_BASES`:

```typescript
import { KNOWLEDGE_BASES, retrieveFacts, type RetrievedFact } from "@/lib/knowledge";
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; npx vitest run src/lib/chat-prompt.test.ts
```

Expected: FAIL — `PERSONAS` does not contain `"manzil"`.

- [ ] **Step 3: Add the persona to the wire contract**

In `src/lib/chat-request.ts`, add `"manzil"` to the `PERSONAS` array:

```typescript
export const PERSONAS = [
  "rahbar",
  "study",
  "essay",
  "cv",
  "safar",
  "hunar",
  "qalam",
  "manzil",
] as const;
```

- [ ] **Step 4: Add the persona prompt**

In `src/lib/chat-prompt.ts`, add this entry to `PERSONA_PROMPTS` (after `qalam`):

```typescript
  manzil: `You are "Manzil" (منزل), a grounded guide to studying inside Pakistan, for students who just finished FSc / ICS / I.Com / A-Levels.

Your subject: Pakistani universities and institutes, admission steps, entry-test logistics, merit and aggregates, fees, and scholarships for studying at home. You appear on /pakistan/assistant.

Rules:
- Answer from the retrieved facts and cite the source URL of the fact you used. Fees, merit weightings, deadlines and eligibility must come from a fact, never from memory.
- Deadlines and fees in this sector are cycle-based and move every year. Where a fact says a date or fee is announced per cycle, say exactly that and send the student to the official link — never turn a vague deadline into a specific one.
- Closing merit changes yearly. Give last year's figure as a guide with a margin, never as a promise of admission.
- A concept or syllabus question ("explain projectile motion", "how do I revise Biology") → redirect to Ustaad on /study. You cover how a test works — pattern, fee, eligibility, applying — not what is on it.
- Anything about studying abroad — visas, foreign universities, IELTS — → redirect to Safar on /abroad/assistant.
- Questions about using this website → redirect to Rahbar.
- Never tell a student an institute is recognised unless a fact says so. Point them to HEC's recognised list to check for themselves.
- Keep answers concise and scannable. Plain English with occasional Urdu phrases where natural.
- End with one concrete next step: a page to open, a document to gather, or an official link to check.`,
```

- [ ] **Step 5: Add the persona's marker to the existing prompt test**

`src/lib/chat-prompt.test.ts` has a `MARKERS` map at line 10 that an existing test walks for every persona in `PERSONAS`. It is typed `Record<string, string>`, so a missing entry **compiles fine** and then fails at runtime with a misleading message about the prompt not containing `undefined`. Add the row:

```typescript
const MARKERS: Record<string, string> = {
  rahbar: "Rahbar",
  study: "Ustaad",
  essay: "essay coach",
  cv: "ATS-friendly",
  safar: "Safar",
  hunar: "Hunar",
  qalam: "Qalam",
  manzil: "Manzil",
};
```

- [ ] **Step 6: Register the knowledge base and aliases**

In `src/lib/knowledge.ts`, add the import and the `KNOWLEDGE_BASES` entry:

```typescript
import { pakistanChatbotKnowledge } from "@/data/pakistan-chatbot-knowledge";

export const KNOWLEDGE_BASES: Partial<Record<Persona, KnowledgeBase>> = {
  safar: abroadChatbotKnowledge,
  hunar: skillsChatbotKnowledge,
  manzil: pakistanChatbotKnowledge,
};
```

Then add four rows to `ALIAS` (derived topics need none — their vocabulary is already in the fact text):

```typescript
  // study in pakistan
  "choosing-where-to-apply": ["public or private", "which university", "shortlist", "hostel", "worth the fee", "government university"],
  "merit-strategy": ["aggregate", "closing merit", "merit list", "did not get admission", "missed merit", "repeat", "second list"],
  "scholarship-strategy": ["how to get scholarship", "financial aid office", "income certificate", "documents", "rejected", "stipend"],
  "admission-safety": ["recognised", "hec verified", "fake university", "agent", "scam", "attestation", "affiliated"],
```

- [ ] **Step 7: Run the tests and the type check**

```bash
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; npx vitest run src/lib/chat-prompt.test.ts src/lib/knowledge.test.ts src/lib/chat-request.test.ts && npx tsc --noEmit
```

Expected: PASS. The existing "each alias topic id exists in its knowledge base" test in `knowledge.test.ts` will fail unless that test's `known` list is extended to include `topicIds(pakistanChatbotKnowledge)` — make that edit as part of this step.

---

### Task 6: Extend the recall harness and fix the gate

**Files:**
- Modify: `src/lib/knowledge.test.ts:253-304` (the `HARNESS` array and the gate assertion)

**Interfaces:**
- Consumes: the registered `manzil` persona and its topics from Task 5.
- Produces: no exports; a passing recall gate over a longer harness.

**The gate is currently a bug waiting to happen.** It reads `expect(misses.length).toBeLessThanOrEqual(HARNESS.length - 22)`. With 24 cases that means "at most 2 misses". Adding 20 cases silently relaxes it to "at most 22 misses" — the gate would pass with almost every new case failing. It must become proportional in the same change.

- [ ] **Step 1: Add the Manzil cases to `HARNESS`**

Append these entries to the `HARNESS` array, before the two off-domain cases at the end:

```typescript
  { persona: "manzil", query: "What does NUST charge per semester for a computing degree?", expectTopicId: "uni-nust" },
  { persona: "manzil", query: "How do I apply to NUST and what is the aggregate formula?", expectTopicId: "uni-nust" },
  { persona: "manzil", query: "Is GIKI a public or a private university and what is it known for?", expectTopicId: "uni-giki" },
  { persona: "manzil", query: "What is the MDCAT paper pattern and how many biology questions are there?", expectTopicId: "test-mdcat" },
  { persona: "manzil", query: "How much does MDCAT registration cost and how often is it held?", expectTopicId: "test-mdcat" },
  { persona: "manzil", query: "How do I register for the ECAT and who conducts it?", expectTopicId: "test-ecat" },
  { persona: "manzil", query: "Which need-based scholarship covers tuition plus a monthly stipend?", expectTopicId: "scholarships-need-based" },
  { persona: "manzil", query: "What HEC scholarships can I get for an undergraduate degree in Pakistan?", expectTopicId: "scholarships-hec" },
  { persona: "manzil", query: "Are there provincial government scholarships for students from Sindh?", expectTopicId: "scholarships-provincial" },
  { persona: "manzil", query: "Should I go to a government university or pay for a private one?", expectTopicId: "choosing-where-to-apply" },
  { persona: "manzil", query: "I have to move city for university — what should I budget for hostel?", expectTopicId: "choosing-where-to-apply" },
  { persona: "manzil", query: "I missed the closing merit everywhere — what do I do now?", expectTopicId: "merit-strategy" },
  { persona: "manzil", query: "Should I repeat my entry test next year to improve my aggregate?", expectTopicId: "merit-strategy" },
  { persona: "manzil", query: "What documents do I need for a need-based financial aid application?", expectTopicId: "scholarship-strategy" },
  { persona: "manzil", query: "Can I hold two scholarships at the same time?", expectTopicId: "scholarship-strategy" },
  { persona: "manzil", query: "How do I check whether a university is actually recognised by HEC?", expectTopicId: "admission-safety" },
  { persona: "manzil", query: "An agent says he can guarantee me a seat in a medical college for a fee", expectTopicId: "admission-safety" },
  { persona: "manzil", query: "The institute asked me to transfer the fee to a personal account — is that normal?", expectTopicId: "admission-safety" },
```

And add one off-domain case at the end, next to the existing two:

```typescript
  { persona: "manzil", query: "How much money do I park in a German blocked account for a student visa?" },
```

- [ ] **Step 2: Run the harness to see where retrieval actually lands**

```bash
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; npx vitest run src/lib/knowledge.test.ts
```

Expected: some new cases FAIL. This is the tuning signal, not a defect — note which queries miss.

- [ ] **Step 3: Make the gate proportional**

Replace the gate assertion at the end of the `recall harness` describe block:

```typescript
  it("scores at least 90% of the harness", () => {
    const misses: string[] = [];
    for (const c of HARNESS) {
      const { facts, covered } = retrieveFacts(c.persona, c.query);
      const hit = c.expectTopicId
        ? covered && facts.slice(0, 3).some((f) => f.topicId === c.expectTopicId)
        : !covered;
      if (!hit) misses.push(`[${c.persona}] ${c.query}`);
    }
    // Proportional, not a fixed count: a fixed "HARNESS.length - 22" gate
    // loosens every time a case is added, which would let a longer harness
    // pass with most of its new cases failing.
    const rate = (HARNESS.length - misses.length) / HARNESS.length;
    expect(rate, `misses:\n${misses.join("\n")}`).toBeGreaterThanOrEqual(0.9);
  });
```

- [ ] **Step 4: Tune the misses via ALIAS, never by rewording facts**

For each still-missing case, add the student's vocabulary to the relevant `ALIAS` row in `src/lib/knowledge.ts`. Do not reword the derived fact text — derived text must keep matching the JSON it came from. If a derived topic genuinely needs an alias (for example a campus nickname like "SEECS" that maps to `uni-nust`), add an ALIAS row for that topic id.

- [ ] **Step 5: Run the harness until the gate passes**

```bash
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; npx vitest run src/lib/knowledge.test.ts
```

Expected: PASS, with the recall rate at or above 0.9.

---

### Task 7: Point the frontend at the live endpoint

**Files:**
- Modify: `src/components/pakistan/manzil-assistant.tsx`

**Interfaces:**
- Consumes: `POST /api/chat` with `{ persona: "manzil", messages }`, streaming a plain-text body.
- Produces: no exports; the shipped page stops serving canned replies.

- [ ] **Step 1: Delete the mock and stream from the API**

In `src/components/pakistan/manzil-assistant.tsx`, delete the `MOCK_REPLIES` array and the `mockReply` function together with the design-preview comment above them, then replace the body of `send` after `setMessages([...next, { role: "assistant", content: "" }]);` with the same reader Safar uses:

```typescript
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          persona: "manzil",
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
          content:
            "Sorry, I hit a snag. Try again in a moment — or check the pages on the left while you wait.",
        },
      ]);
    } finally {
      setStreaming(false);
    }
```

- [ ] **Step 2: Replace the preview disclaimer**

Change the footer line from the design-preview wording to match the shipped bots:

```tsx
        <p className="mt-2 text-center text-[11px] text-faint">
          Manzil answers from a curated knowledge base and cites sources. Always double-check on official pages.
        </p>
```

- [ ] **Step 3: Add the legacy storage key**

The chat key is namespaced per user by `usePersonalKey`. Add the base key to `LEGACY_SHARED_KEYS` in `src/lib/chat-storage.ts` so any un-namespaced key written during the preview is deleted rather than inherited by the next student on a shared computer:

```typescript
export const LEGACY_SHARED_KEYS: string[] = [
  "aftermediate:rahbar-chat",
  "aftermediate:safar-chat",
  "aftermediate:manzil-chat",
  "aftermediate:skills:chat",
  "aftermediate:study-chat",
  RATER_CHAT_BASE,
  ESSAY_DRAFT_BASE,
];
```

- [ ] **Step 4: Verify types and the storage tests**

```bash
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; npx tsc --noEmit && npx vitest run src/lib/chat-storage.test.ts
```

Expected: no type errors, storage tests PASS.

- [ ] **Step 5: Confirm no mock text survives**

```bash
grep -n "design preview\|MOCK_REPLIES\|mockReply" src/components/pakistan/manzil-assistant.tsx
```

Expected: no matches.

- [ ] **Step 6: Full-suite check against the known baseline**

```bash
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; npx vitest run --no-file-parallelism 2>&1 | tail -20
```

Expected: only the known `builder.test.tsx` "AI Polish" failure. Any other failure is a regression from this work.

---

## Manual verification still owed

Unit tests cannot cover these; they need a signed-in browser session, because `(app)` routes redirect to `/login`.

- Open `/pakistan/assistant` signed in and ask "what does NUST charge per semester" — the answer must quote a figure that appears in `pakistan-universities.json` and cite the NUST fee URL.
- Ask "how much money for a German blocked account" — Manzil must decline and point to Safar rather than answering.
- Ask "explain how photosynthesis works" — Manzil must redirect to Ustaad.
- Ask about a scholarship whose `deadline` is cycle-based — the answer must not contain a specific date.
