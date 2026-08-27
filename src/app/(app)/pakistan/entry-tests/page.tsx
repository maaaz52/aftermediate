"use client";

import { Badge } from "@/components/ui/badge";
import { EntryTestsExplorer } from "@/components/pakistan/entry-tests-explorer";

export default function PakistanEntryTestsPage() {
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
        Every entry test, one hub.
      </h1>
      <p
        className="animate-reveal mt-2 max-w-xl text-muted"
        style={{ animationDelay: "120ms" }}
      >
        MDCAT to LAT — pattern, syllabus, fee, and how to apply for every test a 12th-passed
        student can take, straight from the official conducting bodies.
      </p>
      <div className="animate-reveal mt-8" style={{ animationDelay: "180ms" }}>
        <EntryTestsExplorer />
      </div>
    </div>
  );
}
