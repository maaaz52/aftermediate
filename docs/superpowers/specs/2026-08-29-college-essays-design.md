# College Essays — Design Spec

**Date:** 2026-08-29
**Status:** Approved (user: "yes")
**User decisions:** Qalam A.I (قلم) as the rating assistant persona · deterministic Approach Builder engine · real sourced content with source links throughout · Inspiration Gallery of real personal statements with backstories.

## Goal

Add a new "College Essays" sidebar group with a single unified page at `/college-essays` that helps Pakistani students write personal essays and statements for college/university applications. The page contains four deeply interactive subsections (modules) in one cohesive experience — no multi-page routing.

## Context & Existing Patterns

- **App structure**: `src/app/(app)/layout.tsx` renders `Sidebar` + `TopNav` + main. Sidebar groups defined in `src/components/sidebar.tsx` (`groups` array, consumed by `top-nav.tsx` via flatMap — auto-picks-up new links).
- **Page pattern**: server component wrapper (pixel icon tile header, `mx-auto max-w-6xl px-4 py-6 sm:px-6`) + client component internals (see `/skills/*` pages).
- **Chat pattern**: POST `/api/chat` with `persona`, streaming via `ReadableStream` reader, localStorage history (see `skills-chat.tsx`).
- **Personas**: `PERSONA_PROMPTS: Record<ChatContext["persona"], string>` in `src/lib/ai.ts`. The `essay` persona exists but is **unused by any page** and is a *writer* (drafts essays). The `cv` persona is a resume writer. Both are reference material for Qalam.
- **Design system**: light paper theme (`bg-background #f4f2eb`, surface, surface-2, line, ink, muted, faint), accent `#2f55d4`, emerald `#1c9e62`, amber `#d99a2b`, danger `#d63d3d`, info `#1790b0`, violet `#7a5bd4`; Silkscreen / Plus Jakarta Sans / Space Mono; utilities `.pixel-shadow`, `.pixel-border`, `.card-glass`, `.dither`, `.grid-bg`; primitives PixelCard, PixelButton, Badge. No animation library — scroll effects via IntersectionObserver + CSS transitions.
- **Data honesty**: the site's established standard — content backed by real sources with URLs (chatbot knowledge bases, skills data), hedged time-varying figures.
- **Profile**: `useStudent()` from `src/lib/store.tsx` exposes `profile` (name, stream, marks, interests, skills, education[], city, budget, quiz) — input for the Approach Builder.

## Architecture

**Route:** `/college-essays` (single URL, protected by auth middleware like all app pages).

**Files:**
- Create `src/app/(app)/college-essays/page.tsx` — server wrapper: violet pixel icon tile header (`Feather` icon, `text-violet bg-violet/10`), title "College Essays" with violet suffix, one-line description, then `<CollegeEssaysApp />`.
- Create `src/components/college-essays/college-essays-app.tsx` — client shell: sticky module tab bar (4 tabs, pixel-border, icons, ✓ checkmark on completed modules read from localStorage) + hash sync.
- Create `src/components/college-essays/essay-explainer.tsx` — Module 1.
- Create `src/components/college-essays/writing-guide.tsx` — Module 2.
- Create `src/components/college-essays/essay-rater.tsx` — Module 3 (Qalam).
- Create `src/components/college-essays/approach-builder.tsx` — Module 4.
- Create `src/lib/college-essays.ts` — pure functions (tone analyzer, strategy engine, cliché/telling-word lists).
- Create `src/lib/college-essays.test.ts` — unit tests (TDD).
- Create `src/data/college-essays.json` — all content (sections, criteria, myths, quiz, drag-drop, inspiration, guide steps, starters, templates) with `sources` on every block.
- Create `src/data/college-essays.test.ts` — contract tests.
- Modify `src/lib/ai.ts` — add `"qalam"` persona.
- Modify `src/app/api/chat/route.ts` — extend persona cast with `"qalam"`.
- Modify `src/components/sidebar.tsx` — add "College Essays" group.

**Sidebar group** (after "Skills & Side Hustles", before "Resources"):
```tsx
{
  label: "College Essays",
  links: [
    { href: "/college-essays", label: "College Essays", icon: Feather },
  ],
},
```
Add `Feather` to lucide imports. Top-nav picks it up automatically.

**Shell tab/hash sync:** tabs map to hashes `#what`, `#how-to`, `#rating`, `#builder`. On mount, read `location.hash`; on tab change, `history.replaceState` + update hash. Back button works. Active module persisted under `aftermediate:essays:tab` (hash wins on load).

## Module 1 — What Is A Personal Essay?

Scroll-driven, animated explainer (IntersectionObserver adds an `is-visible` class; CSS transitions: fade + slight translate + pixel-border accent reveal). Sections:

1. **What it is** — definition + role in applications, with admissions-officer sourced statements.
2. **What admissions officers look for** — 5 criteria cards with pixel meters (e.g., authentic voice, specific detail, growth/insight, stakes, craft). Each card sourced.
3. **Before / After** — interactive toggle: weak paragraph vs strong rewrite of the same idea, annotated highlights (what changed and why), sourced from essay-editing guidance.
4. **Common myths** — myth/fact pairs (e.g., "essays must be about trauma", "use big vocabulary to impress"), each debunked with a source link.
5. **Inspiration Gallery** — 6–8 real personal statements sourced from published collections: MIT "Essays That Worked", Johns Hopkins "Essays That Worked", NYT college essay series, College Essay Guy, QuestBridge/Gates scholarship essays. Each card: **backstory** (who wrote it, their context), short excerpt, "why it works" annotation, and a source link to the full essay. Copyright-safe: backstory + short excerpt + link only — never full essays copied into the site.
6. **Strong vs. weak quiz** — 5 multiple-choice questions (data-driven), instant feedback + explanation with source, score tracked.
7. **Drag-and-drop** — 6 essay fragments; drop each into "Strong hook" or "Weak hook" zone (native HTML5 DnD + tap-to-place fallback for touch). Instant feedback with explanation; score tracked.

Progress persisted: `aftermediate:essays:quiz` (answers + score), `aftermediate:essays:dragdrop` (placed items). Completing all quiz + drag-drop items marks the module ✓.

## Module 2 — How To Write It

4-step stepper with **progressive disclosure** (one step expanded at a time; completed steps show ✓; step order enforced but skippable):

1. **Brainstorm** — random idea generator ("prompt wheel": shuffle a sourced prompt/experience question, show one, re-spin) + free-text **experience inventory** (list of experiences/topics, each with a one-line "why it matters"), persisted.
2. **Outline** — 3 structure templates to choose from (Narrative Arc, Challenge→Growth, Topic Deep-Dive), each showing a skeleton of labeled slots; student fills slots inline; chosen template + content persisted.
3. **Draft** — sentence starters grouped by essay part (hook, transition, reflection, closing), click-to-insert into the draft area; live word counter; autosaved draft.
4. **Revise** — **real-time tone/clarity analyzer** (deterministic, pure function in `college-essays.ts`, runs on draft as the student types): word count, sentence count, average sentence length, sentences over 25 words, telling words (happy/sad/nice/amazing…), clichés, "show vs. tell" flags → actionable checklist (e.g., "3 sentences over 25 words — vary your rhythm", "Replace 'I felt happy' with a concrete moment").

Steps sourced to writing guides (Purdue OWL, College Essay Guy, university admissions blogs) via `sources` arrays.

Persistence: `aftermediate:essays:guide-step`, `aftermediate:essays:inventory`, `aftermediate:essays:outline`, `aftermediate:essays:draft`. Completing all 4 steps marks the module ✓.

## Module 3 — AI Essay Rating (Qalam A.I · قلم)

- **Layout**: split view on desktop — left: draft panel (textarea to paste draft + "Load my draft" button that pulls `aftermediate:essays:draft` from Module 2 + live word count); right: chat panel. Stacks on mobile.
- **Chat**: streaming, same pattern as `skills-chat.tsx` (fetch `/api/chat`, `persona: "qalam"`, reader-based streaming, localStorage history `aftermediate:essays:rater-chat`, suggestion chips: "Rate my draft", "Make my hook stronger", "Is my opening cliché?", "What should I cut?").
- **Persona** (`PERSONA_PROMPTS.qalam`): identity "Qalam (قلم)", a college/scholarship essay rating coach. Embeds the existing essay persona guidelines (authenticity, no clichés, strong hook, narrative arc, 400–600 words unless told otherwise, never fabricate) and cv-style tailoring awareness. Rating framework: reply with **Strengths / Weaknesses / Improvement suggestions**, each point **quoting concrete excerpts from the user's text** ("You wrote '…' — …"). Never fabricate feedback not grounded in the pasted text. Academic questions → redirect to Ustaad (/study); site navigation → Rahbar. End with one concrete next step.
- **route.ts**: persona cast union extended with `"qalam"`.

## Module 4 — Smart Approach Builder

- **Form inputs**: essay type (Personal statement / Scholarship / Both), target universities (preset chips from a curated `builderPresets` list in `college-essays.json` — includes top Pakistan (LUMS, NUST, GIKI, FAST) and abroad (Ivy League, top UK/AU/EU) targets + free text), intended major (chips + custom), extracurriculars (chips + custom).
- **Profile panel**: "From your profile" — reads `useStudent()` profile: stream, interests, skills, education entries, city; displayed read-only with note that it comes from their profile.
- **Deterministic engine** (`collegeEssaysStrategy(input): Strategy` in `college-essays.ts`, pure + fully unit-tested):
  - `approach: "narrative" | "analytical" | "hybrid"` — STEM stream + scholarship type → analytical-lean; humanities/business/interests → narrative-lean; mixed → hybrid. Low English confidence (`quiz.english < 3`) → narrative with simpler structure. `approachReason` explains the choice.
  - `themes: { name; why }[]` — top 3–4 themes mapped from interests + skills + major keywords via a theme bank (curiosity, resilience, leadership, service, innovation, identity, community…); deterministic tie-breaking.
  - `structureTemplateId` — one of the Module 2 templates, chosen by approach + essay type.
  - `prompts: string[]` — 3–5 targeted fill-in-the-blank drafting prompts combining chosen themes + inputs (e.g., "Tell the story of the moment you first discovered your interest in [major]").
- **Output card**: strategy summary (approach + reason, theme chips with why, structure template preview, numbered prompts), copy-to-clipboard button, "Jump to Qalam" cross-link to Module 3. Persisted: `aftermediate:essays:strategy`.

## Data Model (src/data/college-essays.json)

```jsonc
{
  "explainer": {
    "sections": [{ "id": "what", "title": "", "body": "", "sources": [{ "label": "", "url": "" }] }], // ≥4
    "criteria": [{ "id": "voice", "title": "", "weight": "high|medium", "detail": "", "sources": [] }], // 5
    "beforeAfter": { "weak": { "title": "", "paragraphs": [] }, "strong": { "title": "", "paragraphs": [] }, "notes": [{ "label": "", "detail": "" }] },
    "myths": [{ "id": "", "myth": "", "fact": "", "sources": [] }] // ≥4
  },
  "quiz": [{ "id": "q1", "question": "", "options": [{ "label": "", "correct": false }], "explanation": "", "source": { "label": "", "url": "" } }], // exactly 5
  "dragDrop": {
    "zones": [{ "id": "strong-hook", "label": "Strong hook" }, { "id": "weak-hook", "label": "Weak hook" }],
    "items": [{ "id": "i1", "text": "", "zone": "strong-hook", "explanation": "" }] // ≥6, every zone id valid
  },
  "inspiration": [{ "id": "", "title": "", "program": "", "backstory": "", "excerpt": "", "whyItWorks": "", "sourceLabel": "", "sourceUrl": "" }], // 6–8, https URLs
  "guide": {
    "steps": [{ "id": "brainstorm|outline|draft|revise", "title": "", "summary": "", "tools": ["idea-generator|inventory|templates|starters|analyzer"], "sources": [] }], // exactly 4 in order
    "starters": [{ "id": "", "part": "hook|transition|reflection|closing", "text": "", "sources": [] }], // ≥10, all 4 parts covered
    "templates": [{ "id": "narrative-arc|challenge-growth|topic-deep-dive", "name": "", "bestFor": "", "skeleton": [], "sources": [] }] // exactly 3, ≥4 skeleton slots each
  },
  "builderPresets": {
    "universities": ["LUMS", "NUST", "GIKI", "FAST", "Stanford", "MIT", "Harvard", "Oxford", "Toronto"], // chips, extendable
    "majors": ["Computer Science", "Medicine", "Business", "Economics", "Mechanical Engineering", "Architecture", "Law", "Psychology", "Graphic Design"],
    "extracurriculars": ["Debate", "MUN", "Volunteering", "Robotics club", "Sports team", "Coding projects", "School society leadership", "Content writing"]
  }
}
```

**Sourcing rules (user requirement):**
- Every content block (sections, criteria, myths, quiz explanation, steps, starters, templates) carries `sources` with real, verified URLs from various websites — researched via web search, never invented.
- Inspiration essays link to the original published pages (universities' own "Essays That Worked" pages, NYT, College Essay Guy, etc.). Short excerpt + backstory only; full essays live on the source sites.
- Time-varying or opinion-based guidance hedged ("as of 2026", "most admissions officers advise…").

## Lib Functions (src/lib/college-essays.ts)

```ts
export const CLICHES: string[];          // curated cliché phrases
export const TELLING_WORDS: string[];    // "happy", "sad", "nice"…
export function splitSentences(text: string): string[];
export function countWords(text: string): number;
export interface DraftAnalysis {
  wordCount: number; sentenceCount: number;
  avgSentenceLength: number;
  longSentences: { text: string; words: number }[]; // > 25 words
  tellingWords: string[];
  cliches: string[];
  suggestions: string[];                  // actionable checklist lines
}
export function analyzeDraft(text: string): DraftAnalysis; // pure, deterministic

export type EssayType = "personal" | "scholarship" | "both";
export interface StrategyInput {
  essayType: EssayType;
  universities: string[];
  major: string;
  extracurriculars: string[];
  profile: {
    stream: string | null;
    interests: string[];
    skills: string[];
    english?: number;   // quiz.english 1-5
  };
}
export interface Strategy {
  approach: "narrative" | "analytical" | "hybrid";
  approachReason: string;
  themes: { name: string; why: string }[]; // 3-4
  structureTemplateId: "narrative-arc" | "challenge-growth" | "topic-deep-dive";
  prompts: string[];                       // 3-5, non-empty
}
export function collegeEssaysStrategy(input: StrategyInput): Strategy; // pure, deterministic
```

## localStorage Keys

| Key | Purpose |
|---|---|
| `aftermediate:essays:tab` | active module |
| `aftermediate:essays:quiz` | quiz answers + score |
| `aftermediate:essays:dragdrop` | drag-drop placements |
| `aftermediate:essays:guide-step` | current stepper position |
| `aftermediate:essays:inventory` | experience inventory |
| `aftermediate:essays:outline` | chosen template + slots |
| `aftermediate:essays:draft` | draft text (shared by Modules 2/3) |
| `aftermediate:essays:rater-chat` | Qalam chat history |
| `aftermediate:essays:strategy` | last generated strategy |

## Testing

**Unit (src/lib/college-essays.test.ts, TDD):**
- `analyzeDraft`: word/sentence counts, long-sentence detection, telling words, clichés, empty/whitespace input, suggestion generation.
- `collegeEssaysStrategy`: STEM+scholarship → analytical-lean; humanities → narrative-lean; low English → narrative; themes derived from interests/skills/major (top 3–4, no dupes); prompts always 3–5 non-empty; **determinism** (same input twice → deep-equal output).

**Contract (src/data/college-essays.test.ts):**
- Exactly 5 quiz questions with 4 options each; exactly 2 drag zones; ≥6 items all referencing valid zones.
- `builderPresets`: ≥8 universities, ≥5 majors, ≥5 extracurriculars, all non-empty.
- 6–8 inspiration entries, every `sourceUrl` starts with `https://`, non-empty backstory/excerpt/whyItWorks.
- Exactly 4 guide steps in order brainstorm→outline→draft→revise; exactly 3 templates (≥4 skeleton slots each); ≥10 starters covering all 4 parts.
- **Every sourced block has ≥1 source with `https://` URL** (explainer sections, criteria, myths, quiz explanations, steps, starters, templates).
- No duplicate ids anywhere.

## Verification Gates

- `npx vitest run` — new suites pass; full suite green except documented pre-existing failures (13 `quiz.test.ts` + 3 `abroad-tests.test.ts` — unrelated, untouched).
- `npx tsc --noEmit` exit 0 · `npx eslint` exit 0 · `npx next build` exit 0 (route prerenders static).
- Browser spot-check if auth session available; otherwise build + tests as evidence.

## Out of Scope

- No multi-page routing, no hub page.
- No AI-generated strategy (deterministic per user decision).
- No full-essay copying (links + excerpts only, copyright-safe).
- No new dependencies (native DnD, IntersectionObserver, CSS transitions).
