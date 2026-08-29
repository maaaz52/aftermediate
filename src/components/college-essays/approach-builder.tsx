"use client";

import * as React from "react";
import { ArrowRight, Check, Copy, Quote, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { copyText, useLocalStorage } from "@/lib/skills";
import { useStudent } from "@/lib/store";
import { collegeEssaysStrategy, type EssayType, type Strategy, type StrategyInput } from "@/lib/college-essays";
import data from "@/data/college-essays.json";

type Source = { label: string; url: string };

const builderData = data as unknown as {
  builderPresets: { universities: string[]; majors: string[]; extracurriculars: string[] };
  guide: { templates: { id: string; name: string; bestFor: string; skeleton: string[]; sources: Source[] }[] };
};

const APPROACH_LABELS: Record<Strategy["approach"], string> = {
  narrative: "Narrative",
  analytical: "Analytical",
  hybrid: "Hybrid",
};

const ESSAY_OPTIONS: { id: EssayType; label: string; hint: string }[] = [
  { id: "personal", label: "Personal statement", hint: "Your story for regular applications" },
  { id: "scholarship", label: "Scholarship essay", hint: "Outcomes for funding committees" },
  { id: "both", label: "Both", hint: "One draft, two audiences" },
];

function isStrategy(v: unknown): v is Strategy {
  if (typeof v !== "object" || v === null) return false;
  const s = v as Partial<Strategy>;
  return (
    (s.approach === "narrative" || s.approach === "analytical" || s.approach === "hybrid") &&
    typeof s.approachReason === "string" &&
    Array.isArray(s.themes) &&
    (s.structureTemplateId === "narrative-arc" || s.structureTemplateId === "challenge-growth" || s.structureTemplateId === "topic-deep-dive") &&
    Array.isArray(s.prompts)
  );
}

function ChipRow({
  label,
  items,
  selected,
  onToggle,
}: {
  label: string;
  items: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div>
      <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-violet">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => {
          const active = selected.includes(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => onToggle(item)}
              aria-pressed={active}
              className={cn(
                "rounded-full border-2 px-3 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-violet/50",
                active ? "border-violet bg-violet/10 font-bold text-violet" : "border-line bg-surface-2 text-muted hover:text-ink"
              )}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ApproachBuilder() {
  const { profile } = useStudent();
  const [essayType, setEssayType] = React.useState<EssayType>(
    profile.quiz.needsScholarship === "must" || profile.quiz.needsScholarship === "helpful" ? "scholarship" : "personal"
  );
  const [universities, setUniversities] = React.useState<string[]>([]);
  const [major, setMajor] = React.useState(profile.quiz.dreamField ?? "");
  const [extracurriculars, setExtracurriculars] = React.useState<string[]>([]);
  const [savedStrategy, setStrategy] = useLocalStorage<unknown>("aftermediate:essays:strategy", null);
  const strategy = React.useMemo(() => (isStrategy(savedStrategy) ? savedStrategy : null), [savedStrategy]);
  const [copied, setCopied] = React.useState<string | null>(null);

  const english = typeof profile.quiz.english === "number" ? profile.quiz.english : 3;
  const template = strategy ? builderData.guide.templates.find((t) => t.id === strategy.structureTemplateId) : null;

  function toggle(list: string[], set: (v: string[]) => void, value: string) {
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  function build() {
    const input: StrategyInput = {
      essayType,
      universities,
      major: major.trim() || profile.quiz.dreamField || "",
      extracurriculars: extracurriculars.length > 0 ? extracurriculars : profile.skills,
      profile: {
        stream: profile.stream,
        interests: profile.interests,
        skills: profile.skills,
        english,
      },
    };
    setStrategy(collegeEssaysStrategy(input));
    window.setTimeout(() => {
      document.getElementById("essay-strategy-output")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function jumpToRater() {
    window.location.hash = "rating";
  }

  async function copyPrompt(p: string) {
    if (await copyText(p)) {
      setCopied(p);
      window.setTimeout(() => setCopied(null), 2000);
    }
  }

  async function copyAll() {
    if (!strategy) return;
    const text = [
      `Approach: ${APPROACH_LABELS[strategy.approach]}`,
      strategy.approachReason,
      `Themes: ${strategy.themes.map((t) => t.name).join(", ")}`,
      `Structure: ${template?.name ?? strategy.structureTemplateId}`,
      "",
      "Prompts:",
      ...strategy.prompts.map((p, i) => `${i + 1}. ${p}`),
    ].join("\n");
    if (await copyText(text)) {
      setCopied("all");
      window.setTimeout(() => setCopied(null), 2000);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="rounded-2xl border-2 border-ink bg-surface p-5 pixel-shadow">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
            <Target className="h-5 w-5 text-violet" /> Build your approach
          </h3>
          <p className="mt-1 text-sm text-muted">Answer three quick questions — the engine maps them to an approach, themes, a structure, and prompts. No AI needed, instant result.</p>

          <p className="mt-5 font-mono text-[11px] font-bold uppercase tracking-widest text-violet">Which essay are you writing?</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {ESSAY_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setEssayType(o.id)}
                aria-pressed={essayType === o.id}
                className={cn(
                  "rounded-xl border-2 p-3.5 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-violet/50",
                  essayType === o.id ? "border-violet bg-violet/10" : "border-line bg-surface-2 hover:border-violet/40"
                )}
              >
                <p className="text-sm font-bold text-ink">{o.label}</p>
                <p className="mt-0.5 text-xs text-muted">{o.hint}</p>
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            <ChipRow label="Universities (optional)" items={builderData.builderPresets.universities} selected={universities} onToggle={(v) => toggle(universities, setUniversities, v)} />
            <ChipRow label="Major (optional)" items={builderData.builderPresets.majors} selected={major ? [major] : []} onToggle={(v) => setMajor(major === v ? "" : v)} />
            <ChipRow label="Extracurriculars (optional)" items={builderData.builderPresets.extracurriculars} selected={extracurriculars} onToggle={(v) => toggle(extracurriculars, setExtracurriculars, v)} />
          </div>

          <button
            type="button"
            onClick={build}
            className="mt-6 w-full rounded-xl bg-violet px-4 py-3 text-sm font-bold text-background transition-colors hover:bg-violet/90"
          >
            Build my strategy
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-violet">From your profile</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Stream</dt>
              <dd className="font-semibold text-ink">{profile.stream ?? "Not set"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Interests</dt>
              <dd className="text-right text-ink">{profile.interests.length > 0 ? profile.interests.join(", ") : "None yet"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Skills</dt>
              <dd className="text-right text-ink">{profile.skills.length > 0 ? profile.skills.join(", ") : "None yet"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">English self-rating</dt>
              <dd className="font-semibold text-ink">{english}/5</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-faint">Your profile feeds the strategy engine — keep it up to date on the Profile page.</p>
        </div>
      </div>

      {strategy && (
        <div id="essay-strategy-output" className="rounded-2xl border-2 border-ink bg-surface p-5 pixel-shadow lg:col-span-3 scroll-mt-24">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
              <Quote className="h-5 w-5 text-violet" /> Your strategy
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyAll}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-bold text-muted hover:text-ink"
              >
                {copied === "all" ? <Check className="h-3.5 w-3.5 text-emerald" /> : <Copy className="h-3.5 w-3.5" />}
                Copy all
              </button>
              <button type="button" onClick={jumpToRater} className="inline-flex items-center gap-1.5 rounded-lg bg-violet px-3 py-1.5 text-xs font-bold text-background">
                Get it rated <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-surface-2 p-4">
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-violet">Approach — {APPROACH_LABELS[strategy.approach]}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink">{strategy.approachReason}</p>
          </div>

          <div className="mt-4">
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-violet">Themes</p>
            <div className="mt-2 space-y-2">
              {strategy.themes.map((t) => (
                <p key={t.name} className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink">
                  <span className="font-bold">{t.name}</span> — {t.why}
                </p>
              ))}
            </div>
          </div>

          {template && (
            <div className="mt-4">
              <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-violet">Structure — {template.name}</p>
              <p className="mt-1 text-xs text-muted">{template.bestFor}</p>
              <ol className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {template.skeleton.map((slot, j) => (
                  <li key={j} className="flex gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs text-muted">
                    <span className="font-mono text-violet">{j + 1}.</span> {slot}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="mt-4">
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-violet">Prompts to start from</p>
            <div className="mt-2 space-y-2">
              {strategy.prompts.map((p, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2.5">
                  <span className="font-mono text-xs font-bold text-violet">{i + 1}.</span>
                  <p className="flex-1 text-sm text-ink">{p}</p>
                  <button type="button" onClick={() => copyPrompt(p)} aria-label="Copy prompt" className="text-faint hover:text-violet">
                    {copied === p ? <Check className="h-4 w-4 text-emerald" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button type="button" onClick={() => setStrategy(null)} className="mt-4 text-xs font-semibold text-faint hover:text-danger">
            Clear strategy and rebuild
          </button>
        </div>
      )}
    </div>
  );
}
