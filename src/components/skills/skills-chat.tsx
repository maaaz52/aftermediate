"use client";

import * as React from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const GREETING =
  "Salam! Main Hunar hoon — your freelancing & side-hustle coach. 💼 Ask me about skills to learn, pricing your work, finding clients, or getting paid from Pakistan. Let's build something that pays.";

const STORAGE_KEY = "aftermediate:skills:chat";

const SUGGESTIONS = [
  "I have zero skills — where do I start?",
  "How do I price a logo design?",
  "Upwork vs Fiverr — which first?",
  "How do I get paid from Pakistan?",
];

function loadHistory(): Msg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
}

export function SkillsChat() {
  const [messages, setMessages] = React.useState<Msg[]>(() =>
    loadHistory().length > 0 ? loadHistory() : [{ role: "assistant", content: GREETING }]
  );
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages]);

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
    <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                m.role === "user" ? "bg-accent text-background" : "bg-surface-2 text-ink"
              )}
            >
              {m.content || (streaming && <Loader2 className="h-4 w-4 animate-spin" />)}
            </div>
          </div>
        ))}

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3.5 py-2 text-sm text-muted transition-colors hover:border-emerald/40 hover:text-ink"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald" />
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about skills, pricing, clients, getting paid…"
            className="h-11 flex-1 rounded-lg border border-line bg-surface-2 px-3.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-emerald/50"
          />
          <button
            onClick={() => send()}
            disabled={streaming || !input.trim()}
            className="grid h-11 w-11 place-items-center rounded-lg bg-emerald text-background disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
