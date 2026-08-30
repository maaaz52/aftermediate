"use client";

import { Sparkles, X, Zap } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { ResumeData } from "@/lib/resume-model";
import { cn } from "@/lib/utils";
import { DARK_INPUT } from "./input-panel";

export interface ExperienceTabProps {
  experience: ResumeData["experience"];
  polishing: boolean;
  updateExperience: (patch: Partial<ResumeData["experience"]>) => void;
  polishExperience: () => void;
  updateBullet: (index: number, bullet: string) => void;
  removeBullet: (index: number) => void;
}

export function ExperienceTab({
  experience,
  polishing,
  updateExperience,
  polishExperience,
  updateBullet,
  removeBullet,
}: ExperienceTabProps) {
  const hasBullets = experience.bullets.length > 0;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="builder-raw-notes" className="text-xs font-medium text-[#8a93a6]">
          What have you actually done?
        </Label>
        <textarea
          id="builder-raw-notes"
          rows={5}
          value={experience.rawNotes}
          onChange={(e) => updateExperience({ rawNotes: e.target.value })}
          placeholder="e.g. organised school sports day for 200 students, edited 15 videos for my YouTube channel, got 88% in FSc Physics lab"
          className={cn(
            DARK_INPUT,
            "w-full resize-y rounded-lg border px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2"
          )}
        />
        <p className="text-[11px] leading-relaxed text-[#555d6e]">
          Write it like you&apos;d tell a friend. The rule engine turns your notes into 3
          recruiter-ready STAR bullets.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={polishExperience}
          disabled={polishing}
          className="inline-flex items-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_-6px_rgba(59,130,246,0.7)] transition-colors hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Zap className="h-4 w-4" />
          {polishing ? "Polishing…" : "AI Polish"}
        </button>
        {hasBullets && (
          <button
            type="button"
            onClick={polishExperience}
            disabled={polishing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#333] bg-transparent px-3 py-2 text-xs font-medium text-[#8a93a6] transition-colors hover:border-[#555] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Repolish
          </button>
        )}
      </div>

      {hasBullets && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#10B981]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#10B981]" />
            Polished bullets
          </p>
          {experience.bullets.map((bullet, i) => (
            <div key={i} className="flex items-start gap-2">
              <textarea
                aria-label={`Polished bullet ${i + 1}`}
                rows={2}
                value={bullet}
                onChange={(e) => updateBullet(i, e.target.value)}
                className={cn(
                  DARK_INPUT,
                  "w-full resize-y rounded-lg border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2"
                )}
              />
              <button
                type="button"
                aria-label={`Remove bullet ${i + 1}`}
                onClick={() => removeBullet(i)}
                className="mt-0.5 rounded-md p-1.5 text-[#555d6e] transition-colors hover:bg-[#1a1a2e] hover:text-[#d63d3d]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <p className="text-[11px] text-[#555d6e]">
            Edit any bullet in place — the preview and ATS score update live.
          </p>
        </div>
      )}
    </div>
  );
}
