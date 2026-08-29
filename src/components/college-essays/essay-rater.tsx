"use client";

import * as React from "react";
import { ClipboardPaste, Loader2, Send, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { analyzeDraft } from "@/lib/college-essays";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "aftermediate:essays:rater-chat";

const GREETING =
  "Salam! Main Qalam (قلم) hoon — your college essay rating coach. Paste your draft on the left and send it here, or click \"Load my draft\" to pull in the draft from the writing guide. I will rate it with strengths, weaknesses, and one concrete next step.";

const SUGGESTIONS = [
  "Rate my draft",
  "Which sentences are weakest?",
  "How do I make my opening stronger?",
  "Is my essay too cliché?",
];

function loadHistory(): Msg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function EssayRater() {
  const [messages, setMessages] = React.useState<Msg[]>(() => {
    const h = loadHistory();
    return h.length > 0 ? h : [{ role: "assistant", content: GREETING }];
  });
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [draftText, setDraftText] = React.useState("");
  const [loadedNote, setLoadedNote] = React.useState<string | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const analysis = React.useMemo(() => analyzeDraft(draftText), [draftText]);

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

  function loadDraft() {
    try {
      const raw = window.localStorage.getItem("aftermediate:essays:draft");
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
        <div className="flex h-[560px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    m.role === "user" ? "bg-violet text-background" : "bg-surface-2 text-ink"
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
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3.5 py-2 text-sm text-muted transition-colors hover:border-violet/40 hover:text-ink"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-violet" />
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
                placeholder="Paste your essay or ask about a section…"
                aria-label="Chat message"
                className="h-11 flex-1 rounded-lg border border-line bg-surface-2 px-3.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-violet/50"
              />
              <button
                onClick={() => send()}
                disabled={streaming || !input.trim()}
                aria-label="Send message"
                className="grid h-11 w-11 place-items-center rounded-lg bg-violet text-background disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
