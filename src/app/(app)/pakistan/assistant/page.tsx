import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { ManzilAssistant } from "@/components/pakistan/manzil-assistant";

export const metadata: Metadata = pageMetadata({
  title: "Manzil A.I — guide to studying in Pakistan",
  description: "Ask about Pakistani universities, admission steps, entry tests, merit, fees and scholarships — answered from a curated knowledge base with cited sources.",
  path: "/pakistan/assistant",
});

export default function PakistanAssistantPage() {
  return (
    <div className="chat-page-shell"><ManzilAssistant /></div>
  );
}
