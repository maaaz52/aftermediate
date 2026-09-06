"use client";

import * as React from "react";
import { BookOpen, Download, History, Loader2, Send } from "lucide-react";
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
  "Salam! Main Ustaad hoon — your FSc study assistant. Ask me to explain a concept, break down an MDCAT/NET/ECAT topic, or make you a revision plan. Let's get you exam-ready.";

const SUGGESTIONS = [
  "Explain biological magnification like I'm 15",
  "Make me a 2-week MDCAT revision plan",
  "How does NUST NET aggregate work?",
  "Practice a physics torque question",
];

const PERSONA_LABEL = "Ustaad A.I · استاد";

export default function StudyPage() {
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
    listSessions("study").then((s) => setHasSessions(s.length > 0));
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
        const session = await createSession("study", text);
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
          persona: "study",
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
      setMessages([...next, { role: "assistant", content: "Sorry, I hit a snag. Try again in a moment." }]);
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
    <div
      data-tour="ustaad-ai"
      className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col px-4 py-6 sm:px-6"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-info/10 text-info">
          <BookOpen className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            {PERSONA_LABEL}
          </h1>
          <p className="text-sm text-muted">Your FSc study tutor — concepts, past papers, revision plans.</p>
        </div>
        {user && (
          <div className="flex items-center gap-1">
            {messages.length > 1 && (
              <button
                onClick={() => exportChatAsPDF(messages, activeSession?.title ?? "Ustaad chat", PERSONA_LABEL)}
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
                {m.role === "user" ? m.content : m.content ? <MessageContent>{m.content}</MessageContent> : null}
                {!m.content && streaming && <Loader2 className="h-4 w-4 animate-spin" />}
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

      <SessionSidebar
        persona="study"
        activeSessionId={activeSession?.id ?? null}
        onSelect={handleLoadSession}
        onNew={handleNewSession}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </div>
  );
}
