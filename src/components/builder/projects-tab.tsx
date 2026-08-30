"use client";

import { Award, FolderKanban, GraduationCap, Plus, Users, X, type LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { ResumeData } from "@/lib/resume-model";
import { cn } from "@/lib/utils";
import { DARK_INPUT, type AcademicEntry, type ProjectEntry } from "./input-panel";

export interface ProjectsTabProps {
  projects: ResumeData["projects"];
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
}

function SectionTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#8a93a6]">
      <Icon className="h-3.5 w-3.5" />
      {title}
    </h3>
  );
}

function IconButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="rounded-md p-1 text-[#555d6e] transition-colors hover:bg-[#1a1a2e] hover:text-[#d63d3d]"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#333] px-3 py-1.5 text-xs font-medium text-[#8a93a6] transition-colors hover:border-[#3B82F6]/50 hover:text-white"
    >
      <Plus className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function DarkInput({
  label,
  value,
  placeholder,
  onChange,
  className,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <Input
      aria-label={label}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(DARK_INPUT, className)}
    />
  );
}

export function ProjectsTab({
  projects,
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
}: ProjectsTabProps) {
  return (
    <div className="space-y-5">
      {/* ── Projects ─────────────────────────────────────────── */}
      <section className="space-y-2">
        <SectionTitle icon={FolderKanban} title="Projects" />
        {projects.entries.length === 0 && (
          <p className="text-xs text-[#555d6e]">
            No projects yet — add a science fair entry, a channel, anything you built.
          </p>
        )}
        {projects.entries.map((entry, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-[#222] bg-[#0d0d15] p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#555d6e]">
                Project {i + 1}
              </span>
              <IconButton label={`Remove project ${i}`} onClick={() => removeProject(i)} />
            </div>
            <DarkInput
              label={`Project title ${i}`}
              value={entry.title}
              placeholder="Project title"
              onChange={(v) => updateProject(i, { title: v })}
            />
            <div className="grid grid-cols-2 gap-2">
              <DarkInput
                label={`Project org ${i}`}
                value={entry.org}
                placeholder="Org / context"
                onChange={(v) => updateProject(i, { org: v })}
              />
              <DarkInput
                label={`Project year ${i}`}
                value={entry.year}
                placeholder="Year"
                onChange={(v) => updateProject(i, { year: v })}
              />
            </div>
            <textarea
              aria-label={`Project description ${i}`}
              rows={2}
              value={entry.description}
              placeholder="What did you do and what happened?"
              onChange={(e) => updateProject(i, { description: e.target.value })}
              className={cn(
                DARK_INPUT,
                "w-full resize-y rounded-lg border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2"
              )}
            />
          </div>
        ))}
        <AddButton label="Add project" onClick={addProject} />
      </section>

      {/* ── Academics ────────────────────────────────────────── */}
      <section className="space-y-2">
        <SectionTitle icon={GraduationCap} title="Academics" />
        {projects.academics.length === 0 && (
          <p className="text-xs text-[#555d6e]">
            No academic entries — add your FSc / A-Level results.
          </p>
        )}
        {projects.academics.map((entry, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-[#222] bg-[#0d0d15] p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#555d6e]">
                Academic {i + 1}
              </span>
              <IconButton label={`Remove academic ${i}`} onClick={() => removeAcademic(i)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <DarkInput
                label={`Degree ${i}`}
                value={entry.degree}
                placeholder="Degree"
                onChange={(v) => updateAcademic(i, { degree: v })}
              />
              <DarkInput
                label={`Institution ${i}`}
                value={entry.institution}
                placeholder="Institution"
                onChange={(v) => updateAcademic(i, { institution: v })}
              />
              <DarkInput
                label={`Score ${i}`}
                value={entry.score}
                placeholder="Score / CGPA"
                onChange={(v) => updateAcademic(i, { score: v })}
              />
              <DarkInput
                label={`Years ${i}`}
                value={entry.years}
                placeholder="Years"
                onChange={(v) => updateAcademic(i, { years: v })}
              />
            </div>
          </div>
        ))}
        <AddButton label="Add academic" onClick={addAcademic} />
      </section>

      {/* ── Certificates ─────────────────────────────────────── */}
      <section className="space-y-2">
        <SectionTitle icon={Award} title="Certificates" />
        {projects.certificates.length === 0 && (
          <p className="text-xs text-[#555d6e]">
            No certificates yet — Coursera, DigiSkills, anything online.
          </p>
        )}
        {projects.certificates.map((cert, i) => (
          <div key={i} className="flex items-center gap-2">
            <DarkInput
              label={`Certificate ${i}`}
              value={cert}
              placeholder="e.g. Coursera Introduction to Biology"
              onChange={(v) => updateCertificate(i, v)}
            />
            <IconButton label={`Remove certificate ${i}`} onClick={() => removeCertificate(i)} />
          </div>
        ))}
        <AddButton label="Add certificate" onClick={addCertificate} />
      </section>

      {/* ── Leadership ───────────────────────────────────────── */}
      <section className="space-y-2">
        <SectionTitle icon={Users} title="Leadership" />
        {projects.leadership.length === 0 && (
          <p className="text-xs text-[#555d6e]">
            No leadership roles yet — house captain, club leads, team captains.
          </p>
        )}
        {projects.leadership.map((role, i) => (
          <div key={i} className="flex items-center gap-2">
            <DarkInput
              label={`Leadership ${i}`}
              value={role}
              placeholder="e.g. House Captain, Science Society"
              onChange={(v) => updateLeadership(i, v)}
            />
            <IconButton label={`Remove leadership ${i}`} onClick={() => removeLeadership(i)} />
          </div>
        ))}
        <AddButton label="Add leadership" onClick={addLeadership} />
      </section>
    </div>
  );
}
