"use client";

import { Badge } from "@/components/ui/badge";
import { FinancialPlanner } from "@/components/abroad/financial-planner";

export default function AbroadPlannerPage() {
  return (
    <div data-tour="planner" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="animate-reveal flex items-center gap-2">
        <Badge variant="saffron">Education Abroad</Badge>
        <span className="font-mono text-xs text-faint">know your numbers</span>
      </div>
      <h1
        className="animate-reveal mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl"
        style={{ animationDelay: "60ms" }}
      >
        What studying abroad actually costs.
      </h1>
      <p
        className="animate-reveal mt-2 max-w-xl text-muted"
        style={{ animationDelay: "120ms" }}
      >
        First-year breakdown, a 4-year projection, a monthly budget, and how long it will
        take you to save for it — in PKR or the local currency.
      </p>
      <div className="animate-reveal mt-8" style={{ animationDelay: "180ms" }}>
        <FinancialPlanner />
      </div>
    </div>
  );
}
