"use client";

import { Angry, Frown, Laugh, Meh, Smile } from "lucide-react";
import { TONE_META, type ToneId } from "@/lib/feedback-model";

const ICONS = { Laugh, Smile, Meh, Frown, Angry } as const;

export function MoodMeter({ value, onChange }: { value: ToneId | null; onChange: (t: ToneId) => void }) {
  return (
    <div role="group" aria-label="How do you feel?" className="flex flex-wrap gap-3">
      {TONE_META.map((tone) => {
        const Icon = ICONS[tone.icon as keyof typeof ICONS];
        const active = value === tone.id;
        return (
          <button
            key={tone.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(tone.id)}
            className={`flex min-w-[110px] flex-1 flex-col items-center gap-2 rounded-xl border px-4 py-5 transition-all duration-200 ${
              active
                ? "scale-105 border-saffron/40 bg-saffron/10 shadow-[0_0_24px_rgba(47,85,212,0.25)]"
                : "border-line bg-surface hover:border-saffron/40"
            }`}
          >
            <Icon className="h-7 w-7" style={{ color: active ? tone.color : "#8a93a6" }} aria-hidden />
            <span className={`text-sm font-semibold ${active ? "text-ink" : "text-faint"}`}>{tone.label}</span>
          </button>
        );
      })}
    </div>
  );
}
