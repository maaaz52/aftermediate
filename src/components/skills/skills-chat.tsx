"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { MessageContent } from "@/components/message-content";
import { ChatThinkingIndicator } from "@/components/chat/chat-thinking-indicator";
import { useChatHistory, type ChatMessage } from "@/lib/chat-storage";

type Msg = ChatMessage;

const GREETING =
  "Salam! Main Hunar hoon — your freelancing & side-hustle coach. 💼 Ask me about skills to learn, pricing your work, finding clients, or getting paid from Pakistan. Let's build something that pays.";

const STORAGE_KEY = "aftermediate:skills:chat";

const SUGGESTIONS = [
  "I have zero skills — where do I start?",
  "How do I price a logo design?",
  "Upwork vs Fiverr — which first?",
  "How do I get paid from Pakistan?",
];

export function SkillsChat() {
  const [messages, setMessages] = useChatHistory(STORAGE_KEY, GREETING);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  async function send(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || streaming) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setStreaming(true);
    setMessages([...next, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ persona: "hunar", messages: next.map((m) => ({ role: m.role, content: m.content })) }),
      });
      if (!res.ok || !res.body) throw new Error("failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages([...next, { role: "assistant", content: acc }]);
      }
    } catch {
      setMessages([...next, { role: "assistant", content: "Sorry, I hit a snag. Try again in a moment." }]);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <section className="chat-workspace">
      <header className="chat-workspace-header"><h1 className="chat-workspace-title">Hunar A.I</h1></header>
      <div className="chat-transcript"><div className="chat-transcript-inner">
        {messages.map((m, i) => (
          <div key={i} className={`chat-message-row chat-message-row-${m.role}`}>
            <div className={`chat-message chat-message-${m.role}`}>
              {m.role === "user" ? m.content : m.content ? <MessageContent>{m.content}</MessageContent> : null}
              {!m.content && streaming && <ChatThinkingIndicator className="text-emerald" />}
            </div>
          </div>
        ))}

        {messages.length <= 1 && (
          <div className="chat-suggestions">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="chat-suggestion"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div></div>

      <form className="chat-composer-wrap" onSubmit={(event) => { event.preventDefault(); void send(); }}>
        <div className="chat-composer">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about skills, pricing, clients, getting paid…"
            className="chat-composer-input"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="chat-send-button"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </section>
  );
}
