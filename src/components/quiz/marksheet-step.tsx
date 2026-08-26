"use client";

import * as React from "react";
import { Loader2, ScanLine } from "lucide-react";
import type { Marks, Stream } from "@/lib/types";

interface Props {
  onExtract: (patch: { marks: Partial<Marks>; stream?: Stream }) => void;
}

export function MarksheetStep({ onExtract }: Props) {
  const [scanning, setScanning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setError(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "OCR failed");

      const marks: Partial<Marks> = {};
      if (json.matricObtained != null) marks.matricObtained = json.matricObtained;
      if (json.matricTotal != null) marks.matricTotal = json.matricTotal;
      if (json.fscObtained != null) marks.fscObtained = json.fscObtained;
      if (json.fscTotal != null) marks.fscTotal = json.fscTotal;
      if (json.fscPart1Obtained != null) marks.fscPart1Obtained = json.fscPart1Obtained;
      if (json.fscPart1Total != null) marks.fscPart1Total = json.fscPart1Total;

      onExtract({ marks, stream: json.stream ?? undefined });
    } catch {
      setError("Couldn't read that image. Enter your marks by hand below.");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="min-w-0">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed border-line bg-surface p-8 text-center transition-colors hover:border-accent">
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        {scanning ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <span className="text-sm text-muted">Scanning marksheet…</span>
          </>
        ) : (
          <>
            <div className="grid h-14 w-14 place-items-center border-2 border-ink bg-surface-2 text-accent">
              <ScanLine className="h-7 w-7" />
            </div>
            <span className="font-semibold text-ink">Scan your marksheet</span>
            <span className="font-mono text-[11px] text-faint">JPG or PNG — AI reads it</span>
          </>
        )}
      </label>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
