# Skills & Side Hustles — Design Spec

**Date:** 2026-08-29
**Status:** Approved (no changes requested)

## Goal

Build a new sidebar category **"Skills & Side Hustles"** — a working machine for building marketable skills outside traditional education, aimed at Pakistani students/FSc graduates. Five interactive, data-driven pages: Courses, Books, Hunar A.I (chatbot), Clients, Platforms. No blog-style static layouts — every page is a tool.

## Architecture

- **Static data + client components.** No runtime external APIs (project rule). Deterministic interactivity; localStorage for persistence. The only network call is the sanctioned `/api/chat` used by Hunar A.I.
- Data files in `src/data/*.json|ts` with structural validation tests, matching the existing pattern (entry-tests.json, abroad-scholarships.json, etc.).
- Pure helper logic in `src/lib/skills.ts` (unit-tested): PKR conversion, sorting, skill-path sequencing, platform wizard scoring, localStorage hooks.
- Interactive components in `src/components/skills/`.
- Design system: existing paper/pixel theme — `bg-background`, `border-line`, `pixel-border`, `pixel-shadow`, `bg-surface`, `bg-surface-2`, `text-ink/muted/faint`, accent `saffron` (#2f55d4), `emerald` (free/good), `amber` (warn), `danger`, `info`, `violet`; fonts Silkscreen (display), Plus Jakarta Sans (sans), Space Mono (mono).

## Navigation

Sidebar group `Skills & Side Hustles` placed **between "Education Abroad" and "Resources"**, direct links (no hub page), matching how other categories are built:

| Route | Label | Icon |
|---|---|---|
| /skills/courses | Courses | MonitorPlay |
| /skills/books | Books | BookMarked |
| /skills/chat | Hunar A.I | MessageSquareText |
| /skills/clients | Clients | Handshake |
| /skills/platforms | Platforms | Store |

## Page Specs

### 1. /skills/courses — Course Explorer (~48 courses)

**Data** `src/data/skills-courses.json`:
```ts
{ id: string; title: string; provider: string; track: string; // "web-development"|"design"|"data"|"ai"|"marketing"|"writing"|"business"|"video"
  level: "beginner"|"intermediate"|"advanced"; hours: number; costUsd: number; // 0 = free
  certificate: boolean; rating: number; // 0–5, one decimal
  url: string; // https
  description: string; // 1–2 sentences
  why: string; // "why take this" one-liner
  updatedYear: number; }
```

**Interactions:**
- Track filter chips with counts + All; level segmented control; free-only toggle; sort (rating desc, hours asc, cost asc, title); live search over title/provider/description.
- Card grid: pixel-border, track badge, difficulty meter (3 segments from level), time chip, cost chip (`$49 ≈ Rs 13,700` — PKR conversion in lib), rating stars, certificate badge, "why" line, external link.
- Active-filter summary with clear button; result count.
- **Skill Path mode** — toggle from list view to path view. 5 preset paths: `frontend-6mo` (Frontend Dev in 6 Months), `designer-starter`, `data-analyst-starter`, `ai-prompt-work`, `content-writer`. Each path = ordered list of 4–6 course IDs (must exist in catalog). Path view shows timeline with check-off per course; completion persisted in localStorage (`aftermediate:skills:paths`). Path courses can be opened from the list view.

### 2. /skills/books — Book Library (~36 books)

**Data** `src/data/skills-books.json`:
```ts
{ id: string; title: string; author: string; genre: string; // "business"|"marketing"|"design"|"code"|"mindset"|"writing"|"finance"|"sales"
  rating: number; // 0–5, one decimal
  pages: number; year: number; free: boolean;
  url: string; // https — free copy or official page
  summary: string; // 2–3 sentences
  whyRead: string; // "why read this" 1–2 lines
  level: "beginner"|"intermediate"|"advanced"; }
```

**Interactions:**
- Genre chips + search + free-only toggle + sort (rating desc, pages asc, year desc).
- Cards: pixel cover header (title initials), rating stars, pages + read-time estimate ("~6 days at 40 pages/day"), FREE/paid badge, expandable summary + "why read this" box, link out.
- **Reading Queue:** add/remove books; per-book progress slider (0–100%, localStorage `aftermediate:skills:queue`); queue strip shows total pages, weighted finish-date estimate, progress bars.

### 3. /skills/chat — Hunar A.I (ہنر)

- Full-page streaming chat identical to /study pattern (greeting, suggestion chips, localStorage history `aftermediate:skills:chat`, streaming reader).
- New persona `"hunar"` added to `ChatContext` union, `PERSONA_PROMPTS` in `src/lib/ai.ts`, and `/api/chat` route persona union.
- **Knowledge base** `src/data/skills-chatbot-knowledge.ts` (same shape as abroad-chatbot-knowledge.ts: `KnowledgeTopic { id, title, facts: { text, source }[] }`, header comment "edit this file to train the bot"). ~18 topics, every fact carries a source URL:
  - getting-started, in-demand-skills, portfolio-building, upwork-onboarding, fiverr-gigs, pricing (USD/PKR), client-communication, contracts-basics, getting-paid (Payoneer/Wise/Elevate), pakistan-taxes (FBR/NTN, sales tax threshold), side-project-ideas, personal-branding, portfolio-projects, scam-warnings, time-management, free-training-programs (DigiSkills, Bano Qabil), interview-prep, rate-raises.
- Persona rules: answer from knowledge base first, cite sources, hedge time-varying figures ("around", "as of 2026"), redirect study questions to Ustaad and site-nav questions to Rahbar, always end with one concrete next step. Urdu name: Hunar A.I · ہنر.
- Greeting + 4 suggestion chips: "I have zero skills — where do I start?", "How do I price a logo design?", "Upwork vs Fiverr — which first?", "How do I get paid from Pakistan?"

### 4. /skills/clients — Client Playbook

**Data** `src/data/skills-client-playbook.json`:
```ts
{ sectionId: string; title: string; intro: string;
  cards: { id: string; title: string; type: "template"|"script"|"rule"|"framework";
           body: string; // 1–4 paragraphs, copy-paste usable
           tags: string[] }[] }[]
```

**Sections (5):**
1. `kickoff` — Kickoff & Communication: first-message template, kickoff-call agenda template, check-in cadence rules, status-update template.
2. `contracts` — Contracts & Scope: 10 clauses every contract needs (framework), milestone structure template, change-request form template.
3. `pricing` — Pricing: hourly vs fixed vs value-based framework, deposit rules, when to raise rates, negotiation scripts (client pushes back), scope of work template.
4. `difficult` — Difficult Situations: scope-creep script, late-payment sequence (3-step script), unhappy-client script, firing-a-client script.
5. `delivery` — Delivery & Handoff: delivery checklist, feedback-round cap rule, testimonial-request script.

**Interactions:**
- Section tab list (left rail); search across cards; type filter chips (template/script/rule/framework); accordion cards with **Copy** buttons (`navigator.clipboard`, fallback); tag display.
- **Quote Builder** widget: service type select (logo, website, content article, video edit, dev hour, other), hours estimate input, hourly rate USD input, complexity multiplier (1× / 1.25× / 1.5× segmented) → live outputs: total quote, 50% deposit, PKR equivalent, suggested milestone split (50/50 or 40/40/20); last quote persisted to localStorage `aftermediate:skills:quote`.

### 5. /skills/platforms — Platform War Room (~12 platforms)

**Data** `src/data/skills-platforms.json`:
```ts
{ id: string; name: string; tagline: string;
  kind: "marketplace"|"showcase"|"agency";
  fee: number; // client % fee, 0–100
  feeNote: string;
  competition: number; // 1–5
  newcomerFriendly: number; // 1–5
  payoutMethods: string[]; // e.g. ["Payoneer","Bank Transfer","PayPal"]
  payoutTime: string; // e.g. "5 days after milestone"
  minWithdrawalUsd: number;
  avgEarningsNote: string;
  niches: string[];
  pros: string[]; cons: string[];
  tips: string[]; // platform-specific
  url: string; pkrFriendly: boolean; }
```

**Platforms (12):** Upwork, Fiverr, Freelancer, Toptal, PeoplePerHour, Guru, 99designs, Truelancer, Contra, LinkedIn (Services Marketplace), Dribbble, Behance.

**Interactions:**
- Sortable comparison table: click headers (name, fee, competition, newcomer, min withdrawal, payout time) to sort.
- Platform cards: fee bar, competition meter (5 dots), newcomer meter, payout chips, niche tags, pros/cons, tips callout box.
- Filters: newcomer-friendly toggle, Pakistan-friendly payout toggle, niche select.
- **"Where should I start?" wizard:** 4 questions — (1) skill area (design/development/writing/data/video/other), (2) experience (none/1–2 years/3+), (3) target first-client budget (small $/mid $/premium), (4) payout preference (Payoneer-friendly/any). Deterministic weighted scoring in `src/lib/skills.ts` → ranked top 3 with reasons.

## lib/skills.ts (pure helpers, unit-tested)

- `USD_TO_PKR` constant (~280, hedged note) + `pkr(valueUsd): string` formatting "Rs 13,700".
- `sortCourses/books/platforms` — generic sorters by key.
- `trackCounts(courses)` — chip counts.
- `skillPaths` — path definitions (id, title, subtitle, courseIds[]), `validatePaths(courses)` (all ids exist, no dups), `pathProgress(pathId, doneSet)`.
- `wizardScore(answers, platforms): { id, score, reasons[] }[]` — weighted top-3.
- `readDays(pages, perDay=40)` — read-time estimate.
- `useLocalStorage<T>(key, initial)` — React hook (localStorage-guarded, SSR-safe).
- `copyText(text)` — clipboard with fallback.

## AI Integration

- `src/lib/ai.ts`: extend `ChatContext["persona"]` union with `"hunar"`; add `PERSONA_PROMPTS.hunar` (persona + knowledge injection like SAFAR via `skillsChatbotKnowledge`).
- `src/app/api/chat/route.ts`: extend persona union.
- `src/data/skills-chatbot-knowledge.ts` + test: header comment, ~18 topics, every fact sourced; test asserts structure, https sources, non-empty, unique ids.

## Files

**Create:**
- src/data/skills-courses.json + skills-courses.test.ts
- src/data/skills-books.json + skills-books.test.ts
- src/data/skills-chatbot-knowledge.ts + skills-chatbot-knowledge.test.ts
- src/data/skills-client-playbook.json + skills-client-playbook.test.ts
- src/data/skills-platforms.json + skills-platforms.test.ts
- src/lib/skills.ts + src/lib/skills.test.ts
- src/components/skills/course-explorer.tsx, book-library.tsx, skills-chat.tsx, client-playbook.tsx, platform-war-room.tsx
- src/app/(app)/skills/courses/page.tsx, books/page.tsx, chat/page.tsx, clients/page.tsx, platforms/page.tsx

**Modify:**
- src/lib/ai.ts (persona union + prompt)
- src/app/api/chat/route.ts (persona union)
- src/components/sidebar.tsx (new group)

## Verification

- `npx vitest run` — all data + lib tests pass (existing suites unaffected)
- `npx tsc --noEmit` — exit 0
- `npx eslint` on modified/created files — exit 0
- `npx next build` — all 5 new routes build
