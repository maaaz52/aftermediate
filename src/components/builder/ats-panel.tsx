"use client";

import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  GraduationCap,
  Lightbulb,
  Rocket,
  type LucideIcon,
} from "lucide-react";
import type { AtsResult, FeedbackItem, RecruiterMode } from "@/lib/resume-model";
import { cn } from "@/lib/utils";

export interface AtsPanelProps {
  mode: RecruiterMode;
  setMode: (m: RecruiterMode) => void;
  ats: AtsResult;
  feedback: FeedbackItem[];
  applyAutoFix: (item: FeedbackItem) => void;
}

const MODES: { id: RecruiterMode; label: string; icon: LucideIcon }[] = [
  { id: "startup", label: "Startup Founder", icon: Rocket },
  { id: "corporate", label: "Corporate HR", icon: Building2 },
  { id: "university", label: "University Admissions", icon: GraduationCap },
];

/** Mode-flavored tagline under the empty-state check. */
const MODE_TAGLINE: Record<RecruiterMode, string> = {
  startup: "Startup founders reward measurable impact and strong action verbs.",
  corporate: "Corporate HR scans for keywords, structure and professional formatting.",
  university: "Admissions officers value academics, clarity and strong verbs.",
};

const GAUGE_SIZE = 120;
const GAUGE_STROKE = 10;
const GAUGE_RADIUS = (GAUGE_SIZE - GAUGE_STROKE) / 2;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

/** Score color ramp: emerald ≥ 80, amber 50–79, red < 50. */
function scoreColor(score: number): string {
  if (score >= 80) return "#10B981";
  if (score >= 50) return "#d99a2b";
  return "#d63d3d";
}

export function AtsPanel({ mode, setMode, ats, feedback, applyAutoFix }: AtsPanelProps) {
  const score = ats.impactScore;
  const color = scoreColor(score);
  const verdict =
    score >= 80
      ? "Recruiter-ready — strong resume"
      : score >= 50
        ? "Solid but needs polish"
        : "Needs work before applications";
  const modeLabel = MODES.find((m) => m.id === mode)?.label ?? mode;

  const breakdowns = [
    { label: "Formatting Readability", value: ats.breakdown.formatting },
    { label: "Action Verb Strength", value: ats.breakdown.actionVerbs },
    { label: "Keyword Density", value: ats.breakdown.keywords },
  ];

  return (
    <div className="space-y-4 rounded-xl border border-[#222] bg-[#111118] p-4">
      {/* ── Recruiter mode switcher ─────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2">
        {MODES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={mode === id}
            onClick={() => setMode(id)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg border px-1 py-2 transition-colors",
              mode === id
                ? "border-[#3B82F6] bg-[#3B82F6]/10 text-white"
                : "border-[#333] bg-[#111118] text-[#8a93a6] hover:border-[#555] hover:text-white"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="text-center text-[11px] font-medium leading-tight">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Impact score gauge ──────────────────────────────────────── */}
      <div
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="ATS impact score"
        className="relative mx-auto h-[120px] w-[120px]"
      >
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={GAUGE_RADIUS}
            fill="none"
            stroke="#1f1f2a"
            strokeWidth={GAUGE_STROKE}
          />
          <circle
            cx="60"
            cy="60"
            r={GAUGE_RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={GAUGE_STROKE}
            strokeLinecap="round"
            strokeDasharray={GAUGE_CIRCUMFERENCE}
            strokeDashoffset={GAUGE_CIRCUMFERENCE * (1 - score / 100)}
            className="transition-[stroke-dashoffset] duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold leading-none text-white">{score}</span>
          <span className="mt-1 text-[10px] font-medium text-[#8a93a6]">Impact Score</span>
          <span className="text-[9px] text-[#555d6e]">out of 100</span>
        </div>
      </div>
      <p className="text-center text-xs font-medium" style={{ color }}>
        {verdict}
      </p>

      {/* ── Breakdown bars ──────────────────────────────────────────── */}
      <div className="space-y-3">
        {breakdowns.map(({ label, value }) => (
          <div
            key={label}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={label}
            className="space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#8a93a6]">{label}</span>
              <span className="text-xs font-semibold text-white">{value}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#1f1f2a]">
              <div
                aria-hidden="true"
                className="h-1.5 rounded-full transition-[width] duration-500"
                style={{ width: `${value}%`, backgroundColor: scoreColor(value) }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── Recruiter live roast & feedback feed ────────────────────── */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-white">Recruiter Live Roast</h3>
          <span className="rounded-full border border-[#333] bg-[#0d0d15] px-2 py-0.5 text-[10px] font-medium text-[#8a93a6]">
            {modeLabel}
          </span>
        </div>
        <div className="mt-2 space-y-2">
          {feedback.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-[#10B981]/20 bg-[#10B981]/5 p-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-[#10B981]" />
              <p className="text-xs font-medium text-[#cbd5e1]">
                No issues found — your resume is recruiter-ready
              </p>
              <p className="text-[11px] leading-relaxed text-[#8a93a6]">{MODE_TAGLINE[mode]}</p>
            </div>
          ) : (
            feedback.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "rounded-xl border p-3",
                  item.kind === "warning"
                    ? "border-[#d99a2b]/30 bg-[#d99a2b]/5"
                    : "border-[#3B82F6]/30 bg-[#3B82F6]/5"
                )}
              >
                <div className="flex items-start gap-2">
                  {item.kind === "warning" ? (
                    <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0 text-[#d99a2b]" />
                  ) : (
                    <Lightbulb className="mt-px h-3.5 w-3.5 shrink-0 text-[#3B82F6]" />
                  )}
                  <p className="text-xs leading-relaxed text-[#cbd5e1]">{item.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => applyAutoFix(item)}
                  className="mt-2 w-full rounded-lg bg-[#10B981]/15 px-3 py-1.5 text-xs font-semibold text-[#10B981] transition-colors hover:bg-[#10B981]/25"
                >
                  {item.fixLabel}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
