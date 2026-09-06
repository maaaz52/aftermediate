import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { SafarAssistant } from "@/components/abroad/safar-assistant";

export const metadata: Metadata = {
  title: "Safar A.I — study-abroad guide",
};

export default function AbroadAssistantPage() {
  return (
    <div data-tour="safar-ai" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="animate-reveal flex items-center gap-2">
        <Badge variant="saffron">Education Abroad</Badge>
        <span className="font-mono text-xs text-faint">ask anything</span>
      </div>
      <h1
        className="animate-reveal mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl"
        style={{ animationDelay: "60ms" }}
      >
        Safar A.I (سفر): your study-abroad guide.
      </h1>
      <p
        className="animate-reveal mt-2 max-w-xl text-muted"
        style={{ animationDelay: "120ms" }}
      >
        Visa questions, document checklists, bank statements, money, tests — ask in plain
        words. Every answer comes from a curated knowledge base with sources cited.
      </p>
      <div className="animate-reveal mt-8" style={{ animationDelay: "180ms" }}>
        <SafarAssistant />
      </div>
    </div>
  );
}
