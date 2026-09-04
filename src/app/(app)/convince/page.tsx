"use client";

import * as React from "react";
import { FileText, Gauge, Printer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SourceTag } from "@/components/stat";
import { MiniLineChart } from "@/components/mini-charts";
import { useStudent } from "@/lib/store";
import { data } from "@/lib/data";
import { worthScore, pct } from "@/lib/aggregates";

function ConvinceChart() {
  const d = [
    { year: "FY24", value: 3.2 },
    { year: "FY25", value: 3.8 },
    { year: "FY26", value: 4.6 },
  ];
  return <MiniLineChart points={d} color="var(--color-emerald)" />;
}

export default function ConvincePage() {
  const { profile } = useStudent();
  const fscPct = pct(profile.marks.fscObtained, profile.marks.fscTotal);

  const [certifications, setCertifications] = React.useState(profile.quiz.certifications ?? 0);
  const [projects, setProjects] = React.useState(profile.quiz.projects ?? 0);
  const [english, setEnglish] = React.useState(profile.quiz.english ?? 3);
  const [consistency, setConsistency] = React.useState(profile.quiz.consistency ?? 3);
  const worth = worthScore({ fscPct, certifications, projects, english, consistency });

  const rcIt = data.realities.find((r) => r.id === "it-exports")!;
  const rcJobs = data.realities.find((r) => r.id === "youth-unemployment")!;
  const rcMdcat = data.realities.find((r) => r.id === "mdcat-ratio")!;

  return (
    <div data-tour="convince" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2">
        <Badge variant="danger">Convince</Badge>
        <span className="font-mono text-xs text-faint">worth · parents</span>
      </div>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">Show this to your parents.</h1>
      <p className="mt-2 max-w-xl text-muted">
        A bilingual, data-backed report that turns &quot;beta, doctor bano&quot; into an informed conversation.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="overflow-hidden" id="parent-report">
          <div className="border-b border-line bg-surface-2/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-saffron" />
                <h2 className="text-lg font-bold text-ink sm:text-xl">The Parent Convincer</h2>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Save PDF
              </Button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="font-mono text-3xl font-bold text-danger">{rcMdcat.stat.value.split("vs")[0].trim()}</p>
                <p className="mt-1 text-sm text-muted">MBBS candidates vs ~11k seats</p>
                <p className="mt-2 text-sm text-ink" dir="rtl">{rcMdcat.urdu}</p>
              </div>
              <div>
                <p className="font-mono text-3xl font-bold text-emerald">{rcIt.stat.value.split(",")[0]}</p>
                <p className="mt-1 text-sm text-muted">IT exports, fastest-growing</p>
                <p className="mt-2 text-sm text-ink" dir="rtl">{rcIt.urdu}</p>
              </div>
              <div>
                <p className="font-mono text-3xl font-bold text-saffron">{rcJobs.stat.value}</p>
                <p className="mt-1 text-sm text-muted">Youth unemployment</p>
                <p className="mt-2 text-sm text-ink" dir="rtl">{rcJobs.urdu}</p>
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-2 text-xs uppercase tracking-widest text-faint">IT exports trend (US$ billions)</p>
              <ConvinceChart />
            </div>

            <div className="mt-6 rounded-xl border border-line bg-surface-2/50 p-4">
              <p className="text-sm font-medium text-ink">The takeaway for parents</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Your child&apos;s marks are one input — not a verdict. The fastest-growing jobs in Pakistan are
                in technology, and with a clear plan, a non-medical or non-traditional path can out-earn a
                conventional one. Let&apos;s choose with data, not fear.
              </p>
              <p className="mt-3 text-sm text-ink" dir="rtl">
                آپ کے بچے کے نمبر صرف ایک معیار ہیں، فیصلہ نہیں۔ پاکستان میں سب سے تیزی سے بڑھتی ہوئی نوکریاں
                ٹیکنالوجی میں ہیں۔ صحیح منصوبے کے ساتھ، غیر روایتی راستہ بھی بہترین کما سکتا ہے۔
              </p>
            </div>

            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-[11px] text-faint">
                <span>Sources</span>
              </div>
              <SourceTag stat={rcMdcat.stat} />
              <SourceTag stat={rcIt.stat} />
              <SourceTag stat={rcJobs.stat} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-violet" />
            <h2 className="text-lg font-bold text-ink sm:text-xl">Your Career Credit Score</h2>
          </div>
          <div className="mt-5 flex items-center gap-5">
            <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl border border-violet/30 bg-violet/10">
              <span className="font-mono text-4xl font-bold text-violet">{worth.score}</span>
            </div>
            <div>
              <p className="font-semibold text-ink">{worth.label}</p>
              <p className="text-xs text-muted">out of 100, based on your profile</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <Label>Certifications (0-4)</Label>
            <Input type="number" min={0} max={4} value={certifications} onChange={(e) => setCertifications(Number(e.target.value))} className="font-mono" />
            <Label>Projects / experience (0-4)</Label>
            <Input type="number" min={0} max={4} value={projects} onChange={(e) => setProjects(Number(e.target.value))} className="font-mono" />
            <Label>English level: {english}/5</Label>
            <input type="range" min={1} max={5} value={english} onChange={(e) => setEnglish(Number(e.target.value))} className="w-full accent-violet" />
            <Label>Consistency: {consistency}/5</Label>
            <input type="range" min={1} max={5} value={consistency} onChange={(e) => setConsistency(Number(e.target.value))} className="w-full accent-violet" />
          </div>
          <div className="mt-6 space-y-2">
            {worth.breakdown.map((b) => (
              <div key={b.key} className="flex items-center justify-between text-sm">
                <span className="text-muted">{b.key}</span>
                <span className="font-mono text-ink">{b.value} / {b.weight}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
