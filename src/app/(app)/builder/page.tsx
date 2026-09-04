"use client";

import { Badge } from "@/components/ui/badge";
import { Builder } from "@/components/builder/builder";
import { useStudent } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import type { ResumeData } from "@/lib/resume-model";

/** Build a starting resume from the student's real profile instead of mock data. */
function resumeFromProfile(name: string, email: string, city: string, streamLabel: string, skills: string[]): ResumeData {
  const tech = skills.slice(0, 5);
  const soft = skills.slice(5, 8);
  return {
    identity: {
      name,
      email,
      phone: "",
      location: city,
      github: "",
      linkedin: "",
      targetRole: streamLabel || "",
    },
    experience: { rawNotes: "", bullets: [], polished: false },
    projects: { entries: [], academics: [], certificates: [], leadership: [] },
    skills: { tech, soft },
  };
}

export default function BuilderPage() {
  const { profile, hydrated } = useStudent();
  const { user } = useAuth();

  const hasProfile = hydrated && (profile.name || profile.city || profile.skills.length > 0);

  const initial = hasProfile
    ? resumeFromProfile(
        profile.name,
        user?.email || "",
        profile.city,
        profile.stream ? profile.stream : "",
        profile.skills
      )
    : undefined;

  return (
    <div data-tour="cv-builder" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2">
        <Badge variant="violet">CV Builder</Badge>
        <span className="font-mono text-xs text-faint">polish · quantify · impress</span>
      </div>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
        Build a CV that gets a <span className="text-violet">second look.</span>
      </h1>
      <p className="mt-2 max-w-xl text-muted">
        Turn rough notes into recruiter-ready bullets, watch your ATS score climb in real time, and
        download a clean PDF when you&apos;re done.
      </p>

      <Builder initial={initial} />
    </div>
  );
}