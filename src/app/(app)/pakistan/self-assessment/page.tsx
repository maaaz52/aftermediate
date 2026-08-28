"use client";

import { Badge } from "@/components/ui/badge";
import { PracticeCatalog } from "@/components/practice/practice-catalog";

export default function SelfAssessmentPage() {
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
        Self Assessment
      </h1>
      <p
        className="animate-reveal mt-2 max-w-xl text-muted"
        style={{ animationDelay: "120ms" }}
      >
        Timed mock exams replicating real entry-test conditions &mdash; test
        your readiness with full-length and quick practice papers sourced from
        official patterns.
      </p>
      <div
        className="animate-reveal mt-8"
        style={{ animationDelay: "180ms" }}
      >
        <PracticeCatalog />
      </div>
    </div>
  );
}