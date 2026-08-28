"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getMajorsByStream } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { Stream } from "@/lib/types";

const STREAMS: { id: Stream; label: string; sub: string }[] = [
  { id: "pre-medical", label: "Pre-Medical", sub: "Biology, Chemistry, Physics" },
  { id: "pre-engineering", label: "Pre-Engineering", sub: "Math, Chemistry, Physics" },
  { id: "ics", label: "ICS", sub: "Computer Science" },
  { id: "icom", label: "I.Com", sub: "Commerce" },
];

export function StreamExplorer() {
  const [stream, setStream] = React.useState<Stream>("pre-medical");
  const majors = getMajorsByStream(stream).slice(0, 4);

  return (
    <div className="border-2 border-ink bg-surface shadow-[6px_6px_0_0_var(--color-ink)]">
      <div className="flex flex-wrap border-b-2 border-ink">
        {STREAMS.map((s) => (
          <button
            key={s.id}
            onClick={() => setStream(s.id)}
            className={cn(
              "flex-1 min-w-[140px] border-r-2 border-ink px-4 py-3 text-left transition-colors last:border-r-0",
              stream === s.id ? "bg-accent text-white" : "bg-surface text-muted hover:bg-surface-2 hover:text-ink"
            )}
          >
            <p className="font-mono text-xs uppercase tracking-wider">{s.label}</p>
            <p className={cn("mt-0.5 text-[11px]", stream === s.id ? "text-white/75" : "text-faint")}>{s.sub}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {majors.map((m) => (
          <Link
            key={m.id}
            href="/login?mode=signup"
            className="group border-2 border-ink bg-surface p-4 transition-all hover:-translate-y-0.5 hover:bg-surface-2"
          >
            <div className="flex items-start justify-between">
              <span className="text-2xl">{m.emoji}</span>
              <ArrowRight className="h-4 w-4 text-faint transition-transform group-hover:translate-x-1 group-hover:text-accent" />
            </div>
            <p className="mt-2 font-sans font-bold text-ink">{m.name}</p>
            <p className="text-xs text-muted">{m.tagline}</p>
            <p className="mt-2 font-mono text-xs text-accent">
              {m.salaryRange.low / 1000}k–{m.salaryRange.high / 1000}k/mo
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}