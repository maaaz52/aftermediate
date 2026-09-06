import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { Badge } from "@/components/ui/badge";
import { CountriesExplorer } from "@/components/abroad/countries-explorer";

export const metadata: Metadata = pageMetadata({
  title: "Countries — study abroad",
  description: "Compare study-abroad destinations for Pakistani students — visas, tuition in PKR, living costs and post-study work, side by side.",
  path: "/abroad/countries",
});

export default function AbroadCountriesPage() {
  return (
    <div data-tour="countries" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="animate-reveal flex items-center gap-2">
        <Badge variant="saffron">Education Abroad</Badge>
        <span className="font-mono text-xs text-faint">study destinations</span>
      </div>
      <h1
        className="animate-reveal mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl"
        style={{ animationDelay: "60ms" }}
      >
        Compare 13 study destinations, side by side.
      </h1>
      <p
        className="animate-reveal mt-2 max-w-xl text-muted"
        style={{ animationDelay: "120ms" }}
      >
        Tuition, living costs, visa rules, documents, and the full pathway for each country —
        every figure sourced from official pages.
      </p>
      <div className="animate-reveal mt-8" style={{ animationDelay: "180ms" }}>
        <CountriesExplorer />
      </div>
    </div>
  );
}
