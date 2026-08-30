"use client";

import { Download, Link2 } from "lucide-react";
import type { TemplateId } from "@/lib/resume-model";
import { cn } from "@/lib/utils";

export interface BuilderHeaderProps {
  template: TemplateId;
  onTemplateChange: (template: TemplateId) => void;
  onDownload: () => void;
  onShare: () => void;
}

const TEMPLATES: { id: TemplateId; label: string; swatch: string }[] = [
  { id: "academic", label: "Academic", swatch: "bg-white" },
  { id: "silicon", label: "Silicon", swatch: "border border-[#334155] bg-[#0F172A]" },
  {
    id: "glass",
    label: "Glass",
    swatch: "border border-[#475569]/40 bg-gradient-to-br from-[#64748b]/70 via-[#334155]/50 to-[#0f172a]",
  },
];

export function BuilderHeader({
  template,
  onTemplateChange,
  onDownload,
  onShare,
}: BuilderHeaderProps) {
  return (
    <div className="sticky top-16 z-30 -mx-4 border-b border-[#1f1f2a] bg-[#09090B]/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="mr-1 hidden text-xs font-medium text-[#555d6e] sm:inline">Template</span>
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={template === t.id}
              onClick={() => onTemplateChange(t.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                template === t.id
                  ? "border-[#3B82F6] bg-[#3B82F6]/10 text-white"
                  : "border-[#333] bg-[#111118] text-[#8a93a6] hover:border-[#555] hover:text-white"
              )}
            >
              <span aria-hidden="true" className={cn("h-3 w-3 rounded-[3px] shadow-sm", t.swatch)} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_-6px_rgba(59,130,246,0.7)] transition-colors hover:bg-[#2563eb]"
          >
            <Download className="h-4 w-4" />
            Download Clean PDF
          </button>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-2 rounded-lg border border-[#333] bg-transparent px-4 py-2 text-sm font-medium text-[#8a93a6] transition-colors hover:border-[#555] hover:text-white"
          >
            <Link2 className="h-4 w-4" />
            Get Live Web Link
          </button>
        </div>
      </div>
    </div>
  );
}
