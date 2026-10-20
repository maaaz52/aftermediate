import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { SafarAssistant } from "@/components/abroad/safar-assistant";

export const metadata: Metadata = pageMetadata({
  title: "Safar A.I — study-abroad guide",
  description: "Ask anything about studying abroad — visas, documents, bank statements, money and tests — answered from a curated knowledge base with cited sources.",
  path: "/abroad/assistant",
});

export default function AbroadAssistantPage() {
  return (
    <div data-tour="safar-ai" className="chat-page-shell"><SafarAssistant /></div>
  );
}
