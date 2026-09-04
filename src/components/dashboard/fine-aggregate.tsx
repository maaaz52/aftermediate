"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useStudent } from "@/lib/store";
import { pct, topUniChance } from "@/lib/aggregates";
import { cn } from "@/lib/utils";

export function FineAggregate() {
  const { profile } = useStudent();
  const marks = profile.marks;

  const fscPct = pct(marks.fscObtained, marks.fscTotal);
  const matPct = pct(marks.matricObtained, marks.matricTotal);
  const chance = topUniChance(marks);

  const hasMarks = fscPct > 0 || matPct > 0;

  return (
    <div className="card-glass rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
        Top-university chances
      </p>

      {!hasMarks ? (
        <div className="mt-4">
          <p className="text-sm text-muted">
            Add your FSc and Matric marks to see your odds at the country&apos;s top universities.
          </p>
          <Link
            href="/profile"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-saffron hover:underline"
          >
            Add your marks <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="font-mono text-3xl font-bold text-ink">{chance.chance}%</p>
              <p className="text-[11px] text-muted">estimated chance</p>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-bold",
                chance.chance >= 75
                  ? "bg-emerald/15 text-emerald"
                  : chance.chance >= 40
                    ? "bg-saffron/15 text-saffron"
                    : "bg-danger/15 text-danger"
              )}
            >
              {chance.band}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <Bar label="FSc" value={fscPct} color="bg-emerald" />
            <Bar label="Matric" value={matPct} color="bg-amber" />
          </div>

          {chance.targets.length > 0 && (
            <p className="mt-3 text-xs text-muted">
              Could land:{" "}
              <span className="font-medium text-ink">{chance.targets.join(" · ")}</span>
            </p>
          )}

          <p className="mt-3 border-t border-line pt-2 text-[10.5px] text-faint">
            Based on 2024-25 closing merits (NUST CS ~78%, FAST CS ~73%, UET CS ~75%). The entry
            test still decides — see the full breakdown.
          </p>
        </>
      )}

      <Link href="/merit" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-saffron hover:underline">
        Full merit breakdown <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="font-mono font-semibold text-ink">{value.toFixed(1)}%</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}