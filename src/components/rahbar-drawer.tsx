"use client";

import * as React from "react";
import { X, Send, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageContent } from "@/components/message-content";
import { useChatHistory, type ChatMessage } from "@/lib/chat-storage";

type Msg = ChatMessage;

const GREETING =
  "Salam! I'm Rahbar 🧭 — your guide to aftermediate. Ask me how to use any page, what a feature does, or how to fix something on the site. For study help, try Ustaad.";

const STORAGE_KEY = "aftermediate:rahbar-chat";

const SUGGESTIONS = [
  "What can I do on this site?",
  "How do I use the Merit page?",
  "What is Ustaad for?",
  "How do I edit my profile?",
];

export function RahbarDrawer() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = useChatHistory(STORAGE_KEY, GREETING);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const open = () => setOpen(true);
    const close = () => setOpen(false);
    document.addEventListener("open-rahbar", open);
    document.addEventListener("close-rahbar", close);
    return () => {
      document.removeEventListener("open-rahbar", open);
      document.removeEventListener("close-rahbar", close);
    };
  }, []);

  React.useEffect(() => {
    document.dispatchEvent(new CustomEvent(open ? "rahbar-open" : "rahbar-closed"));
  }, [open]);

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
        body: JSON.stringify({ persona: "rahbar", messages: next.map((m) => ({ role: m.role, content: m.content })) }),
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
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-ink/20 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open Rahbar AI"
          className="group fixed bottom-5 right-5 z-40 flex items-center gap-2.5 rounded-full border border-saffron/30 bg-surface py-3 pl-4 pr-5 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-saffron/15">
            <Sparkles className="h-5 w-5 text-saffron transition-transform group-hover:rotate-12" />
          </span>
          <span className="text-left">
            <span className="block text-sm font-bold text-ink">Rahbar A.I</span>
            <span className="block text-[11px] text-muted">Ask about the site</span>
          </span>
        </button>
      )}

      <aside
        data-tour="rahbar-drawer"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[400px] max-w-[calc(100vw-1rem)] flex-col border-l border-line bg-surface shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-saffron/10">
              <Sparkles className="h-4 w-4 text-saffron" />
            </div>
            <div>
              <p className="text-sm font-bold text-ink">Rahbar A.I</p>
              <p className="text-[11px] text-muted">Site guide · online</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-2.5 text-muted hover:bg-surface-2 hover:text-ink min-h-11 min-w-11 flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
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
                  onClick={() => send(s)}
                  className="rounded-full border border-line bg-surface-2 px-3 py-2.5 text-xs text-muted transition-colors hover:border-saffron/40 hover:text-ink sm:py-1.5"
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
              placeholder="Ask about the site…"
              className="h-11 flex-1 rounded-lg border border-line bg-surface-2 px-3.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-saffron/50"
            />
            <button
              onClick={() => send()}
              disabled={streaming || !input.trim()}
              className="grid h-11 w-11 place-items-center rounded-lg bg-saffron text-background disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}