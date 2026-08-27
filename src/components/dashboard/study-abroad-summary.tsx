"use client";

import Link from "next/link";
import { data } from "@/lib/data";

export function StudyAbroadSummary() {
  const top = data.destinations.slice(0, 3);

  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Study abroad · summary</p>
        <Link href="/money" className="text-xs font-medium text-saffron hover:underline">Money page →</Link>
      </div>
      <div className="mt-3 space-y-1">
        {top.map((d) => (
          <div
            key={d.country}
            className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-2/60"
          >
            <span className="text-lg">{d.flag}</span>
            <span className="w-24 truncate text-sm font-semibold text-ink">{d.country}</span>
            <span className="hidden rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted md:inline">
              {d.approxStudents} students
            </span>
            <span className="ml-auto rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-medium text-emerald">
              {d.postStudyWork}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}