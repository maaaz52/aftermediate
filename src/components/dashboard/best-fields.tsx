"use client";

import Link from "next/link";
import { bestFields } from "@/lib/recommend";
import { getMajorsByStream } from "@/lib/data";
import { useStudent } from "@/lib/store";
import { cn } from "@/lib/utils";

const demandChip: Record<string, string> = {
  high: "bg-emerald/10 text-emerald",
  medium: "bg-amber/10 text-amber",
  low: "bg-surface-2 text-muted",
};

export function BestFields() {
  const { profile } = useStudent();
  const stream = profile.stream ?? "pre-engineering";
  const fields = bestFields(getMajorsByStream(stream), profile.interests, 5);

  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Best-fit fields for your stream</p>
        <Link href="/career" className="text-xs font-medium text-saffron hover:underline">All fields →</Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {fields.map((m) => (
          <Link
            key={m.id}
            href={`/career/${m.id}`}
            className="group rounded-xl border border-line bg-surface-2/40 p-3 text-center transition-all hover:-translate-y-0.5 hover:border-saffron/40 hover:shadow-sm"
          >
            <div className="text-2xl">{m.emoji}</div>
            <p className="mt-1.5 text-xs font-bold leading-tight text-ink group-hover:text-saffron">{m.name}</p>
            <span className={cn("mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", demandChip[m.demand])}>
              {m.demand} demand
            </span>
            <p className="mt-1 font-mono text-[10px] text-muted">
              {Math.round(m.salaryRange.low / 1000)}–{Math.round(m.salaryRange.high / 1000)}k
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}