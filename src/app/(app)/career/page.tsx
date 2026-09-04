"use client";

import * as React from "react";
import Link from "next/link";
import { BarChart3, Rocket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SalaryExplorer } from "@/components/pakistan/salary-explorer";
import { useStudent } from "@/lib/store";
import { data, getMajorsByStream } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { Stream } from "@/lib/types";

const filters: { id: Stream | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pre-medical", label: "Pre-Medical" },
  { id: "pre-engineering", label: "Pre-Engineering" },
  { id: "ics", label: "ICS" },
  { id: "icom", label: "I.Com" },
];

export default function CareerPage() {
  const { profile } = useStudent();
  const [filter, setFilter] = React.useState<Stream | "all">(profile.stream ?? "all");

  const majors =
    filter === "all" ? data.majors : getMajorsByStream(filter);

  return (
    <div data-tour="career" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* ── Hero ── */}
      <div className="animate-reveal flex items-center gap-2">
        <Badge variant="violet">Career</Badge>
        <span className="font-mono text-xs text-faint">discover · simulate · skill up</span>
      </div>
      <h1
        className="animate-reveal mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl"
        style={{ animationDelay: "60ms" }}
      >
        Explore careers and what they actually pay.
      </h1>
      <p
        className="animate-reveal mt-2 max-w-xl text-muted"
        style={{ animationDelay: "120ms" }}
      >
        Every field has a skill tree, a day-in-the-life simulation, and short courses you can
        start today — plus real salary data across Pakistan.
      </p>

      {/* ── Stream filters ── */}
      <div className="animate-reveal mt-8 flex flex-wrap gap-2" style={{ animationDelay: "180ms" }}>
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-all",
              filter === f.id
                ? "border-violet bg-violet/15 text-violet"
                : "border-line bg-surface text-muted hover:text-ink"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Major cards ── */}
      <div className="animate-reveal mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" style={{ animationDelay: "240ms" }}>
        {majors.map((m) => (
          <Link
            key={m.id}
            href={`/career/${m.id}`}
            className="card-glass group rounded-2xl p-5 transition-all hover:-translate-y-1 hover:border-violet/40"
          >
            <div className="flex items-start justify-between">
              <span className="text-4xl">{m.emoji}</span>
              <Badge variant={m.demand === "high" ? "emerald" : m.demand === "medium" ? "saffron" : "default"}>
                {m.demand}
              </Badge>
            </div>
            <h3 className="mt-4 text-lg font-bold text-ink sm:text-xl">{m.name}</h3>
            <p className="mt-0.5 text-xs uppercase tracking-widest text-faint">{m.field}</p>
            <p className="mt-2 text-sm text-muted">{m.tagline}</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="font-mono text-violet">
                {m.salaryRange.low / 1000}k–{m.salaryRange.high / 1000}k/mo
              </span>
              <span className="flex items-center gap-1 text-muted group-hover:text-violet">
                <Rocket className="h-4 w-4" /> Try it
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Salary landscape ── */}
      <div className="animate-reveal mt-16 border-t border-line pt-12" style={{ animationDelay: "300ms" }}>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-saffron" />
          <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Salary landscape in Pakistan
          </h2>
        </div>
        <p className="mt-2 max-w-xl text-muted text-sm">
          Real salary ranges by field and experience level — plus the honest trade-off between
          freelancing, government, and private careers.
        </p>
        <div className="mt-6">
          <SalaryExplorer />
        </div>
      </div>
    </div>
  );
}
