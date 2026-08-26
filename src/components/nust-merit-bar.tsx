"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const SEGMENTS = [
  { key: "net", label: "NET / entry test", pct: 75, color: "bg-accent" },
  { key: "fsc", label: "FSc Part-1", pct: 15, color: "bg-emerald" },
  { key: "matric", label: "Matric", pct: 10, color: "bg-amber" },
];

export function NustMeritBar() {
  const [hovered, setHovered] = React.useState<string | null>(null);
  const active = SEGMENTS.find((s) => s.key === hovered);

  return (
    <div>
      <div className="flex h-10 w-full overflow-hidden border-2 border-ink">
        {SEGMENTS.map((s) => (
          <div
            key={s.key}
            onMouseEnter={() => setHovered(s.key)}
            onMouseLeave={() => setHovered(null)}
            className={cn("flex min-w-0 items-center justify-center overflow-hidden font-mono text-[11px] font-bold text-white transition-opacity", s.color, hovered && hovered !== s.key && "opacity-40")}
            style={{ width: `${s.pct}%` }}
          >
            {s.pct}%
          </div>
        ))}
      </div>
      <div className="mt-2 min-h-6 font-mono text-[11px]">
        {hovered ? (
          <span>
            <span className={cn("font-bold", active?.key === "net" ? "text-accent" : active?.key === "fsc" ? "text-emerald" : "text-amber")}>
              {active?.label}
            </span>{" "}
            <span className="text-faint">carries {active?.pct}% of your NUST merit</span>
          </span>
        ) : (
          <span className="text-muted">
            <span className="text-accent">75% NET</span> + <span className="text-emerald">15% FSc</span> +{" "}
            <span className="text-amber">10% matric</span>
          </span>
        )}
      </div>
    </div>
  );
}