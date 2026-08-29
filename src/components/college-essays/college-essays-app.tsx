"use client";

import * as React from "react";
import { Eye, Feather, MessageSquareText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { EssayExplainer } from "./essay-explainer";
import { WritingGuide } from "./writing-guide";
import { EssayRater } from "./essay-rater";
import { ApproachBuilder } from "./approach-builder";

const TABS = [
  { id: "what", label: "What Is It", icon: Eye },
  { id: "how-to", label: "How To Write It", icon: Feather },
  { id: "rating", label: "AI Rating", icon: MessageSquareText },
  { id: "builder", label: "Approach Builder", icon: Sparkles },
] as const;

type TabId = (typeof TABS)[number]["id"];

const COMPLETION_KEYS: Record<TabId, string> = {
  what: "aftermediate:essays:quiz",
  "how-to": "aftermediate:essays:guide-step",
  rating: "aftermediate:essays:rater-chat",
  builder: "aftermediate:essays:strategy",
};

function readKey(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function computeDone(): Record<TabId, boolean> {
  if (typeof window === "undefined") return { what: false, "how-to": false, rating: false, builder: false };
  const next = {} as Record<TabId, boolean>;
  for (const t of TABS) next[t.id] = isDone(t.id, readKey(COMPLETION_KEYS[t.id]));
  return next;
}

function isDone(id: TabId, value: unknown): boolean {
  if (value == null) return false;
  if (id === "what") {
    const quiz = value as Record<string, number>;
    const dd = readKey("aftermediate:essays:dragdrop") as Record<string, string> | null;
    return Object.keys(quiz).length >= 5 && dd != null && Object.keys(dd).length >= 6;
  }
  if (id === "how-to") {
    const g = value as { done: string[] };
    return Array.isArray(g.done) && g.done.length >= 4;
  }
  if (id === "rating") {
    return Array.isArray(value) && value.length > 1;
  }
  return true;
}

export function CollegeEssaysApp() {
  const [tab, setTab] = React.useState<TabId>(() => {
    if (typeof window === "undefined") return "what";
    const hash = window.location.hash.replace("#", "");
    return (TABS.some((t) => t.id === hash) ? hash : "what") as TabId;
  });
  const done = computeDone();

  React.useEffect(() => {
    window.history.replaceState(null, "", `#${tab}`);
  }, [tab]);

  React.useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace("#", "");
      if (TABS.some((t) => t.id === h)) setTab(h as TabId);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <div className="mt-6">
      <div className="sticky top-16 z-30 -mx-4 border-b border-line bg-background/95 px-4 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex gap-1 overflow-x-auto py-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors",
                tab === t.id ? "bg-violet/10 text-violet" : "text-muted hover:bg-surface-2 hover:text-ink"
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              {done[t.id] && (
                <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald text-[10px] font-bold text-background">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6">
        {tab === "what" && <EssayExplainer />}
        {tab === "how-to" && <WritingGuide />}
        {tab === "rating" && <EssayRater />}
        {tab === "builder" && <ApproachBuilder />}
      </div>
    </div>
  );
}
