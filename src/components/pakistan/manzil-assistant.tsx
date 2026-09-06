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
  "Salam! I'm Manzil (منزل) — your guide to studying inside Pakistan. Ask me about universities, admission steps, entry tests, merit, fees, or HEC and provincial scholarships.";

const SUGGESTIONS = [
  "Which universities offer merit scholarships?",
  "How do I apply to NUST?",
  "What is the HEC need-based scholarship process?",
  "What's on the MDCAT paper?",
  "How much does LUMS cost per year?",
];

const PERSONA_LABEL = "Manzil A.I · منزل";

export function ManzilAssistant() {
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

  // Load sessions list on mount to check if user has past chats
  const [hasSessions, setHasSessions] = React.useState(false);
  React.useEffect(() => {
    if (!user) return;
    listSessions("manzil").then((s) => setHasSessions(s.length > 0));
  }, [user]);

  async function send(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || streaming) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setStreaming(true);
    setMessages([...next, { role: "assistant", content: "" }]);

    // Create session on first message if none active
    let sessionId = activeSession?.id;
    if (!sessionId) {
      try {
        const session = await createSession("manzil", text);
        setActiveSession(session);
        sessionId = session.id;
        setHasSessions(true);
        // Save user message
        await saveMessage(sessionId, "user", text);
      } catch {
        // If session creation fails, still stream the response
      }
    }

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
      // Save assistant response
      if (sessionId && acc) {
        await saveMessage(sessionId, "assistant", acc);
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
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-saffron/10">
          <Sparkles className="h-4 w-4 text-saffron" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-ink">{PERSONA_LABEL}</p>
          <p className="text-[11px] text-muted">
            Study-in-Pakistan assistant · institutes, merit and scholarships
          </p>
        </div>
        {user && (
          <div className="flex items-center gap-1">
            {messages.length > 1 && (
              <button
                onClick={() => exportChatAsPDF(messages, activeSession?.title ?? "Manzil chat", PERSONA_LABEL)}
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

      {/* Messages */}
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

      {/* Input */}
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

      {/* Session Sidebar */}
      <SessionSidebar
        persona="manzil"
        activeSessionId={activeSession?.id ?? null}
        onSelect={handleLoadSession}
        onNew={handleNewSession}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </div>
  );
}
