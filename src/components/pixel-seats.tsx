"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function PixelSeats({ total = 15 }: { total?: number }) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const seatIndex = 6; // the 1 seat out of 15

  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: total }).map((_, i) => {
          const isSeat = i === seatIndex;
          return (
            <button
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                "aspect-square border-2 border-ink transition-colors",
                isSeat
                  ? "bg-accent shadow-[3px_3px_0_0_var(--color-ink)] animate-pulse-ring"
                  : hovered === i
                  ? "bg-surface-2"
                  : "bg-surface-2/50"
              )}
              aria-label={isSeat ? "MBBS seat" : "MDCAT candidate"}
            />
          );
        })}
      </div>
      <div className="mt-3 flex min-h-6 flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[11px]">
        {hovered === null ? (
          <>
            <span className="h-3 w-3 border border-ink bg-accent" />
            <span className="text-muted">1 seat</span>
            <span className="text-faint">· 14 candidates still waiting</span>
          </>
        ) : hovered === seatIndex ? (
          <span className="text-accent">this is the MBBS seat</span>
        ) : (
          <span className="text-faint">candidate {hovered + 1} — still preparing</span>
        )}
      </div>
    </div>
  );
}