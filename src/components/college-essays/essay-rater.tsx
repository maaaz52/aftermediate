"use client";

import * as React from "react";
import { ClipboardPaste, Send, Wand2 } from "lucide-react";
import { MessageContent } from "@/components/message-content";
import { ChatThinkingIndicator } from "@/components/chat/chat-thinking-indicator";
import { analyzeDraft } from "@/lib/college-essays";
import {
  ESSAY_DRAFT_BASE,
  RATER_CHAT_BASE,
  useChatHistory,
  usePersonalKey,
  type ChatMessage,
} from "@/lib/chat-storage";

type Msg = ChatMessage;

const GREETING =
  "Salam! Main Qalam (قلم) hoon — your college essay rating coach. Paste your draft on the left and send it here, or click \"Load my draft\" to pull in the draft from the writing guide. I will rate it with strengths, weaknesses, and one concrete next step.";

const SUGGESTIONS = [
  "Rate my draft",
  "Which sentences are weakest?",
  "How do I make my opening stronger?",
  "Is my essay too cliché?",
];

export function EssayRater() {
  const [messages, setMessages] = useChatHistory(RATER_CHAT_BASE, GREETING);
  const draftKey = usePersonalKey(ESSAY_DRAFT_BASE);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [draftText, setDraftText] = React.useState("");
  const [loadedNote, setLoadedNote] = React.useState<string | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const analysis = React.useMemo(() => analyzeDraft(draftText), [draftText]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  function loadDraft() {
    try {
      const raw = draftKey ? window.localStorage.getItem(draftKey) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        setDraftText(typeof parsed === "string" ? parsed : "");
        setLoadedNote("Loaded the draft from your writing guide.");
      } else {
        setLoadedNote("No draft saved in the writing guide yet — paste one here instead.");
      }
    } catch {
      setLoadedNote("Could not read the saved draft.");
    }
    window.setTimeout(() => setLoadedNote(null), 3000);
  }

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
        body: JSON.stringify({ persona: "qalam", messages: next.map((m) => ({ role: m.role, content: m.content })) }),
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
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <div className="rounded-2xl border-2 border-ink bg-surface p-4 pixel-shadow">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-ink">Your draft</h3>
            <button
              type="button"
              onClick={loadDraft}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-bold text-violet"
            >
              <ClipboardPaste className="h-3.5 w-3.5" /> Load my draft
            </button>
          </div>
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            rows={12}
            placeholder="Paste your essay draft here…"
            className="mt-3 w-full rounded-xl border border-line bg-surface-2 p-3.5 font-mono text-sm leading-relaxed text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-violet/50"
          />
          {loadedNote && <p className="mt-2 text-xs font-semibold text-emerald">{loadedNote}</p>}
          <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-xs text-muted">
            <span>{analysis.wordCount} words</span>
            <span>{analysis.sentenceCount} sentences</span>
            <span>~{analysis.avgSentenceLength} w/s</span>
          </div>
          {draftText.trim() && (
            <div className="mt-3 space-y-2">
              {analysis.suggestions.slice(0, 3).map((s, i) => (
                <p key={i} className="flex gap-2 rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted">
                  <Wand2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet" /> {s}
                </p>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              if (draftText.trim()) send(draftText);
            }}
            disabled={!draftText.trim() || streaming}
            className="mt-3 w-full rounded-lg bg-violet px-4 py-2.5 text-sm font-bold text-background disabled:opacity-50"
          >
            Send draft to Qalam
          </button>
        </div>
      </div>

      <div className="lg:col-span-3">
        <div className="chat-workspace min-h-[560px] border-l border-[#ececec]">
          <header className="chat-workspace-header"><h2 className="chat-workspace-title">Qalam A.I</h2></header>
          <div className="chat-transcript"><div className="chat-transcript-inner !px-4 !py-5">
            {messages.map((m, i) => (
              <div key={i} className={`chat-message-row chat-message-row-${m.role}`}>
                <div className={`chat-message chat-message-${m.role}`}>
                  {m.role === "user" ? m.content : m.content ? <MessageContent>{m.content}</MessageContent> : null}
                  {!m.content && streaming && <ChatThinkingIndicator className="text-violet" />}
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

          <form className="chat-composer-wrap !px-4 !pb-4" onSubmit={(event) => { event.preventDefault(); void send(); }}>
            <div className="chat-composer">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste your essay or ask about a section…"
                aria-label="Chat message"
                className="chat-composer-input"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                aria-label="Send message"
                className="chat-send-button"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
