"use client";

import { Badge } from "@/components/ui/badge";
import { ScholarshipsExplorer } from "@/components/pakistan/scholarships-explorer";

export default function PakistanScholarshipsPage() {
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
        Every scholarship, one page.
      </h1>
      <p
        className="animate-reveal mt-2 max-w-xl text-muted"
        style={{ animationDelay: "120ms" }}
      >
        HEC, need-based, merit-based, university-specific, and provincial — grouped so you can find
        what applies to you in seconds. Every entry links to its official page.
      </p>
      <div className="animate-reveal mt-8" style={{ animationDelay: "180ms" }}>
        <ScholarshipsExplorer />
      </div>
    </div>
  );
}
