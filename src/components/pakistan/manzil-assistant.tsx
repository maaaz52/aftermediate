"use client";

import * as React from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatHistory, type ChatMessage } from "@/lib/chat-storage";

type Msg = ChatMessage;

const GREETING =
  "Salam! I'm Manzil (منزل) — your guide to studying inside Pakistan. Ask me about universities, admission steps, entry tests, merit, fees, or HEC and provincial scholarships.";

const STORAGE_KEY = "aftermediate:manzil-chat";

const SUGGESTIONS = [
  "Which universities offer merit scholarships?",
  "How do I apply to NUST?",
  "What is the HEC need-based scholarship process?",
  "What aggregate do I need for MBBS in Punjab?",
  "Which private universities are cheapest for engineering?",
];

export function ManzilAssistant() {
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
        body: JSON.stringify({
          persona: "manzil",
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
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
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            "Sorry, I hit a snag. Try again in a moment — or check the pages on the left while you wait.",
        },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="card-glass mx-auto flex h-[70vh] max-w-3xl flex-col overflow-hidden rounded-2xl">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-saffron/10">
          <Sparkles className="h-4 w-4 text-saffron" />
        </div>
        <div>
          <p className="text-sm font-bold text-ink">Manzil A.I · منزل</p>
          <p className="text-[11px] text-muted">
            Study-in-Pakistan assistant · institutes, merit and scholarships
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                m.role === "user" ? "bg-saffron text-background" : "bg-surface-2 text-ink"
              )}
            >
              {m.content || (streaming && <Loader2 className="h-4 w-4 animate-spin" />)}
            </div>
          </div>
        ))}

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-full border border-line bg-surface-2 px-3 py-1.5 text-xs text-muted transition-colors hover:border-saffron/40 hover:text-ink"
              >
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
            placeholder="Ask about universities, admissions, merit, fees…"
            className="h-11 flex-1 rounded-lg border border-line bg-surface-2 px-3.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-saffron/50"
          />
          <button
            type="button"
            onClick={() => send()}
            disabled={streaming || !input.trim()}
            className="grid h-11 w-11 place-items-center rounded-lg bg-saffron text-background disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-faint">
          Manzil answers from a curated knowledge base and cites sources. Always double-check on official pages.
        </p>
      </div>
    </div>
  );
}
