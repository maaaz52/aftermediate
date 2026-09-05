"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { HeroSection } from "./hero-section";
import { MentorCard } from "./mentor-card";
import { MentorDetailModal } from "./mentor-detail-modal";
import { BecomeMentorModal } from "./become-mentor-modal";
import data from "@/data/mentors.json";

// ── Types ──

export type MentorField =
  | "engineering"
  | "medical"
  | "tech"
  | "business"
  | "arts"
  | "civil-services";

export type Availability = "available" | "limited" | "booked";

export interface SocialLink {
  platform: "instagram" | "discord" | "whatsapp" | "email" | "linkedin";
  label: string;
  url: string;
}

export interface MentorProfile {
  id: string;
  name: string;
  institution: string;
  degree: string;
  field: MentorField;
  bio: string;
  topics: string[];
  socials: SocialLink[];
  achievements: string[];
  availability: Availability;
}

// ── Data ──

const mentors: MentorProfile[] = (data as { mentors: MentorProfile[] }).mentors;

const FIELD_FILTERS: { id: MentorField | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "engineering", label: "Engineering" },
  { id: "medical", label: "Medical" },
  { id: "tech", label: "Tech" },
  { id: "business", label: "Business" },
  { id: "arts", label: "Arts" },
  { id: "civil-services", label: "Civil Services" },
];

// ── Component ──

export function MentorMatchPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeField, setActiveField] = React.useState<MentorField | "all">("all");
  const [selectedMentor, setSelectedMentor] = React.useState<MentorProfile | null>(null);
  const [showBecomeModal, setShowBecomeModal] = React.useState(false);

  const filtered = React.useMemo(() => {
    let result = mentors;

    if (activeField !== "all") {
      result = result.filter((m) => m.field === activeField);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.institution.toLowerCase().includes(q) ||
          m.topics.some((t) => t.toLowerCase().includes(q))
      );
    }

    return result;
  }, [activeField, searchQuery]);

  const handleSelect = (id: string) => {
    const mentor = mentors.find((m) => m.id === id) ?? null;
    setSelectedMentor(mentor);
  };

  const handleClose = React.useCallback(() => setSelectedMentor(null), []);

  return (
    <div>
      <div className="animate-reveal">
        <HeroSection onBecomeMentor={() => setShowBecomeModal(true)} />
      </div>

      {/* Search + Filters */}
      <div className="mt-8 animate-reveal" style={{ animationDelay: "80ms" }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, institution, or topic..."
            className="pl-9"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {FIELD_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setActiveField(f.id);
                setSearchQuery("");
              }}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                activeField === f.id
                  ? "border-saffron/40 bg-saffron/10 text-saffron"
                  : "border-line bg-surface text-muted hover:text-ink"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div
        id="mentor-grid"
        className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {filtered.map((mentor, index) => (
          <div
            key={mentor.id}
            className="animate-reveal h-full"
            style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
          >
            <MentorCard mentor={mentor} onSelect={handleSelect} />
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="mt-16 text-center">
          <p className="text-muted">
            {searchQuery.trim() !== ""
              ? "No mentors match your search. Try a different keyword."
              : "No mentors in this category yet. Check back soon."}
          </p>
          {searchQuery.trim() === "" && (
            <button
              type="button"
              onClick={() => setActiveField("all")}
              className="mt-4 inline-flex rounded-full border border-saffron/40 px-4 py-2 text-sm font-medium text-saffron transition-all hover:bg-saffron/10"
            >
              Browse all
            </button>
          )}
        </div>
      )}

      {/* Footer note */}
      <p className="mt-8 text-center text-xs text-faint">
        Profiles are illustrative samples. Mentor availability and response times may vary.
      </p>

      {/* Become a mentor modal */}
      <BecomeMentorModal open={showBecomeModal} onClose={() => setShowBecomeModal(false)} />

      {/* Detail modal */}
      <MentorDetailModal
        mentor={selectedMentor}
        onClose={handleClose}
      />
    </div>
  );
}