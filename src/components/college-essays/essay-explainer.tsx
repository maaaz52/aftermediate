"use client";

import * as React from "react";
import { Check, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/lib/skills";
import data from "@/data/college-essays.json";

const explainer = data as unknown as {
  explainer: {
    sections: { id: string; title: string; body: string; sources: { label: string; url: string }[] }[];
    criteria: { id: string; title: string; weight: "high" | "medium"; detail: string; sources: { label: string; url: string }[] }[];
    beforeAfter: { weak: { title: string; paragraphs: string[] }; strong: { title: string; paragraphs: string[] }; notes: { label: string; detail: string }[] };
    myths: { id: string; myth: string; fact: string; sources: { label: string; url: string }[] }[];
  };
  quiz: { id: string; question: string; options: { label: string; correct: boolean }[]; explanation: string; source: { label: string; url: string } }[];
  dragDrop: { zones: { id: string; label: string }[]; items: { id: string; text: string; zone: string; explanation: string }[] };
  inspiration: { id: string; title: string; program: string; backstory: string; excerpt: string; whyItWorks: string; sourceLabel: string; sourceUrl: string }[];
};

function Sources({ sources }: { sources: { label: string; url: string }[] }) {
  return (
    <p className="mt-3 font-mono text-[11px] text-faint">
      Source:{" "}
      {sources.map((s, i) => (
        <React.Fragment key={s.url}>
          {i > 0 && " · "}
          <a href={s.url} target="_blank" rel="noreferrer" className="text-info underline decoration-dotted hover:text-ink">
            {s.label}
          </a>
        </React.Fragment>
      ))}
    </p>
  );
}

function Reveal({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn("transition-all duration-700 ease-out", visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0")}>
      {children}
    </div>
  );
}

function Meter({ value, total = 5 }: { value: number; total?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={cn("h-2.5 w-2.5", i < value ? "bg-violet" : "bg-line")} />
      ))}
    </div>
  );
}

export function EssayExplainer() {
  const [showStrong, setShowStrong] = React.useState(false);
  const [openMyth, setOpenMyth] = React.useState<string | null>(null);
  const [answers, setAnswers] = useLocalStorage<Record<string, number>>("aftermediate:essays:quiz", {});
  const [placed, setPlaced] = useLocalStorage<Record<string, string>>("aftermediate:essays:dragdrop", {});
  const [selectedItem, setSelectedItem] = React.useState<string | null>(null);

  const score = explainer.quiz.filter((q) => answers[q.id] != null && q.options[answers[q.id]]?.correct).length;
  const answered = Object.keys(answers).length;
  const placedCount = Object.keys(placed).length;
  const correctPlacements = explainer.dragDrop.items.filter((i) => placed[i.id] === i.zone).length;

  function dropItem(itemId: string, zoneId: string) {
    setPlaced((p) => ({ ...p, [itemId]: zoneId }));
    setSelectedItem(null);
  }

  return (
    <div className="space-y-14">
      {explainer.explainer.sections.map((s) => (
        <Reveal key={s.id}>
          <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">{s.title}</h2>
          <p className="mt-2 max-w-3xl leading-relaxed text-muted">{s.body}</p>
          <Sources sources={s.sources} />
        </Reveal>
      ))}

      <Reveal>
        <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">What admissions officers look for</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {explainer.explainer.criteria.map((c) => (
            <div key={c.id} className="rounded-2xl border-2 border-ink bg-surface p-5 pixel-shadow">
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs uppercase tracking-widest text-violet">{c.title}</p>
                <Meter value={c.weight === "high" ? 5 : 3} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.detail}</p>
              <Sources sources={c.sources} />
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">Before &amp; after</h2>
        <div className="mt-4 flex gap-2">
          {(["weak", "strong"] as const).map((side) => (
            <button
              key={side}
              type="button"
              onClick={() => setShowStrong(side === "strong")}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                showStrong === (side === "strong") ? "bg-violet text-background" : "bg-surface-2 text-muted hover:text-ink"
              )}
            >
              {side === "weak" ? "Before (weak)" : "After (strong)"}
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border border-line bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-faint">{showStrong ? "After" : "Before"}</p>
          {explainer.explainer.beforeAfter[showStrong ? "strong" : "weak"].paragraphs.map((p, i) => (
            <p key={i} className="mt-2 leading-relaxed text-ink">{p}</p>
          ))}
          {showStrong &&
            explainer.explainer.beforeAfter.notes.map((n) => (
              <div key={n.label} className="mt-3 rounded-lg border-l-2 border-emerald bg-emerald/5 px-3 py-2">
                <p className="font-mono text-xs font-bold text-emerald">{n.label}</p>
                <p className="text-sm text-muted">{n.detail}</p>
              </div>
            ))}
        </div>
      </Reveal>

      <Reveal>
        <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">Common myths</h2>
        <div className="mt-4 space-y-2">
          {explainer.explainer.myths.map((m) => (
            <div key={m.id} className="rounded-xl border border-line bg-surface">
              <button
                type="button"
                onClick={() => setOpenMyth(openMyth === m.id ? null : m.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-ink"
              >
                {m.myth}
                <span className={cn("text-violet transition-transform", openMyth === m.id && "rotate-45")}>+</span>
              </button>
              {openMyth === m.id && (
                <div className="border-t border-line px-4 py-3">
                  <p className="text-sm leading-relaxed text-muted">{m.fact}</p>
                  <Sources sources={m.sources} />
                </div>
              )}
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">Inspiration — real essays that worked</h2>
        <p className="mt-1 text-sm text-muted">
          Real personal statements published by universities and programs. Read the backstory, then open the full essay.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {explainer.inspiration.map((e) => (
            <div key={e.id} className="flex flex-col rounded-2xl border-2 border-ink bg-surface p-5 pixel-shadow">
              <p className="font-mono text-[11px] uppercase tracking-widest text-amber">{e.program}</p>
              <h3 className="mt-1 font-display text-base font-bold text-ink">{e.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                <span className="font-semibold text-ink">The backstory: </span>
                {e.backstory}
              </p>
              <p className="mt-3 border-l-2 border-line pl-3 text-sm italic leading-relaxed text-ink">&ldquo;{e.excerpt}&rdquo;</p>
              <p className="mt-3 text-sm leading-relaxed text-emerald">
                <span className="font-mono text-xs font-bold uppercase tracking-widest">Why it works: </span>
                {e.whyItWorks}
              </p>
              <a
                href={e.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-info hover:text-ink"
              >
                Read the full essay <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">Strong vs. weak elements</h2>
          <span className="rounded-lg bg-violet/10 px-3 py-1.5 font-mono text-sm font-bold text-violet">
            {answered}/{explainer.quiz.length} · {score} correct
          </span>
        </div>
        <div className="mt-4 space-y-4">
          {explainer.quiz.map((q, qi) => {
            const chosen = answers[q.id];
            return (
              <div key={q.id} className="rounded-2xl border border-line bg-surface p-5">
                <p className="font-semibold text-ink">
                  {qi + 1}. {q.question}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {q.options.map((o, oi) => {
                    const isChosen = chosen === oi;
                    const isCorrect = o.correct;
                    return (
                      <button
                        key={oi}
                        type="button"
                        disabled={chosen != null}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                          chosen == null && "border-line bg-surface-2 text-muted hover:border-violet/50 hover:text-ink",
                          isChosen && isCorrect && "border-emerald bg-emerald/10 text-ink",
                          isChosen && !isCorrect && "border-danger bg-danger/10 text-ink",
                          chosen != null && !isChosen && isCorrect && "border-emerald/60 bg-emerald/5 text-ink"
                        )}
                      >
                        {isChosen && (isCorrect ? <Check className="h-4 w-4 shrink-0 text-emerald" /> : <X className="h-4 w-4 shrink-0 text-danger" />)}
                        {chosen != null && !isChosen && isCorrect && <Check className="h-4 w-4 shrink-0 text-emerald" />}
                        {o.label}
                      </button>
                    );
                  })}
                </div>
                {chosen != null && (
                  <div className="mt-3 rounded-lg bg-surface-2 px-3 py-2">
                    <p className="text-sm leading-relaxed text-muted">{q.explanation}</p>
                    <Sources sources={[q.source]} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Reveal>

      <Reveal>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">Sort the hooks</h2>
          <span className="rounded-lg bg-violet/10 px-3 py-1.5 font-mono text-sm font-bold text-violet">
            {placedCount}/{explainer.dragDrop.items.length} · {correctPlacements} correct
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">Drag each opening into the right zone — or tap an opening, then tap a zone.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {explainer.dragDrop.zones.map((z) => (
            <div
              key={z.id}
              role="button"
              tabIndex={0}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const itemId = e.dataTransfer.getData("text/plain");
                if (itemId && !placed[itemId]) dropItem(itemId, z.id);
              }}
              onClick={() => {
                if (selectedItem && !placed[selectedItem]) dropItem(selectedItem, z.id);
              }}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && selectedItem && !placed[selectedItem]) {
                  e.preventDefault();
                  dropItem(selectedItem, z.id);
                }
              }}
              className={cn(
                "min-h-40 rounded-2xl border-2 border-dashed p-4 transition-colors",
                z.id === "strong-hook" ? "border-emerald/50 bg-emerald/5" : "border-danger/50 bg-danger/5"
              )}
            >
              <p className={cn("font-mono text-xs font-bold uppercase tracking-widest", z.id === "strong-hook" ? "text-emerald" : "text-danger")}>
                {z.label}
              </p>
              <div className="mt-3 space-y-2">
                {explainer.dragDrop.items
                  .filter((i) => placed[i.id] === z.id)
                  .map((i) => (
                    <div key={i.id} className="rounded-lg border border-line bg-surface px-3 py-2">
                      <p className="text-sm text-ink">&ldquo;{i.text}&rdquo;</p>
                      <p className="mt-1 text-xs text-muted">{i.explanation}</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlaced((p) => {
                            const next = { ...p };
                            delete next[i.id];
                            return next;
                          });
                        }}
                        className="mt-1 font-mono text-[11px] text-faint hover:text-danger"
                      >
                        remove
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {explainer.dragDrop.items
            .filter((i) => !placed[i.id])
            .map((i) => (
              <button
                key={i.id}
                type="button"
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", i.id)}
                onClick={() => setSelectedItem(selectedItem === i.id ? null : i.id)}
                className={cn(
                  "rounded-xl border-2 px-3 py-2 text-sm transition-colors",
                  selectedItem === i.id ? "border-violet bg-violet/10 text-violet" : "border-line bg-surface-2 text-muted hover:text-ink"
                )}
              >
                &ldquo;{i.text}&rdquo;
              </button>
            ))}
        </div>
        {placedCount === explainer.dragDrop.items.length && (
          <p className="mt-4 rounded-xl bg-emerald/10 px-4 py-3 text-sm font-semibold text-emerald">
            {correctPlacements === explainer.dragDrop.items.length
              ? "All 6 sorted correctly — you can spot a strong hook."
              : `${correctPlacements}/6 sorted correctly — check the explanations above to sharpen your eye.`}
          </p>
        )}
      </Reveal>
    </div>
  );
}
