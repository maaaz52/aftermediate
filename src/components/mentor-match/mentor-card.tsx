import type { MentorProfile } from "./mentor-match-page";
import { cn } from "@/lib/utils";

interface MentorCardProps {
  mentor: MentorProfile;
  onSelect: (id: string) => void;
}

const FIELD_GRADIENTS: Record<MentorProfile["field"], string> = {
  engineering: "linear-gradient(135deg, #d99a2b, #f59e0b)",
  medical: "linear-gradient(135deg, #1c9e62, #10b981)",
  tech: "linear-gradient(135deg, #2f55d4, #4a6cf0)",
  business: "linear-gradient(135deg, #7a5bd4, #8b5cf6)",
  arts: "linear-gradient(135deg, #e1306c, #f472b6)",
  "civil-services": "linear-gradient(135deg, #566073, #8a93a6)",
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#e1306c",
  discord: "#5865f2",
  whatsapp: "#25d366",
};

const AVAILABILITY_CONFIG: Record<
  MentorProfile["availability"],
  { dot: string; label: string }
> = {
  available: { dot: "bg-emerald", label: "Available this week" },
  limited: { dot: "bg-amber", label: "1-2 slots open" },
  booked: { dot: "bg-danger", label: "Fully booked — join waitlist" },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
}

export function MentorCard({ mentor, onSelect }: MentorCardProps) {
  const { dot, label } = AVAILABILITY_CONFIG[mentor.availability];

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
      className="card-glass w-full cursor-pointer rounded-2xl p-5 text-left outline-none transition-all hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-saffron/40"
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
          <p className="text-sm font-semibold text-saffron">
            {mentor.institution} · {mentor.degree}
          </p>
        </div>
      </div>

      {/* Bio */}
      <p className="mt-3 text-[13px] leading-relaxed text-muted">{mentor.bio}</p>

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

      {/* Availability */}
      <div className="mt-3 flex items-center gap-1.5">
        <span className={cn("h-2 w-2 rounded-full", dot)} />
        <span className="text-xs text-muted">{label}</span>
      </div>

      {/* Social buttons */}
      <div
        className={cn(
          "mt-3 flex gap-2",
          mentor.socials.length === 1 ? "flex-col" : ""
        )}
      >
        {mentor.socials.map((social) => (
          <a
            key={social.platform}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90",
              mentor.socials.length === 1 ? "w-full" : "flex-1"
            )}
            style={{ backgroundColor: PLATFORM_COLORS[social.platform] ?? "#566073" }}
            onClick={(e) => e.stopPropagation()}
          >
            {social.label}
          </a>
        ))}
      </div>
    </div>
  );
}