"use client";

import * as React from "react";
import { SourceTag } from "@/components/stat";
import type { RealityCheck } from "@/lib/types";

export interface RealityFanCard {
  item: RealityCheck;
  value: string;
  label: string;
}

const POSITIONS = ["left", "centre", "right"] as const;

function FanCard({ card, position }: { card: RealityFanCard; position: (typeof POSITIONS)[number] }) {
  const [flipped, setFlipped] = React.useState(false);

  return (
    <button
      type="button"
      onClick={() => setFlipped((v) => !v)}
      aria-pressed={flipped}
      aria-label={card.label}
      className={`reality-fan-card ${position} ${flipped ? "flipped" : ""}`}
    >
      <div className="reality-fan-inner">
        {/* Front — the number */}
        <div className="reality-fan-face border-2 border-ink bg-surface p-4 text-left shadow-[5px_5px_0_0_var(--color-ink)]">
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-faint">the number</p>
            <span className="font-mono text-[10px] uppercase tracking-widest text-accent">tap → reality</span>
          </div>
          <p className="mt-3 font-mono text-2xl font-bold leading-none text-accent">{card.value}</p>
          <p className="mt-2 text-sm font-medium text-ink">{card.label}</p>
          <div className="mt-auto pt-3">
            <SourceTag stat={card.item.stat} />
          </div>
        </div>

        {/* Back — the reality */}
        <div className="reality-fan-face reality-fan-back border-2 border-ink bg-surface p-4 text-left shadow-[5px_5px_0_0_var(--color-ink)]">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-block border-2 border-ink bg-emerald px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-white">
              the reality
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-faint">tap → number</span>
          </div>
          <p className="mt-3 text-sm font-medium leading-relaxed text-ink">{card.item.fact}</p>
          <p className="mt-2 text-sm text-muted" dir="rtl">{card.item.urdu}</p>
          <div className="mt-auto pt-3">
            <SourceTag stat={card.item.stat} />
          </div>
        </div>
      </div>
    </button>
  );
}

/** Fan of 3 flippable reality cards (inspired by cards.html). */
export function RealityFan({ cards }: { cards: RealityFanCard[] }) {
  return (
    <div className="mt-10 w-full overflow-x-auto pb-2">
      <div className="reality-fan">
        {cards.slice(0, 3).map((card, i) => (
          <FanCard key={card.item.id} card={card} position={POSITIONS[i]} />
        ))}
      </div>
    </div>
  );
}