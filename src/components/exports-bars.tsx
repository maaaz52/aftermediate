"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const BARS = [
  { year: "FY24", value: 3.2 },
  { year: "FY25", value: 3.8 },
  { year: "FY26", value: 4.6 },
];

const MAX = 5;

export function ExportsBars() {
  const [hovered, setHovered] = React.useState<number | null>(null);

  return (
    <div>
      <div className="flex h-28 items-end gap-3 border-b-2 border-ink pb-px">
        {BARS.map((b, i) => (
          <div key={b.year} className="flex flex-1 flex-col items-center gap-1">
            <button
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                "w-full max-w-14 border-2 border-ink transition-all",
                i === 2 ? "bg-accent" : "bg-emerald",
                hovered === i && "scale-105 shadow-[3px_3px_0_0_var(--color-ink)]"
              )}
              style={{ height: `${(b.value / MAX) * 88}px` }}
              aria-label={`${b.year}: $${b.value}B`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        {BARS.map((b, i) => (
          <div key={b.year} className="min-w-0 flex-1 text-center">
            <p className={cn("font-mono text-xs font-bold", i === 2 ? "text-accent" : "text-ink")}>
              {hovered === i ? `$${b.value}B` : `$${b.value}B`}
            </p>
            <p className="font-mono text-[10px] text-faint">{b.year}</p>
          </div>
        ))}
      </div>
    </div>
  );
}