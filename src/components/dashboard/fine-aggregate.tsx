"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useStudent } from "@/lib/store";
import { nustAggregate, fastAggregate, mdcatAggregate } from "@/lib/aggregates";
import type { AggregateResult } from "@/lib/aggregates";

const BAR_GRADIENTS = [
  "bg-linear-to-r from-saffron to-saffron-soft",
  "bg-linear-to-r from-emerald to-emerald/70",
  "bg-linear-to-r from-amber to-amber/70",
];

function BreakdownRow({
  name, weight, value, gradient, hasTest,
}: {
  name: string;
  weight: number;
  value: number;
  gradient: string;
  hasTest: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{name} · {weight}%</span>
        <span className="font-mono font-semibold text-ink">{hasTest ? value.toFixed(1) : "—"}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full ${gradient} transition-all duration-700`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

export function FineAggregate() {
  const { profile } = useStudent();
  const stream = profile.stream ?? "pre-engineering";
  const marks = profile.marks;
  const hasTest = !!marks.entryTestObtained;

  let results: AggregateResult[] = [];
  if (stream === "pre-medical") results = [mdcatAggregate(marks)];
  else if (stream !== "icom") results = [nustAggregate(marks), fastAggregate(marks)];

  return (
    <div className="card-glass rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Fine · Formula breakdown</p>

      {results.length > 0 ? (
        <>
          <div className="mt-4 space-y-3">
            {results[0].breakdown.map((b, i) => (
              <BreakdownRow
                key={b.component}
                name={b.component}
                weight={b.weight}
                value={b.contribution}
                gradient={BAR_GRADIENTS[i % BAR_GRADIENTS.length]}
                hasTest={hasTest}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
            <span className="text-xs text-muted">{results[0].name} aggregate</span>
            <span className="font-mono text-lg font-bold text-ink">{results[0].value.toFixed(1)}%</span>
          </div>
          {results[1] && (
            <p className="mt-2 text-xs text-muted">
              {results[1].name}: <span className="font-mono font-semibold text-ink">{results[1].value.toFixed(1)}%</span>
            </p>
          )}
        </>
      ) : (
        <p className="mt-3 text-sm text-muted">
          No standard aggregate formula for I.Com — merit depends on each university&apos;s entry test.
        </p>
      )}

      <Link href="/merit" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-saffron hover:underline">
        {hasTest ? "Full breakdown" : "Add your entry test score"} <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}