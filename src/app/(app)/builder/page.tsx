"use client";

import { Badge } from "@/components/ui/badge";
import { Builder } from "@/components/builder/builder";

export default function BuilderPage() {
  return (
    <div data-tour="cv-builder" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2">
        <Badge variant="violet">CV Builder</Badge>
        <span className="font-mono text-xs text-faint">polish · quantify · impress</span>
      </div>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
        Build a CV that gets a <span className="text-violet">second look.</span>
      </h1>
      <p className="mt-2 max-w-xl text-muted">
        Turn rough notes into recruiter-ready bullets, watch your ATS score climb in real time, and
        download a clean PDF when you&apos;re done.
      </p>

      <Builder />
    </div>
  );
}
