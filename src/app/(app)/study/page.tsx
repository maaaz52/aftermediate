"use client";

import * as React from "react";
import { BookOpen, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatHistory, type ChatMessage } from "@/lib/chat-storage";

type Msg = ChatMessage;

const GREETING =
  "Salam! Main Ustaad hoon — your FSc study assistant. 🤓 Ask me to explain a concept, break down an MDCAT/NET/ECAT topic, or make you a revision plan. Let's get you exam-ready.";

const STORAGE_KEY = "aftermediate:study-chat";

const SUGGESTIONS = [
  "Explain biological magnification like I'm 15",
  "Make me a 2-week MDCAT revision plan",
  "How does NUST NET aggregate work?",
  "Practice a physics torque question",
];

export default function StudyPage() {
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
        body: JSON.stringify({ persona: "study", messages: next.map((m) => ({ role: m.role, content: m.content })) }),
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
    <div
      data-tour="ustaad-ai"
      className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col px-4 py-6 sm:px-6"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-info/10 text-info">
          <BookOpen className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Ustaad A.I <span className="text-info">· استاد</span>
          </h1>
          <p className="text-sm text-muted">Your FSc study tutor — concepts, past papers, revision plans.</p>
        </div>
      </div>

      <div className="mt-5 flex flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "user" ? "bg-saffron text-background" : "bg-surface-2 text-ink"
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
                  className="rounded-full border border-line bg-surface-2 px-3.5 py-2 text-sm text-muted transition-colors hover:border-info/40 hover:text-ink"
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
              placeholder="Ask a FSc question…"
              className="h-11 flex-1 rounded-lg border border-line bg-surface-2 px-3.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-info/50"
            />
            <button
              onClick={() => send()}
              disabled={streaming || !input.trim()}
              className="grid h-11 w-11 place-items-center rounded-lg bg-info text-background disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}