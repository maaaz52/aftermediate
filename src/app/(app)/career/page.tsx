"use client";

import * as React from "react";
import Link from "next/link";
import { Rocket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2">
        <Badge variant="violet">Career</Badge>
        <span className="font-mono text-xs text-faint">discover · simulate · skill up</span>
      </div>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">Try a major before you commit.</h1>
      <p className="mt-2 max-w-xl text-muted">
        Every field here has a skill tree, a day-in-the-life simulation, and short courses you can
        start today.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
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

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}
