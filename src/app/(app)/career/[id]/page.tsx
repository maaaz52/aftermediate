"use client";

import * as React from "react";
import { use } from "react";
import Link from "next/link";
import { ArrowLeft, GitBranch, GraduationCap, Lightbulb, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SourceTag } from "@/components/stat";
import { getMajor, getCourses, data } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function MajorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const major = getMajor(id);

  const [picked, setPicked] = React.useState<number | null>(null);
  const [scenarioIdx, setScenarioIdx] = React.useState(0);

  if (!major) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Major not found.</h1>
        <Link href="/career" className="mt-4 inline-block text-saffron">← Back to career</Link>
      </div>
    );
  }

  const courses = getCourses(major.courses);
  const unis = data.universities.filter((u) => major.universities.includes(u.id));
  const scenario = major.dayInLife[scenarioIdx % major.dayInLife.length];

  function reset() {
    setPicked(null);
    setScenarioIdx((i) => (i + 1) % major!.dayInLife.length);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link href="/career" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All fields
      </Link>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-surface-2 text-5xl">{major.emoji}</div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="violet">{major.field}</Badge>
            <Badge variant={major.demand === "high" ? "emerald" : major.demand === "medium" ? "saffron" : "default"}>
              {major.demand} demand
            </Badge>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">{major.name}</h1>
          <p className="mt-2 text-lg text-muted">{major.tagline}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-widest text-muted">Entry salary</p>
          <p className="mt-2 font-mono text-2xl font-bold text-saffron">
            {major.salaryRange.low / 1000}k–{major.salaryRange.high / 1000}k
          </p>
          <p className="text-xs text-faint">{major.salaryRange.currency}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-widest text-muted">Why now</p>
          <p className="mt-2 font-mono text-xl font-bold text-emerald">{major.whyNow.value}</p>
          <div className="mt-2"><SourceTag stat={major.whyNow} /></div>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-widest text-muted">The one-liner</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{major.description}</p>
        </Card>
      </div>

      <section className="mt-12">
        <div className="mb-5 flex items-center gap-3">
          <Lightbulb className="h-5 w-5 text-saffron" />
          <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Try the major: a day in the life</h2>
        </div>
        <Card className="overflow-hidden">
          <div className="border-b border-line bg-surface-2/50 px-6 py-4">
            <p className="font-mono text-xs uppercase tracking-widest text-saffron">{scenario.title}</p>
          </div>
          <div className="p-6">
            <p className="text-lg text-ink">{scenario.scenario}</p>
            <div className="mt-6 grid gap-3">
              {scenario.options.map((opt, i) => {
                const isPicked = picked === i;
                const isCorrect = i === 0;
                return (
                  <button
                    key={i}
                    onClick={() => setPicked(i)}
                    disabled={picked !== null}
                    className={cn(
                      "rounded-xl border p-4 text-left text-sm transition-all",
                      picked === null
                        ? "border-line bg-surface hover:border-saffron/50"
                        : isPicked
                        ? isCorrect
                          ? "border-emerald bg-emerald/10"
                          : "border-danger bg-danger/10"
                        : "border-line opacity-50"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {picked !== null && (
              <div className="mt-5 animate-rise rounded-xl border border-line bg-surface-2/60 p-5">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-saffron" />
                  <div>
                    <p className="text-ink">{scenario.options[picked].result}</p>
                    <p className="mt-2 text-sm text-muted">
                      <span className="font-semibold text-saffron">Behind the scenes:</span>{" "}
                      {scenario.options[picked].insight}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-4" onClick={reset}>
                  Next scenario →
                </Button>
              </div>
            )}
          </div>
        </Card>
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-center gap-3">
          <GitBranch className="h-5 w-5 text-emerald" />
          <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">The skill tree</h2>
        </div>
        <div className="space-y-0">
          {major.skillTree.map((stage, i) => (
            <div key={stage.stage} className="relative flex gap-4 pb-6">
              {i < major.skillTree.length - 1 && (
                <div className="absolute left-[15px] top-8 h-full w-px bg-line" />
              )}
              <div className="z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-emerald/40 bg-surface text-xs font-mono text-emerald">
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-ink">{stage.stage}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {stage.skills.map((s) => (
                    <span key={s.name} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-muted">
                      {s.name}
                      {s.cert && <span className="ml-2 font-mono text-xs text-emerald">{s.cert}</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {courses.length > 0 && (
        <section className="mt-12">
          <div className="mb-5 flex items-center gap-3">
            <GraduationCap className="h-5 w-5 text-info" />
            <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Start today — short courses</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {courses.map((c) => (
              <a key={c.id} href={c.url} target="_blank" rel="noopener noreferrer"
                className="card-glass group flex items-center justify-between rounded-xl p-4 transition-colors hover:border-info/40">
                <div>
                  <p className="font-medium text-ink">{c.name}</p>
                  <p className="text-xs text-muted">{c.provider} · {c.duration} · {c.cost}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-faint group-hover:text-info" />
              </a>
            ))}
          </div>
        </section>
      )}

      {unis.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Where to study it</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {unis.map((u) => (
              <div key={u.id} className="rounded-xl border border-line bg-surface p-4">
                <p className="font-semibold text-ink">{u.name}</p>
                <p className="text-xs text-muted">{u.city} · {u.entryTest}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <Card className="mt-12 border-danger/20 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-danger">Reality check</p>
            <p className="mt-2 text-ink">{major.realityCheck}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
