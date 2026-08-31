"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import "driver.js/dist/driver.css";
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

/** Keep only well-formed chapter entries, coercing each field to safe values. */
function sanitizeChapters(chapters: unknown): Record<string, ChapterProgress> {
  const out: Record<string, ChapterProgress> = {};
  if (!chapters || typeof chapters !== "object" || Array.isArray(chapters)) return out;
  for (const [key, entry] of Object.entries(chapters)) {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) continue;
    const candidate = entry as { completed?: unknown; lastStep?: unknown };
    const lastStep = candidate.lastStep;
    out[key] = {
      completed: Boolean(candidate.completed),
      lastStep:
        typeof lastStep === "number" && Number.isFinite(lastStep) && lastStep >= 0
          ? Math.floor(lastStep)
          : 0,
    };
  }
  return out;
}

function loadState(): PersistedTourState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<PersistedTourState>;
    return {
      promptDismissed: Boolean(parsed.promptDismissed),
      chapters: sanitizeChapters(parsed.chapters),
    };
  } catch {
    return DEFAULT_STATE;
  }
}

/** The slice of driver.js 1.8.0's PopoverDOM that decoratePopover touches. */
interface PopoverDom {
  wrapper: HTMLElement;
  title: HTMLElement;
  footer: HTMLElement;
  footerButtons: HTMLElement;
}

function decoratePopover(
  popover: PopoverDom,
  chapterName: string,
  index: number,
  total: number,
  onExit: () => void
) {
  const { wrapper, title, footerButtons } = popover;

  wrapper.setAttribute("aria-modal", "true");
  if (!wrapper.hasAttribute("role")) {
    wrapper.setAttribute("role", "dialog");
  }
  // driver.js 1.8.0 already gives the title element the id "driver-popover-title"
  // and wires the wrapper's aria-labelledby to it; only fall back to our own
  // wiring when a title element has no id.
  if (!title.hasAttribute("id")) {
    title.id = "tour-popover-title";
    wrapper.setAttribute("aria-labelledby", "tour-popover-title");
  }

  const kicker = document.createElement("p");
  kicker.className = "tour-kicker";
  kicker.textContent = chapterName;
  wrapper.prepend(kicker);

  const counter = document.createElement("span");
  counter.className = "tour-counter";
  counter.textContent = `${index + 1}/${total}`;
  wrapper.appendChild(counter);

  const progress = document.createElement("div");
  progress.className = "tour-progress";
  const fill = document.createElement("span");
  fill.style.width = `${((index + 1) / total) * 100}%`;
  progress.appendChild(fill);
  wrapper.appendChild(progress);

  const exitBtn = document.createElement("button");
  exitBtn.type = "button";
  exitBtn.className = "tour-exit-btn";
  exitBtn.textContent = "Exit";
  exitBtn.addEventListener("click", onExit);
  footerButtons.prepend(exitBtn);
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
  const rahbarOpenRef = React.useRef(false);

  activeChapterRef.current = activeChapter;
  stepIndexRef.current = stepIndex;
  rahbarOpenRef.current = rahbarOpen;

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

  const patchChapter = React.useCallback((id: TourChapterId, patch: Partial<ChapterProgress>) => {
    setState((prev) => {
      const base = prev.chapters[id] ?? { completed: false, lastStep: 0 };
      return {
        ...prev,
        chapters: { ...prev.chapters, [id]: { ...base, ...patch } },
      };
    });
  }, []);

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
    if (rahbarOpenRef.current) {
      try {
        document.dispatchEvent(new CustomEvent("close-rahbar"));
      } catch {
        /* ignore */
      }
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

  // Core step runner: navigate → poll for the target → dispatch onEnter →
  // render the driver instance for this single step.
  React.useEffect(() => {
    if (!activeChapter) return;
    const chapter = getChapter(activeChapter);
    if (!chapter) return;

    const steps = chapter.steps;
    const chapterName = chapter.name;
    const total = steps.length;

    if (stepIndex >= steps.length) {
      finishChapter(activeChapter);
      return;
    }

    const step = steps[stepIndex];
    const token = ++runTokenRef.current;
    expectedRouteRef.current = step.route ?? pathname;
    let cancelled = false;

    async function run() {
      try {
        if (step.route && step.route !== pathname) router.push(step.route);

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

        // Dispatch after the target poll and cancellation check so a
        // route+onEnter step fires exactly once, from the final
        // post-navigation run.
        if (step.onEnter === "open-rahbar") {
          document.dispatchEvent(new CustomEvent("open-rahbar"));
        } else if (step.onEnter === "close-rahbar") {
          document.dispatchEvent(new CustomEvent("close-rahbar"));
        }

        const { driver } = await import("driver.js");
        if (cancelled || token !== runTokenRef.current) return;

        const isLast = stepIndex === total - 1;
        const isFirst = stepIndex === 0;

        transitionRef.current = true;
        driverRef.current?.destroy();
        driverRef.current = null;

        const drv = driver({
          overlayColor: "rgba(25,31,44,.5)",
          stagePadding: 8,
          stageRadius: 10,
          animate: !reducedMotion,
          allowClose: true,
          // driver.js's own Tab trap and arrow handling would fight the
          // provider's keydown control — keep them off.
          allowKeyboardControl: false,
          popoverClass: "tour-popover",
          onPopoverRender: (popover: PopoverDom) => {
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
          // Land initial focus on the primary action, not the prepended Exit
          // button; fall back to the first focusable.
          const primary = popover.querySelector<HTMLElement>(".driver-popover-next-btn");
          if (primary) {
            primary.focus();
            return;
          }
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

  // Escape exits; Tab is trapped inside the active popover; arrows navigate.
  React.useEffect(() => {
    if (!activeChapter) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        exitTour();
        return;
      }
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        const chapter = activeChapterRef.current
          ? getChapter(activeChapterRef.current)
          : undefined;
        if (!chapter) return;
        if (event.key === "ArrowRight" && stepIndexRef.current < chapter.steps.length) {
          event.preventDefault();
          transitionTo(stepIndexRef.current + 1);
        } else if (event.key === "ArrowLeft" && stepIndexRef.current > 0) {
          event.preventDefault();
          transitionTo(stepIndexRef.current - 1);
        }
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
  }, [activeChapter, exitTour, transitionTo]);

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
