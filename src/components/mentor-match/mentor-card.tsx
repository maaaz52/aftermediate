import type { MentorProfile } from "./mentor-match-page";
import { FIELD_GRADIENTS, getInitials } from "./mentor-utils";
import { AtSign, Mail, MessageCircle, Phone } from "lucide-react";

const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: AtSign,
  discord: MessageCircle,
  whatsapp: Phone,
  email: Mail,
};

interface MentorCardProps {
  mentor: MentorProfile;
  onSelect: (id: string) => void;
}

export function MentorCard({ mentor, onSelect }: MentorCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(mentor.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(mentor.id);
        }
      }}
      className="card-glass flex h-full cursor-pointer flex-col rounded-2xl p-5 text-left outline-none transition-all hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      {/* Header row */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: FIELD_GRADIENTS[mentor.field] }}
        >
          {getInitials(mentor.name)}
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-ink">{mentor.name}</h3>
          <p className="text-sm font-semibold text-accent">
            {mentor.institution} · {mentor.degree}
          </p>
        </div>
      </div>

      {/* Bio */}
      <p className="mt-3 flex-1 text-[13px] leading-relaxed text-muted">{mentor.bio}</p>

      {/* Topics */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {mentor.topics.map((topic) => (
          <span
            key={topic}
            className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted"
          >
            {topic}
          </span>
        ))}
      </div>

      {/* Social buttons — fixed height row */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {mentor.socials.map((social) => {
          const Icon = SOCIAL_ICONS[social.platform] ?? MessageCircle;
          return (
            <a
              key={social.platform}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-accent text-xs font-semibold text-white transition-opacity hover:opacity-90"
              onClick={(e) => e.stopPropagation()}
            >
              <Icon className="h-3.5 w-3.5" />
              {social.platform.charAt(0).toUpperCase() + social.platform.slice(1)}
            </a>
          );
        })}
      </div>
    </div>
  );
}
