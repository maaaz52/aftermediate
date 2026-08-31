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
