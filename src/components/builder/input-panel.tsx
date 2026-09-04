"use client";

import { FolderKanban, User, Wrench, Zap, type LucideIcon } from "lucide-react";
import type { ResumeData, TabId } from "@/lib/resume-model";
import { cn } from "@/lib/utils";
import { ExperienceTab } from "./experience-tab";
import { IdentityTab } from "./identity-tab";
import { ProjectsTab } from "./projects-tab";
import { SkillsTab } from "./skills-tab";

// ---------------------------------------------------------------------------
// Shared types & styling tokens (also used by the tab components and by
// builder.tsx, which re-exports these for Task 3 consumers)
// ---------------------------------------------------------------------------

export type ProjectEntry = ResumeData["projects"]["entries"][number];
export type AcademicEntry = ResumeData["projects"]["academics"][number];

/** Light-theme input override matching the app's design system. */
export const INPUT_STYLE =
  "bg-surface border-line text-ink placeholder:text-faint focus-visible:ring-saffron/40 focus-visible:border-saffron/60";

export interface InputPanelProps {
  resume: ResumeData;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  updateIdentity: (patch: Partial<ResumeData["identity"]>) => void;
  updateExperience: (patch: Partial<ResumeData["experience"]>) => void;
  polishExperience: () => void;
  polishing: boolean;
  updateBullet: (index: number, bullet: string) => void;
  removeBullet: (index: number) => void;
  addProject: () => void;
  removeProject: (index: number) => void;
  updateProject: (index: number, patch: Partial<ProjectEntry>) => void;
  addAcademic: () => void;
  removeAcademic: (index: number) => void;
  updateAcademic: (index: number, patch: Partial<AcademicEntry>) => void;
  addCertificate: () => void;
  removeCertificate: (index: number) => void;
  updateCertificate: (index: number, value: string) => void;
  addLeadership: () => void;
  removeLeadership: (index: number) => void;
  updateLeadership: (index: number, value: string) => void;
  toggleSkill: (type: "tech" | "soft", skill: string) => void;
  setTargetRole: (role: string) => void;
}

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "identity", label: "Identity", icon: User },
  { id: "experience", label: "Experience", icon: Zap },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "skills", label: "Skills", icon: Wrench },
];

export function InputPanel({
  resume,
  activeTab,
  onTabChange,
  updateIdentity,
  updateExperience,
  polishExperience,
  polishing,
  updateBullet,
  removeBullet,
  addProject,
  removeProject,
  updateProject,
  addAcademic,
  removeAcademic,
  updateAcademic,
  addCertificate,
  removeCertificate,
  updateCertificate,
  addLeadership,
  removeLeadership,
  updateLeadership,
  toggleSkill,
  setTargetRole,
}: InputPanelProps) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3 shadow-sm sm:p-4">
      <div
        role="tablist"
        aria-label="Resume sections"
        className="grid grid-cols-4 gap-1 rounded-lg bg-surface-2 p-1"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`tab-${id}`}
            role="tab"
            type="button"
            aria-selected={activeTab === id}
            aria-controls={`panel-${id}`}
            onClick={() => onTabChange(id)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md px-1.5 py-2 text-xs font-semibold transition-colors",
              activeTab === id
                ? "border border-saffron bg-saffron/10 text-ink"
                : "border border-transparent text-muted hover:text-ink"
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* key-based remount gives the fade-in transition on tab switch */}
      <div
        key={activeTab}
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="animate-reveal mt-4"
      >
        {activeTab === "identity" && (
          <IdentityTab
            identity={resume.identity}
            updateIdentity={updateIdentity}
            setTargetRole={setTargetRole}
          />
        )}
        {activeTab === "experience" && (
          <ExperienceTab
            experience={resume.experience}
            polishing={polishing}
            updateExperience={updateExperience}
            polishExperience={polishExperience}
            updateBullet={updateBullet}
            removeBullet={removeBullet}
          />
        )}
        {activeTab === "projects" && (
          <ProjectsTab
            projects={resume.projects}
            addProject={addProject}
            removeProject={removeProject}
            updateProject={updateProject}
            addAcademic={addAcademic}
            removeAcademic={removeAcademic}
            updateAcademic={updateAcademic}
            addCertificate={addCertificate}
            removeCertificate={removeCertificate}
            updateCertificate={updateCertificate}
            addLeadership={addLeadership}
            removeLeadership={removeLeadership}
            updateLeadership={updateLeadership}
          />
        )}
        {activeTab === "skills" && (
          <SkillsTab
            skills={resume.skills}
            targetRole={resume.identity.targetRole}
            toggleSkill={toggleSkill}
          />
        )}
      </div>

      {/* On small screens the preview stacks below — a quick jump beats scrolling. */}
      <a
        href="#builder-preview"
        className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-saffron hover:underline xl:hidden"
      >
        Jump to live preview ↓
      </a>
    </div>
  );
}
