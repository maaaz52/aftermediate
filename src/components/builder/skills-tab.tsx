"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { suggestSkills, type ResumeData } from "@/lib/resume-model";
import { DARK_INPUT } from "./input-panel";

export interface SkillsTabProps {
  skills: ResumeData["skills"];
  targetRole: string;
  toggleSkill: (type: "tech" | "soft", skill: string) => void;
}

const STATIC_SKILLS = [
  "HTML",
  "CSS",
  "JavaScript",
  "Python",
  "Excel",
  "Canva",
  "Video Editing",
  "Research",
  "Communication",
  "Leadership",
  "Time Management",
  "Teamwork",
];

/** Role-keyword suggestions + curated list, deduped and minus already-selected skills. */
function buildSuggestions(targetRole: string, selected: string[], query: string): string[] {
  const combined: string[] = [];
  const seen = new Set<string>();
  for (const skill of [...suggestSkills(targetRole, selected), ...STATIC_SKILLS]) {
    const key = skill.toLowerCase();
    if (!seen.has(key) && !selected.some((s) => s.toLowerCase() === key)) {
      seen.add(key);
      combined.push(skill);
    }
  }
  const q = query.trim().toLowerCase();
  return q ? combined.filter((s) => s.toLowerCase().includes(q)) : combined;
}

function SkillGroup({
  type,
  label,
  skills,
  targetRole,
  toggleSkill,
}: {
  type: "tech" | "soft";
  label: string;
  skills: ResumeData["skills"];
  targetRole: string;
  toggleSkill: (type: "tech" | "soft", skill: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = skills[type];
  const suggestions = useMemo(
    () => buildSuggestions(targetRole, selected, query),
    [targetRole, selected, query]
  );

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[#8a93a6]">{label}</p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {selected.length === 0 && (
          <span className="text-xs text-[#555d6e]">Nothing selected yet.</span>
        )}
        {selected.map((skill) => (
          <button
            key={skill}
            type="button"
            aria-label={`Remove ${skill}`}
            onClick={() => toggleSkill(type, skill)}
            className="inline-flex items-center gap-1 rounded-full border border-[#3B82F6]/40 bg-[#3B82F6]/15 px-2.5 py-1 text-xs font-medium text-[#93c5fd] transition-colors hover:bg-[#3B82F6]/25"
          >
            {skill}
            <X className="h-3 w-3" />
          </button>
        ))}
      </div>

      <div className="relative mt-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          aria-label={`Search ${type} skills`}
          placeholder="Type to search skills…"
          className={DARK_INPUT}
        />
        {open && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 z-10 mt-1.5 max-h-44 overflow-y-auto rounded-lg border border-[#333] bg-[#15151f] p-1.5 shadow-2xl">
            <p className="px-2 pb-1 pt-1 text-[10px] font-medium uppercase tracking-wider text-[#555d6e]">
              {targetRole ? `Suggested for "${targetRole}"` : "Common skills"}
            </p>
            <div className="flex flex-wrap gap-1.5 p-1">
              {suggestions.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    toggleSkill(type, skill);
                    setQuery("");
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-[#333] bg-[#1a1a2e] px-2.5 py-1 text-xs text-[#8a93a6] transition-colors hover:border-[#3B82F6]/60 hover:text-white"
                >
                  <Plus className="h-3 w-3" />
                  {skill}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function SkillsTab({ skills, targetRole, toggleSkill }: SkillsTabProps) {
  return (
    <div className="space-y-5">
      <SkillGroup
        type="tech"
        label="Tech skills"
        skills={skills}
        targetRole={targetRole}
        toggleSkill={toggleSkill}
      />
      <SkillGroup
        type="soft"
        label="Soft skills"
        skills={skills}
        targetRole={targetRole}
        toggleSkill={toggleSkill}
      />
    </div>
  );
}
