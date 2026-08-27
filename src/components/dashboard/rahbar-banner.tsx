"use client";

import { Sparkles, ArrowRight } from "lucide-react";

export function RahbarBanner() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-linear-to-r from-saffron to-saffron-soft px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2 text-sm font-semibold text-white">
        <Sparkles className="h-4 w-4 shrink-0" /> Stuck? Ask Rahbar — your AI counselor, grounded in Pakistani data.
      </p>
      <button
        onClick={() => document.dispatchEvent(new CustomEvent("open-rahbar"))}
        className="inline-flex items-center gap-1.5 self-start rounded-lg bg-white px-4 py-2 text-xs font-bold text-saffron transition-transform hover:-translate-y-0.5 sm:self-auto"
      >
        Ask Rahbar <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}