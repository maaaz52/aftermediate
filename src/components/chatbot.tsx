"use client";

import * as React from "react";
import { X, Send, Sparkles, BookOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

type Persona = "rahbar" | "study";

const greetings: Record<Persona, string> = {
  rahbar:
    "Salam! I'm Rahbar 🧭 — your post-FSc guide. Ask me about merit, Plan B fields, scholarships, or what to do with your marks. Fikr not, I got you.",
  study:
    "Hey, Study Buddy here 📚. Ask me to explain a FSc concept, break down an MDCAT topic, or plan your revision. Let's get you exam-ready.",
};

const STORAGE_KEY = "aftermediate:chat";

function loadHistory(): Record<Persona, Msg[]> {
  if (typeof window === "undefined") return { rahbar: [], study: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return { rahbar: [], study: [], ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { rahbar: [], study: [] };
}

export function Chatbot() {
  const [open, setOpen] = React.useState(false);
  const [persona, setPersona] = React.useState<Persona>("rahbar");
  const [history, setHistory] = React.useState<Record<Persona, Msg[]>>(loadHistory);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const messages = history[persona];

  const setMessages = React.useCallback((p: Persona, msgs: Msg[]) => {
    setHistory((prev) => {
      const next = { ...prev, [p]: msgs };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const seed = React.useCallback(
    (p: Persona) => {
      if (history[p].length === 0) setMessages(p, [{ role: "assistant", content: greetings[p] }]);
    },
    [history, setMessages]
  );

  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as Persona | undefined;
      const target: Persona = detail === "study" ? "study" : "rahbar";
      setPersona(target);
      if (history[target].length === 0) setMessages(target, [{ role: "assistant", content: greetings[target] }]);
      setOpen(true);
    };
    document.addEventListener("open-chat", handler);
    return () => document.removeEventListener("open-chat", handler);
  }, [history, setMessages]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(persona, next);
    setInput("");
    setStreaming(true);

    const assistant: Msg = { role: "assistant", content: "" };
    setMessages(persona, [...next, assistant]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ persona, messages: next.map((m) => ({ role: m.role, content: m.content })) }),
      });
      if (!res.ok || !res.body) throw new Error("failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages(persona, [...next, { role: "assistant", content: acc }]);
      }
    } catch {
      setMessages(persona, [...next, { role: "assistant", content: "Sorry, I hit a snag. Try again in a moment." }]);
    } finally {
      setStreaming(false);
    }
  }

  function switchPersona() {
    const target: Persona = persona === "rahbar" ? "study" : "rahbar";
    setPersona(target);
    if (history[target].length === 0) setMessages(target, [{ role: "assistant", content: greetings[target] }]);
  }

  return (
    <>
      <button
        onClick={() => {
          setOpen((o) => !o);
          seed(persona);
        }}
        className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-2xl bg-saffron text-background shadow-[0_8px_40px_-6px_rgba(245,185,66,0.6)] transition-transform hover:scale-105 animate-pulse-ring"
        aria-label="Open assistant"
      >
        <Sparkles className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[520px] w-[380px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl animate-rise">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              {persona === "rahbar" ? <Sparkles className="h-4 w-4 text-saffron" /> : <BookOpen className="h-4 w-4 text-info" />}
              <span className="font-semibold text-ink">{persona === "rahbar" ? "Rahbar" : "Study Buddy"}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={switchPersona} className="rounded-md px-2 py-1 text-xs text-muted hover:bg-surface-2 hover:text-ink">
                {persona === "rahbar" ? "→ Study" : "→ Rahbar"}
              </button>
              <button onClick={() => setOpen(false)} className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-ink">
                <X className="h-4 w-4" />
              </button>
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
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-line p-3">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder={persona === "rahbar" ? "Ask about merit, Plan B, abroad…" : "Ask a FSc question…"}
                className="h-11 flex-1 rounded-lg border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-saffron/50"
              />
              <button
                onClick={send}
                disabled={streaming || !input.trim()}
                className="grid h-11 w-11 place-items-center rounded-lg bg-saffron text-background disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
