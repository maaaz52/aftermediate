"use client";

import { PersistentChatAssistant } from "@/components/chat/persistent-chat-assistant";

export function ManzilAssistant() {
  return (
    <PersistentChatAssistant
      persona="manzil"
      label="Manzil A.I"
      greeting="Salam! I'm Manzil (منزل), your guide to studying inside Pakistan. Ask me about universities, admission steps, entry tests, merit, fees, or scholarships."
      suggestions={["Which universities offer merit scholarships?", "How do I apply to NUST?", "What is the HEC need-based scholarship process?", "What's on the MDCAT paper?"]}
      placeholder="Ask about universities, admissions, merit, or fees"
    />
  );
}
