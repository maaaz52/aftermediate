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
                ? "scale-105 border-blue-500/60 bg-blue-500/10 shadow-[0_0_24px_rgba(59,130,246,0.35)]"
                : "border-[#222] bg-[#111118] hover:border-[#3a3a48]"
            }`}
          >
            <Icon className="h-7 w-7" style={{ color: active ? tone.color : "#8a8a9e" }} aria-hidden />
            <span className={`text-sm font-semibold ${active ? "text-white" : "text-faint"}`}>{tone.label}</span>
          </button>
        );
      })}
    </div>
  );
}
