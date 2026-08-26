"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Stethoscope,
  Cpu,
  MonitorSmartphone,
  Calculator,
  GraduationCap,
  Upload,
  ScanLine,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStudent } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Stream } from "@/lib/types";

const streams: { id: Stream; label: string; sub: string; icon: React.ElementType }[] = [
  { id: "pre-medical", label: "FSc Pre-Medical", sub: "Biology · Chemistry · Physics", icon: Stethoscope },
  { id: "pre-engineering", label: "FSc Pre-Engineering", sub: "Math · Chemistry · Physics", icon: Cpu },
  { id: "ics", label: "ICS", sub: "Computer Science · Physics · Math", icon: MonitorSmartphone },
  { id: "icom", label: "I.Com", sub: "Commerce · Accounting", icon: Calculator },
  { id: "alevel", label: "A-Levels", sub: "Cambridge International", icon: GraduationCap },
];

const interests = [
  "Medicine & Healthcare",
  "Technology & Coding",
  "Engineering & Machines",
  "Business & Finance",
  "Design & Creativity",
  "Data & Numbers",
  "Writing & Communication",
  "Teaching & Mentoring",
  "Research & Science",
  "Helping People",
  "Building Things",
  "Leadership",
];

export default function OnboardPage() {
  const router = useRouter();
  const { profile, update } = useStudent();
  const [step, setStep] = React.useState(0);
  const [scanning, setScanning] = React.useState(false);
  const [ocrError, setOcrError] = React.useState<string | null>(null);

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  const finish = () => {
    router.push("/dashboard");
  };

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setOcrError(null);
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
      update({
        marks: {
          matricObtained: json.matricObtained ?? profile.marks.matricObtained,
          matricTotal: json.matricTotal ?? profile.marks.matricTotal,
          fscObtained: json.fscObtained ?? profile.marks.fscObtained,
          fscTotal: json.fscTotal ?? profile.marks.fscTotal,
          fscPart1Obtained: json.fscPart1Obtained ?? undefined,
          fscPart1Total: json.fscPart1Total ?? undefined,
        },
      });
      if (json.stream) update({ stream: json.stream });
    } catch (err) {
      setOcrError("Couldn't read that image. You can enter marks manually below.");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="grid-bg relative min-h-screen">
      <header className="relative mx-auto flex h-20 max-w-3xl items-center justify-between px-4">
        <Link href="/"><Brand /></Link>
        <span className="font-mono text-xs text-faint">step {step + 1} / 3</span>
      </header>

      <main className="relative mx-auto max-w-3xl px-4 pb-24">
        <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-saffron transition-all duration-500"
            style={{ width: `${((step + 1) / 3) * 100}%` }}
          />
        </div>

        {step === 0 && (
          <div className="animate-rise">
            <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">What did you do in FSc?</h1>
            <p className="mt-2 text-muted">This decides which doors we map for you.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {streams.map((s) => {
                const active = profile.stream === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => update({ stream: s.id })}
                    className={cn(
                      "group flex items-center gap-4 rounded-2xl border p-5 text-left transition-all",
                      active
                        ? "border-saffron bg-saffron/10 shadow-[0_0_32px_-8px_rgba(245,185,66,0.5)]"
                        : "border-line bg-surface hover:border-saffron/40"
                    )}
                  >
                    <div className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-xl", active ? "bg-saffron text-background" : "bg-surface-2 text-muted group-hover:text-saffron")}>
                      <s.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-ink">{s.label}</p>
                      <p className="text-xs text-muted">{s.sub}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex justify-end">
              <Button size="lg" disabled={!profile.stream} onClick={next}>
                Continue <ArrowRight />
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-rise">
            <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">Upload your marksheet.</h1>
            <p className="mt-2 text-muted">We'll read it automatically. No typing.</p>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line bg-surface p-8 text-center transition-colors hover:border-saffron/50">
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                {scanning ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-saffron" />
                    <span className="text-sm text-muted">Scanning marksheet…</span>
                  </>
                ) : (
                  <>
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-saffron">
                      <ScanLine className="h-7 w-7" />
                    </div>
                    <span className="font-semibold text-ink">Scan marksheet</span>
                    <span className="text-xs text-faint">JPG or PNG — AI reads it</span>
                  </>
                )}
              </label>

              <div className="space-y-4">
                <p className="text-sm font-medium text-muted">Or enter marks manually</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Matric obtained</Label>
                    <Input
                      type="number"
                      className="mt-1 font-mono"
                      value={profile.marks.matricObtained || ""}
                      onChange={(e) => update({ marks: { ...profile.marks, matricObtained: Number(e.target.value) } })}
                    />
                  </div>
                  <div>
                    <Label>Matric total</Label>
                    <Input
                      type="number"
                      className="mt-1 font-mono"
                      value={profile.marks.matricTotal || ""}
                      onChange={(e) => update({ marks: { ...profile.marks, matricTotal: Number(e.target.value) } })}
                    />
                  </div>
                  <div>
                    <Label>FSc obtained</Label>
                    <Input
                      type="number"
                      className="mt-1 font-mono"
                      value={profile.marks.fscObtained || ""}
                      onChange={(e) => update({ marks: { ...profile.marks, fscObtained: Number(e.target.value) } })}
                    />
                  </div>
                  <div>
                    <Label>FSc total</Label>
                    <Input
                      type="number"
                      className="mt-1 font-mono"
                      value={profile.marks.fscTotal || ""}
                      onChange={(e) => update({ marks: { ...profile.marks, fscTotal: Number(e.target.value) } })}
                    />
                  </div>
                </div>
                {ocrError && <p className="text-sm text-danger">{ocrError}</p>}
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={back}><ArrowLeft /> Back</Button>
              <Button size="lg" onClick={next}>
                Continue <ArrowRight />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-rise">
            <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">What pulls you?</h1>
            <p className="mt-2 text-muted">Pick everything that sounds interesting. We'll connect the dots.</p>
            <div className="mt-8 flex flex-wrap gap-2.5">
              {interests.map((i) => {
                const active = profile.interests.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() =>
                      update({
                        interests: active
                          ? profile.interests.filter((x) => x !== i)
                          : [...profile.interests, i],
                      })
                    }
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                      active
                        ? "border-saffron bg-saffron/15 text-saffron"
                        : "border-line bg-surface text-muted hover:border-saffron/40 hover:text-ink"
                    )}
                  >
                    {i}
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={back}><ArrowLeft /> Back</Button>
              <Button size="lg" onClick={finish} className="gap-2">
                <Sparkles className="h-4 w-4" /> Build my map <ArrowRight />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
