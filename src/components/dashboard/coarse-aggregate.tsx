"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CountUp } from "@/components/count-up";
import { overallStanding } from "@/lib/aggregates";
import { useStudent } from "@/lib/store";

export function CoarseAggregate() {
  const { profile } = useStudent();
  if (!profile.marks.fscObtained) return null;
  const standing = overallStanding(profile.marks);

  return (
    <div className="card-glass rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Coarse · Overall standing</p>
        <span className="rounded-full bg-emerald/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald">
          {standing.label}
        </span>
      </div>
      <div className="mt-2 flex items-end gap-1.5">
        <CountUp value={standing.value} decimals={1} className="font-mono text-4xl font-bold text-ink" />
        <span className="mb-1 text-lg font-semibold text-saffron">%</span>
      </div>
      <svg viewBox="0 0 160 28" className="mt-2 h-7 w-full" aria-hidden="true">
        <polyline
          points="0,24 20,21 40,23 60,17 80,19 100,13 120,15 140,9 160,7"
          fill="none" stroke="var(--color-saffron)" strokeWidth="2"
        />
        <polygon
          points="0,24 20,21 40,23 60,17 80,19 100,13 120,15 140,9 160,7 160,28 0,28"
          fill="var(--color-saffron)" opacity="0.07"
        />
      </svg>
      <p className="mt-1 text-xs text-muted">Ballpark from FSc + Matric only — entry test not included.</p>
      <Link href="/merit" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-saffron hover:underline">
        See exact merit <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}