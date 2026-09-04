"use client";

import { Download, Link2 } from "lucide-react";
import type { TemplateId } from "@/lib/resume-model";
import { cn } from "@/lib/utils";

export interface BuilderHeaderProps {
  template: TemplateId;
  onTemplateChange: (template: TemplateId) => void;
  onDownload: () => void;
  onShare: () => void;
  downloading: boolean;
  saved: boolean;
}

const TEMPLATES: { id: TemplateId; label: string; swatch: string }[] = [
  { id: "academic", label: "Academic", swatch: "bg-white border border-line" },
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
  downloading,
  saved,
}: BuilderHeaderProps) {
  return (
    <div className="sticky top-16 z-30 -mx-4 border-b border-line bg-background/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="mr-1 hidden text-xs font-medium text-faint sm:inline">Template</span>
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={template === t.id}
              onClick={() => onTemplateChange(t.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                template === t.id
                  ? "border-saffron bg-saffron/10 text-ink"
                  : "border-line bg-surface text-muted hover:text-ink"
              )}
            >
              <span aria-hidden="true" className={cn("h-3 w-3 rounded-[3px] shadow-sm", t.swatch)} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {saved && (
            <span className="hidden text-[11px] font-medium text-emerald sm:inline">✓ Saved locally</span>
          )}
          <button
            type="button"
            onClick={onDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-lg bg-saffron px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_-6px_rgba(47,85,212,0.7)] transition-colors hover:bg-saffron-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {downloading ? "Preparing PDF…" : "Download Clean PDF"}
          </button>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-transparent px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            <Link2 className="h-4 w-4" />
            Preview Link
          </button>
        </div>
      </div>
    </div>
  );
}