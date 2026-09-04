"use client";

import { Sparkles, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { ResumeData } from "@/lib/resume-model";
import { cn } from "@/lib/utils";
import { INPUT_STYLE } from "./input-panel";

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
  const hasNotes = experience.rawNotes.trim().length > 0;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="builder-raw-notes" className="text-xs font-medium text-muted">
          What have you actually done?
        </Label>
        <textarea
          id="builder-raw-notes"
          rows={5}
          value={experience.rawNotes}
          onChange={(e) => updateExperience({ rawNotes: e.target.value })}
          placeholder="e.g. organised school sports day for 200 students, edited 15 videos for my YouTube channel, got 88% in FSc Physics lab"
          className={cn(
            INPUT_STYLE,
            "w-full resize-y rounded-lg border px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2"
          )}
        />
        <p className="text-[11px] leading-relaxed text-faint">
          Write it like you&apos;d tell a friend. The rule engine turns your notes into 3
          recruiter-ready STAR bullets.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={polishExperience}
          disabled={polishing || !hasNotes}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors",
            hasNotes
              ? "bg-saffron shadow-[0_0_20px_-6px_rgba(47,85,212,0.7)] hover:bg-saffron-soft"
              : "cursor-not-allowed bg-line text-muted",
            polishing && "cursor-not-allowed opacity-60"
          )}
        >
          <Sparkles className="h-4 w-4" />
          {polishing ? "Polishing…" : "AI Polish"}
        </button>
        {!hasNotes && (
          <p className="text-xs text-faint">Add your notes above first.</p>
        )}
      </div>

      {hasBullets && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald" />
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
                  INPUT_STYLE,
                  "w-full resize-y rounded-lg border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2"
                )}
              />
              <button
                type="button"
                aria-label={`Remove bullet ${i + 1}`}
                onClick={() => removeBullet(i)}
                className="mt-0.5 rounded-md p-1.5 text-faint transition-colors hover:bg-surface-2 hover:text-danger"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <p className="text-[11px] text-faint">
            Edit any bullet in place — the preview and ATS score update live.
          </p>
        </div>
      )}
    </div>
  );
}