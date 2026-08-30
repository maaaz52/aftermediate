"use client";

import { cn } from "@/lib/utils";
import { Illustration } from "@/components/pixel/illustrations";

export function Brand({ className, compact = false, nav = false }: { className?: string; compact?: boolean; nav?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      <div className="grid h-9 w-9 place-items-center border-2 border-ink bg-accent shadow-[3px_3px_0_0_var(--color-ink)]">
        <Illustration name="compass" scale={2} />
      </div>
      {!compact && (
        nav ? (
          <span className="font-logo font-bold text-xl leading-none tracking-wide text-ink">
            After<span className="text-accent">mediate</span>
          </span>
        ) : (
          <span className="font-display font-bold text-xl leading-none tracking-wide text-ink">
            after<span className="text-accent">mediate</span>
          </span>
        )
      )}
    </div>
  );
}
