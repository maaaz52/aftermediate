"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ResumeData, TemplateId } from "@/lib/resume-model";
import { escapeHtml } from "@/lib/escape-html";

export interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  resume: ResumeData;
  template: TemplateId;
}

/** "Hira Ahmed" → "hira-ahmed"; non-alphanumerics become single dashes. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** All templates print ink-friendly: white background + dark text. */
const PRINT_RULE =
  "@media print { body { background: white !important; color: #111 !important; } }";

const TEMPLATE_CSS: Record<TemplateId, string> = {
  academic: `
    * { box-sizing: border-box; margin: 0; }
    body { background: #ffffff; color: #1a1a1a; font-family: Georgia, 'Times New Roman', serif; max-width: 640px; margin: 0 auto; padding: 40px 32px; }
    .name { text-align: center; text-transform: uppercase; font-size: 26px; font-weight: 700; letter-spacing: 0.12em; }
    .contact { text-align: center; color: #444; font-size: 12px; margin-top: 6px; }
    .role { text-align: center; font-style: italic; color: #333; font-size: 13px; margin-top: 8px; }
    .rule { border: 0; border-top: 1px solid rgba(26, 26, 26, 0.2); margin: 14px 0; }
    h2 { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 8px; }
    p { font-size: 13px; line-height: 1.55; }
    a { color: #1a1a1a; }
    .meta { color: #555; font-size: 12px; }
    .pill { display: inline-block; border: 1px solid rgba(26, 26, 26, 0.15); background: #f5f5f5; border-radius: 999px; padding: 2px 10px; font-size: 11px; margin: 0 4px 4px 0; }
    ${PRINT_RULE}
  `,
  silicon: `
    * { box-sizing: border-box; margin: 0; }
    body { background: #0F172A; color: #f1f5f9; font-family: Inter, system-ui, -apple-system, sans-serif; max-width: 640px; margin: 0 auto; padding: 32px 24px; }
    .name { font-size: 22px; font-weight: 700; }
    .contact { color: #94a3b8; font-size: 12px; margin-top: 4px; }
    a { color: #3B82F6; }
    .role { color: #cbd5e1; font-size: 12px; margin-top: 6px; font-weight: 500; }
    .rule { border: 0; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 12px 0; }
    h2 { color: #3B82F6; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
    p { font-size: 13px; line-height: 1.5; }
    .meta { color: #94a3b8; font-size: 12px; }
    .pill { display: inline-block; border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.05); border-radius: 999px; padding: 2px 10px; font-size: 11px; margin: 0 4px 4px 0; }
    ${PRINT_RULE}
  `,
  glass: `
    * { box-sizing: border-box; margin: 0; }
    body { background: linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(17, 24, 39, 0.95) 50%, #0f172a); color: #f1f5f9; font-family: Inter, system-ui, -apple-system, sans-serif; max-width: 640px; margin: 0 auto; padding: 32px 24px; }
    .header { display: flex; align-items: center; gap: 12px; }
    .avatar { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 9999px; background: linear-gradient(135deg, #3B82F6, #10B981); color: #ffffff; font-weight: 700; flex-shrink: 0; }
    .name { font-size: 20px; font-weight: 700; }
    a { color: #3B82F6; }
    .role { color: #cbd5e1; font-size: 12px; }
    .contact { color: #94a3b8; font-size: 12px; margin-top: 4px; }
    .section { border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.05); padding: 14px 16px; margin-bottom: 14px; }
    h2 { color: #3B82F6; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
    p { font-size: 13px; line-height: 1.5; }
    .meta { color: #94a3b8; font-size: 12px; }
    .pill { display: inline-block; border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.05); border-radius: 999px; padding: 2px 10px; font-size: 11px; margin: 0 4px 4px 0; }
    ${PRINT_RULE}
  `,
};

/** Section wrapper — glass gets the rounded card treatment. */
function section(title: string, content: string, template: TemplateId): string {
  const inner = `<h2>${title}</h2>${content}`;
  return template === "glass" ? `<section class="section">${inner}</section>` : `<section>${inner}</section>`;
}

/** Contact line (email · phone · location) and social links, template-aware. */
function headerHtml(resume: ResumeData, template: TemplateId): string {
  const { identity } = resume;
  const name = escapeHtml(identity.name.trim() || "Your Name");
  const contact = [identity.email, identity.phone, identity.location]
    .filter(Boolean)
    .map(escapeHtml)
    .join(" · ");
  const socials: string[] = [];
  if (identity.email) socials.push(`<a href="mailto:${escapeHtml(identity.email)}">${escapeHtml(identity.email)}</a>`);
  if (identity.github) socials.push(`<a href="${escapeHtml(identity.github)}">${escapeHtml(identity.github.replace(/^https?:\/\//, ""))}</a>`);
  if (identity.linkedin) socials.push(`<a href="${escapeHtml(identity.linkedin)}">${escapeHtml(identity.linkedin.replace(/^https?:\/\//, ""))}</a>`);
  const socialLine = socials.length > 0 ? `<p class="contact">${socials.join(" · ")}</p>` : "";
  const role = identity.targetRole ? `<p class="role">${escapeHtml(identity.targetRole)}</p>` : "";

  if (template === "glass") {
    const initial = escapeHtml(identity.name.trim().charAt(0).toUpperCase() || "?");
    return `<header><div class="header"><div class="avatar">${initial}</div><div><h1 class="name">${name}</h1>${role}</div></div>${contact ? `<p class="contact">${contact}</p>` : ""}${socialLine}</header>`;
  }
  return `<header><h1 class="name">${name}</h1>${contact ? `<p class="contact">${contact}</p>` : ""}${socialLine}${role}</header>`;
}

/**
 * Build a complete standalone HTML document for the resume. Pure function —
 * no DOM access, unit-testable. Print-friendly: all templates render with a
 * white background and dark text when printed.
 */
export function buildStandaloneHtml(resume: ResumeData, template: TemplateId): string {
  const { experience, projects, skills } = resume;
  const esc = escapeHtml;

  const sections: string[] = [];

  if (experience.bullets.length > 0) {
    const content = experience.bullets.map((b) => `<p>${esc(b)}</p>`).join("");
    sections.push(section("Experience", content, template));
  }

  const entries = projects.entries.filter((e) => e.title.trim() || e.description.trim());
  if (entries.length > 0) {
    const content = entries
      .map(
        (e) =>
          `<p><strong>${esc(e.title)}</strong> ${e.org || e.year ? `<span class="meta">${esc([e.org, e.year].filter(Boolean).join(" · "))}</span>` : ""}</p>` +
          (e.description ? `<p>${esc(e.description)}</p>` : "")
      )
      .join("");
    sections.push(section("Projects", content, template));
  }

  const academics = projects.academics.filter((a) => a.degree.trim() || a.institution.trim());
  if (academics.length > 0) {
    const content = academics
      .map(
        (a) =>
          `<p><strong>${esc(a.degree)}</strong> <span class="meta">${esc([a.institution, a.score, a.years].filter(Boolean).join(" · "))}</span></p>`
      )
      .join("");
    sections.push(section("Academics", content, template));
  }

  const certificates = projects.certificates.filter((c) => c.trim());
  if (certificates.length > 0) {
    const content = certificates.map((c) => `<p>• ${esc(c)}</p>`).join("");
    sections.push(section("Certificates", content, template));
  }

  const leadership = projects.leadership.filter((l) => l.trim());
  if (leadership.length > 0) {
    const content = leadership.map((l) => `<p>• ${esc(l)}</p>`).join("");
    sections.push(section("Leadership", content, template));
  }

  const allSkills = [...skills.tech, ...skills.soft];
  if (allSkills.length > 0) {
    const content = `<div>${allSkills.map((s) => `<span class="pill">${esc(s)}</span>`).join("")}</div>`;
    sections.push(section("Skills", content, template));
  }

  const name = esc(resume.identity.name.trim() || "Your Name");
  const body = sections.map((s) => `<hr class="rule" />\n${s}`).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${name} — Resume</title>
<style>${TEMPLATE_CSS[template]}</style>
</head>
<body>
${headerHtml(resume, template)}
${body}
</body>
</html>`;
}

export function ShareModal({ open, onClose, resume, template }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const url = `aftermediate.site/builder/view/${slugify(resume.identity.name)}`;

  // Move focus into the dialog on open; restore it to the trigger on close
  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => trigger?.focus();
  }, [open]);

  // Escape closes the dialog; Tab is trapped inside the panel
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "Tab") {
        const panel = panelRef.current;
        if (!panel) return;
        const focusable = panel.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) {
          event.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Clear the "Copied!" timer on unmount
  useEffect(() => {
    return () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
  }, []);

  if (!open) return null;

  const handleCopy = async () => {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions / insecure context) — ignore
    }
  };

  const handlePreview = () => {
    try {
      const doc = window.open("", "_blank");
      if (doc) {
        doc.document.write(buildStandaloneHtml(resume, template));
        doc.document.close();
      }
    } catch {
      // Popup blocked — ignore
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-[#222] bg-[#111118] p-6 shadow-2xl outline-none"
      >
        <h2 id="share-modal-title" className="text-lg font-bold text-white">
          Your Live Web Link
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-[#8a93a6]">
          Share this link with recruiters — opens a clean standalone view of your resume.
        </p>

        <div className="mt-4 rounded-lg border border-[#333] bg-[#0c0c12] px-3 py-2 font-mono text-sm text-[#3B82F6]">
          {url}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2563eb]"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
          <button
            type="button"
            onClick={handlePreview}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#333] bg-transparent px-4 py-2 text-sm font-medium text-[#8a93a6] transition-colors hover:border-[#555] hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            Open Standalone Preview
          </button>
        </div>
      </div>
    </div>
  );
}
