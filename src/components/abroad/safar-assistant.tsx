"use client";

import * as React from "react";
import { Download, History, Loader2, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageContent } from "@/components/message-content";
import { SessionSidebar } from "@/components/chat/session-sidebar";
import {
  listSessions,
  createSession,
  loadSession,
  saveMessage,
  type ChatSession,
} from "@/lib/chat-api";
import { exportChatAsPDF } from "@/lib/chat-pdf";
import { useAuth } from "@/lib/auth";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING =
  "Salam! I'm Safar (سفر) — your study-abroad assistant. Ask me about visa processes, documents, bank statements, money, tests, scholarships, or any of the 13 destination countries.";

const SUGGESTIONS = [
  "What documents do I need for a student visa?",
  "How much bank statement do I need to show?",
  "Which countries are cheapest for Pakistani students?",
  "How do I prepare for a visa interview?",
  "What tests do I need for Germany?",
];

const PERSONA_LABEL = "Safar A.I · سفر";

export function SafarAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = React.useState<Msg[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [activeSession, setActiveSession] = React.useState<ChatSession | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const [hasSessions, setHasSessions] = React.useState(false);
  React.useEffect(() => {
    if (!user) return;
    listSessions("safar").then((s) => setHasSessions(s.length > 0));
  }, [user]);

  async function send(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || streaming) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setStreaming(true);
    setMessages([...next, { role: "assistant", content: "" }]);

    let sessionId = activeSession?.id;
    if (!sessionId) {
      try {
        const session = await createSession("safar", text);
        setActiveSession(session);
        sessionId = session.id;
        setHasSessions(true);
        await saveMessage(sessionId, "user", text);
      } catch {
        // continue streaming even if session creation fails
      }
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          persona: "safar",
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
      if (sessionId && acc) {
        await saveMessage(sessionId, "assistant", acc);
      }
    } catch {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: "Sorry, I hit a snag. Try again in a moment — or check the pages on the left while you wait.",
        },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  async function handleLoadSession(id: string) {
    const loaded = await loadSession(id);
    if (loaded) {
      setActiveSession({ id: loaded.id, persona: loaded.persona, title: loaded.title, created_at: loaded.created_at, updated_at: loaded.updated_at });
      setMessages(loaded.messages.length > 0 ? loaded.messages : [{ role: "assistant", content: GREETING }]);
    }
  }

  function handleNewSession() {
    setActiveSession(null);
    setMessages([{ role: "assistant", content: GREETING }]);
  }

  return (
    <div className="card-glass mx-auto flex h-[70vh] max-w-3xl flex-col overflow-hidden rounded-2xl">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-saffron/10">
          <Sparkles className="h-4 w-4 text-saffron" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-ink">{PERSONA_LABEL}</p>
          <p className="text-[11px] text-muted">Study-abroad assistant · answers from a curated knowledge base</p>
        </div>
        {user && (
          <div className="flex items-center gap-1">
            {messages.length > 1 && (
              <button
                onClick={() => exportChatAsPDF(messages, activeSession?.title ?? "Safar chat", PERSONA_LABEL)}
                className="grid h-8 w-8 place-items-center rounded-lg text-faint transition-colors hover:bg-surface-2 hover:text-ink"
                title="Save as PDF"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => setSidebarOpen(true)}
              className="grid h-8 w-8 place-items-center rounded-lg text-faint transition-colors hover:bg-surface-2 hover:text-ink"
              title="Chat history"
            >
              <History className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                m.role === "user"
                  ? "whitespace-pre-wrap bg-saffron text-background"
                  : "bg-surface-2 text-ink"
              )}
            >
              {m.role === "user" ? m.content : m.content ? <MessageContent>{m.content}</MessageContent> : null}
              {!m.content && streaming && <Loader2 className="h-4 w-4 animate-spin" />}
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
            placeholder="Ask about visas, documents, money, tests…"
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
          Safar answers from a curated knowledge base and cites sources. Always double-check on official pages.
        </p>
      </div>

      <SessionSidebar
        persona="safar"
        activeSessionId={activeSession?.id ?? null}
        onSelect={handleLoadSession}
        onNew={handleNewSession}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </div>
  );
}
