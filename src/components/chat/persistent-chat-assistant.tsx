"use client";

import * as React from "react";
import { Download, History, Send } from "lucide-react";
import { MessageContent } from "@/components/message-content";
import { ChatThinkingIndicator } from "@/components/chat/chat-thinking-indicator";
import { SessionSidebar } from "@/components/chat/session-sidebar";
import {
  createSession,
  loadSession,
  saveMessage,
  type ChatSession,
  type SessionPersona,
} from "@/lib/chat-api";
import { exportChatAsPDF } from "@/lib/chat-pdf";
import { useAuth } from "@/lib/auth";

type Message = { role: "user" | "assistant"; content: string };

type PersistentChatAssistantProps = {
  persona: SessionPersona;
  label: string;
  greeting: string;
  suggestions: string[];
  placeholder: string;
};

export function PersistentChatAssistant({ persona, label, greeting, suggestions, placeholder }: PersistentChatAssistantProps) {
  const { user } = useAuth();
  const [messages, setMessages] = React.useState<Message[]>([{ role: "assistant", content: greeting }]);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [activeSession, setActiveSession] = React.useState<ChatSession | null>(null);
  const [historyError, setHistoryError] = React.useState<string | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  async function send(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || streaming) return;
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    let sessionId = activeSession?.id;
    try {
      if (!sessionId) {
        const session = await createSession(persona, text);
        setActiveSession(session);
        sessionId = session.id;
      }
      if (sessionId) await saveMessage(sessionId, "user", text);
    } catch (error) {
      console.warn("chat message could not be saved", error);
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ persona, messages: next }),
      });
      if (!response.ok || !response.body) throw new Error("Chat request failed");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setMessages([...next, { role: "assistant", content: answer }]);
      }
      if (sessionId && answer) {
        try {
          await saveMessage(sessionId, "assistant", answer);
        } catch (error) {
          console.warn("chat response could not be saved", error);
        }
      }
    } catch (error) {
      console.warn("chat response failed", error);
      setMessages([...next, { role: "assistant", content: "Sorry, I hit a snag. Try again in a moment." }]);
    } finally {
      setStreaming(false);
    }
  }

  async function handleLoadSession(id: string) {
    try {
      setHistoryError(null);
      const loaded = await loadSession(id);
      if (!loaded) {
        setHistoryError("That saved chat is no longer available.");
        return;
      }
      setActiveSession(loaded);
      setMessages(loaded.messages.length ? loaded.messages : [{ role: "assistant", content: greeting }]);
    } catch (error) {
      console.warn("chat session could not be loaded", error);
      setHistoryError("Saved chats could not be opened. Please try again.");
    }
  }

  function handleNewSession() {
    setHistoryError(null);
    setActiveSession(null);
    setMessages([{ role: "assistant", content: greeting }]);
  }

  return (
    <section className="chat-workspace">
      <header className="chat-workspace-header">
        <h1 className="chat-workspace-title">{label}</h1>
        {user && <div className="flex items-center gap-1">
          {messages.length > 1 && <button type="button" onClick={() => exportChatAsPDF(messages, activeSession?.title ?? `${label} chat`, label)} className="chat-header-button" title="Save as PDF" aria-label="Save chat as PDF"><Download className="h-4 w-4" /></button>}
          <button type="button" onClick={() => setSidebarOpen(true)} className="chat-header-button" title="Chat history" aria-label="Open chat history"><History className="h-4 w-4" /></button>
        </div>}
      </header>
      {historyError && <p className="chat-history-error" role="alert">{historyError}</p>}
      <div className="chat-transcript"><div className="chat-transcript-inner">
        {messages.map((message, index) => <div key={index} className={`chat-message-row chat-message-row-${message.role}`}><div className={`chat-message chat-message-${message.role}`}>
          {message.role === "user" ? message.content : message.content ? <MessageContent>{message.content}</MessageContent> : null}
          {!message.content && streaming && <ChatThinkingIndicator />}
        </div></div>)}
        {messages.length <= 1 && <div className="chat-suggestions">{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => send(suggestion)} className="chat-suggestion">{suggestion}</button>)}</div>}
        <div ref={bottomRef} />
      </div></div>
      <form className="chat-composer-wrap" onSubmit={(event) => { event.preventDefault(); void send(); }}><div className="chat-composer">
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder={placeholder} aria-label="Chat message" className="chat-composer-input" />
        <button type="submit" disabled={streaming || !input.trim()} className="chat-send-button" aria-label="Send message"><Send className="h-4 w-4" /></button>
      </div></form>
      <SessionSidebar persona={persona} activeSessionId={activeSession?.id ?? null} onSelect={handleLoadSession} onNew={handleNewSession} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </section>
  );
}
