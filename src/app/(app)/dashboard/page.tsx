"use client";

import Link from "next/link";
import { ArrowRight, Target, Rocket, Wallet, FileText, Sparkles, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SourceTag } from "@/components/stat";
import { SavePlanButton } from "@/components/save-plan-button";
import { useStudent } from "@/lib/store";
import { getMajorsByStream, getRealityCheck } from "@/lib/data";
import { nustAggregate, fastAggregate, mdcatAggregate, pct } from "@/lib/aggregates";
import type { Stream } from "@/lib/types";

const streamLabel: Record<Stream, string> = {
  "pre-medical": "FSc Pre-Medical",
  "pre-engineering": "FSc Pre-Engineering",
  ics: "ICS",
  icom: "I.Com",
  alevel: "A-Levels",
};

const streamReality: Record<Stream, string> = {
  "pre-medical": "mdcat-ratio",
  "pre-engineering": "nust-aggregate",
  ics: "it-exports",
  icom: "income",
  alevel: "abroad",
};

export default function DashboardPage() {
  const { profile } = useStudent();
  const stream = profile.stream ?? "pre-engineering";
  const majors = getMajorsByStream(stream);
  const rc = getRealityCheck(streamReality[stream]);

  const fscPct = pct(profile.marks.fscObtained, profile.marks.fscTotal);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="saffron">{streamLabel[stream]}</Badge>
            {fscPct > 0 && <Badge variant="emerald" className="font-mono">{fscPct.toFixed(1)}%</Badge>}
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Salam{profile.name ? `, ${profile.name}` : ""}. Here&apos;s your map.
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <SavePlanButton />
          <Link href="/onboard" className="text-sm text-muted hover:text-saffron">
            Edit profile →
          </Link>
        </div>
      </div>

      {rc && (
        <Card className="mt-8 overflow-hidden border-danger/20">
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-danger/10 text-danger">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-mono text-xs uppercase tracking-widest text-danger">Reality check · {streamLabel[stream]}</p>
              <p className="mt-2 text-lg font-semibold text-ink">{rc.fact}</p>
              <p className="mt-1 text-sm text-muted" dir="rtl">{rc.urdu}</p>
              <div className="mt-3">
                <SourceTag stat={rc.stat} />
              </div>
            </div>
          </div>
        </Card>
      )}

      {fscPct > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {(stream === "pre-medical"
            ? [mdcatAggregate(profile.marks)]
            : stream === "icom"
            ? []
            : [nustAggregate(profile.marks), fastAggregate(profile.marks)]
          ).map((a) => (
            <Card key={a.name} className="p-5">
              <p className="text-xs uppercase tracking-widest text-muted">{a.name} aggregate</p>
              <p className="mt-2 font-mono text-4xl font-bold text-saffron">{a.value.toFixed(2)}%</p>
              <p className="mt-2 text-xs text-muted">{a.note}</p>
              <Link href="/merit" className="mt-3 inline-flex items-center gap-1 text-sm text-saffron hover:underline">
                Explore merit <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-12">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Fields that fit your stream</h2>
          <Link href="/career" className="text-sm text-muted hover:text-saffron">All fields →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {majors.slice(0, 6).map((m) => (
            <Link key={m.id} href={`/career/${m.id}`} className="card-glass group rounded-2xl p-5 transition-all hover:-translate-y-1 hover:border-saffron/40">
              <div className="flex items-start justify-between">
                <span className="text-3xl">{m.emoji}</span>
                <Badge variant={m.demand === "high" ? "emerald" : "default"}>{m.demand} demand</Badge>
              </div>
              <h3 className="mt-3 text-lg font-bold text-ink sm:text-xl">{m.name}</h3>
              <p className="mt-1 text-sm text-muted">{m.tagline}</p>
              <p className="mt-3 font-mono text-sm text-saffron">
                {m.salaryRange.low / 1000}k – {m.salaryRange.high / 1000}k {m.salaryRange.currency.replace("/mo", "")}/mo
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Target, title: "Merit engine", desc: "NUST · FAST · UET · PMDC", href: "/merit" },
          { icon: Rocket, title: "Try a major", desc: "Day-in-the-life sims", href: "/career" },
          { icon: Wallet, title: "Budget agent", desc: "Cost + scholarships", href: "/money" },
          { icon: FileText, title: "Parent report", desc: "Bilingual, printable", href: "/convince" },
        ].map((c) => (
          <Link key={c.title} href={c.href} className="card-glass group flex items-center gap-3 rounded-2xl p-4 transition-colors hover:border-saffron/40">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface-2 text-saffron">
              <c.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-ink">{c.title}</p>
              <p className="text-xs text-muted">{c.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-saffron/20 bg-saffron/5 p-6 text-center">
        <Sparkles className="mx-auto h-6 w-6 text-saffron" />
        <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Talk to Rahbar</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">
          Your guidance counselor — grounded in real Pakistani data. Ask anything.
        </p>
        <Button className="mt-4" onClick={() => document.dispatchEvent(new CustomEvent("open-chat", { detail: "rahbar" }))}>
          Ask Rahbar <ArrowRight />
        </Button>
      </div>
    </div>
  );
}
