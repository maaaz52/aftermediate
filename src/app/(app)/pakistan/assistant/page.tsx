import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { Badge } from "@/components/ui/badge";
import { ManzilAssistant } from "@/components/pakistan/manzil-assistant";

export const metadata: Metadata = pageMetadata({
  title: "Manzil A.I — guide to studying in Pakistan",
  description: "Ask about Pakistani universities, admission steps, entry tests, merit, fees and scholarships — answered from a curated knowledge base with cited sources.",
  path: "/pakistan/assistant",
});

export default function PakistanAssistantPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="animate-reveal flex items-center gap-2">
        <Badge variant="saffron">Education in Pakistan</Badge>
        <span className="font-mono text-xs text-faint">ask anything</span>
      </div>
      <h1
        className="animate-reveal mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl"
        style={{ animationDelay: "60ms" }}
      >
        Manzil A.I (منزل): your guide to studying at home.
      </h1>
      <p
        className="animate-reveal mt-2 max-w-xl text-muted"
        style={{ animationDelay: "120ms" }}
      >
        Universities, admission steps, entry tests, merit, fees and scholarships — ask in
        plain words. Every answer comes from a curated knowledge base with sources cited.
      </p>
      <div className="animate-reveal mt-8" style={{ animationDelay: "180ms" }}>
        <ManzilAssistant />
      </div>
    </div>
  );
}
