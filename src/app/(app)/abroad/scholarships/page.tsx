"use client";

import { Badge } from "@/components/ui/badge";
import { AbroadScholarshipsExplorer } from "@/components/abroad/abroad-scholarships-explorer";

export default function AbroadScholarshipsPage() {
  return (
    <div data-tour="abroad-scholarships" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="animate-reveal flex items-center gap-2">
        <Badge variant="saffron">Education Abroad</Badge>
        <span className="font-mono text-xs text-faint">funding your degree</span>
      </div>
      <h1
        className="animate-reveal mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl"
        style={{ animationDelay: "60ms" }}
      >
        Every scholarship a Pakistani student should know.
      </h1>
      <p
        className="animate-reveal mt-2 max-w-xl text-muted"
        style={{ animationDelay: "120ms" }}
      >
        HEC foreign programs, host-government awards, university scholarships, and merit/need
        schemes — with official links, not agents&apos; promises.
      </p>
      <div className="animate-reveal mt-8" style={{ animationDelay: "180ms" }}>
        <AbroadScholarshipsExplorer />
      </div>
    </div>
  );
}
