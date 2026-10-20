"use client";

import { PersistentChatAssistant } from "@/components/chat/persistent-chat-assistant";

export default function StudyPage() {
  return (
    <div data-tour="ustaad-ai" className="chat-page-shell">
      <PersistentChatAssistant
        persona="study"
        label="Ustaad A.I"
        greeting="Salam! Main Ustaad hoon, your FSc study assistant. Ask me to explain a concept, break down an MDCAT, NET, or ECAT topic, or make you a revision plan."
        suggestions={["Explain biological magnification like I'm 15", "Make me a 2-week MDCAT revision plan", "How does NUST NET aggregate work?", "Practice a physics torque question"]}
        placeholder="Ask a FSc question"
      />
    </div>
  );
}
