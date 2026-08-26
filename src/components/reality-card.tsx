"use client";

import * as React from "react";
import { SourceTag } from "@/components/stat";
import { cn } from "@/lib/utils";
import type { RealityCheck } from "@/lib/types";

export function RealityCard({
  item,
  value,
  label,
}: {
  item: RealityCheck;
  value: string;
  label: string;
}) {
  const [flipped, setFlipped] = React.useState(false);

  return (
    <button
      onClick={() => setFlipped((f) => !f)}
      className="group border-2 border-ink bg-surface p-5 text-left shadow-[5px_5px_0_0_var(--color-ink)] transition-all hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[3px_3px_0_0_var(--color-ink)]"
      aria-pressed={flipped}
    >
      {!flipped ? (
        <div>
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-widest text-faint">the number</p>
            <span className="font-mono text-[10px] uppercase tracking-widest text-accent">tap → reality</span>
          </div>
          <p className="mt-3 font-mono text-2xl font-bold leading-none text-accent">{value}</p>
          <p className="mt-2 text-sm font-medium text-ink">{label}</p>
          <div className="mt-3"><SourceTag stat={item.stat} /></div>
        </div>
      ) : (
        <div className="animate-rise">
          <div className="flex items-center justify-between">
            <span className="inline-block border-2 border-ink bg-emerald px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-white">
              the reality
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-faint">tap → number</span>
          </div>
          <p className="mt-3 text-sm font-medium leading-relaxed text-ink">{item.fact}</p>
          <p className="mt-2 text-sm text-muted" dir="rtl">{item.urdu}</p>
          <div className="mt-3"><SourceTag stat={item.stat} /></div>
        </div>
      )}
    </button>
  );
}