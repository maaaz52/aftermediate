# Skills & Side Hustles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the "Skills & Side Hustles" sidebar category — 5 interactive, data-driven pages (Courses, Books, Hunar A.I chatbot, Clients, Platforms) for Pakistani students building skills outside traditional education.

**Architecture:** Static JSON/TS data files with structural validation tests; pure helper logic in `src/lib/skills.ts`; client components in `src/components/skills/`; one new AI persona "hunar" reusing the existing `/api/chat` streaming infra; sidebar group with direct links. No runtime external APIs except the sanctioned chat route.

**Tech Stack:** Next.js 16.3.2 App Router, React 19, Tailwind 4 (paper/pixel theme), lucide-react, vitest, tsx.

**Spec:** `docs/superpowers/specs/2026-08-29-skills-side-hustles-design.md`

---

## Task 1: Foundation — lib/skills.ts + tests

**Files:**
- Create: `src/lib/skills.test.ts`
- Create: `src/lib/skills.ts`

- [x] **Step 1: Write `src/lib/skills.test.ts`** — tests for every helper below (TDD):

```ts
import { describe, expect, it } from "vitest";
import {
  USD_TO_PKR, pkr, sortByKey, trackCounts, skillPaths, validatePaths,
  pathProgress, readDays, wizardScore, WizardAnswers,
} from "./skills";
```

Test cases:
- `pkr(0)` → "Free"; `pkr(49)` → "Rs 13,700" (grouped, no decimals); `pkr(500)` → "Rs 140,000". USD_TO_PKR === 280.
- `sortByKey(arr, "rating", "desc")` stable by key; string and number keys both work.
- `trackCounts(courses)` returns `{ track: count }` for tracks present, sum === courses.length.
- `skillPaths` has exactly 5 entries; each has 4–6 courseIds, unique within the path and across paths.
- `validatePaths(courses)` returns `{ missing: string[], duplicates: string[] }` — empty arrays when all ids exist.
- `pathProgress("frontend-6mo", new Set(["freecodecamp-responsive"]))` → 1 / 6 (or actual length).
- `readDays(300)` → 8; `readDays(0)` → 0 (40 pages/day, ceil).
- `wizardScore({ skill: "design", experience: "none", budget: "small", payout: "payoneer" }, platforms)` returns sorted list, top result first, each with `id`, `score: number`, `reasons: string[]`; every platform gets a score ≥ 0; scores are deterministic (same input → same output).

- [x] **Step 2: Run test — verify it fails** (`npx vitest run src/lib/skills.test.ts`)

- [x] **Step 3: Write `src/lib/skills.ts`**

```ts
import * as React from "react";

export const USD_TO_PKR = 280; // approx, hedged — update when rates move

export function pkr(valueUsd: number): string {
  if (valueUsd <= 0) return "Free";
  return `Rs ${Math.round(valueUsd * USD_TO_PKR).toLocaleString("en-US")}`;
}

export type SortDir = "asc" | "desc";
export function sortByKey<T>(items: T[], key: keyof T, dir: SortDir = "asc"): T[] {
  return [...items].sort((a, b) => {
    const av = a[key]; const bv = b[key];
    const cmp = typeof av === "string" ? (av as string).localeCompare(bv as string)
      : (av as number) - (bv as number);
    return dir === "asc" ? cmp : -cmp;
  });
}

export function trackCounts(courses: { track: string }[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of courses) out[c.track] = (out[c.track] ?? 0) + 1;
  return out;
}

// --- Skill paths (source of truth for course ids that MUST exist in skills-courses.json) ---
export interface SkillPath { id: string; title: string; subtitle: string; courseIds: string[]; }

export const skillPaths: SkillPath[] = [
  { id: "frontend-6mo", title: "Frontend Dev in 6 Months", subtitle: "HTML → CSS → JS → React → deploy",
    courseIds: ["freecodecamp-responsive", "javascript-info", "cs50-web", "react-bootcamp", "tailwind-scrimba", "frontend-mentor-practice"] },
  { id: "designer-starter", title: "Freelance Designer Starter", subtitle: "Figma → color → UX → portfolio",
    courseIds: ["figma-basics", "google-ux", "color-theory", "design-portfolio", "gumroad-design"] },
  { id: "data-analyst-starter", title: "Data Analyst Starter", subtitle: "Excel → SQL → Python → Power BI",
    courseIds: ["excel-skills", "sql-basics", "python-data", "powerbi-dax", "kaggle-pandas"] },
  { id: "ai-prompt-work", title: "AI & Prompt Work", subtitle: "Prompting → AI tools → automation",
    courseIds: ["prompt-engineering", "chatgpt-productivity", "ai-tools-workflow", "automation-zapier"] },
  { id: "content-writer", title: "Content Writer Path", subtitle: "Grammar → SEO → copywriting → niches",
    courseIds: ["english-writing", "seo-basics", "copywriting-101", "content-marketing-hubspot", "freelance-writing"] },
];

export function validatePaths(courses: { id: string }[]): { missing: string[]; duplicates: string[] } {
  const ids = new Set(courses.map((c) => c.id));
  const missing: string[] = [];
  const duplicates: string[] = [];
  const seen = new Set<string>();
  for (const p of skillPaths) for (const cid of p.courseIds) {
    if (!ids.has(cid)) missing.push(`${p.id}:${cid}`);
    if (seen.has(cid)) duplicates.push(cid); else seen.add(cid);
  }
  return { missing, duplicates };
}

export function pathProgress(pathId: string, done: Set<string>): { done: number; total: number; pct: number } {
  const p = skillPaths.find((x) => x.id === pathId);
  const total = p?.courseIds.length ?? 0;
  const doneCount = p?.courseIds.filter((id) => done.has(id)).length ?? 0;
  return { done: doneCount, total, pct: total ? Math.round((doneCount / total) * 100) : 0 };
}

export function readDays(pages: number, perDay = 40): number {
  return pages <= 0 ? 0 : Math.ceil(pages / perDay);
}

// --- Platform wizard (deterministic scoring) ---
export interface WizardAnswers { skill: string; experience: "none" | "some" | "pro"; budget: "small" | "mid" | "premium"; payout: "payoneer" | "any"; }
export interface WizardResult { id: string; score: number; reasons: string[]; }

// niche keywords per skill area, matched against platform.niches (case-insensitive substring)
const SKILL_NICHES: Record<string, string[]> = {
  design: ["design", "logo", "brand", "ui/ux", "graphic"],
  development: ["web", "development", "software", "programming", "mobile"],
  writing: ["writing", "content", "copywriting", "translation"],
  data: ["data", "analytics", "excel", "sql"],
  video: ["video", "animation", "editing"],
  other: [],
};
const EXPERIENCE_BONUS: Record<WizardAnswers["experience"], number> = { none: 3, some: 2, pro: 0 };
const BUDGET_BONUS: Record<WizardAnswers["budget"], number> = { small: 3, mid: 2, premium: 0 };

export function wizardScore(a: WizardAnswers, platforms: { id: string; name: string; niches: string[]; newcomerFriendly: number; minWithdrawalUsd: number; pkrFriendly: boolean; fee: number }[]): WizardResult[] {
  return platforms.map((p) => {
    let score = 5;
    const reasons: string[] = [];
    const nicheHits = SKILL_NICHES[a.skill].filter((k) => p.niches.some((n) => n.toLowerCase().includes(k)));
    if (nicheHits.length > 0) { score += 4; reasons.push(`Strong fit for ${a.skill} work`); }
    score += Math.min(p.newcomerFriendly, 5);
    reasons.push(`Newcomer-friendliness ${p.newcomerFriendly}/5`);
    score += EXPERIENCE_BONUS[a.experience];
    if (a.experience === "none" && p.newcomerFriendly >= 4) reasons.push("Built for first-timers");
    if (a.budget === "small" && p.minWithdrawalUsd <= 30) { score += 2; reasons.push(`Low ${p.minWithdrawalUsd}$ withdrawal threshold`); }
    if (a.budget === "premium" && p.minWithdrawalUsd >= 500) { score += 2; reasons.push("Premium clients, higher payouts"); }
    score += BUDGET_BONUS[a.budget];
    if (a.payout === "payoneer" && p.pkrFriendly) { score += 3; reasons.push("Pakistan-friendly payouts (Payoneer/bank)"); }
    score -= p.fee / 20;
    return { id: p.id, score: Math.max(0, Math.round(score * 10) / 10), reasons };
  }).sort((x, y) => y.score - x.score);
}

// --- React hooks / browser utils ---
export function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [value, setValue] = React.useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try { const raw = window.localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : initial; }
    catch { return initial; }
  });
  React.useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  }, [key, value]);
  return [value, setValue];
}

export async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    try { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta);
      ta.select(); document.execCommand("copy"); document.body.removeChild(ta); return true; }
    catch { return false; }
  }
}
```

- [x] **Step 4: Run tests — verify they pass** (`npx vitest run src/lib/skills.test.ts`)
- [x] **Step 5: Commit** — `feat(skills): add skills lib helpers with tests`

---

## Task 2: Data contract tests (5 files)

**Files:**
- Create: `src/data/skills-courses.test.ts`
- Create: `src/data/skills-books.test.ts`
- Create: `src/data/skills-client-playbook.test.ts`
- Create: `src/data/skills-platforms.test.ts`
- Create: `src/data/skills-chatbot-knowledge.test.ts`

- [x] **Step 1: Write all 5 test files** (each imports its data file and validates structure). Shared patterns (adapt from `practice-banks.test.ts` / `abroad-scholarships.test.ts` style — `describe/it`, `expect`):

**skills-courses.test.ts** — imports `courses from "./skills-courses.json"` and `{ skillPaths, validatePaths, trackCounts } from "@/lib/skills"`:
- ≥ 40 courses; unique ids; every field present with correct types
- track ∈ 8 allowed; level ∈ 3 allowed; 0 ≤ rating ≤ 5; hours > 0; costUsd ≥ 0; certificate boolean; updatedYear ≥ 2019
- url starts with https:// ; description/why non-empty (> 20 chars)
- every track has ≥ 3 courses; every level has ≥ 10 courses
- `validatePaths(courses)` → missing/duplicates empty (i.e., all skill-path ids exist)
- `trackCounts(courses)` sums to courses.length

**skills-books.test.ts** — imports `books from "./skills-books.json"`:
- ≥ 30 books; unique ids; genre ∈ 8 allowed; level ∈ 3 allowed
- 0 ≤ rating ≤ 5; pages between 50 and 1500; year ≥ 1980; free boolean
- url https; summary > 40 chars; whyRead > 20 chars; author/title non-empty
- every genre has ≥ 3 books; at least 8 free books

**skills-client-playbook.test.ts** — imports `playbook from "./skills-client-playbook.json"`:
- exactly 5 sections; sectionIds = kickoff, contracts, pricing, difficult, delivery
- each section: title/intro non-empty; ≥ 3 cards
- every card: id unique across file, type ∈ {template, script, rule, framework}, body > 80 chars, ≥ 1 tag; every section has ≥ 1 template and ≥ 1 script
- total cards ≥ 18

**skills-platforms.test.ts** — imports `platforms from "./skills-platforms.json"`:
- exactly 12 platforms; unique ids; kind ∈ {marketplace, showcase, agency}
- 0 ≤ fee ≤ 100; 1 ≤ competition ≤ 5; 1 ≤ newcomerFriendly ≤ 5
- payoutMethods ≥ 2 each; minWithdrawalUsd ≥ 0; avgEarningsNote non-empty
- niches ≥ 2; pros/cons ≥ 2 each; tips ≥ 2; url https; pkrFriendly boolean
- at least 4 pkrFriendly; at least 8 marketplaces; at least 2 showcase

**skills-chatbot-knowledge.test.ts** — imports `{ skillsChatbotKnowledge } from "./skills-chatbot-knowledge"`:
- ≥ 15 topics; unique topic ids; updatedAt matches /^\d{4}-\d{2}-\d{2}$/
- every fact: text > 40 chars, source starts with https://
- ≥ 3 topics per required area: pricing, getting-paid, portfolio

- [x] **Step 2: Run all 5 — verify they fail (missing data files)**
- [x] **Step 3: Commit** — `test(skills): add data contract tests for skills data files`

---

## Task 3: Generate data files (parallel agents)

**Files:**
- Create: `src/data/skills-courses.json` (~48 courses)
- Create: `src/data/skills-books.json` (~36 books)
- Create: `src/data/skills-client-playbook.json` (5 sections, ≥ 18 cards)
- Create: `src/data/skills-platforms.json` (12 platforms)
- Create: `src/data/skills-chatbot-knowledge.ts` (~18 topics)

- [x] **Step 1: Dispatch 5 parallel GeneralPurpose agents** (dispatching-parallel-agents skill). Each agent gets: the exact schema from the spec, the contract-test requirements from Task 2, realistic real-world content, and strict JSON formatting rules (JSON files: valid JSON, 2-space indent, `"id"` keys matching `skills-courses` etc. patterns; the knowledge file: TypeScript module mirroring `abroad-chatbot-knowledge.ts` structure with the "edit this file to train the bot" header comment).

  **Agent A — courses:** must include ALL course ids from `skillPaths` (Task 1) with accurate metadata (real providers: freeCodeCamp, JavaScript.info, CS50/edX, Scrimba, Frontend Mentor, Figma, Google/Coursera, Kaggle, Maven Analytics, DeepLearning.AI, HubSpot Academy, Zapier, etc.); remaining courses cover 8 tracks with ≥ 3 each; 15–20 free courses; ratings realistic (3.8–4.9); hours realistic (2–120).

  **Agent B — books:** real books only (e.g., "The Design of Everyday Things", "Don't Make Me Think", "Deep Work", "The 4-Hour Workweek", "Freelancing in Pakistan"-adjacent practical titles, "Steal Like an Artist", "JavaScript: The Definitive Guide", "Building a StoryBrand", "The Mom Test", "Atomic Habits", etc.); ≥ 8 free (public-domain or officially free PDFs — only include a free URL when a genuinely free legal copy exists; otherwise paid with official page URL); genres balanced.

  **Agent C — playbook:** write like a senior freelancer sharing real insider tactics; templates must be copy-paste complete (with `[placeholders]`); scripts must be ready-to-send message blocks; sections/cards per spec (kickoff 4, contracts 4, pricing 5, difficult 4, delivery 4 = 21 cards).

  **Agent D — platforms:** the exact 12 named in the spec with REAL current-ish data (hedged: "as of 2026"): Upwork (10% fee, 5% agency fee note, $1 min withdrawal... verify: Upwork min withdrawal via Payoneer is $1? — instruct agent to hedge figures), Fiverr (20% flat), Freelancer (10%/20% tiers), Toptal (no fee for freelancers, elite), PeoplePerHour (20%), Guru (5–9%), 99designs (5–15%), Truelancer (10–15%), Contra (0% commission), LinkedIn Services (free), Dribbble (showcase), Behance (showcase). Where uncertain, use hedged phrasing in `feeNote`/`avgEarningsNote` and pick defensible values.

  **Agent E — knowledge base:** ~18 topics from the spec list; every fact must be practical, Pakistan-relevant (PKR amounts, FBR/NTN rules hedged, Payoneer/Wise/Elevate, DigiSkills/Bano Qabil), carry a real source URL (official docs, Payoneer help, FBR site, DigiSkills, etc.), and avoid invented specifics — hedge time-varying figures.

- [x] **Step 2: Run the 5 data test files** — fix any violations (schema mismatches, missing path ids, count shortfalls) directly in the data files.
- [x] **Step 3: Commit** — `feat(skills): add courses, books, playbook, platforms, and chatbot knowledge data`

---

## Task 4: AI persona "hunar"

**Files:**
- Modify: `src/lib/ai.ts`
- Modify: `src/app/api/chat/route.ts`

- [x] **Step 1: `src/lib/ai.ts`** — extend `ChatContext["persona"]` union: `"rahbar" | "study" | "essay" | "cv" | "safar" | "hunar"`. Import `skillsChatbotKnowledge` from `@/data/skills-chatbot-knowledge`; build `HUNAR_KNOWLEDGE` via the same `formatKnowledgeBase` pattern (generalize the existing function to accept a knowledge object). Add `PERSONA_PROMPTS.hunar`:

```ts
hunar: `You are "Hunar" (ہنر), the freelancing & side-hustle coach for aftermediate — a career platform for Pakistani students and fresh graduates. You help people build marketable skills, find clients, price their work, and get paid from Pakistan.

Tone: direct, practical, encouraging. No fluff. Use bullet points for checklists. Plain English with occasional Urdu phrases where natural.

KNOWLEDGE BASE — authored by the site owner. Treat it as your primary, authoritative source for facts. When you use a fact from it, cite its source URL in your reply:
${HUNAR_KNOWLEDGE}

Grounding rules:
- Answer from the knowledge base first. If it does not cover the question, give general best-practice advice but clearly mark it as general advice.
- Never invent fees, rates, tax figures, or platform rules. Use hedged language ("around", "typically", "as of 2026") for time-varying numbers.
- Academic/study questions → redirect to Ustaad (/study). Site navigation questions → redirect to Rahbar.
- Always end with one concrete next step the user can take today.`,
```

- [x] **Step 2: `src/app/api/chat/route.ts`** — extend persona union: `(body.persona as "rahbar" | "study" | "essay" | "cv" | "safar" | "hunar")`.
- [x] **Step 3: Verify** — `npx tsc --noEmit` exit 0.
- [x] **Step 4: Commit** — `feat(skills): add Hunar A.I persona with freelancing knowledge base`

---

## Task 5: Interactive components (5)

**Files:**
- Create: `src/components/skills/course-explorer.tsx`
- Create: `src/components/skills/book-library.tsx`
- Create: `src/components/skills/skills-chat.tsx`
- Create: `src/components/skills/client-playbook.tsx`
- Create: `src/components/skills/platform-war-room.tsx`

All components: `"use client"`, `React.useState`/`useMemo`, lucide-react icons, Tailwind tokens from the design system (`bg-surface`, `border-line`, `pixel-border`, `text-ink/muted/faint`, `saffron`, `emerald`, `amber`, `danger`, `info`, `violet`), font-mono for data values.

- [x] **Step 1: `course-explorer.tsx`** — state: `track` (null|track), `level` (null|level), `freeOnly` (bool), `sort` ("rating"|"hours"|"cost"|"title"), `q` (string), `mode` ("list"|"paths"), `done` (Set<string> via useLocalStorage `aftermediate:skills:paths`). List view: chips with counts (`All 48`), segmented level control, free-only toggle, sort select, search input; filtered grid of pixel-border cards (track badge, level difficulty meter as 3 filled/empty segments, hours chip, cost chip `pkr(costUsd)` showing `$49 ≈ Rs 13,700` for paid, rating stars, certificate badge `Cert`, "why" line, `Open ↗` link). Empty-state with clear-filters button. Paths view: 5 path cards → expand to timeline (numbered steps, course title + provider + hours, checkbox → toggles `done`), progress bar + `x/y done`, "Show only these courses" button → switches to list view with the path's course ids pre-filtered (highlighted). Result count line.
- [x] **Step 2: `book-library.tsx`** — state: `genre`, `q`, `freeOnly`, `sort`, `open` (expanded card ids), `queue` (useLocalStorage `aftermediate:skills:queue`: `{ id, progress }[]`). Card: pixel cover header (two-letter initials on colored block per genre), title/author, rating stars, `pages · ~N days @40/day`, FREE (emerald) / Paid badge, expandable "Summary + Why read this", `Read ↗` link, `+ Queue` / `In queue (N%)` button. Queue strip (fixed bottom or right rail on the page): total books, total pages, weighted finish estimate `(100 - avg progress)`, per-book progress sliders (input range 0–100), remove button, clear-all. Progress persists.
- [x] **Step 3: `skills-chat.tsx`** — copy the /study chat pattern (streaming reader, localStorage history `aftermediate:skills:chat`), adapted: greeting "Salam! Main Hunar hoon — your freelancing & side-hustle coach. Ask me about skills, pricing, clients, or getting paid from Pakistan."; suggestion chips: "I have zero skills — where do I start?", "How do I price a logo design?", "Upwork vs Fiverr — which first?", "How do I get paid from Pakistan?"; posts `persona: "hunar"` to `/api/chat`.
- [x] **Step 4: `client-playbook.tsx`** — state: `section` (default "kickoff"), `q`, `type` (null|type), `open` (Set of card ids). Left rail: 5 section buttons with card counts. Header: search + type chips. Cards: accordion (click header to expand body), Copy button (`copyText(body)` → temporary "Copied ✓" state), type badge with color (template=saffron, script=violet, rule=emerald, framework=amber), tags as mono chips. **Quote Builder** panel (top or side): service select (logo 6h, website 20h, content article 3h, video edit 8h, dev hour 1h, other 10h — presets fill hours), hours number input, rate USD number input (default 15), complexity segmented (1× / 1.25× / 1.5×) → live: `Quote: $X (Rs Y) · Deposit 50%: $Z · Milestones: 50/50 (or 40/40/20 when > 8h)`; persists last inputs via useLocalStorage `aftermediate:skills:quote`.
- [x] **Step 5: `platform-war-room.tsx`** — state: `view` ("table"|"cards"|"wizard"), sort key/dir for table, filters (newcomer toggle, pkr toggle, niche select). Table: sortable column headers (Name, Fee %, Competition ●●●○○, Newcomer ●●●○○, Min payout $, Payout time). Cards: fee bar (width %), competition meter (5 dots), newcomer meter, payout method chips, niche tags, pros/cons (two columns), tips callout (`bg-amber/10 border-amber/30`), `Visit ↗`. Wizard: 4 steps (skill select: design/development/writing/data/video/other; experience: none/some/pro; budget: small/mid/premium; payout: payoneer/any) → `wizardScore` → top-3 cards with reasons + full ranked list (collapsible).
- [x] **Step 6: Quick render sanity** — `npx tsc --noEmit` exit 0.
- [x] **Step 7: Commit** — `feat(skills): add five interactive skill components`

---

## Task 6: Route pages + sidebar

**Files:**
- Create: `src/app/(app)/skills/courses/page.tsx`, `books/page.tsx`, `chat/page.tsx`, `clients/page.tsx`, `platforms/page.tsx`
- Modify: `src/components/sidebar.tsx`

- [x] **Step 1: Pages** — each page: page header block (pixel icon tile + title + one-line description, matching study/page.tsx header pattern), then renders its component full-width (`mx-auto max-w-6xl px-4 py-6 sm:px-6`). Chat page mirrors study/page.tsx layout (`max-w-4xl h-[calc(100vh-4rem)]`).
- [x] **Step 2: Sidebar** — add group after "Education Abroad", before "Resources":

```tsx
{
  label: "Skills & Side Hustles",
  links: [
    { href: "/skills/courses", label: "Courses", icon: MonitorPlay },
    { href: "/skills/books", label: "Books", icon: BookMarked },
    { href: "/skills/chat", label: "Hunar A.I", icon: MessageSquareText },
    { href: "/skills/clients", label: "Clients", icon: Handshake },
    { href: "/skills/platforms", label: "Platforms", icon: Store },
  ],
},
```

Add the 5 icons to the lucide import list (verify names exist in lucide-react: `MonitorPlay`, `BookMarked`, `MessageSquareText`, `Handshake`, `Store`). Check whether any mobile nav component consumes `groups` (e.g., a drawer in the app layout) — if it does, it picks up the new group automatically; verify no hardcoded group lists elsewhere (`grep -rn "Education Abroad" src/`).

- [x] **Step 3: Verify** — `npx tsc --noEmit` exit 0; `npx eslint` on all changed files exit 0.
- [x] **Step 4: Commit** — `feat(skills): add skill pages and sidebar group`

---

## Task 7: Full verification

- [x] **Step 1:** `npx vitest run` — all suites pass (existing 3 pre-existing failures in `abroad-tests.test.ts` are known/unrelated)
- [x] **Step 2:** `npx tsc --noEmit` — exit 0
- [x] **Step 3:** `npx eslint` on all created/modified files — exit 0
- [x] **Step 4:** `npx next build` — all 5 new routes in output; exit 0
- [x] **Step 5:** Spot-check interactivity in dev (`npx next dev` + browser agent): courses filters/paths mode, book queue, chat sends a message (may fail without API key locally — verify request shape), quote builder math, platform wizard recommendation.
- [x] **Step 6:** Commit — `chore(skills): verification pass`

---

## Assumptions

- USD→PKR fixed at 280 with hedged wording; not a live rate service.
- Platform stats are best-effort as-of-2026 values, hedged in prose where uncertain.
- The 5 skill paths are the source of truth for a subset of course ids; course data must satisfy them.
- No hub page; direct sidebar links (approved).
