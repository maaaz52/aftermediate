# Guided Walkthrough Tour Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A persistent "Guided tour" floating button on every authenticated page that opens a chapter hub; each chapter runs a driver.js spotlight walkthrough across routes, with a one-time prompt on first dashboard visit and per-chapter resume.

**Architecture:** `src/lib/tour.ts` holds pure chapter/step data (no React). `src/components/tour/tour-provider.tsx` owns the state machine (`idle → hub → running(step) → hub|complete`), localStorage persistence (`aftermediate:tour`), the driver.js lifecycle (dynamically imported in `useEffect`, one instance per step, rebuilt on cross-route steps with target polling), the focus trap, and the aria-live announcer. `tour-hub.tsx` renders the floating pill + chapter panel; `tour-prompt.tsx` renders the first-visit card. Steps target existing page elements via `data-tour` attributes; driver's popover is themed to design tokens via `popoverClass: "tour-popover"` + CSS in `globals.css`.

**Tech Stack:** Next.js 16.3.2 (App Router, client components), React 19.2.8, TypeScript, Tailwind CSS v4 (design tokens in `@theme`), driver.js ^1.8.0 (MIT), Vitest 4 + Testing Library (jsdom per-file via `// @vitest-environment jsdom`).

**Spec:** `docs/superpowers/specs/2026-08-31-walkthrough-tour-design.md`

---

## Conventions & context (read before starting)

- **Test environment:** vitest default env is `node` (`vitest.config.ts`). Component tests MUST start with `// @vitest-environment jsdom` as their first line (see `src/components/dashboard/entry-test-heatmap.test.tsx`). CSS imports (`import "driver.js/driver.css"`) are stubbed automatically by vitest.
- **Mocking `useStudent`:** the established pattern is `vi.spyOn(store, "useStudent").mockImplementation(() => mockUseStudent())` (entry-test-heatmap.test.tsx:9-10). The provider calls `useStudent()`, so every tour component test needs this mock.
- **Mocking modules with state:** `vi.mock` factories are hoisted above imports — mutable mock state must be created with `vi.hoisted(() => ...)`. `next/navigation` must be mocked to return a STABLE router object (the step effect has `router` in its deps; a fresh object per render would re-trigger it).
- **localStorage namespace:** `aftermediate:tour` mirrors `aftermediate:profile` / `aftermediate:rahbar-chat`.
- **driver.js rules:** JS is imported dynamically inside `useEffect` — never at module scope (SSR/hydration safety). Only the CSS (`import "driver.js/driver.css"`) is a static import. The provider stores instances as `Driver | null` via `import type { Driver } from "driver.js"` (type-only, erased at runtime).
- **Design tokens** (globals.css `@theme`): `saffron` #2f55d4 (accent), `emerald` #1c9e62, `surface` #fff, `line` #d7d2c4, `ink` #191f2c, `muted` #566073, `faint` #8a93a6, fonts `--font-mono` (Space Mono) / `--font-sans` (Plus Jakarta Sans). Existing animations: `animate-rise`, `animate-pulse-ring`.
- **Commit style:** lowercase conventional commits like `feat: cv builder task 4 — html2pdf download, sidebar link, full gates`.
- **Next.js 16 warning (AGENTS.md):** if any Next API beyond `usePathname`/`useRouter`/"use client" is needed, check `node_modules/next/dist/docs/` first. This plan uses only APIs already present in the codebase.
- **Windows note:** this repo lives on Windows; all `npm`/`npx vitest` commands run from the repo root in Git Bash.

## File map

| File | Action |
|---|---|
| `package.json` | Modify — add `driver.js` dep (Task 1) |
| `src/lib/tour.ts` | Create — types + 4 chapters / 24 steps (Task 2) |
| `src/lib/tour.test.ts` | Create — data integrity tests (Task 2) |
| `src/components/tour/tour-provider.tsx` | Create — state machine + driver lifecycle (Task 3) |
| `src/components/tour/tour-provider.test.tsx` | Create (Task 3) |
| `src/components/tour/tour-hub.tsx` | Create — pill + chapter panel (Task 4) |
| `src/components/tour/tour-hub.test.tsx` | Create (Task 4) |
| `src/components/tour/tour-prompt.tsx` | Create — first-visit card (Task 5) |
| `src/components/tour/tour-prompt.test.tsx` | Create (Task 5) |
| `src/components/rahbar-drawer.tsx` | Modify — `close-rahbar` listener + `rahbar-open`/`rahbar-closed` events (Task 6) |
| `src/components/rahbar-drawer.test.tsx` | Create (Task 6) |
| `src/app/(app)/layout.tsx` | Modify — mount TourProvider + TourHub + TourPrompt (Task 6) |
| 18 page files + `sidebar.tsx`, `top-nav.tsx`, `daily-sprint.tsx`, `rahbar-drawer.tsx` | Modify — `data-tour` attributes (Task 7) |
| `src/app/globals.css` | Modify — `.tour-popover` theming (Task 8) |

---

## Task 1: Install driver.js

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install the dependency**

Run: `npm install driver.js`
Expected: exits 0, adds `"driver.js": "^1.8.0"` to `dependencies`.

- [ ] **Step 2: Verify**

Run: `node -e "console.log(require('driver.js/package.json').version)"`
Expected: prints `1.8.x`. Also confirm `node_modules/driver.js/dist/driver.css` exists:

Run: `ls node_modules/driver.js/dist/driver.css`
Expected: the file path is listed.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add driver.js dependency for guided tour"
```

---

## Task 2: Tour data module (`src/lib/tour.ts`)

**Files:**
- Create: `src/lib/tour.ts`
- Test: `src/lib/tour.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/tour.test.ts` (node environment — no jsdom comment):

```ts
import { describe, it, expect } from "vitest";
import { chapters } from "./tour";
import { groups } from "@/components/sidebar";

const navRoutes = new Set(groups.flatMap((g) => g.links.map((l) => l.href)));

describe("tour data integrity", () => {
  it("has exactly 4 chapters with unique ids", () => {
    expect(chapters).toHaveLength(4);
    expect(new Set(chapters.map((c) => c.id)).size).toBe(4);
  });

  it("every chapter has 5-7 steps", () => {
    for (const ch of chapters) {
      expect(ch.steps.length, `${ch.id} step count`).toBeGreaterThanOrEqual(5);
      expect(ch.steps.length, `${ch.id} step count`).toBeLessThanOrEqual(7);
    }
  });

  it("every step has a data-tour target, title and body", () => {
    for (const ch of chapters) {
      for (const [i, step] of ch.steps.entries()) {
        expect(step.target, `${ch.id}[${i}] target`).toMatch(/^\[data-tour="/);
        expect(step.title.trim(), `${ch.id}[${i}] title`).not.toBe("");
        expect(step.body.trim(), `${ch.id}[${i}] body`).not.toBe("");
      }
    }
  });

  it("every step route exists in the sidebar nav", () => {
    for (const ch of chapters) {
      for (const [i, step] of ch.steps.entries()) {
        if (step.route === undefined) continue;
        expect(navRoutes.has(step.route), `${ch.id}[${i}] route ${step.route}`).toBe(true);
      }
    }
  });

  it("step targets are unique across all chapters", () => {
    const targets = chapters.flatMap((c) => c.steps.map((s) => s.target));
    expect(new Set(targets).size).toBe(targets.length);
  });

  it("has 24 steps across all chapters", () => {
    expect(chapters.reduce((n, c) => n + c.steps.length, 0)).toBe(24);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/tour.test.ts`
Expected: FAIL — `Cannot find module './tour'` (or equivalent resolve error).

- [ ] **Step 3: Write the data module**

Create `src/lib/tour.ts`:

```ts
export type TourChapterId = "getting-around" | "pakistan" | "abroad-money" | "skills-ai";

export interface TourStep {
  /** CSS selector for the spotlight target, e.g. '[data-tour="merit"]'. */
  target: string;
  title: string;
  body: string;
  /** Navigate to this route before highlighting (skipped when already there). */
  route?: string;
  /** Side effect dispatched when the step becomes active. */
  onEnter?: "open-rahbar" | "close-rahbar";
}

export interface TourChapter {
  id: TourChapterId;
  name: string;
  blurb: string;
  steps: TourStep[];
}

export const chapters: TourChapter[] = [
  {
    id: "getting-around",
    name: "Getting around",
    blurb: "dashboard & navigation",
    steps: [
      {
        target: '[data-tour="dashboard-welcome"]',
        route: "/dashboard",
        title: "Welcome to aftermediate",
        body: "This dashboard is your home base — your marks, streaks and recommendations update here as you use the site. Let's take a quick look around.",
      },
      {
        target: '[data-tour="sidebar-nav"]',
        route: "/dashboard",
        title: "Your navigation map",
        body: "Every tool lives in this sidebar, grouped from local universities to skills and A.I helpers. On a phone, the same links run along the top.",
      },
      {
        target: '[data-tour="top-nav"]',
        route: "/dashboard",
        title: "Quick actions up top",
        body: "Your account and sign-out live here. This bar also carries the mobile nav when the sidebar is hidden.",
      },
      {
        target: '[data-tour="daily-sprint"]',
        route: "/dashboard",
        title: "Daily Sprint",
        body: "Five questions, two minutes, every day. Keep the streak alive — it's the easiest habit on the site.",
      },
      {
        target: '[data-tour="rahbar-button"]',
        route: "/dashboard",
        title: "Rahbar A.I — your site guide",
        body: "Confused about any page? Ask Rahbar. It guides you around the site itself — try \"What is the Merit page?\" anytime.",
      },
    ],
  },
  {
    id: "pakistan",
    name: "Education in Pakistan",
    blurb: "universities, tests & merit",
    steps: [
      {
        target: '[data-tour="universities"]',
        route: "/pakistan/universities",
        title: "Universities, decoded",
        body: "Compare every major Pakistani university — programs, fees and real merit thresholds — before you shortlist anything.",
      },
      {
        target: '[data-tour="entry-tests"]',
        route: "/pakistan/entry-tests",
        title: "Entry Tests hub",
        body: "One place to understand ECAT, MDCAT and friends — patterns, dates and what to actually study.",
      },
      {
        target: '[data-tour="pakistan-self-assessment"]',
        route: "/pakistan/self-assessment",
        title: "Where do you stand?",
        body: "Answer a few questions and get an honest read on which fields fit you — before you commit years to one.",
      },
      {
        target: '[data-tour="pakistan-scholarships"]',
        route: "/pakistan/scholarships",
        title: "Local scholarships",
        body: "Every scholarship worth applying to, with eligibility spelled out. Free money first, always.",
      },
      {
        target: '[data-tour="merit"]',
        route: "/merit",
        title: "Know your number",
        body: "Your aggregate decides your admissions fate. This calculator shows exactly how your marks stack up.",
      },
      {
        target: '[data-tour="career"]',
        route: "/career",
        title: "Try before you commit",
        body: "Preview what a major actually leads to — courses, careers, salaries — before you pick it.",
      },
      {
        target: '[data-tour="trends"]',
        route: "/trends",
        title: "What the market wants",
        body: "Which fields are rising and which are saturated, based on real data — not auntie's opinions.",
      },
    ],
  },
  {
    id: "abroad-money",
    name: "Study abroad & money",
    blurb: "destinations & funding",
    steps: [
      {
        target: '[data-tour="countries"]',
        route: "/abroad/countries",
        title: "13 destinations, side by side",
        body: "Compare study destinations on cost, visas and Pakistani-friendliness — then narrow down to two or three.",
      },
      {
        target: '[data-tour="abroad-scholarships"]',
        route: "/abroad/scholarships",
        title: "International scholarships",
        body: "The funding Pakistani students actually win — with deadlines and eligibility in plain words.",
      },
      {
        target: '[data-tour="planner"]',
        route: "/abroad/planner",
        title: "The real cost, planned",
        body: "Budget tuition, rent and flights for any destination so money never kills a plan late.",
      },
      {
        target: '[data-tour="money"]',
        route: "/money",
        title: "Money is a merit factor",
        body: "Guides for education loans, part-time rules and funding strategies for Pakistani families.",
      },
      {
        target: '[data-tour="convince"]',
        route: "/convince",
        title: "Convince your parents",
        body: "A ready-made case for studying abroad — evidence, costs and outcomes — built for the hardest audience: home.",
      },
      {
        target: '[data-tour="safar-ai"]',
        route: "/abroad/assistant",
        title: "Safar A.I — abroad guide",
        body: "Ask Safar anything about visas, universities or applications abroad. It only answers study-abroad questions.",
      },
    ],
  },
  {
    id: "skills-ai",
    name: "Skills, CV & your A.I helpers",
    blurb: "income tools & helpers",
    steps: [
      {
        target: '[data-tour="courses"]',
        route: "/skills/courses",
        title: "Learn skills that pay",
        body: "Curated free and paid courses that lead to actual freelance income — not certificate collectors.",
      },
      {
        target: '[data-tour="cv-builder"]',
        route: "/builder",
        title: "Build a hireable CV",
        body: "Turn your skills into a polished CV you can download and send — with A.I help for every line.",
      },
      {
        target: '[data-tour="hunar-ai"]',
        route: "/skills/chat",
        title: "Hunar A.I — skills coach",
        body: "Your mentor for freelancing: finding clients, pricing work and picking what to learn next.",
      },
      {
        target: '[data-tour="ustaad-ai"]',
        route: "/study",
        title: "Ustaad A.I — study tutor",
        body: "Stuck on a concept at midnight? Ustaad explains syllabus topics step by step, in plain language.",
      },
      {
        target: '[data-tour="rahbar-drawer"]',
        title: "Rahbar, opened live",
        body: "This is Rahbar — ask it how any page works, any time. It's open right now; try a question when the tour ends.",
        onEnter: "open-rahbar",
      },
      {
        target: '[data-tour="mentor-match"]',
        route: "/mentors",
        title: "Find a mentor",
        body: "Match with someone who's walked your path — university, career or abroad — and ask them anything.",
        onEnter: "close-rahbar",
      },
    ],
  },
];

export function getChapter(id: TourChapterId): TourChapter | undefined {
  return chapters.find((c) => c.id === id);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/tour.test.ts`
Expected: PASS — 6 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/tour.ts src/lib/tour.test.ts
git commit -m "feat: guided tour chapter/step data module"
```

---

## Task 3: Tour provider (`src/components/tour/tour-provider.tsx`)

**Files:**
- Create: `src/components/tour/tour-provider.tsx`
- Test: `src/components/tour/tour-provider.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/tour/tour-provider.test.tsx`:

```tsx
// @vitest-environment jsdom
import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { TourProvider, useTour } from "./tour-provider";
import { chapters } from "@/lib/tour";
import * as store from "@/lib/store";

const mockUseStudent = vi.fn();
vi.spyOn(store, "useStudent").mockImplementation(() => mockUseStudent());

const mocks = vi.hoisted(() => {
  const destroy = vi.fn();
  const drive = vi.fn();
  const driver = vi.fn(() => ({ destroy, drive }));
  return { destroy, drive, driver };
});
vi.mock("driver.js", () => ({ driver: mocks.driver }));

const nav = vi.hoisted(() => {
  const push = vi.fn();
  return { pathname: "/dashboard", router: { push } };
});
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => nav.router,
}));

function seedTourTargets() {
  for (const name of [
    "dashboard-welcome",
    "sidebar-nav",
    "top-nav",
    "daily-sprint",
    "rahbar-button",
  ]) {
    const el = document.createElement("div");
    el.setAttribute("data-tour", name);
    document.body.appendChild(el);
  }
}

function Probe() {
  const t = useTour();
  return (
    <div>
      <span data-testid="running">{String(t.running)}</span>
      <span data-testid="chapter">{t.activeChapter ?? "none"}</span>
      <span data-testid="prompt">{String(t.promptVisible)}</span>
      <span data-testid="completed">{String(t.completedCount)}</span>
      <button type="button" data-testid="start" onClick={() => t.startChapter("getting-around")}>
        start
      </button>
      <button
        type="button"
        data-testid="resume"
        onClick={() => t.startChapter("getting-around", 2)}
      >
        resume
      </button>
      <button type="button" data-testid="exit" onClick={() => t.exitTour()}>
        exit
      </button>
    </div>
  );
}

beforeEach(() => {
  cleanup();
  document.querySelectorAll("[data-tour]").forEach((el) => el.remove());
  window.localStorage.clear();
  vi.clearAllMocks();
  nav.pathname = "/dashboard";
  mockUseStudent.mockReturnValue({
    profile: { quizCompletedAt: "2026-08-31T00:00:00.000Z" },
  });
});

afterEach(() => {
  cleanup();
  mocks.driver.mockImplementation(() => ({ destroy: mocks.destroy, drive: mocks.drive }));
});

// ── Starting & driving steps ──

it("starts a chapter at step 0 and drives the first step", async () => {
  seedTourTargets();
  const user = userEvent.setup();
  render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );

  await user.click(screen.getByTestId("start"));

  await waitFor(() => expect(mocks.driver).toHaveBeenCalled());
  const config = mocks.driver.mock.calls[0][0];
  expect(config.steps[0].element).toBe(chapters[0].steps[0].target);
  expect(config.steps[0].popover.title).toBe(chapters[0].steps[0].title);
  expect(config.steps[0].popover.nextBtnText).toBe("Next");
  expect(mocks.drive).toHaveBeenCalled();
  expect(screen.getByTestId("chapter").textContent).toBe("getting-around");
});

it("advances steps through the driver next callback", async () => {
  seedTourTargets();
  const user = userEvent.setup();
  render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );
  await user.click(screen.getByTestId("start"));
  await waitFor(() => expect(mocks.driver).toHaveBeenCalled());

  const firstConfig = mocks.driver.mock.calls[0][0];
  await act(async () => firstConfig.onNextClick());
  await waitFor(() => expect(mocks.driver).toHaveBeenCalledTimes(2));

  const secondConfig = mocks.driver.mock.calls[1][0];
  expect(secondConfig.steps[0].popover.title).toBe(chapters[0].steps[1].title);
  expect(secondConfig.steps[0].popover.showButtons).toEqual(["previous", "next"]);
  expect(mocks.destroy).toHaveBeenCalled();
});

it("marks the chapter complete after the final step and persists it", async () => {
  seedTourTargets();
  const user = userEvent.setup();
  render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );
  await user.click(screen.getByTestId("start"));
  await waitFor(() => expect(mocks.driver).toHaveBeenCalled());

  const stepCount = chapters[0].steps.length;
  for (let i = 0; i < stepCount; i += 1) {
    const config = mocks.driver.mock.calls[mocks.driver.mock.calls.length - 1][0];
    await act(async () => config.onNextClick());
    if (i < stepCount - 1) {
      await waitFor(() => expect(mocks.driver).toHaveBeenCalledTimes(i + 2));
    } else {
      await waitFor(() => expect(screen.getByTestId("running").textContent).toBe("false"));
    }
  }

  expect(screen.getByTestId("completed").textContent).toBe("1");
  const saved = JSON.parse(window.localStorage.getItem("aftermediate:tour")!);
  expect(saved.chapters["getting-around"].completed).toBe(true);
});

// ── Exit & resume ──

it("exiting mid-chapter saves the resume point", async () => {
  seedTourTargets();
  const user = userEvent.setup();
  render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );
  await user.click(screen.getByTestId("start"));
  await waitFor(() => expect(mocks.driver).toHaveBeenCalled());

  await act(async () => mocks.driver.mock.calls[0][0].onNextClick());
  await waitFor(() => expect(mocks.driver).toHaveBeenCalledTimes(2));
  await act(async () => mocks.driver.mock.calls[1][0].onNextClick());
  await waitFor(() => expect(mocks.driver).toHaveBeenCalledTimes(3));

  await user.click(screen.getByTestId("exit"));

  expect(screen.getByTestId("running").textContent).toBe("false");
  const saved = JSON.parse(window.localStorage.getItem("aftermediate:tour")!);
  expect(saved.chapters["getting-around"].lastStep).toBe(2);
  expect(saved.chapters["getting-around"].completed).toBe(false);
});

it("resumes a chapter from a saved step", async () => {
  seedTourTargets();
  const user = userEvent.setup();
  render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );
  await user.click(screen.getByTestId("resume"));

  await waitFor(() => expect(mocks.driver).toHaveBeenCalled());
  const config = mocks.driver.mock.calls[0][0];
  expect(config.steps[0].popover.title).toBe(chapters[0].steps[2].title);
});

it("exits and saves when the user navigates away mid-tour", async () => {
  seedTourTargets();
  const user = userEvent.setup();
  const view = render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );
  await user.click(screen.getByTestId("start"));
  await waitFor(() => expect(mocks.driver).toHaveBeenCalled());
  await act(async () => mocks.driver.mock.calls[0][0].onNextClick());
  await waitFor(() => expect(mocks.driver).toHaveBeenCalledTimes(2));

  nav.pathname = "/merit";
  view.rerender(
    <TourProvider>
      <Probe />
    </TourProvider>
  );

  await waitFor(() => expect(screen.getByTestId("running").textContent).toBe("false"));
  const saved = JSON.parse(window.localStorage.getItem("aftermediate:tour")!);
  expect(saved.chapters["getting-around"].lastStep).toBe(1);
});

// ── onEnter side effects ──

it("dispatches open-rahbar when the drawer step activates", async () => {
  const drawer = document.createElement("div");
  drawer.setAttribute("data-tour", "rahbar-drawer");
  document.body.appendChild(drawer);
  const spy = vi.spyOn(document, "dispatchEvent");

  function RahbarProbe() {
    const t = useTour();
    return <button type="button" onClick={() => t.startChapter("skills-ai", 4)}>go</button>;
  }
  const user = userEvent.setup();
  render(
    <TourProvider>
      <RahbarProbe />
    </TourProvider>
  );
  await user.click(screen.getByRole("button", { name: "go" }));

  await waitFor(() =>
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: "open-rahbar" }))
  );
  spy.mockRestore();
});

// ── Prompt gating ──

it("shows the prompt only when onboarding is done, on the dashboard, and not dismissed", () => {
  render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );
  expect(screen.getByTestId("prompt").textContent).toBe("true");

  cleanup();
  nav.pathname = "/merit";
  render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );
  expect(screen.getByTestId("prompt").textContent).toBe("false");

  cleanup();
  nav.pathname = "/dashboard";
  mockUseStudent.mockReturnValue({ profile: { quizCompletedAt: null } });
  render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );
  expect(screen.getByTestId("prompt").textContent).toBe("false");

  cleanup();
  mockUseStudent.mockReturnValue({
    profile: { quizCompletedAt: "2026-08-31T00:00:00.000Z" },
  });
  window.localStorage.setItem(
    "aftermediate:tour",
    JSON.stringify({ promptDismissed: true, chapters: {} })
  );
  render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );
  expect(screen.getByTestId("prompt").textContent).toBe("false");
});

it("survives malformed localStorage", () => {
  window.localStorage.setItem("aftermediate:tour", "{oops");
  render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );
  expect(screen.getByTestId("prompt").textContent).toBe("true");
});

// ── Failure handling ──

it("fails gracefully when the driver cannot be created", async () => {
  seedTourTargets();
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  mocks.driver.mockImplementation(() => {
    throw new Error("boom");
  });
  const user = userEvent.setup();
  render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );
  await user.click(screen.getByTestId("start"));

  await waitFor(() => expect(screen.getByTestId("running").textContent).toBe("false"));
  expect(warn).toHaveBeenCalled();
  warn.mockRestore();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/tour/tour-provider.test.tsx`
Expected: FAIL — `Cannot find module './tour-provider'`.

- [ ] **Step 3: Write the provider**

Create `src/components/tour/tour-provider.tsx`:

```tsx
"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import "driver.js/driver.css";
import type { Driver } from "driver.js";
import { chapters, getChapter, type TourChapterId } from "@/lib/tour";
import { useStudent } from "@/lib/store";

const STORAGE_KEY = "aftermediate:tour";
const POLL_INTERVAL_MS = 300;
const POLL_TIMEOUT_MS = 5000;

export interface ChapterProgress {
  completed: boolean;
  /** Index of the next step to show (resume point). */
  lastStep: number;
}

interface PersistedTourState {
  promptDismissed: boolean;
  chapters: Record<string, ChapterProgress>;
}

const DEFAULT_STATE: PersistedTourState = { promptDismissed: false, chapters: {} };

function loadState(): PersistedTourState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<PersistedTourState>;
    return {
      promptDismissed: Boolean(parsed.promptDismissed),
      chapters:
        parsed.chapters && typeof parsed.chapters === "object" && !Array.isArray(parsed.chapters)
          ? (parsed.chapters as PersistedTourState["chapters"])
          : {},
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function decoratePopover(
  popover: HTMLElement,
  chapterName: string,
  index: number,
  total: number,
  onExit: () => void
) {
  popover.setAttribute("role", "dialog");
  popover.setAttribute("aria-modal", "true");
  const title = popover.querySelector<HTMLElement>(".driver-popover-title");
  if (title) {
    title.id = "tour-popover-title";
    popover.setAttribute("aria-labelledby", "tour-popover-title");
  }

  const kicker = document.createElement("p");
  kicker.className = "tour-kicker";
  kicker.textContent = chapterName;
  popover.prepend(kicker);

  const counter = document.createElement("span");
  counter.className = "tour-counter";
  counter.textContent = `${index + 1}/${total}`;
  popover.appendChild(counter);

  const progress = document.createElement("div");
  progress.className = "tour-progress";
  const fill = document.createElement("span");
  fill.style.width = `${((index + 1) / total) * 100}%`;
  progress.appendChild(fill);
  popover.appendChild(progress);

  const footer = popover.querySelector<HTMLElement>(".driver-popover-footer");
  if (footer) {
    const exitBtn = document.createElement("button");
    exitBtn.type = "button";
    exitBtn.className = "tour-exit-btn";
    exitBtn.textContent = "Exit";
    exitBtn.addEventListener("click", onExit);
    const btns = footer.querySelector<HTMLElement>(".driver-popover-footer-btns") ?? footer;
    btns.prepend(exitBtn);
  }
}

interface TourContextValue {
  state: PersistedTourState;
  hubOpen: boolean;
  activeChapter: TourChapterId | null;
  stepIndex: number;
  running: boolean;
  rahbarOpen: boolean;
  reducedMotion: boolean;
  completedCount: number;
  promptVisible: boolean;
  startChapter: (id: TourChapterId, fromStep?: number) => void;
  openHub: () => void;
  closeHub: () => void;
  dismissPrompt: () => void;
  exitTour: () => void;
}

const TourCtx = React.createContext<TourContextValue | null>(null);

export function useTour(): TourContextValue {
  const ctx = React.useContext(TourCtx);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useStudent();

  const [state, setState] = React.useState<PersistedTourState>(loadState);
  const [hubOpen, setHubOpen] = React.useState(false);
  const [activeChapter, setActiveChapter] = React.useState<TourChapterId | null>(null);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [rahbarOpen, setRahbarOpen] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  const driverRef = React.useRef<Driver | null>(null);
  const runTokenRef = React.useRef(0);
  const pollRef = React.useRef<number | null>(null);
  // True while a destroy was provider-initiated (advance/exit), so the
  // driver's onDestroyed hook does not treat it as a user exit.
  const transitionRef = React.useRef(false);
  const activeChapterRef = React.useRef<TourChapterId | null>(null);
  const stepIndexRef = React.useRef(0);
  const expectedRouteRef = React.useRef<string | null>(null);
  const prevPathnameRef = React.useRef(pathname);

  activeChapterRef.current = activeChapter;
  stepIndexRef.current = stepIndex;

  const running = activeChapter !== null;

  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  React.useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  React.useEffect(() => {
    const open = () => setRahbarOpen(true);
    const close = () => setRahbarOpen(false);
    document.addEventListener("rahbar-open", open);
    document.addEventListener("rahbar-closed", close);
    return () => {
      document.removeEventListener("rahbar-open", open);
      document.removeEventListener("rahbar-closed", close);
    };
  }, []);

  const patchChapter = React.useCallback(
    (id: TourChapterId, patch: Partial<ChapterProgress>) => {
      setState((prev) => ({
        ...prev,
        chapters: {
          ...prev.chapters,
          [id]: { completed: false, lastStep: 0, ...prev.chapters?.[id], ...patch },
        },
      }));
    },
    []
  );

  const focusPill = React.useCallback(() => {
    window.setTimeout(() => {
      document.querySelector<HTMLButtonElement>("[data-tour-pill]")?.focus();
    }, 50);
  }, []);

  const startChapter = React.useCallback((id: TourChapterId, fromStep = 0) => {
    setHubOpen(false);
    setStepIndex(fromStep);
    setActiveChapter(id);
    setState((prev) => (prev.promptDismissed ? prev : { ...prev, promptDismissed: true }));
  }, []);

  const openHub = React.useCallback(() => setHubOpen(true), []);
  const closeHub = React.useCallback(() => setHubOpen(false), []);

  const dismissPrompt = React.useCallback(() => {
    setState((prev) => ({ ...prev, promptDismissed: true }));
  }, []);

  const stopPolling = React.useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const exitTour = React.useCallback(() => {
    if (activeChapterRef.current === null) return;
    const id = activeChapterRef.current;
    const total = getChapter(id)?.steps.length ?? 0;
    patchChapter(id, { lastStep: Math.min(stepIndexRef.current, total) });

    transitionRef.current = true;
    driverRef.current?.destroy();
    driverRef.current = null;
    stopPolling();
    runTokenRef.current += 1;
    setActiveChapter(null);
    setStepIndex(0);
    setHubOpen(true);
    try {
      document.dispatchEvent(new CustomEvent("close-rahbar"));
    } catch {
      /* ignore */
    }
    focusPill();
  }, [patchChapter, stopPolling, focusPill]);

  const finishChapter = React.useCallback(
    (id: TourChapterId) => {
      const total = getChapter(id)?.steps.length ?? 0;
      patchChapter(id, { completed: true, lastStep: total });
      stopPolling();
      runTokenRef.current += 1;
      setActiveChapter(null);
      setStepIndex(0);
      setHubOpen(true);
      focusPill();
    },
    [patchChapter, stopPolling, focusPill]
  );

  const transitionTo = React.useCallback((nextIndex: number) => {
    transitionRef.current = true;
    driverRef.current?.destroy();
    driverRef.current = null;
    setStepIndex(Math.max(0, nextIndex));
  }, []);

  // Core step runner: navigate → dispatch onEnter → poll for the target →
  // render the driver instance for this single step.
  React.useEffect(() => {
    if (!activeChapter) return;
    const chapter = getChapter(activeChapter);
    if (!chapter) return;

    if (stepIndex >= chapter.steps.length) {
      finishChapter(activeChapter);
      return;
    }

    const step = chapter.steps[stepIndex];
    const token = ++runTokenRef.current;
    expectedRouteRef.current = step.route ?? pathname;
    let cancelled = false;

    async function run() {
      try {
        if (step.route && step.route !== pathname) router.push(step.route);

        if (step.onEnter === "open-rahbar") {
          document.dispatchEvent(new CustomEvent("open-rahbar"));
        } else if (step.onEnter === "close-rahbar") {
          document.dispatchEvent(new CustomEvent("close-rahbar"));
        }

        const el = await new Promise<HTMLElement | null>((resolve) => {
          const hit = document.querySelector<HTMLElement>(step.target);
          if (hit) {
            resolve(hit);
            return;
          }
          const startedAt = Date.now();
          const id = window.setInterval(() => {
            const found = document.querySelector<HTMLElement>(step.target);
            if (found) {
              window.clearInterval(id);
              if (pollRef.current === id) pollRef.current = null;
              resolve(found);
            } else if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
              window.clearInterval(id);
              if (pollRef.current === id) pollRef.current = null;
              resolve(null);
            }
          }, POLL_INTERVAL_MS);
          pollRef.current = id;
        });

        if (cancelled || token !== runTokenRef.current) return;
        if (!el) {
          // Target never appeared — skip the step, never dead-end the tour.
          setStepIndex((i) => i + 1);
          return;
        }

        const { driver } = await import("driver.js");
        if (cancelled || token !== runTokenRef.current) return;

        const isLast = stepIndex === chapter.steps.length - 1;
        const isFirst = stepIndex === 0;
        const chapterName = chapter.name;
        const total = chapter.steps.length;

        transitionRef.current = true;
        driverRef.current?.destroy();
        driverRef.current = null;

        const drv = driver({
          overlayColor: "rgba(25,31,44,.5)",
          stagePadding: 8,
          stageRadius: 10,
          animate: !reducedMotion,
          allowClose: true,
          allowKeyboardControl: true,
          popoverClass: "tour-popover",
          onPopoverRender: (popover: HTMLElement) => {
            decoratePopover(popover, chapterName, stepIndex, total, () => exitTour());
          },
          onNextClick: () => transitionTo(stepIndex + 1),
          onPrevClick: () => transitionTo(stepIndex - 1),
          onDestroyed: () => {
            if (transitionRef.current) return;
            exitTour();
          },
          steps: [
            {
              element: step.target,
              popover: {
                title: step.title,
                description: step.body,
                showButtons: isFirst ? ["next"] : ["previous", "next"],
                nextBtnText: isLast ? "Finish" : "Next",
                prevBtnText: "Back",
                showProgress: false,
              },
            },
          ],
        });

        driverRef.current = drv;
        drv.drive();
        transitionRef.current = false;

        window.setTimeout(() => {
          const popover = document.querySelector<HTMLElement>(".tour-popover");
          if (!popover) return;
          const focusable = popover.querySelectorAll<HTMLElement>(
            'button, [href], [tabindex]:not([tabindex="-1"])'
          );
          (focusable.length > 0 ? focusable[0] : popover).focus();
        }, 60);
      } catch (err) {
        console.warn("guided tour step failed", err);
        exitTour();
      }
    }

    run();

    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [activeChapter, stepIndex, pathname, router, reducedMotion, finishChapter, exitTour]);

  // Escape exits; Tab is trapped inside the active popover.
  React.useEffect(() => {
    if (!activeChapter) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        exitTour();
        return;
      }
      if (event.key !== "Tab") return;
      const popover = document.querySelector<HTMLElement>(".tour-popover");
      if (!popover) return;
      const focusable = Array.from(
        popover.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])')
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeChapter, exitTour]);

  // User navigating away mid-tour (e.g. sidebar link) ends the chapter cleanly.
  React.useEffect(() => {
    const prev = prevPathnameRef.current;
    prevPathnameRef.current = pathname;
    if (prev === pathname) return;
    if (activeChapterRef.current === null) return;
    if (expectedRouteRef.current === null) return;
    if (pathname !== expectedRouteRef.current) exitTour();
  }, [pathname, exitTour]);

  const promptVisible =
    !running &&
    !hubOpen &&
    !rahbarOpen &&
    !state.promptDismissed &&
    profile.quizCompletedAt !== null &&
    pathname === "/dashboard";

  const completedCount = chapters.filter((c) => state.chapters[c.id]?.completed).length;

  const activeSteps = activeChapter ? getChapter(activeChapter)?.steps ?? [] : [];
  const activeStep = activeSteps[stepIndex];

  const value: TourContextValue = {
    state,
    hubOpen,
    activeChapter,
    stepIndex,
    running,
    rahbarOpen,
    reducedMotion,
    completedCount,
    promptVisible,
    startChapter,
    openHub,
    closeHub,
    dismissPrompt,
    exitTour,
  };

  return (
    <TourCtx.Provider value={value}>
      {children}
      <div className="sr-only" aria-live="polite">
        {activeStep ? `Step ${stepIndex + 1} of ${activeSteps.length}, ${activeStep.title}` : ""}
      </div>
    </TourCtx.Provider>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/tour/tour-provider.test.tsx`
Expected: PASS — 10 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/tour/tour-provider.tsx src/components/tour/tour-provider.test.tsx
git commit -m "feat: tour provider state machine + driver.js lifecycle"
```

---

## Task 4: Tour hub (`src/components/tour/tour-hub.tsx`)

**Files:**
- Create: `src/components/tour/tour-hub.tsx`
- Test: `src/components/tour/tour-hub.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/tour/tour-hub.test.tsx`:

```tsx
// @vitest-environment jsdom
import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TourProvider } from "./tour-provider";
import { TourHub } from "./tour-hub";
import { chapters } from "@/lib/tour";
import * as store from "@/lib/store";

const mockUseStudent = vi.fn();
vi.spyOn(store, "useStudent").mockImplementation(() => mockUseStudent());

const mocks = vi.hoisted(() => {
  const destroy = vi.fn();
  const drive = vi.fn();
  const driver = vi.fn(() => ({ destroy, drive }));
  return { destroy, drive, driver };
});
vi.mock("driver.js", () => ({ driver: mocks.driver }));

const nav = vi.hoisted(() => {
  const push = vi.fn();
  return { pathname: "/dashboard", router: { push } };
});
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => nav.router,
}));

beforeEach(() => {
  cleanup();
  document.querySelectorAll("[data-tour]").forEach((el) => el.remove());
  window.localStorage.clear();
  vi.clearAllMocks();
  nav.pathname = "/dashboard";
  mockUseStudent.mockReturnValue({ profile: { quizCompletedAt: null } });
});

afterEach(() => {
  cleanup();
  mocks.driver.mockImplementation(() => ({ destroy: mocks.destroy, drive: mocks.drive }));
});

it("renders the floating pill with dialog semantics", () => {
  render(
    <TourProvider>
      <TourHub />
    </TourProvider>
  );
  const pill = screen.getByRole("button", { name: /guided tour/i });
  expect(pill.getAttribute("aria-haspopup")).toBe("dialog");
  expect(pill.getAttribute("aria-expanded")).toBe("false");
});

it("opens and closes the hub panel from the pill", async () => {
  const user = userEvent.setup();
  render(
    <TourProvider>
      <TourHub />
    </TourProvider>
  );
  await user.click(screen.getByRole("button", { name: /guided tour/i }));
  expect(screen.getByRole("dialog", { name: "Guided tours" })).toBeTruthy();
  expect(
    screen.getByRole("button", { name: /guided tour/i }).getAttribute("aria-expanded")
  ).toBe("true");

  await user.click(screen.getByRole("button", { name: /guided tour/i }));
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("lists every chapter with stop counts and Start state", async () => {
  const user = userEvent.setup();
  render(
    <TourProvider>
      <TourHub />
    </TourProvider>
  );
  await user.click(screen.getByRole("button", { name: /guided tour/i }));
  for (const ch of chapters) {
    expect(screen.getByText(ch.name)).toBeTruthy();
    expect(screen.getByText(new RegExp(`${ch.steps.length} stops`))).toBeTruthy();
  }
  expect(screen.getAllByText("Start")).toHaveLength(chapters.length);
  expect(screen.getByText(`0 of ${chapters.length} chapters`)).toBeTruthy();
});

it("shows Resume for mid-chapter and Done for completed chapters", async () => {
  window.localStorage.setItem(
    "aftermediate:tour",
    JSON.stringify({
      promptDismissed: true,
      chapters: {
        pakistan: { completed: false, lastStep: 3 },
        "skills-ai": { completed: true, lastStep: 6 },
      },
    })
  );
  const user = userEvent.setup();
  render(
    <TourProvider>
      <TourHub />
    </TourProvider>
  );
  await user.click(screen.getByRole("button", { name: /guided tour/i }));
  expect(screen.getByText("Resume 3/7")).toBeTruthy();
  expect(screen.getByText("Done")).toBeTruthy();
  expect(screen.getByText(`1 of ${chapters.length} chapters`)).toBeTruthy();
});

it("closes the panel on Escape and returns focus to the pill", async () => {
  const user = userEvent.setup();
  render(
    <TourProvider>
      <TourHub />
    </TourProvider>
  );
  const pill = screen.getByRole("button", { name: /guided tour/i });
  await user.click(pill);
  expect(screen.getByRole("dialog")).toBeTruthy();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(pill);
});

it("closes the panel on outside click", async () => {
  const user = userEvent.setup();
  render(
    <TourProvider>
      <TourHub />
    </TourProvider>
  );
  await user.click(screen.getByRole("button", { name: /guided tour/i }));
  expect(screen.getByRole("dialog")).toBeTruthy();

  const outside = document.createElement("div");
  document.body.appendChild(outside);
  await user.click(outside);
  expect(screen.queryByRole("dialog")).toBeNull();
  outside.remove();
});

it("resumes a mid-chapter tour from the saved step", async () => {
  window.localStorage.setItem(
    "aftermediate:tour",
    JSON.stringify({
      promptDismissed: true,
      chapters: { pakistan: { completed: false, lastStep: 3 } },
    })
  );
  const target = document.createElement("div");
  target.setAttribute("data-tour", "pakistan-scholarships");
  document.body.appendChild(target);

  const user = userEvent.setup();
  render(
    <TourProvider>
      <TourHub />
    </TourProvider>
  );
  await user.click(screen.getByRole("button", { name: /guided tour/i }));
  await user.click(screen.getByRole("button", { name: /education in pakistan/i }));

  await waitFor(() => expect(mocks.driver).toHaveBeenCalled());
  const config = mocks.driver.mock.calls[0][0];
  expect(config.steps[0].popover.title).toBe(chapters[1].steps[3].title);
  expect(nav.router.push).toHaveBeenCalledWith("/pakistan/scholarships");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/tour/tour-hub.test.tsx`
Expected: FAIL — `Cannot find module './tour-hub'`.

- [ ] **Step 3: Write the hub**

Create `src/components/tour/tour-hub.tsx`:

```tsx
"use client";

import * as React from "react";
import { Check, Compass } from "lucide-react";
import { chapters } from "@/lib/tour";
import { useTour } from "./tour-provider";
import { cn } from "@/lib/utils";

export function TourHub() {
  const tour = useTour();
  const panelRef = React.useRef<HTMLDivElement>(null);
  const pillRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!tour.hubOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (pillRef.current?.contains(target)) return;
      tour.closeHub();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      tour.closeHub();
      pillRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [tour]);

  if (tour.running || tour.rahbarOpen) return null;

  const hasProgress = chapters.some((c) => {
    const p = tour.state.chapters[c.id];
    return p ? p.completed || p.lastStep > 0 : false;
  });
  const pulse = !tour.state.promptDismissed && !hasProgress;

  return (
    <>
      <button
        ref={pillRef}
        type="button"
        data-tour-pill
        aria-haspopup="dialog"
        aria-expanded={tour.hubOpen}
        onClick={() => (tour.hubOpen ? tour.closeHub() : tour.openHub())}
        className={cn(
          "animate-rise fixed bottom-6 right-6 z-40 inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-saffron px-5 text-sm font-semibold text-background shadow-[0_0_24px_-6px_rgba(245,185,66,0.6)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron/60",
          pulse && "animate-pulse-ring"
        )}
      >
        <Compass className="h-4 w-4" />
        Guided tour
      </button>

      {tour.hubOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Guided tours"
          className="animate-rise fixed bottom-24 right-6 z-40 w-[280px] rounded-2xl border border-line bg-surface p-4 shadow-xl"
        >
          <p className="text-sm font-bold text-ink">Guided tours</p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-faint">
            {chapters.length} chapters · pick your lane
          </p>

          <div className="mt-3 space-y-1">
            {chapters.map((ch) => {
              const progress = tour.state.chapters[ch.id];
              const completed = progress?.completed ?? false;
              const lastStep = progress?.lastStep ?? 0;
              const mid = !completed && lastStep > 0;
              const fromStep = completed ? 0 : lastStep;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => tour.startChapter(ch.id, fromStep)}
                  className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors hover:border-line hover:bg-surface-2"
                >
                  <span>
                    <span className="block text-sm font-semibold text-ink">{ch.name}</span>
                    <span className="block text-xs text-muted">
                      {ch.steps.length} stops · {ch.blurb}
                    </span>
                  </span>
                  {completed ? (
                    <span className="flex shrink-0 items-center gap-1 font-mono text-xs text-emerald">
                      <Check className="h-3.5 w-3.5" /> Done
                    </span>
                  ) : mid ? (
                    <span className="shrink-0 font-mono text-xs text-saffron">
                      Resume {lastStep}/{ch.steps.length}
                    </span>
                  ) : (
                    <span className="shrink-0 font-mono text-xs text-saffron">Start</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-emerald transition-all duration-300"
                style={{ width: `${(tour.completedCount / chapters.length) * 100}%` }}
              />
            </div>
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-faint">
              {tour.completedCount} of {chapters.length} chapters
            </p>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/tour/tour-hub.test.tsx`
Expected: PASS — 7 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/tour/tour-hub.tsx src/components/tour/tour-hub.test.tsx
git commit -m "feat: guided tour hub — floating pill + chapter panel"
```

---

## Task 5: First-visit prompt (`src/components/tour/tour-prompt.tsx`)

**Files:**
- Create: `src/components/tour/tour-prompt.tsx`
- Test: `src/components/tour/tour-prompt.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/tour/tour-prompt.test.tsx`:

```tsx
// @vitest-environment jsdom
import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TourProvider } from "./tour-provider";
import { TourPrompt } from "./tour-prompt";
import { chapters } from "@/lib/tour";
import * as store from "@/lib/store";

const mockUseStudent = vi.fn();
vi.spyOn(store, "useStudent").mockImplementation(() => mockUseStudent());

const mocks = vi.hoisted(() => {
  const destroy = vi.fn();
  const drive = vi.fn();
  const driver = vi.fn(() => ({ destroy, drive }));
  return { destroy, drive, driver };
});
vi.mock("driver.js", () => ({ driver: mocks.driver }));

const nav = vi.hoisted(() => {
  const push = vi.fn();
  return { pathname: "/dashboard", router: { push } };
});
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => nav.router,
}));

beforeEach(() => {
  cleanup();
  document.querySelectorAll("[data-tour]").forEach((el) => el.remove());
  window.localStorage.clear();
  vi.clearAllMocks();
  nav.pathname = "/dashboard";
  mockUseStudent.mockReturnValue({
    profile: { quizCompletedAt: "2026-08-31T00:00:00.000Z" },
  });
});

afterEach(() => cleanup());

it("stays hidden before onboarding is complete", () => {
  mockUseStudent.mockReturnValue({ profile: { quizCompletedAt: null } });
  render(
    <TourProvider>
      <TourPrompt />
    </TourProvider>
  );
  expect(screen.queryByText("New here?")).toBeNull();
});

it("appears on the dashboard after onboarding", () => {
  render(
    <TourProvider>
      <TourPrompt />
    </TourProvider>
  );
  expect(screen.getByText("New here?")).toBeTruthy();
});

it("hides permanently when dismissed", async () => {
  const user = userEvent.setup();
  render(
    <TourProvider>
      <TourPrompt />
    </TourProvider>
  );
  await user.click(screen.getByRole("button", { name: /maybe later/i }));
  expect(screen.queryByText("New here?")).toBeNull();
  const saved = JSON.parse(window.localStorage.getItem("aftermediate:tour")!);
  expect(saved.promptDismissed).toBe(true);
});

it("starts chapter one from the prompt", async () => {
  const welcome = document.createElement("div");
  welcome.setAttribute("data-tour", "dashboard-welcome");
  document.body.appendChild(welcome);

  const user = userEvent.setup();
  render(
    <TourProvider>
      <TourPrompt />
    </TourProvider>
  );
  await user.click(screen.getByRole("button", { name: /start tour/i }));

  expect(screen.queryByText("New here?")).toBeNull();
  await waitFor(() => expect(mocks.driver).toHaveBeenCalled());
  const config = mocks.driver.mock.calls[0][0];
  expect(config.steps[0].popover.title).toBe(chapters[0].steps[0].title);
  welcome.remove();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/tour/tour-prompt.test.tsx`
Expected: FAIL — `Cannot find module './tour-prompt'`.

- [ ] **Step 3: Write the prompt**

Create `src/components/tour/tour-prompt.tsx`:

```tsx
"use client";

import { Compass } from "lucide-react";
import { chapters } from "@/lib/tour";
import { useTour } from "./tour-provider";

export function TourPrompt() {
  const tour = useTour();
  if (!tour.promptVisible) return null;

  return (
    <div className="animate-rise fixed bottom-24 right-6 z-40 w-[300px] rounded-2xl border border-line bg-surface p-4 shadow-xl">
      <p className="text-sm font-bold text-ink">New here?</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Take a 2-minute guided tour of the essentials — chapters for local unis, studying
        abroad, skills and A.I helpers.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={tour.dismissPrompt}
          className="h-9 cursor-pointer rounded-lg border border-line px-3 text-xs font-semibold text-muted transition-colors hover:bg-surface-2"
        >
          Maybe later
        </button>
        <button
          type="button"
          onClick={() => tour.startChapter(chapters[0].id)}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-saffron px-3 text-xs font-bold text-background transition-colors hover:bg-saffron-soft"
        >
          <Compass className="h-3.5 w-3.5" />
          Start tour
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/tour/tour-prompt.test.tsx`
Expected: PASS — 4 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/tour/tour-prompt.tsx src/components/tour/tour-prompt.test.tsx
git commit -m "feat: first-visit guided tour prompt"
```

---

## Task 6: Rahbar drawer events + mount in the app shell

**Files:**
- Modify: `src/components/rahbar-drawer.tsx:44-48` (event listener effect) + add announce effect
- Create: `src/components/rahbar-drawer.test.tsx`
- Modify: `src/app/(app)/layout.tsx`
- Test: extend `src/components/tour/tour-hub.test.tsx`

- [ ] **Step 1: Write the failing drawer test**

Create `src/components/rahbar-drawer.test.tsx`:

```tsx
// @vitest-environment jsdom
import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { RahbarDrawer } from "./rahbar-drawer";

beforeEach(() => {
  cleanup();
  window.localStorage.removeItem("aftermediate:rahbar-chat");
});

afterEach(() => cleanup());

it("opens on the open-rahbar event and announces rahbar-open", async () => {
  const spy = vi.spyOn(document, "dispatchEvent");
  render(<RahbarDrawer />);

  document.dispatchEvent(new CustomEvent("open-rahbar"));

  await waitFor(() =>
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: "rahbar-open" }))
  );
  expect(document.querySelector(".bg-ink\\/20")).toBeTruthy();
  spy.mockRestore();
});

it("closes on the close-rahbar event and announces rahbar-closed", async () => {
  const spy = vi.spyOn(document, "dispatchEvent");
  render(<RahbarDrawer />);
  document.dispatchEvent(new CustomEvent("open-rahbar"));
  await waitFor(() =>
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: "rahbar-open" }))
  );

  document.dispatchEvent(new CustomEvent("close-rahbar"));

  await waitFor(() =>
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: "rahbar-closed" }))
  );
  expect(document.querySelector(".bg-ink\\/20")).toBeNull();
  spy.mockRestore();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/rahbar-drawer.test.tsx`
Expected: FAIL — no `rahbar-open`/`rahbar-closed` events dispatched, and the drawer does not close on `close-rahbar`.

- [ ] **Step 3: Modify the drawer**

In `src/components/rahbar-drawer.tsx`, replace the existing open-rahbar listener effect (lines 44-48):

```tsx
  React.useEffect(() => {
    const handler = () => setOpen(true);
    document.addEventListener("open-rahbar", handler);
    return () => document.removeEventListener("open-rahbar", handler);
  }, []);
```

with:

```tsx
  React.useEffect(() => {
    const open = () => setOpen(true);
    const close = () => setOpen(false);
    document.addEventListener("open-rahbar", open);
    document.addEventListener("close-rahbar", close);
    return () => {
      document.removeEventListener("open-rahbar", open);
      document.removeEventListener("close-rahbar", close);
    };
  }, []);

  React.useEffect(() => {
    document.dispatchEvent(new CustomEvent(open ? "rahbar-open" : "rahbar-closed"));
  }, [open]);
```

- [ ] **Step 4: Run drawer test to verify it passes**

Run: `npx vitest run src/components/rahbar-drawer.test.tsx`
Expected: PASS — 2 tests passed.

- [ ] **Step 5: Add pill-hiding coverage to the hub test**

First add `act` to the testing-library import in `src/components/tour/tour-hub.test.tsx`:

```diff
-import { render, screen, cleanup, waitFor } from "@testing-library/react";
+import { render, screen, cleanup, waitFor, act } from "@testing-library/react";
```

Then append this test (after the last `it(...)` block):

```tsx
it("hides the pill while the Rahbar drawer is open", () => {
  render(
    <TourProvider>
      <TourHub />
    </TourProvider>
  );
  expect(screen.getByRole("button", { name: /guided tour/i })).toBeTruthy();

  act(() => {
    document.dispatchEvent(new CustomEvent("rahbar-open"));
  });
  expect(screen.queryByRole("button", { name: /guided tour/i })).toBeNull();

  act(() => {
    document.dispatchEvent(new CustomEvent("rahbar-closed"));
  });
  expect(screen.getByRole("button", { name: /guided tour/i })).toBeTruthy();
});
```

Run: `npx vitest run src/components/tour/tour-hub.test.tsx`
Expected: PASS — 8 tests. (The provider from Task 3 already listens for these events and the hub already returns null while `rahbarOpen` — this test locks the drawer-collision requirement in.)

- [ ] **Step 6: Mount the tour in the app layout**

Modify `src/app/(app)/layout.tsx` — full new content:

```tsx
"use client";

import * as React from "react";
import { Sidebar } from "@/components/sidebar";
import { TopNav } from "@/components/top-nav";
import { RahbarDrawer } from "@/components/rahbar-drawer";
import { TourProvider } from "@/components/tour/tour-provider";
import { TourHub } from "@/components/tour/tour-hub";
import { TourPrompt } from "@/components/tour/tour-prompt";
import { useAuth } from "@/lib/auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="grid-bg grid min-h-screen place-items-center">
        <p className="font-mono text-sm text-faint">loading your plan…</p>
      </div>
    );
  }

  return (
    <TourProvider>
      <div className="min-h-screen">
        <Sidebar />
        <div className="flex min-h-screen flex-col lg:pl-72">
          <TopNav />
          <main className="flex-1">{children}</main>
        </div>
        <RahbarDrawer />
      </div>
      <TourHub />
      <TourPrompt />
    </TourProvider>
  );
}
```

- [ ] **Step 7: Run all tour tests**

Run: `npx vitest run src/components/tour src/components/rahbar-drawer.test.tsx src/lib/tour.test.ts`
Expected: PASS — 10 + 8 + 4 + 2 + 6 = 30 tests passed.

- [ ] **Step 8: Commit**

```bash
git add src/components/rahbar-drawer.tsx src/components/rahbar-drawer.test.tsx src/app/(app)/layout.tsx src/components/tour/tour-hub.test.tsx
git commit -m "feat: mount guided tour in app shell + rahbar drawer events"
```

---

## Task 7: `data-tour` anchors on every tour stop

**Files (24 attribute insertions across 22 files):** listed per edit below. No new tests — `src/lib/tour.test.ts` guarantees the selector strings; existence on pages is verified manually in Task 9.

Each edit adds one `data-tour` attribute to the element named in `tour.ts`. Apply them with the Edit tool using the exact before/after strings.

- [ ] **Step 1: Dashboard & shell anchors (chapter 1 + rahbar-drawer)**

`src/app/(app)/dashboard/page.tsx:27`
```diff
-      <div className="animate-reveal">
+      <div className="animate-reveal" data-tour="dashboard-welcome">
```

`src/components/sidebar.tsx:121`
```diff
-      <nav className="flex-1 overflow-y-auto px-3 py-4">
+      <nav className="flex-1 overflow-y-auto px-3 py-4" data-tour="sidebar-nav">
```

`src/components/sidebar.tsx:152` (the "Talk to Rahbar A.I" button)
```diff
-        <button
-          type="button"
-          onClick={() => document.dispatchEvent(new CustomEvent("open-rahbar"))}
+        <button
+          type="button"
+          data-tour="rahbar-button"
+          onClick={() => document.dispatchEvent(new CustomEvent("open-rahbar"))}
```

`src/components/top-nav.tsx:21`
```diff
-      <header className="sticky top-0 z-40 h-16 shrink-0 border-b border-line bg-background/90 backdrop-blur-md">
+      <header
+        className="sticky top-0 z-40 h-16 shrink-0 border-b border-line bg-background/90 backdrop-blur-md"
+        data-tour="top-nav"
+      >
```

`src/components/dashboard/daily-sprint.tsx:106` — the idle-phase card. This file has THREE identical `<div className="card-glass rounded-2xl p-5">` wrappers (lines 106, 156, 204), so include the context through the unique "⚡ Daily Sprint" heading when editing:
```diff
-    return (
-      <div className="card-glass rounded-2xl p-5">
-        <div className="flex items-center justify-between gap-3">
-          <div>
-            <p className="text-base font-bold text-ink">⚡ Daily Sprint</p>
+    return (
+      <div className="card-glass rounded-2xl p-5" data-tour="daily-sprint">
+        <div className="flex items-center justify-between gap-3">
+          <div>
+            <p className="text-base font-bold text-ink">⚡ Daily Sprint</p>
```

`src/components/rahbar-drawer.tsx:104` (the `<aside>`)
```diff
-      <aside
-        className={cn(
+      <aside
+        data-tour="rahbar-drawer"
+        className={cn(
```

- [ ] **Step 2: Education in Pakistan anchors (chapter 2)**

`src/app/(app)/pakistan/universities/page.tsx:8`
```diff
-    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
+    <div data-tour="universities" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
```

`src/app/(app)/pakistan/entry-tests/page.tsx:8`
```diff
-    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
+    <div data-tour="entry-tests" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
```

`src/app/(app)/pakistan/self-assessment/page.tsx:8`
```diff
-    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
+    <div data-tour="pakistan-self-assessment" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
```

`src/app/(app)/pakistan/scholarships/page.tsx:8`
```diff
-    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
+    <div data-tour="pakistan-scholarships" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
```

`src/app/(app)/merit/page.tsx:61`
```diff
-    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
+    <div data-tour="merit" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
```

`src/app/(app)/career/page.tsx:28`
```diff
-    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
+    <div data-tour="career" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
```

`src/app/(app)/trends/page.tsx:30`
```diff
-    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
+    <div data-tour="trends" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
```

- [ ] **Step 3: Study abroad & money anchors (chapter 3)**

`src/app/(app)/abroad/countries/page.tsx:8`
```diff
-    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
+    <div data-tour="countries" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
```

`src/app/(app)/abroad/scholarships/page.tsx:8`
```diff
-    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
+    <div data-tour="abroad-scholarships" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
```

`src/app/(app)/abroad/planner/page.tsx:8`
```diff
-    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
+    <div data-tour="planner" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
```

`src/app/(app)/money/page.tsx:31`
```diff
-    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
+    <div data-tour="money" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
```

`src/app/(app)/convince/page.tsx:97`
```diff
-    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
+    <div data-tour="convince" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
```

`src/app/(app)/abroad/assistant/page.tsx:8`
```diff
-    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
+    <div data-tour="safar-ai" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
```

- [ ] **Step 4: Skills, CV & A.I helpers anchors (chapter 4)**

`src/app/(app)/skills/courses/page.tsx:6`
```diff
-    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
+    <div data-tour="courses" className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
```

`src/app/(app)/builder/page.tsx:8`
```diff
-    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
+    <div data-tour="cv-builder" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
```

`src/app/(app)/skills/chat/page.tsx:6`
```diff
-    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
+    <div data-tour="hunar-ai" className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
```

`src/app/(app)/study/page.tsx:89`
```diff
-    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col px-4 py-6 sm:px-6">
+    <div
+      data-tour="ustaad-ai"
+      className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col px-4 py-6 sm:px-6"
+    >
```

`src/app/(app)/mentors/page.tsx:7`
```diff
-    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
+    <div data-tour="mentor-match" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
```

(The `rahbar-drawer` anchor for chapter 4 was added in Step 1.)

- [ ] **Step 5: Verify nothing regressed**

Run: `npx vitest run`
Expected: PASS — entire suite green.

Run: `npm run lint`
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/app/(app)/dashboard/page.tsx src/components/sidebar.tsx src/components/top-nav.tsx src/components/dashboard/daily-sprint.tsx src/components/rahbar-drawer.tsx src/app/(app)/pakistan src/app/(app)/merit/page.tsx src/app/(app)/career/page.tsx src/app/(app)/trends/page.tsx src/app/(app)/abroad src/app/(app)/money/page.tsx src/app/(app)/convince/page.tsx src/app/(app)/skills src/app/(app)/builder/page.tsx src/app/(app)/study/page.tsx src/app/(app)/mentors/page.tsx
git commit -m "feat: data-tour anchors on all guided tour stops"
```

---

## Task 8: Driver popover theming (`src/app/globals.css`)

**Files:**
- Modify: `src/app/globals.css` (append after the `.pdf-invert` block at the end of the file)

- [ ] **Step 1: Append the tour styles**

Append to the end of `src/app/globals.css`:

```css
/* Guided tour — driver.js popover + spotlight theming (popoverClass: tour-popover) */
.tour-popover.driver-popover {
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(25, 31, 44, 0.18);
  color: var(--color-ink);
  font-family: var(--font-sans);
  max-width: 320px;
  padding: 16px 18px;
  position: relative;
}

.tour-popover .driver-popover-title {
  font-family: var(--font-sans);
  font-weight: 800;
  font-size: 15px;
  color: var(--color-ink);
}

.tour-popover .driver-popover-description {
  font-size: 13px;
  line-height: 1.55;
  color: var(--color-muted);
}

.tour-popover .tour-kicker {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-saffron);
  margin: 0 0 4px;
}

.tour-popover .tour-counter {
  position: absolute;
  top: 14px;
  right: 16px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-faint);
}

.tour-popover .tour-progress {
  height: 3px;
  border-radius: 999px;
  background: var(--color-surface-2);
  overflow: hidden;
  margin-top: 12px;
}

.tour-popover .tour-progress > span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--color-saffron);
}

.tour-popover .driver-popover-footer {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  align-items: center;
}

.tour-popover .driver-popover-close-btn {
  display: none;
}

.tour-popover .driver-popover-progress-text {
  display: none;
}

.tour-popover .driver-popover-prev-btn,
.tour-popover .driver-popover-next-btn,
.tour-popover .tour-exit-btn {
  border-radius: 8px;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  padding: 8px 14px;
  min-height: 40px;
  text-shadow: none;
  cursor: pointer;
}

.tour-popover .driver-popover-prev-btn {
  background: transparent;
  border: 1px solid var(--color-line);
  color: var(--color-muted);
}

.tour-popover .driver-popover-next-btn {
  background: var(--color-saffron);
  border: none;
  color: var(--color-background);
}

.tour-popover .tour-exit-btn {
  background: transparent;
  border: none;
  color: var(--color-faint);
  margin-right: auto;
}

@media (prefers-reduced-motion: reduce) {
  [data-tour-pill].animate-pulse-ring {
    animation: none;
  }
}
```

- [ ] **Step 2: Verify the app still builds**

Run: `npm run build`
Expected: exits 0 (CSS compiles, no type errors).

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: driver.js popover theming to design tokens"
```

---

## Task 9: Full verification

**Files:** none (verification only; commit fixes if any are needed)

- [ ] **Step 1: Full test suite**

Run: `npx vitest run`
Expected: PASS — the pre-existing suites plus 30 new tour tests.

- [ ] **Step 2: Lint + build**

Run: `npm run lint`
Expected: exits 0.

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Manual walkthrough in the dev server**

Run: `npm run dev`, then in the browser (signed in, on `/dashboard`):

1. **Prompt:** clear `aftermediate:tour` from localStorage, reload `/dashboard` → "New here?" card appears bottom-right; "Maybe later" hides it permanently (reload → gone).
2. **Pill:** "Guided tour" pill bottom-right with pulse ring; click → chapter panel opens (4 rows, "0 of 4 chapters"); Escape closes and focus lands on the pill; clicking the page closes it.
3. **Chapter 1:** start "Getting around" → spotlight + themed popover (mono kicker "GETTING AROUND", title, body, progress bar, counter 1/5, Exit + Next). Next advances; Back appears from step 2; focus stays inside the popover when Tabbing; final Next reads "Finish" → hub reopens, row shows Done, "1 of 4 chapters".
4. **Cross-route:** run "Education in Pakistan" → each Next navigates to the next page and spotlights its header after a short pause; the counter shows n/7.
5. **Resume:** exit chapter 3 at step 3 (Escape or overlay click) → hub reopens; the row reads "Resume 3/6"; resuming starts at step 4.
6. **Rahbar live step:** run chapter 4 to the "Rahbar, opened live" step → the drawer slides open under the spotlight; Next closes it and moves to Mentor Match.
7. **Mid-tour nav:** start a chapter, click a sidebar link → tour ends cleanly (no orphaned overlay), progress saved.
8. **Drawer collision:** open Rahbar from the sidebar (not in a tour) → the pill disappears; close the drawer → pill returns.
9. **Reduced motion:** emulate `prefers-reduced-motion: reduce` in devtools → no pulse ring on the pill, no spotlight transition animation.
10. **Mobile width (<1024px):** pill still bottom-right; chapter 1's sidebar step skips gracefully after the poll cap (acceptance per spec: skip, never dead-end).

- [ ] **Step 4: Fix anything found and commit**

If the manual pass surfaces fixes:

```bash
git add -A
git commit -m "fix: guided tour polish from manual walkthrough"
```

If nothing needed fixing, no commit — Task 8's commit is the last one.

---

## Self-review notes (already applied while writing)

- Spec coverage: chapters 5/7/6/6 stops, pill + hub + prompt, localStorage schema, prompt gating on `quizCompletedAt` + `/dashboard` + once, `onEnter` Rahbar open (spec's renamed-from-`onNext` callback), target polling 300ms/5s with skip, malformed-localStorage fallback, driver import failure no-op with `console.warn`, mid-tour navigation cleanup, focus trap + aria-live + reduced-motion, and popover theming via `popoverClass` all map to Tasks 2-8.
- Type consistency: `TourChapterId` union matches the four chapter ids used in tests and hub rows; `startChapter(id, fromStep?)` used identically by prompt (no arg), hub (`fromStep`), and tests; `ChapterProgress` shape is written by `patchChapter` and read by the hub.
- Known deliberate deviation: hub/prompt are composed in `src/app/(app)/layout.tsx` rather than rendered inside `TourProvider`, so provider tests never need hub/prompt to exist and each component test composes its own tree.
