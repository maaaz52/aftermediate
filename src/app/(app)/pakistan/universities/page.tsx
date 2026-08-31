"use client";

import { Badge } from "@/components/ui/badge";
import { UniversitiesExplorer } from "@/components/pakistan/universities-explorer";

export default function PakistanUniversitiesPage() {
  return (
    <div data-tour="universities" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="animate-reveal flex items-center gap-2">
        <Badge variant="saffron">Pakistan</Badge>
        <span className="font-mono text-xs text-faint">education at home</span>
      </div>
      <h1
        className="animate-reveal mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl"
        style={{ animationDelay: "60ms" }}
      >
        Pakistani universities, decoded.
      </h1>
      <p
        className="animate-reveal mt-2 max-w-xl text-muted"
        style={{ animationDelay: "120ms" }}
      >
        Admission steps, real fees, rankings, and the fields each university is actually known for —
        with official links, not academy gossip.
      </p>
      <div className="animate-reveal mt-8" style={{ animationDelay: "180ms" }}>
        <UniversitiesExplorer />
      </div>
    </div>
  );
}