"use client";

import * as React from "react";
import { Check, Dices, ListChecks, PenLine, RefreshCw, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/lib/skills";
import { ESSAY_DRAFT_BASE, usePersonalString } from "@/lib/chat-storage";
import { analyzeDraft } from "@/lib/college-essays";
import data from "@/data/college-essays.json";

type Source = { label: string; url: string };

const guide = data as unknown as {
  guide: {
    steps: { id: "brainstorm" | "outline" | "draft" | "revise"; title: string; summary: string; tools: string[]; sources: Source[] }[];
    starters: { id: string; part: "hook" | "transition" | "reflection" | "closing"; text: string; sources: Source[] }[];
    templates: { id: "narrative-arc" | "challenge-growth" | "topic-deep-dive"; name: string; bestFor: string; skeleton: string[]; sources: Source[] }[];
    ideaPrompts: { id: string; text: string; sources: Source[] }[];
  };
};

const PART_LABELS: Record<string, string> = {
  hook: "Hooks",
  transition: "Transitions",
  reflection: "Reflections",
  closing: "Closings",
};

interface GuideStepState {
  current: number;
  done: string[];
}

interface OutlineState {
  templateId: string | null;
  slots: Record<string, string>;
}

function Sources({ sources }: { sources: Source[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-faint">
      {sources.map((s) => (
        <a
          key={s.url}
          href={s.url}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-dotted underline-offset-2 hover:text-violet"
        >
          {s.label} ↗
        </a>
      ))}
    </div>
  );
}

export function WritingGuide() {
  const [stepState, setStepState] = useLocalStorage<GuideStepState>("aftermediate:essays:guide-step", { current: 0, done: [] });
  const [inventory, setInventory] = useLocalStorage<string[]>("aftermediate:essays:inventory", []);
  const [outlineState, setOutlineState] = useLocalStorage<OutlineState>("aftermediate:essays:outline", { templateId: null, slots: {} });
  const [draft, setDraft] = usePersonalString(ESSAY_DRAFT_BASE, "");

  const [newItem, setNewItem] = React.useState("");
  const [promptId, setPromptId] = React.useState<string | null>(null);
  const [lastCopied, setLastCopied] = React.useState<string | null>(null);
  const toastRef = React.useRef<number | undefined>(undefined);

  const steps = guide.guide.steps;
  const rawCurrent = Number.isFinite(stepState.current) ? Math.floor(stepState.current) : 0;
  const safeCurrent = Math.min(Math.max(0, rawCurrent), steps.length - 1);
  const currentStep = steps[safeCurrent];
  const analysis = React.useMemo(() => analyzeDraft(draft), [draft]);
  const currentPrompt = guide.guide.ideaPrompts.find((p) => p.id === promptId) ?? null;

  function isUnlocked(index: number): boolean {
    if (index === 0) return true;
    return stepState.done.includes(steps[index - 1].id);
  }

  function completeStep(id: string) {
    if (stepState.done.includes(id)) return;
    const done = [...stepState.done, id];
    setStepState({ current: Math.min(stepState.current + 1, steps.length - 1), done });
  }

  function addItem() {
    const value = newItem.trim();
    if (!value || inventory.includes(value)) return;
    setInventory([...inventory, value]);
    setNewItem("");
  }

  function spinPrompt() {
    const pool = guide.guide.ideaPrompts.filter((p) => p.id !== promptId);
    if (pool.length === 0) return;
    setPromptId(pool[Math.floor(Math.random() * pool.length)].id);
  }

  function appendStarter(text: string) {
    window.clearTimeout(toastRef.current);
    setDraft((d) => (d ? `${d}\n\n${text}` : text));
    setLastCopied(text.slice(0, 60));
    toastRef.current = window.setTimeout(() => setLastCopied(null), 2000);
  }

  React.useEffect(() => () => window.clearTimeout(toastRef.current), []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {steps.map((s, i) => {
          const done = stepState.done.includes(s.id);
          const unlocked = isUnlocked(i);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => unlocked && setStepState((p) => ({ ...p, current: i }))}
              aria-disabled={!unlocked}
              aria-current={i === stepState.current ? "step" : undefined}
              tabIndex={!unlocked ? -1 : 0}
              className={cn(
                "rounded-xl border-2 px-3 py-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-violet/50",
                i === stepState.current ? "border-violet bg-violet/10" : "border-line bg-surface",
                !unlocked && "cursor-not-allowed opacity-40"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("font-mono text-[10px] font-bold uppercase tracking-widest", i === stepState.current ? "text-violet" : "text-faint")}>
                  Step {i + 1}
                </span>
                {done && <Check className="h-4 w-4 text-emerald" />}
              </div>
              <p className="mt-1 text-sm font-bold text-ink">{s.title}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted">{s.summary}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border-2 border-ink bg-surface p-5 pixel-shadow">
        {currentStep.id === "brainstorm" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                <Dices className="h-5 w-5 text-violet" /> Idea generator
              </h3>
              <button type="button" onClick={spinPrompt} className="inline-flex items-center gap-1.5 rounded-lg bg-violet px-3.5 py-2 text-sm font-bold text-background">
                <RefreshCw className="h-3.5 w-3.5" /> Spin a prompt
              </button>
            </div>
            {currentPrompt ? (
              <div className="mt-4 rounded-xl border border-line bg-surface-2 p-4">
                <p className="text-sm font-semibold text-ink">&ldquo;{currentPrompt.text}&rdquo;</p>
                <Sources sources={currentPrompt.sources} />
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">Press the button to get a brainstorm question, then capture your answer in the inventory below.</p>
            )}
            <h4 className="mt-6 flex items-center gap-2 text-sm font-bold text-ink">
              <ListChecks className="h-4 w-4 text-violet" /> Experience inventory
            </h4>
            <p className="mt-1 text-xs text-muted">List 3-5 concrete moments: a project, a failure, a habit, a place. These become your scenes.</p>
            <div className="mt-3 flex gap-2">
              <input
                aria-label="Experience inventory item"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
                placeholder="e.g. rebuilt a robot for the school science exhibition"
                className="h-11 flex-1 rounded-lg border border-line bg-surface-2 px-3.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-violet/50"
              />
              <button type="button" onClick={addItem} className="rounded-lg bg-violet px-4 text-sm font-bold text-background">
                Add
              </button>
            </div>
            {inventory.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {inventory.map((item) => (
                  <span key={item} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-sm text-ink">
                    {item}
                    <button type="button" onClick={() => setInventory(inventory.filter((x) => x !== item))} className="text-faint hover:text-danger">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        {currentStep.id === "outline" && (
          <>
            <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
              <Wand2 className="h-5 w-5 text-violet" /> Pick a structure template
            </h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {guide.guide.templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setOutlineState({ templateId: t.id, slots: {} })}
                  className={cn(
                    "rounded-xl border-2 p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-violet/50",
                    outlineState.templateId === t.id ? "border-violet bg-violet/10" : "border-line bg-surface-2 hover:border-violet/40"
                  )}
                >
                  <p className="text-sm font-bold text-ink">{t.name}</p>
                  <p className="mt-1 text-xs text-muted">{t.bestFor}</p>
                  <ol className="mt-3 space-y-1 text-xs text-muted">
                    {t.skeleton.map((slot, j) => (
                      <li key={j} className="flex gap-1.5">
                        <span className="font-mono text-violet">{j + 1}.</span> {slot}
                      </li>
                    ))}
                  </ol>
                  <Sources sources={t.sources} />
                </button>
              ))}
            </div>
            {outlineState.templateId && (
              <div className="mt-5 space-y-3">
                {(() => {
                  const t = guide.guide.templates.find((x) => x.id === outlineState.templateId)!;
                  return t.skeleton.map((slot, j) => {
                    const key = `${t.id}-${j}`;
                    return (
                      <div key={key}>
                        <label className="font-mono text-[11px] font-bold uppercase tracking-widest text-violet">{slot}</label>
                        <textarea
                          value={outlineState.slots[key] ?? ""}
                          onChange={(e) => setOutlineState((p) => ({ ...p, slots: { ...p.slots, [key]: e.target.value } }))}
                          rows={2}
                          placeholder="One line: what will this paragraph show?"
                          className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-violet/50"
                        />
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </>
        )}

        {currentStep.id === "draft" && (
          <>
            <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
              <PenLine className="h-5 w-5 text-violet" /> Write your draft
            </h3>
            <p className="mt-1 text-xs text-muted">Tap a starter to drop it into your draft, then write in your own voice. Aim for 400-650 words.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {(["hook", "transition", "reflection", "closing"] as const).map((part) => (
                <div key={part} className="rounded-xl border border-line bg-surface-2 p-4">
                  <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-violet">{PART_LABELS[part]}</p>
                  <div className="mt-2 space-y-2">
                    {guide.guide.starters
                      .filter((s) => s.part === part)
                      .map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => appendStarter(s.text)}
                          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-left text-sm text-muted transition-colors hover:border-violet/40 hover:text-ink focus:outline-none focus:ring-2 focus:ring-violet/50"
                        >
                          &ldquo;{s.text}&rdquo;
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
            {lastCopied && (
              <p className="mt-3 rounded-lg bg-emerald/10 px-3 py-2 text-xs font-semibold text-emerald">Added to your draft — &ldquo;{lastCopied}…&rdquo;</p>
            )}
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-ink">Your draft</label>
                <span className="font-mono text-xs text-muted">{analysis.wordCount} words</span>
              </div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={12}
                placeholder="Paste your draft here, or tap starters to begin…"
                className="mt-2 w-full rounded-xl border-2 border-line bg-surface-2 p-4 font-mono text-sm leading-relaxed text-ink placeholder:text-faint focus:border-violet focus:outline-none"
              />
            </div>
          </>
        )}

        {currentStep.id === "revise" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-lg font-bold text-ink">Live revision check</h3>
              <div className="flex gap-2 font-mono text-xs text-muted">
                <span>{analysis.wordCount} words</span>
                <span>·</span>
                <span>{analysis.sentenceCount} sentences</span>
                <span>·</span>
                <span>~{analysis.avgSentenceLength} words/sentence</span>
              </div>
            </div>
            {draft.trim() ? (
              <div className="mt-4 space-y-3">
                {analysis.suggestions.map((s, i) => (
                  <div key={i} className="flex gap-2.5 rounded-xl border border-line bg-surface-2 p-3.5 text-sm text-ink">
                    <Wand2 className="mt-0.5 h-4 w-4 shrink-0 text-violet" />
                    <span>{s}</span>
                  </div>
                ))}
                {analysis.longSentences.length > 0 && (
                  <div className="rounded-xl border border-line bg-surface-2 p-3.5">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted">Long sentences</p>
                    {analysis.longSentences.map((s, i) => (
                      <p key={i} className="mt-2 text-sm text-muted">
                        &ldquo;{s.text.slice(0, 140)}…&rdquo; ({s.words} words)
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">Nothing to check yet — write or paste a draft in Step 3 first.</p>
            )}
          </>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <Sources sources={currentStep.sources} />
          {stepState.done.includes(currentStep.id) ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald/10 px-3.5 py-2 text-sm font-bold text-emerald">
              <Check className="h-4 w-4" /> Step complete
            </span>
          ) : (
            <button type="button" onClick={() => completeStep(currentStep.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-violet px-4 py-2 text-sm font-bold text-background">
              Mark step complete <Check className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
