"use client";

import { Languages, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { language, setLanguage, translating } = useLanguage();
  const isUrdu = language === "ur";
  return (
    <button
      type="button"
      onClick={() => setLanguage(isUrdu ? "en" : "ur")}
      aria-pressed={isUrdu}
      aria-label={isUrdu ? "Switch to English" : "اردو میں تبدیل کریں"}
      data-no-translate
      className={cn(
        "inline-flex min-h-11 items-center gap-2 border-2 border-ink bg-surface px-3 py-2 font-sans text-sm font-bold text-ink shadow-[3px_3px_0_0_var(--color-ink)] transition-transform hover:bg-surface-2 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        className
      )}
    >
      {translating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
      <span>{isUrdu ? "English" : "اردو"}</span>
    </button>
  );
}
