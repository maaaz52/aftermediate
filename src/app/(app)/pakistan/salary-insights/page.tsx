"use client";

import { Badge } from "@/components/ui/badge";
import { SalaryExplorer } from "@/components/pakistan/salary-explorer";

export default function PakistanSalaryPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="animate-reveal flex items-center gap-2">
        <Badge variant="saffron">Pakistan</Badge>
        <span className="font-mono text-xs text-faint">education at home</span>
      </div>
      <h1
        className="animate-reveal mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl"
        style={{ animationDelay: "60ms" }}
      >
        What a degree pays in Pakistan.
      </h1>
      <p
        className="animate-reveal mt-2 max-w-xl text-muted"
        style={{ animationDelay: "120ms" }}
      >
        Real salary ranges by field and experience level — plus the honest trade-off between
        freelancing, government, and private careers. Every figure links back to its source.
      </p>
      <div className="animate-reveal mt-8" style={{ animationDelay: "180ms" }}>
        <SalaryExplorer />
      </div>
    </div>
  );
}
