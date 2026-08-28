"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const INSTITUTES = [
  {
    id: "nust",
    label: "NUST",
    note: "NET 75 · FSc 15 · Matric 10",
    weights: [75, 15, 10] as const,
    target: 80,
    targetLabel: "CS closes ~80%",
  },
  {
    id: "fast",
    label: "FAST",
    note: "Test 50 · FSc 40 · Matric 10",
    weights: [50, 40, 10] as const,
    target: 75,
    targetLabel: "CS closes ~75%",
  },
  {
    id: "lums",
    label: "LUMS",
    note: "Test 50 · FSc 30 · Matric 20",
    weights: [50, 30, 20] as const,
    target: 85,
    targetLabel: "SSE closes ~85%",
  },
  {
    id: "giki",
    label: "GIKI",
    note: "Test 50 · FSc 40 · Matric 10",
    weights: [50, 40, 10] as const,
    target: 80,
    targetLabel: "CS closes ~80%",
  },
  {
    id: "medical",
    label: "Medical",
    note: "MDCAT 50 · FSc 40 · Matric 10",
    weights: [50, 40, 10] as const,
    target: 90,
    targetLabel: "Top public ~90%",
  },
];

function aggregate(institute: (typeof INSTITUTES)[number], fscPct: number, testPct: number, matricPct: number) {
  const [tw, fw, mw] = institute.weights;
  return (testPct * tw + fscPct * fw + matricPct * mw) / 100;
}

function chanceFor(agg: number, target: number) {
  if (agg >= target) return { label: "Strong", cls: "bg-emerald text-white" };
  if (agg >= target - 8) return { label: "Building", cls: "bg-accent text-white" };
  return { label: "Reach", cls: "bg-surface-2 text-ink" };
}

export function MeritDemo() {
  const [institute, setInstitute] = React.useState(0);
  const [fscPct, setFscPct] = React.useState(88);
  const [testPct, setTestPct] = React.useState(70);
  const MATRIC = 82;

  const inst = INSTITUTES[institute];
  const agg = aggregate(inst, fscPct, testPct, MATRIC);
  const chance = chanceFor(agg, inst.target);

  return (
    <div className="border-2 border-ink bg-surface shadow-[6px_6px_0_0_var(--color-ink)]">
      <div className="flex border-b-2 border-ink">
        {INSTITUTES.map((i, idx) => (
          <button
            key={i.id}
            onClick={() => setInstitute(idx)}
            className={cn(
              "flex-1 px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors",
              idx === institute
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:bg-surface-2 hover:text-ink"
            )}
          >
            {i.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted">Your aggregate</p>
            <p className="font-display text-4xl leading-none text-ink">{agg.toFixed(1)}%</p>
            <p className="mt-1 font-mono text-[11px] text-faint">{inst.note}</p>
          </div>
          <span className={cn("border-2 border-ink px-2 py-1 font-mono text-[11px] uppercase", chance.cls)}>
            {chance.label}
          </span>
        </div>

        <div className="mt-4 h-5 w-full overflow-hidden border-2 border-ink bg-surface-2">
          <div
            className="h-full bg-accent transition-all duration-150"
            style={{ width: `${Math.min(100, agg)}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[10px] text-faint">
          <span>0</span>
          <span>{inst.targetLabel}</span>
          <span>100</span>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <div className="flex items-center justify-between font-mono text-[11px] text-muted">
              <span>FSc marks</span>
              <span className="text-ink">{fscPct}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={100}
              value={fscPct}
              onChange={(e) => setFscPct(Number(e.target.value))}
              className="mt-1.5 h-2 w-full cursor-pointer appearance-none bg-surface-2 accent-[#2f55d4]"
              aria-label="FSc percentage"
            />
          </div>
          <div>
            <div className="flex items-center justify-between font-mono text-[11px] text-muted">
              <span>Entry test</span>
              <span className="text-ink">{testPct}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={testPct}
              onChange={(e) => setTestPct(Number(e.target.value))}
              className="mt-1.5 h-2 w-full cursor-pointer appearance-none bg-surface-2 accent-[#2f55d4]"
              aria-label="Entry test percentage"
            />
          </div>
          <p className="font-mono text-[10px] text-faint">
            matric {MATRIC}% · pick an institute, drag the sliders, watch your merit move
          </p>
        </div>
      </div>
    </div>
  );
}