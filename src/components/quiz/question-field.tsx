"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getAnswer, type Question } from "@/lib/quiz";
import type { StudentProfile } from "@/lib/store";

interface Props {
  question: Question;
  profile: StudentProfile;
  onChange: (id: string, value: unknown) => void;
}

export function QuestionField({ question: q, profile, onChange }: Props) {
  const value = getAnswer(profile, q.id);

  if (q.kind === "marksheet") return null;

  if (q.kind === "single" || q.kind === "stream") {
    const opts = q.options ?? [];
    return (
      <fieldset className="min-w-0">
        <legend className="text-sm font-semibold text-ink">
          {q.label}
          {q.required && <span className="ml-1 text-danger">*</span>}
        </legend>
        {q.help && <p className="mt-1 text-xs text-faint">{q.help}</p>}
        <div className={cn("mt-3 grid gap-2.5", q.kind === "stream" ? "sm:grid-cols-2" : "sm:grid-cols-2")}>
          {opts.map((o) => {
            const active = value === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange(q.id, o.value)}
                aria-pressed={active}
                className={cn(
                  "min-w-0 border-2 border-ink p-3.5 text-left transition-all",
                  active
                    ? "bg-accent text-white shadow-[4px_4px_0_0_var(--color-ink)]"
                    : "bg-surface text-ink hover:bg-surface-2"
                )}
              >
                <span className="block text-sm font-semibold">{o.label}</span>
                {o.sub && (
                  <span className={cn("mt-0.5 block font-mono text-[11px]", active ? "text-white/75" : "text-faint")}>
                    {o.sub}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  }

  if (q.kind === "multi") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <fieldset className="min-w-0">
        <legend className="text-sm font-semibold text-ink">
          {q.label}
          {q.required && <span className="ml-1 text-danger">*</span>}
        </legend>
        {q.help && <p className="mt-1 text-xs text-faint">{q.help}</p>}
        <div className="mt-3 flex flex-wrap gap-2.5">
          {(q.options ?? []).map((o) => {
            const active = selected.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  onChange(
                    q.id,
                    active ? selected.filter((x) => x !== o.value) : [...selected, o.value]
                  )
                }
                className={cn(
                  "border-2 border-ink px-3.5 py-2 text-sm font-medium transition-all",
                  active
                    ? "bg-accent text-white shadow-[3px_3px_0_0_var(--color-ink)]"
                    : "bg-surface text-muted hover:bg-surface-2 hover:text-ink"
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  }

  if (q.kind === "scale") {
    const min = q.min ?? 1;
    const max = q.max ?? 5;
    const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    return (
      <fieldset className="min-w-0">
        <legend className="text-sm font-semibold text-ink">
          {q.label}
          {q.required && <span className="ml-1 text-danger">*</span>}
        </legend>
        {q.help && <p className="mt-1 font-mono text-[11px] text-faint">{q.help}</p>}
        <div className="mt-3 flex gap-2">
          {steps.map((n) => {
            const active = value === n;
            return (
              <button
                key={n}
                type="button"
                aria-pressed={active}
                onClick={() => onChange(q.id, n)}
                className={cn(
                  "h-11 flex-1 border-2 border-ink font-mono text-sm font-bold transition-all",
                  active
                    ? "bg-accent text-white shadow-[3px_3px_0_0_var(--color-ink)]"
                    : "bg-surface text-muted hover:bg-surface-2"
                )}
              >
                {n}
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  }

  // number | text
  return (
    <div className="min-w-0">
      <Label htmlFor={q.id}>
        {q.label}
        {q.required && <span className="ml-1 text-danger">*</span>}
      </Label>
      <Input
        id={q.id}
        type={q.kind === "number" ? "number" : "text"}
        inputMode={q.kind === "number" ? "numeric" : undefined}
        min={q.min}
        max={q.max}
        className="mt-1.5 font-mono"
        value={typeof value === "number" || typeof value === "string" ? String(value) : ""}
        onChange={(e) => {
          const raw = e.target.value;
          if (q.kind === "number") {
            onChange(q.id, raw === "" ? undefined : Number(raw));
          } else {
            onChange(q.id, raw);
          }
        }}
      />
      {q.help && <p className="mt-1.5 text-xs text-faint">{q.help}</p>}
    </div>
  );
}
