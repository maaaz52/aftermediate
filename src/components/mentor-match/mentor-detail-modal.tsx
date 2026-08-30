"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import {
  AVAILABILITY_CONFIG,
  FIELD_GRADIENTS,
  PLATFORM_COLORS,
  getInitials,
} from "./mentor-utils";
import { cn } from "@/lib/utils";
import type { MentorProfile } from "./mentor-match-page";

interface MentorDetailModalProps {
  mentor: MentorProfile | null;
  onClose: () => void;
}

const FIELD_BADGE_LABELS: Record<MentorProfile["field"], string> = {
  engineering: "Engineering",
  medical: "Medical",
  tech: "Tech",
  business: "Business",
  arts: "Arts",
  "civil-services": "Civil Services",
};

export function MentorDetailModal({ mentor, onClose }: MentorDetailModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mentor) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [mentor, onClose]);

  if (!mentor) return null;

  const { dot, label } = AVAILABILITY_CONFIG[mentor.availability];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${mentor.name} profile`}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative w-full rounded-t-2xl bg-white p-6 shadow-2xl sm:w-[520px] sm:rounded-2xl sm:max-h-[85vh] sm:overflow-y-auto",
          "animate-[fadeScaleIn_0.2s_ease-out]"
        )}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-muted transition-colors hover:text-ink"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Avatar + Name + Institution */}
        <div className="flex items-center gap-4">
          <div
            className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
            style={{ background: FIELD_GRADIENTS[mentor.field] }}
          >
            {getInitials(mentor.name)}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-ink">{mentor.name}</h2>
            <p className="text-sm font-semibold text-saffron">
              {mentor.institution} · {mentor.degree}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-saffron/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-saffron">
                {FIELD_BADGE_LABELS[mentor.field]}
              </span>
              <div className="flex items-center gap-1">
                <span className={cn("h-2 w-2 rounded-full", dot)} />
                <span className="text-xs text-muted">{label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* About */}
        <section className="mt-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-faint">
            About
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink">{mentor.bio}</p>
        </section>

        {/* Achievements */}
        <section className="mt-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-faint">
            Achievements
          </h3>
          <ul className="mt-2 space-y-1.5">
            {mentor.achievements.slice(0, 3).map((achievement) => (
              <li key={achievement} className="flex items-start gap-2 text-sm text-muted">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-saffron" />
                {achievement}
              </li>
            ))}
          </ul>
        </section>

        {/* Can help with */}
        <section className="mt-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-faint">
            Can help with
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {mentor.topics.map((topic) => (
              <span
                key={topic}
                className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted"
              >
                {topic}
              </span>
            ))}
          </div>
        </section>

        {/* Connect */}
        <section className="mt-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-faint">
            Connect
          </h3>
          <div className="mt-2 flex flex-col gap-2">
            {mentor.socials.map((social) => (
              <a
                key={social.platform}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: PLATFORM_COLORS[social.platform] ?? "#566073" }}
              >
                {social.label}
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}