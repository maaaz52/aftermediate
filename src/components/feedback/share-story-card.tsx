"use client";

import { useRef } from "react";
import { Download } from "lucide-react";
import { CLOSINGS, type ToneId } from "@/lib/feedback-model";

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "story";
}

export function ShareStoryCard({
  name,
  tone,
  rating,
  quote,
  personas,
  date,
}: {
  name: string;
  tone: ToneId;
  rating: number;
  quote: string;
  personas: string[];
  date: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const downloadPng = async () => {
    const node = cardRef.current;
    if (!node) return;
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(node, { backgroundColor: "#ffffff", scale: 2 });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `your-voice-${slugify(name)}.png`;
    a.click();
  };

  const downloadPdf = async () => {
    const node = cardRef.current;
    if (!node) return;
    const { default: html2pdf } = await import("html2pdf.js");
    await html2pdf()
      .set({
        margin: 10,
        filename: `your-voice-${slugify(name)}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(node)
      .save();
  };

  return (
    <div>
      <div
        ref={cardRef}
        className="mx-auto max-w-sm rounded-2xl border border-line bg-surface p-6 text-ink"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-saffron">Your Voice · aftermediate</p>
        <h3 className="mt-4 text-2xl font-extrabold">{name}</h3>
        <p className="mt-1 text-sm text-muted">{new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
        <p className="mt-6 text-5xl font-black tabular-nums text-saffron">{rating}<span className="text-xl text-faint">/10</span></p>
        <p className="mt-4 text-base italic leading-relaxed text-ink">“{quote}”</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {personas.map((p) => (
            <span key={p} className="rounded-full border border-line px-3 py-1 text-xs text-muted">
              recommends for {p}
            </span>
          ))}
        </div>
        <p className="mt-6 border-t border-line pt-4 text-xs text-faint">{CLOSINGS[tone]}</p>
      </div>

      <div className="mt-4 flex justify-center gap-3">
        <button
          type="button"
          onClick={downloadPng}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-soft"
        >
          <Download className="h-4 w-4" aria-hidden /> Download PNG
        </button>
        <button
          type="button"
          onClick={downloadPdf}
          className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-saffron/40"
        >
          <Download className="h-4 w-4" aria-hidden /> Download PDF
        </button>
      </div>
    </div>
  );
}
