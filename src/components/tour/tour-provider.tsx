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
