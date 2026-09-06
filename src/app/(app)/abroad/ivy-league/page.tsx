import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { Badge } from "@/components/ui/badge";
import { IvyExplorer } from "@/components/abroad/ivy-explorer";
import { Crown } from "lucide-react";

export const metadata: Metadata = pageMetadata({
  title: "Ivy League",
  description: "Harvard to Cornell — acceptance rates, testing policies, financial aid and a step-by-step path for Pakistani applicants. Every figure carries a source.",
  path: "/abroad/ivy-league",
});

export default function AbroadIvyLeaguePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="animate-reveal flex items-center gap-2">
        <Badge variant="saffron">Education Abroad</Badge>
        <Crown className="h-4 w-4 text-amber" />
        <span className="font-mono text-xs text-faint">8 schools · sourced data</span>
      </div>
      <h1
        className="animate-reveal mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl"
        style={{ animationDelay: "60ms" }}
      >
        Ivy League
      </h1>
      <p
        className="animate-reveal mt-2 max-w-xl text-muted"
        style={{ animationDelay: "120ms" }}
      >
        Harvard to Cornell — acceptance rates, testing policies, financial aid, and a
        step-by-step path for Pakistani applicants. Every figure carries a source.
      </p>
      <div className="animate-reveal mt-8" style={{ animationDelay: "180ms" }}>
        <IvyExplorer />
      </div>
    </div>
  );
}
