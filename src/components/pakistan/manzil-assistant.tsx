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

/**
 * Design preview only. The chat shell, streaming feel and empty states are
 * final; the answers below are placeholders so the page can be reviewed
 * before a `manzil` persona and its knowledge base exist server-side.
 * Swapping in the real endpoint means replacing `mockReply` with the same
 * `fetch("/api/chat")` reader Safar uses — nothing else here changes.
 */
const MOCK_REPLIES: { match: RegExp; reply: string }[] = [
  {
    match: /scholarship|funding|financial aid|hec|need.?based|fee concession/i,
    reply:
      "Studying inside Pakistan has three main funding routes:\n\n• HEC need-based scholarships — applied for through your university's financial aid office once you have an admission offer. Covers tuition plus a living stipend at participating universities.\n• University merit scholarships — automatic at most public sector universities above a set aggregate; private universities usually run their own scaled fee concessions.\n• Provincial programmes — Punjab, Sindh, KP and Balochistan each run separate endowment funds with their own eligibility and deadlines.\n\nSee the Scholarships page for the full list with official links and current deadlines.",
  },
  {
    match: /nust|net\b|fast|giki|comsats|admission|apply|application/i,
    reply:
      "Admission to most Pakistani universities follows the same shape:\n\n1. Register online on the university's own admission portal and pay the processing fee.\n2. Sit the required entry test — NET for NUST, ECAT for UET, MDCAT for medical, or the university's own paper.\n3. Wait for the merit list, which weighs your FSc marks and test score together.\n4. Confirm your seat by paying the first semester dues before the deadline, or it moves to the next candidate.\n\nTell me which university you have in mind and I can walk through its specific steps, fees and faculties.",
  },
  {
    match: /merit|aggregate|percentage|marks|cut.?off|mdcat|ecat/i,
    reply:
      "Merit is an aggregate, not just your FSc percentage. A typical weighting looks like:\n\n• Entry test — 50%\n• FSc / HSSC — 40%\n• Matric — 10%\n\nThe exact split changes by university and by programme, and the closing merit moves every year with the applicant pool. The Merit page lets you enter your own marks and see where you would have landed against previous years' closing merit.",
  },
  {
    match: /fee|cost|expensive|cheap|afford|budget/i,
    reply:
      "Fees split sharply between sectors:\n\n• Public sector universities — the lowest tuition, with the trade-off of much tighter merit.\n• Semi-government and chartered institutes — mid-range, often with strong industry links.\n• Private universities — the highest tuition, but usually more seats and scaled scholarships.\n\nThe Universities page lists the real, current fee ranges per programme with official links, so you can filter by what you can actually carry.",
  },
];

function mockReply(question: string): string {
  const hit = MOCK_REPLIES.find((r) => r.match.test(question));
  if (hit) return hit.reply;
  return "This is a design preview, so I only have a few sample answers wired up for now. Try one of the suggested questions about universities, admissions, merit, fees or scholarships to see how a real answer will look.";
}

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

    // Typed out in chunks so the layout is reviewed under the same reflow a
    // streamed answer causes, rather than appearing all at once.
    const full = mockReply(text);
    for (let i = 0; i < full.length; i += 3) {
      await new Promise((r) => setTimeout(r, 12));
      setMessages([...next, { role: "assistant", content: full.slice(0, i + 3) }]);
    }
    setMessages([...next, { role: "assistant", content: full }]);
    setStreaming(false);
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
          Design preview — answers are samples, not live yet. Always double-check on official pages.
        </p>
      </div>
    </div>
  );
}
