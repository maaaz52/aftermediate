"use client";

import html2pdf from "html2pdf.js";
import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { mockResume } from "@/data/resume-mock";
import {
  applyAutoFix as applyAutoFixEngine,
  computeAts,
  generateFeedback,
  polishNotes as polishNotesEngine,
  type FeedbackItem,
  type RecruiterMode,
  type ResumeData,
  type TabId,
  type TemplateId,
} from "@/lib/resume-model";
import { BuilderHeader } from "./builder-header";
import { InputPanel, type AcademicEntry, type ProjectEntry } from "./input-panel";
import { AtsPanel } from "./ats-panel";
import { ResumeCanvas } from "./resume-canvas";
import { ShareModal, slugify } from "./share-modal";

/** Length of the "AI polishing…" animation before bullets land. */
export const POLISH_DELAY_MS = 600;

/**
 * Full state + handler surface owned by the Builder orchestrator.
 *
 * Task 3 consumers (resume-canvas.tsx, ats-panel.tsx) are rendered by Builder
 * and receive slices of this interface:
 * - canvas: resume, template, mode, updateBullet
 * - ats panel: mode, setMode, ats, feedback, applyAutoFix
 */
export interface BuilderState {
  resume: ResumeData;
  activeTab: TabId;
  template: TemplateId;
  mode: RecruiterMode;
  polishing: boolean;
  ats: ReturnType<typeof computeAts>;
  feedback: FeedbackItem[];
  setActiveTab: (tab: TabId) => void;
  setTemplate: (template: TemplateId) => void;
  setMode: (mode: RecruiterMode) => void;
  updateIdentity: (patch: Partial<ResumeData["identity"]>) => void;
  updateExperience: (patch: Partial<ResumeData["experience"]>) => void;
  polishExperience: () => void;
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
  applyAutoFix: (item: FeedbackItem) => void;
}

/** Dark matte page with subtle 24px grid lines (spec: #09090B). */
const GRID_BG =
  "bg-[repeating-linear-gradient(0deg,transparent,transparent_24px,rgba(255,255,255,0.02)_25px),repeating-linear-gradient(90deg,transparent,transparent_24px,rgba(255,255,255,0.02)_25px)]";

export function Builder() {
  const [resume, setResume] = useState<ResumeData>(mockResume);
  const [activeTab, setActiveTab] = useState<TabId>("identity");
  const [template, setTemplate] = useState<TemplateId>("academic");
  const [mode, setMode] = useState<RecruiterMode>("startup");
  const [polishing, setPolishing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const polishingRef = useRef(false);
  const polishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (polishTimer.current) clearTimeout(polishTimer.current);
    };
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────
  const ats = useMemo(() => computeAts(resume, mode), [resume, mode]);
  const feedback = useMemo(() => generateFeedback(resume, mode), [resume, mode]);

  // ── Identity ───────────────────────────────────────────────────────────
  const updateIdentity = useCallback((patch: Partial<ResumeData["identity"]>) => {
    setResume((r) => ({ ...r, identity: { ...r.identity, ...patch } }));
  }, []);

  const setTargetRole = useCallback((targetRole: string) => {
    setResume((r) => ({ ...r, identity: { ...r.identity, targetRole } }));
  }, []);

  // ── Experience ─────────────────────────────────────────────────────────
  const updateExperience = useCallback((patch: Partial<ResumeData["experience"]>) => {
    setResume((r) => ({ ...r, experience: { ...r.experience, ...patch } }));
  }, []);

  const polishExperience = useCallback(() => {
    if (polishingRef.current) return;
    polishingRef.current = true;
    setPolishing(true);
    polishTimer.current = setTimeout(() => {
      setResume((r) => {
        const bullets = polishNotesEngine(r.experience.rawNotes);
        return { ...r, experience: { ...r.experience, bullets, polished: true } };
      });
      setPolishing(false);
      polishingRef.current = false;
    }, POLISH_DELAY_MS);
  }, []);

  const updateBullet = useCallback((index: number, bullet: string) => {
    setResume((r) => ({
      ...r,
      experience: {
        ...r.experience,
        bullets: r.experience.bullets.map((b, i) => (i === index ? bullet : b)),
      },
    }));
  }, []);

  const removeBullet = useCallback((index: number) => {
    setResume((r) => ({
      ...r,
      experience: {
        ...r.experience,
        bullets: r.experience.bullets.filter((_, i) => i !== index),
      },
    }));
  }, []);

  // ── Projects ───────────────────────────────────────────────────────────
  const addProject = useCallback(() => {
    setResume((r) => ({
      ...r,
      projects: {
        ...r.projects,
        entries: [...r.projects.entries, { title: "", org: "", year: "", description: "" }],
      },
    }));
  }, []);

  const removeProject = useCallback((index: number) => {
    setResume((r) => ({
      ...r,
      projects: {
        ...r.projects,
        entries: r.projects.entries.filter((_, i) => i !== index),
      },
    }));
  }, []);

  const updateProject = useCallback((index: number, patch: Partial<ProjectEntry>) => {
    setResume((r) => ({
      ...r,
      projects: {
        ...r.projects,
        entries: r.projects.entries.map((e, i) => (i === index ? { ...e, ...patch } : e)),
      },
    }));
  }, []);

  // ── Academics ──────────────────────────────────────────────────────────
  const addAcademic = useCallback(() => {
    setResume((r) => ({
      ...r,
      projects: {
        ...r.projects,
        academics: [
          ...r.projects.academics,
          { degree: "", institution: "", score: "", years: "" },
        ],
      },
    }));
  }, []);

  const removeAcademic = useCallback((index: number) => {
    setResume((r) => ({
      ...r,
      projects: {
        ...r.projects,
        academics: r.projects.academics.filter((_, i) => i !== index),
      },
    }));
  }, []);

  const updateAcademic = useCallback((index: number, patch: Partial<AcademicEntry>) => {
    setResume((r) => ({
      ...r,
      projects: {
        ...r.projects,
        academics: r.projects.academics.map((a, i) => (i === index ? { ...a, ...patch } : a)),
      },
    }));
  }, []);

  // ── Certificates ───────────────────────────────────────────────────────
  const addCertificate = useCallback(() => {
    setResume((r) => ({
      ...r,
      projects: { ...r.projects, certificates: [...r.projects.certificates, ""] },
    }));
  }, []);

  const removeCertificate = useCallback((index: number) => {
    setResume((r) => ({
      ...r,
      projects: {
        ...r.projects,
        certificates: r.projects.certificates.filter((_, i) => i !== index),
      },
    }));
  }, []);

  const updateCertificate = useCallback((index: number, value: string) => {
    setResume((r) => ({
      ...r,
      projects: {
        ...r.projects,
        certificates: r.projects.certificates.map((c, i) => (i === index ? value : c)),
      },
    }));
  }, []);

  // ── Leadership ─────────────────────────────────────────────────────────
  const addLeadership = useCallback(() => {
    setResume((r) => ({
      ...r,
      projects: { ...r.projects, leadership: [...r.projects.leadership, ""] },
    }));
  }, []);

  const removeLeadership = useCallback((index: number) => {
    setResume((r) => ({
      ...r,
      projects: {
        ...r.projects,
        leadership: r.projects.leadership.filter((_, i) => i !== index),
      },
    }));
  }, []);

  const updateLeadership = useCallback((index: number, value: string) => {
    setResume((r) => ({
      ...r,
      projects: {
        ...r.projects,
        leadership: r.projects.leadership.map((l, i) => (i === index ? value : l)),
      },
    }));
  }, []);

  // ── Skills ─────────────────────────────────────────────────────────────
  const toggleSkill = useCallback((type: "tech" | "soft", skill: string) => {
    setResume((r) => {
      const current = r.skills[type];
      const exists = current.some((s) => s.toLowerCase() === skill.toLowerCase());
      const next = exists
        ? current.filter((s) => s.toLowerCase() !== skill.toLowerCase())
        : [...current, skill];
      return { ...r, skills: { ...r.skills, [type]: next } };
    });
  }, []);

  // ── Auto-fix (ATS panel 1-click repair) ───────────────────────────────
  const applyAutoFix = useCallback(
    (item: FeedbackItem) => {
      setResume((r) => applyAutoFixEngine(r, item, mode));
    },
    [mode]
  );

  // ── Toolbar handlers ──────────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    const node = canvasRef.current;
    if (!node) return;

    // html2pdf.js clones the node while .pdf-invert is applied, so dark
    // templates (silicon/glass) capture as white paper with dark text.
    node.classList.add("pdf-invert");
    // Hoisted (not inline) so the extra `pagebreak` key passes the literal
    // excess-property check against html2pdf.js's Html2PdfOptions.
    const options = {
      margin: 10,
      filename: `${slugify(resume.identity.name)}-resume.pdf`,
      image: { type: "jpeg", quality: 0.98 } as const,
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        ignoreElements: (el: Element) => el.classList.contains("resume-overlay"),
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" } as const,
      pagebreak: { mode: ["avoid-all"] },
    };
    try {
      await html2pdf().set(options).from(node).save();
    } finally {
      node.classList.remove("pdf-invert");
    }
  }, [resume.identity.name]);

  const handleShare = useCallback(() => {
    setShareOpen(true);
  }, []);

  const closeShare = useCallback(() => {
    setShareOpen(false);
  }, []);

  return (
    <div className={`mt-6 rounded-2xl bg-[#09090B] ${GRID_BG} p-4 sm:p-6`}>
      <BuilderHeader
        template={template}
        onTemplateChange={setTemplate}
        onDownload={handleDownload}
        onShare={handleShare}
      />

      <div className="mt-6 grid grid-cols-12 gap-4">
        {/* Left — input & skill transformer (30%) */}
        <div className="col-span-12 xl:col-span-4">
          <InputPanel
            resume={resume}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            updateIdentity={updateIdentity}
            updateExperience={updateExperience}
            polishExperience={polishExperience}
            polishing={polishing}
            updateBullet={updateBullet}
            removeBullet={removeBullet}
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
            toggleSkill={toggleSkill}
            setTargetRole={setTargetRole}
          />
        </div>

        {/* Center — live preview canvas (45%) */}
        <div className="col-span-12 xl:col-span-5">
          <ResumeCanvas
            ref={canvasRef}
            resume={resume}
            template={template}
            mode={mode}
            updateBullet={updateBullet}
          />
        </div>

        {/* Right — ATS recruiter simulator (25%) */}
        <div className="col-span-12 xl:col-span-3">
          <AtsPanel
            mode={mode}
            setMode={setMode}
            ats={ats}
            feedback={feedback}
            applyAutoFix={applyAutoFix}
          />
        </div>
      </div>

      <ShareModal
        open={shareOpen}
        onClose={closeShare}
        resume={resume}
        template={template}
      />
    </div>
  );
}
