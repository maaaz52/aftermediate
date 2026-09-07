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
          "animate-rise fixed right-6 top-[4.5rem] z-40 hidden sm:inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-saffron px-5 text-sm font-semibold text-background shadow-[0_0_24px_-6px_rgba(245,185,66,0.6)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron/60",
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
          className="animate-rise fixed right-6 top-28 z-40 w-[280px] rounded-2xl border border-line bg-surface p-4 shadow-xl"
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
