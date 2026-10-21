"use client";

import { PersistentChatAssistant } from "@/components/chat/persistent-chat-assistant";

const GREETING =
  "Salam! Main Hunar hoon — your freelancing & side-hustle coach. 💼 Ask me about skills to learn, pricing your work, finding clients, or getting paid from Pakistan. Let's build something that pays.";

const SUGGESTIONS = [
  "I have zero skills — where do I start?",
  "How do I price a logo design?",
  "Upwork vs Fiverr — which first?",
  "How do I get paid from Pakistan?",
];

export function SkillsChat() {
  return (
    <PersistentChatAssistant
      persona="hunar"
      label="Hunar A.I"
      greeting={GREETING}
      suggestions={SUGGESTIONS}
      placeholder="Ask about skills, pricing, clients, getting paid…"
    />
  );
}
