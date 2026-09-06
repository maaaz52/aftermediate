"use client";

import * as React from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { FAQS } from "@/data/faq";

export function Faq() {
  const [open, setOpen] = React.useState<number | null>(0);

  return (
    <section id="faq" className="border-t-2 border-ink bg-surface-2">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <span className="inline-flex items-center gap-2 border-2 border-ink bg-surface px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-muted shadow-[3px_3px_0_0_var(--color-ink)]">
          <span className="h-2 w-2 bg-accent" /> questions, answered
        </span>
        <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-ink sm:text-4xl uppercase">
          Everything you&apos;re wondering.
        </h2>
        <p className="mt-3 max-w-md text-muted">
          Straight answers, no jargon. Still stuck? Drop us a line.
        </p>

        <div className="mt-8 space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className={cn("border-2 border-ink bg-surface transition-shadow", isOpen && "shadow-[4px_4px_0_0_var(--color-ink)]")}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-ink sm:text-base">{f.q}</span>
                  <span className={cn("grid h-6 w-6 shrink-0 place-items-center border-2 border-ink", isOpen ? "bg-accent text-white" : "bg-surface")}>
                    {isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  </span>
                </button>
                {isOpen && <p className="border-t-2 border-line px-5 py-4 text-sm leading-relaxed text-muted">{f.a}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}