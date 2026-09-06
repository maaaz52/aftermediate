"use client";

import { Hash, Sparkles } from "lucide-react";
import type { Ref } from "react";
import {
  makeQuantifiable,
  rewriteBullet,
  type RecruiterMode,
  type ResumeData,
  type TemplateId,
} from "@/lib/resume-model";
import { cn } from "@/lib/utils";
import { safeExternalUrl } from "@/lib/escape-html";

export interface ResumeCanvasProps {
  resume: ResumeData;
  template: TemplateId;
  mode: RecruiterMode;
  updateBullet: (index: number, bullet: string) => void;
  /** Paper root node — consumed by the PDF capture in builder.tsx. */
  ref?: Ref<HTMLDivElement>;
}

/** Paper surface per template — the A4-shaped preview card. */
const PAPER: Record<TemplateId, string> = {
  academic: "bg-white text-[#1a1a1a] font-serif",
  silicon: "bg-[#0F172A] text-slate-100 font-sans",
  glass: "bg-gradient-to-br from-[#1e293b]/90 via-[#111827]/95 to-[#0f172a] text-slate-100 font-sans",
};

/** Horizontal rule between sections. */
const RULE: Record<TemplateId, string> = {
  academic: "border-b border-[#1a1a1a]/20",
  silicon: "border-b border-white/10",
  glass: "border-b border-white/10",
};

/** Section container per template — glass renders each section as a translucent card. */
const SECTION: Record<TemplateId, string> = {
  academic: "",
  silicon: "",
  glass: "rounded-2xl border border-white/10 bg-white/5 p-4",
};

/** Small-caps section heading style per template. */
const HEADING: Record<TemplateId, string> = {
  academic: "text-xs font-semibold uppercase tracking-[0.15em] text-[#1a1a1a]",
  silicon: "text-[#3B82F6] text-xs font-bold uppercase tracking-wider",
  glass: "text-[#3B82F6] text-xs font-bold uppercase tracking-wider",
};

/** Link color per template (silicon/glass use the electric blue accent). */
const LINK: Record<TemplateId, string> = {
  academic: "underline decoration-[#1a1a1a]/30 underline-offset-2 hover:decoration-[#1a1a1a]",
  silicon: "text-[#3B82F6] hover:underline",
  glass: "text-[#3B82F6] hover:underline",
};

/** Skill pill border/fill per template. */
const SKILL_PILL: Record<TemplateId, string> = {
  academic: "border-[#1a1a1a]/15 bg-[#f5f5f5]",
  silicon: "border-white/10 bg-white/5",
  glass: "border-white/10 bg-white/5",
};

/** Empty-bullets placeholder color. */
const EMPTY_HINT: Record<TemplateId, string> = {
  academic: "text-[#9a9a9a]",
  silicon: "text-[#8a93a6]",
  glass: "text-[#8a93a6]",
};

/** Muted secondary text per template. */
const MUTED: Record<TemplateId, string> = {
  academic: "text-[#555]",
  silicon: "text-slate-400",
  glass: "text-slate-400",
};

export function ResumeCanvas({ resume, template, mode, updateBullet, ref }: ResumeCanvasProps) {
  const { identity, experience, projects, skills } = resume;
  const heading = HEADING[template];
  const rule = RULE[template];
  const muted = MUTED[template];
  const link = LINK[template];

  const contactParts = [identity.email, identity.phone, identity.location].filter(Boolean);
  const contactLine = contactParts.join(" · ");
  const socials = [identity.github, identity.linkedin].filter(Boolean).map(safeExternalUrl);

  const skillCount = skills.tech.length + skills.soft.length;
  const projectEntries = projects.entries.filter((e) => e.title.trim() || e.description.trim());
  const academicEntries = projects.academics.filter(
    (a) => a.degree.trim() || a.institution.trim()
  );
  const certificates = projects.certificates.filter((c) => c.trim());
  const leadership = projects.leadership.filter((l) => l.trim());

  const avatarInitial = identity.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      ref={ref}
      data-template={template}
      role="region"
      aria-label="Resume preview"
      className={cn(
        "mx-auto aspect-[210/297] w-full max-w-[640px] overflow-hidden shadow-2xl",
        PAPER[template]
      )}
    >
      <div className="flex h-full flex-col p-5 sm:p-8">
        {/* ── Header ─────────────────────────────────────────────────── */}
        {template === "glass" ? (
          <header className="px-6 pb-1 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3B82F6] to-[#10B981] text-sm font-bold text-white">
                {avatarInitial}
              </div>
              <div>
                <h1 className="text-xl font-bold leading-tight">{identity.name}</h1>
                {identity.targetRole && (
                  <p className={cn("text-xs", muted)}>{identity.targetRole}</p>
                )}
              </div>
            </div>
            {contactLine && <p className={cn("mt-3 text-[11px]", muted)}>{contactLine}</p>}
            {socials.length > 0 && (
              <p className="mt-1 text-[11px]">
                {socials.map((s) => (
                  <a key={s} href={s} className={cn("mr-3", link)}>
                    {s.replace(/^https?:\/\//, "")}
                  </a>
                ))}
              </p>
            )}
          </header>
        ) : (
          <header
            className={cn(
              "px-6 pb-1 sm:px-8",
              template === "academic" ? "text-center" : "text-left"
            )}
          >
            <h1
              className={cn(
                "text-2xl font-bold leading-tight",
                template === "academic" && "uppercase tracking-[0.12em]"
              )}
            >
              {identity.name}
            </h1>
            {contactLine && <p className={cn("mt-1 text-xs", muted)}>{contactLine}</p>}
            {socials.length > 0 && (
              <p className={cn("mt-1 text-xs", muted)}>
                {socials.map((s) => (
                  <a key={s} href={s} className={cn("mr-3", link)}>
                    {s.replace(/^https?:\/\//, "")}
                  </a>
                ))}
              </p>
            )}
            {identity.targetRole && (
              <p className={cn("mt-1.5 text-sm", muted, template === "academic" && "italic")}>
                {identity.targetRole}
              </p>
            )}
          </header>
        )}

        {template !== "glass" && <div className={cn("mt-4", rule)} />}

        {/* ── Experience (hover-to-rewrite) ───────────────────────────── */}
        <div className={cn("mt-4", SECTION[template])}>
          <h2 className={heading}>Experience</h2>
          {experience.bullets.length > 0 ? (
            <div className="mt-2 space-y-2">
              {experience.bullets.map((bullet, i) => (
                <div key={i} className="group relative">
                  <p className="pr-24 text-xs leading-relaxed sm:text-sm">
                    <span aria-hidden="true" className="mr-1.5">
                      •
                    </span>
                    {bullet}
                  </p>
                  <div className="resume-overlay absolute right-1 top-0 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 print:hidden">
                    <button
                      type="button"
                      onClick={() => updateBullet(i, rewriteBullet(bullet))}
                      className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-medium text-ink shadow-lg transition-colors hover:border-saffron"
                    >
                      <Sparkles className="h-3 w-3" />
                      Rewrite with AI
                    </button>
                    <button
                      type="button"
                      onClick={() => updateBullet(i, makeQuantifiable(bullet, mode))}
                      className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-medium text-ink shadow-lg transition-colors hover:border-saffron"
                    >
                      <Hash className="h-3 w-3" />
                      Make More Quantifiable
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={cn("mt-2 text-xs italic", EMPTY_HINT[template])}>
              Your polished bullets will appear here
            </p>
          )}
        </div>

        {/* ── Projects ────────────────────────────────────────────────── */}
        {projectEntries.length > 0 && (
          <>
            {template !== "glass" && <div className={cn("mt-4", rule)} />}
            <div className={cn("mt-4", SECTION[template])}>
              <h2 className={heading}>Projects</h2>
              <div className="mt-2 space-y-2.5">
                {projectEntries.map((entry, i) => (
                  <div key={i} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold">{entry.title}</p>
                      {entry.description && (
                        <p className={cn("mt-0.5 text-xs leading-relaxed", muted)}>
                          {entry.description}
                        </p>
                      )}
                    </div>
                    {[entry.org, entry.year].filter(Boolean).length > 0 && (
                      <p className={cn("shrink-0 text-right text-xs", muted)}>
                        {[entry.org, entry.year].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Academics ───────────────────────────────────────────────── */}
        {academicEntries.length > 0 && (
          <>
            {template !== "glass" && <div className={cn("mt-4", rule)} />}
            <div className={cn("mt-4", SECTION[template])}>
              <h2 className={heading}>Academics</h2>
              <div className="mt-2 space-y-2">
                {academicEntries.map((a, i) => (
                  <div key={i} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold">{a.degree}</p>
                      <p className={cn("mt-0.5 text-xs", muted)}>
                        {[a.institution, a.score].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {a.years && <p className={cn("shrink-0 text-right text-xs", muted)}>{a.years}</p>}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Certificates ────────────────────────────────────────────── */}
        {certificates.length > 0 && (
          <>
            {template !== "glass" && <div className={cn("mt-4", rule)} />}
            <div className={cn("mt-4", SECTION[template])}>
              <h2 className={heading}>Certificates</h2>
              <div className="mt-2 space-y-1.5">
                {certificates.map((c, i) => (
                  <p key={i} className="text-xs leading-relaxed">
                    <span aria-hidden="true" className="mr-1.5">
                      •
                    </span>
                    {c}
                  </p>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Leadership ──────────────────────────────────────────────── */}
        {leadership.length > 0 && (
          <>
            {template !== "glass" && <div className={cn("mt-4", rule)} />}
            <div className={cn("mt-4", SECTION[template])}>
              <h2 className={heading}>Leadership</h2>
              <div className="mt-2 space-y-1.5">
                {leadership.map((l, i) => (
                  <p key={i} className="text-xs leading-relaxed">
                    <span aria-hidden="true" className="mr-1.5">
                      •
                    </span>
                    {l}
                  </p>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Skills ──────────────────────────────────────────────────── */}
        {skillCount > 0 && (
          <>
            {template !== "glass" && <div className={cn("mt-4", rule)} />}
            <div className={cn("mt-4", SECTION[template])}>
              <h2 className={heading}>Skills</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[...skills.tech, ...skills.soft].map((skill) => (
                  <span
                    key={skill}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                      SKILL_PILL[template]
                    )}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
