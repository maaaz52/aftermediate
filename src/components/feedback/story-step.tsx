"use client";

import { Brain, ChevronDown, Sparkles } from "lucide-react";
import { useState } from "react";
import { PERSONAS } from "@/lib/feedback-model";
import { MediaUploader, type MediaItem } from "./media-uploader";
import { VoiceInput } from "./voice-input";

export function StoryStep({
  surprised,
  mindset,
  recommendTo,
  media,
  onSurprised,
  onMindset,
  onRecommendTo,
  onMedia,
}: {
  surprised: string;
  mindset: string;
  recommendTo: string[];
  media: MediaItem[];
  onSurprised: (v: string) => void;
  onMindset: (v: string) => void;
  onRecommendTo: (v: string[]) => void;
  onMedia: (v: MediaItem[]) => void;
}) {
  const [openCard, setOpenCard] = useState<"surprised" | "mindset" | null>(null);
  const [voiceTarget, setVoiceTarget] = useState<"surprised" | "mindset">("surprised");

  const toggleCard = (card: "surprised" | "mindset") =>
    setOpenCard((c) => {
      const next = c === card ? null : card;
      if (next) setVoiceTarget(next);
      return next;
    });

  const handleVoice = (text: string) => {
    if (voiceTarget === "surprised") onSurprised(`${surprised} ${text}`.trim());
    else onMindset(`${mindset} ${text}`.trim());
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {(
          [
            { id: "surprised", icon: Sparkles, label: "What surprised me?", value: surprised, onChange: onSurprised },
            { id: "mindset", icon: Brain, label: "How did this change my mindset?", value: mindset, onChange: onMindset },
          ] as const
        ).map((card) => {
          const Icon = card.icon;
          const open = openCard === card.id;
          return (
            <div key={card.id} className="rounded-xl border border-line bg-surface">
              <button
                type="button"
                onClick={() => toggleCard(card.id)}
                aria-expanded={open}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <Icon className="h-5 w-5 text-saffron" aria-hidden />
                <span className="flex-1 text-sm font-semibold text-ink">{card.label}</span>
                <ChevronDown
                  className={`h-4 w-4 text-faint transition-transform ${open ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {open && (
                <div className="px-4 pb-4">
                  <textarea
                    aria-label={card.label}
                    value={card.value}
                    onChange={(e) => card.onChange(e.target.value)}
                    onFocus={() => setVoiceTarget(card.id)}
                    placeholder="Optional — a sentence or two is enough."
                    className="min-h-[84px] w-full resize-y rounded-lg border border-line bg-background px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-saffron/60 focus:outline-none"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-ink">Would I recommend this to…?</p>
        <div className="flex flex-wrap gap-2">
          {PERSONAS.map((p) => {
            const active = recommendTo.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  onRecommendTo(active ? recommendTo.filter((r) => r !== p.id) : [...recommendTo, p.id])
                }
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-emerald/40 bg-emerald/10 text-emerald"
                    : "border-line text-muted hover:border-saffron/40 hover:text-ink"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">Show, don&apos;t just tell</p>
          <VoiceInput onResult={handleVoice} />
        </div>
        <MediaUploader items={media} onChange={onMedia} />
      </div>
    </div>
  );
}
