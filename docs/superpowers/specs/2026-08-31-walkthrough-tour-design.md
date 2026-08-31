# Guided Walkthrough Tour — Design Spec

> **Status:** Approved design spec
> **Date:** 2026-08-31

**Feature:** A persistent "Guided tour" floating button on every authenticated page. Clicking it opens a chapter hub panel; each chapter runs a spotlight walkthrough (driver.js engine) that tours one area of the product, navigating across routes as needed. A one-time gentle prompt offers the tour on the user's first dashboard visit after completing onboarding.

**Why chapters:** The sidebar exposes ~30 routes across 8 groups. A single linear tour would be a 30-step marathon — research benchmarks (Chameleon, 15M tour interactions) show completion collapses past 5-7 steps, while user-launched tours complete +123% vs auto-fired ones. Chapters give full site coverage at user-chosen depth, resumable per chapter.

## Route & Navigation

- **Mount point:** `src/app/(app)/layout.tsx` — `<TourProvider>` wraps the shell siblings, next to `RahbarDrawer`. Present on every authenticated page; no route changes needed.
- **Auth:** Inherits the existing `(app)` middleware gate. No new routes.
- **Trigger:** The floating pill is a plain button, not a navigation item.

## Architecture

```
src/lib/tour.ts                        types + chapter/step content (pure data, no React)
src/components/tour/tour-provider.tsx  context: state machine, persistence, driver.js lifecycle
src/components/tour/tour-hub.tsx       floating pill + chapter hub panel
src/components/tour/tour-prompt.tsx    first-visit "Take the tour" card
src/components/tour/tour.test.ts(x)    tests (see Testing)
globals.css                            driver.js popover theming via popoverClass
```

**Separation of concerns:** `tour.ts` is pure data — chapters, steps, copy, target selectors, routes — editable without touching logic and trivially testable. The provider owns behavior (state machine, persistence, driver.js lifecycle, route navigation). The hub/prompt own presentation. Steps target elements via `data-tour="…"` attributes added to existing pages; the selector strings live only in `tour.ts`.

**driver.js integration:** installed as `driver.js` (MIT, v1.8.0, ~5KB gzipped, zero deps, engine-agnostic). It is dynamically imported inside a `useEffect` — never at module scope — so SSR and hydration are unaffected. The provider drives it imperatively: one `driver()` instance per chapter run, rebuilt per step when cross-route navigation occurs. The popover is themed to design tokens via `popoverClass` + CSS in `globals.css` (not driver's default theme).

## The Floating Button

- **Style:** Saffron pill (Compass icon from lucide-react + "Guided tour" label), `Button`-derived classes, soft saffron glow matching `variant="default"`, `animate-rise` entrance.
- **Position:** fixed bottom-right, `z-40` (below modals/drawers at z-50/z-[60]), hidden while the RahbarDrawer overlay is open to avoid stacking collisions.
- **Pulse ring** (`animate-pulse-ring`): first visit only, until the prompt is dismissed or the tour starts.
- **Keyboard/focus:** standard `Button` focus-visible ring; `aria-haspopup="dialog"` + `aria-expanded`.

## Chapter Hub Panel

Opened by the pill; a non-modal popover (Card + Button primitives, `rounded-2xl border border-line bg-surface`, ~280px, `animate-rise`):

- Header "Guided tours" + mono sublabel with chapter count.
- One row per chapter: name, stop count / route scope, and state — `Start`, `Resume (n/m)` when mid-chapter, or emerald checkmark when complete.
- Chapter progress bar + "x of 4 chapters".
- Closes on outside click or Escape; focus returns to the pill. Not a focus trap (non-modal, page stays interactive).

## Chapters & Steps

Each step: `{ target: data-tour selector, title, body (task-shaped copy), route?, onEnter? }`. A step with `route` navigates before highlighting; `onEnter` runs when the step becomes active (used to open the Rahbar drawer live). Chapter list:

| # | Chapter | Stops | Routes |
|---|---|---|---|
| 1 | Getting around | 5 | dashboard (welcome, sidebar groups, top nav, Daily Sprint card, Rahbar A.I button) |
| 2 | Education in Pakistan | 7 | universities, entry tests, self assessment, scholarships, merit, career, trends |
| 3 | Study abroad & money | 6 | countries, scholarships, planner, money, convince, Safar A.I |
| 4 | Skills, CV & your A.I helpers | 6 | courses, builder, Hunar A.I, Ustaad A.I, Rahbar drawer (opened live), mentor match |

- One step per route — explain what the page is *for* and when to use it, not what the labels say.
- The Rahbar step dispatches `open-rahbar` (existing CustomEvent idiom) so the drawer opens live during the tour.
- Not every route gets a stop (College Essays, Webinars, Resources, abroad self-assessment, test prep, platforms, clients, books, ivy-league are skipped in v1). Adding chapters/steps later is a `tour.ts` content edit, not code.

## Spotlight Popover (per step)

- driver.js cutout spotlight: `stagePadding` 8px, rounded corners, dark scrim (`rgba(25,31,44,.5)`).
- Popover: kicker (chapter name, mono uppercase), bold title, one-sentence body, thin progress bar, mono counter `4/7`, `Exit` ghost + `Next` primary buttons; `Back` appears from step 2.
- `Next` on the final step reads `Finish` and returns to the hub with the chapter marked complete.
- Escape or overlay click exits the chapter (progress saved, hub reopens).

## State Machine & Persistence

Provider state: `{ hubOpen, activeChapter, stepIndex }` → transitions `idle → hub → running(step) → hub | complete`.

Single localStorage key `aftermediate:tour` (JSON), mirroring the `aftermediate:rahbar-chat` pattern:

```ts
{
  promptDismissed: boolean,            // gentle prompt shown at most once, ever
  chapters: Record<string, {           // keyed by chapter id
    completed: boolean,
    lastStep: number                   // resume point; completed chapters ignore it
  }>
}
```

- Read in a lazy `useState` initializer with try/catch fallback to defaults; write on every transition (both wrapped for `typeof window`).
- **Prompt gating:** the first-visit prompt shows only when `quizCompletedAt` is set (from `useStudent()`), `promptDismissed` is false, and pathname is `/dashboard`. Dismiss or Start sets the flag permanently.
- **Not synced to Supabase in v1.** Tour progress is device-local; a `tour jsonb` column is a possible additive follow-up if cross-device resume is ever wanted.
- **Cross-route steps:** when the next step's `route` differs from `usePathname()`, the provider calls `router.push(route)`, then polls for the target element (`300ms` interval, `5s` cap) before showing the popover.

## Accessibility

driver.js has no focus trap in core, so the provider adds one modeled on `share-modal.tsx:202-232`:

- Focus moves into the popover on each step; Tab/Shift+Tab cycle within it; Escape exits; focus restores to the pill on chapter end.
- Popover: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, step content announced via a visually-hidden `aria-live="polite"` region ("Step 4 of 7, Merit Calculator").
- `prefers-reduced-motion`: disables the pill pulse ring and the spotlight transition animation.
- All controls are real buttons ≥40px hit targets; counter text is not color-only (mono text).
- The hub and prompt are plain focusable buttons — no overlay, no trap.

## Error Handling

- **Target never appears** (route renders slow, selector stale): after the 5s poll cap, skip that step and advance — a tour must never dead-end. Skipped steps do not mark the chapter complete out of order.
- **Malformed localStorage:** try/catch returns defaults; a corrupt blob never blocks the app.
- **driver.js import failure:** hub/pill render but starting a chapter is a no-op (logged `console.warn`); the app itself is unaffected.
- **Mid-tour navigation by the user** (clicks a sidebar link while spotlighted): the driver instance is destroyed, chapter state saved, no orphaned overlays.

## Testing

Vitest + Testing Library, jsdom per-file convention (`// @vitest-environment jsdom`, as in `entry-test-heatmap.test.tsx`):

1. **`tour.test.ts` (node):** data integrity — every step's `route` exists in the sidebar `groups` nav map; every chapter has 5-7 steps; every step has title + body + target; chapter ids unique.
2. **`tour-provider.test.tsx` (jsdom, driver.js mocked):** state machine transitions; resume index correctness; prompt shows once only when gated conditions met (quizCompletedAt + dashboard + not dismissed); persistence round-trip through localStorage.
3. **`tour-hub.test.tsx` (jsdom):** renders 4 chapters from data; Start vs Resume vs checkmark states; pill `aria-expanded` toggling; Escape/outside-click closes.

Spotlight geometry, cross-route timing, and visual polish are verified manually in the dev server (browser) — jsdom cannot meaningfully assert layout.

## Out of Scope (v1)

- Supabase persistence of tour state
- Per-page contextual mini-tours triggered on first visit to a page
- Localization of tour copy
- Analytics events on tour completion
