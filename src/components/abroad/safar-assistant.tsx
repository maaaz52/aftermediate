"use client";

import { PersistentChatAssistant } from "@/components/chat/persistent-chat-assistant";

export function SafarAssistant() {
  return (
    <PersistentChatAssistant
      persona="safar"
      label="Safar A.I"
      greeting="Salam! I'm Safar (سفر), your study-abroad assistant. Ask me about visas, documents, bank statements, money, tests, scholarships, or destination countries."
      suggestions={["What documents do I need for a student visa?", "How much bank statement do I need to show?", "Which countries are cheapest for Pakistani students?", "How do I prepare for a visa interview?"]}
      placeholder="Ask about visas, documents, money, or tests"
    />
  );
}
