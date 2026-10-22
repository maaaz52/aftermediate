"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  ChevronDown,
  ExternalLink,
  FileText,
  Globe2,
  Hammer,
  Languages,
  Radar,
  Sparkles,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useStudent } from "@/lib/store";
import { PURSUIT_LABELS } from "@/lib/quiz";
import { benchmarksFor, isReviewDue, realityTrackFor, REALITY_BENCHMARKS, type RealityBenchmark } from "@/lib/reality-check";

const ACCENT_CLASSES = {
  violet: "border-violet/25 bg-violet/8 text-violet",
  saffron: "border-saffron/25 bg-saffron/10 text-saffron",
  emerald: "border-emerald/25 bg-emerald/10 text-emerald",
  info: "border-info/25 bg-info/10 text-info",
} as const;

const MARKER_CLASSES = {
  violet: "bg-violet",
  saffron: "bg-saffron",
  emerald: "bg-emerald",
  info: "bg-info",
} as const;

interface EvidenceItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  target: string;
  status: "start" | "building" | "strong";
  why: string;
  action: string;
  href: string;
  actionLabel: string;
}

function countStatus(value: number, target: number): EvidenceItem["status"] {
  if (value >= target) return "strong";
  if (value > 0) return "building";
  return "start";
}

function scaleStatus(value: number): EvidenceItem["status"] {
  if (value >= 4) return "strong";
  if (value >= 3) return "building";
  return "start";
}

function statusCopy(status: EvidenceItem["status"]) {
  if (status === "strong") return "A solid signal";
  if (status === "building") return "Momentum to build on";
  return "Your clearest next move";
}

function EvidenceCard({ item }: { item: EvidenceItem }) {
  const Icon = item.icon;
  const statusClass = item.status === "strong"
    ? "border-emerald/25 bg-emerald/8 text-emerald"
    : item.status === "building"
      ? "border-saffron/25 bg-saffron/10 text-saffron"
      : "border-violet/25 bg-violet/8 text-violet";

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-5 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-surface-2">
          <Icon className="h-5 w-5 text-ink" />
        </div>
        <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold", statusClass)}>{statusCopy(item.status)}</span>
      </div>
      <p className="mt-6 text-sm font-medium text-muted">{item.label}</p>
      <div className="mt-1 flex items-end gap-2">
        <p className="font-mono text-4xl font-bold tracking-tight text-ink">{item.value}</p>
        <p className="mb-1 text-xs text-faint">first target: {item.target}</p>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted">{item.why}</p>
      <div className="mt-5 border-t border-line pt-4">
        <p className="text-sm font-medium text-ink">{item.action}</p>
        <Link href={item.href} className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-sm font-semibold text-saffron transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron/60">
          {item.actionLabel} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function SourceDetails({ benchmark }: { benchmark: RealityBenchmark }) {
  const [open, setOpen] = React.useState(false);
  const reviewDue = isReviewDue(benchmark);

  return (
    <div className="border-t border-line pt-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-1 text-left text-xs font-medium text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron/60"
      >
        <span>Source & methodology</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-3 space-y-2 break-words text-xs leading-relaxed text-muted">
          <p><span className="font-semibold text-ink">Scope:</span> {benchmark.scope}</p>
          <p>{benchmark.methodology}</p>
          <p>
            <span className="font-semibold text-ink">Published:</span> {benchmark.published} · <span className="font-semibold text-ink">Last reviewed:</span> {benchmark.reviewedAt}
            {reviewDue && <span className="ml-2 font-semibold text-saffron">Review due</span>}
          </p>
          <a
            href={benchmark.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-1 rounded-lg px-1 font-semibold text-saffron transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron/60"
          >
            Open {benchmark.source} <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}

function BenchmarkCard({ benchmark }: { benchmark: RealityBenchmark }) {
  return (
    <article className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <span className={cn("h-2.5 w-2.5 rounded-full", MARKER_CLASSES[benchmark.accent])} aria-hidden="true" />
        <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide", ACCENT_CLASSES[benchmark.accent])}>{benchmark.published}</span>
      </div>
      <p className="mt-7 font-mono text-3xl font-bold tracking-tight text-ink sm:text-4xl">{benchmark.metric}</p>
      <h3 className="mt-2 min-h-10 text-base font-bold text-ink">{benchmark.label}</h3>
      <p className="mt-1 min-h-10 text-sm text-muted">{benchmark.context}</p>
      <p className="mt-5 min-h-12 text-xs leading-relaxed text-faint">{benchmark.scope}</p>
      <div className="mt-5">
        <SourceDetails benchmark={benchmark} />
      </div>
    </article>
  );
}

export function RealityCheckExperience() {
  const { profile, hydrated } = useStudent();
  const pursuit = profile.quiz.pursuit;
  const track = realityTrackFor(pursuit);
  const benchmarks = benchmarksFor(pursuit);
  const heroBenchmarks = track.heroBenchmarkIds.map((id) => REALITY_BENCHMARKS.find((benchmark) => benchmark.id === id)!);
  const projectCount = Math.max(0, profile.quiz.projects ?? 0);
  const certificateCount = Math.max(0, profile.quiz.certifications ?? 0);
  const english = profile.quiz.english ?? 0;
  const consistency = profile.quiz.consistency ?? 0;
  const direction = pursuit ? PURSUIT_LABELS[pursuit] : "your future direction";

  const evidence: EvidenceItem[] = [
    {
      id: "projects",
      label: track.proofLabel,
      shortLabel: track.proofLabel,
      icon: Hammer,
      value: String(projectCount),
      target: track.proofTarget,
      status: countStatus(projectCount, 2),
      why: track.proofWhy,
      action: track.actions[0].body,
      href: track.actions[0].href,
      actionLabel: "Start this step",
    },
    {
      id: "certifications",
      label: "Learning proof",
      shortLabel: "Certifications",
      icon: Award,
      value: String(certificateCount),
      target: "1 relevant credential",
      status: countStatus(certificateCount, 1),
      why: "A certificate is not a substitute for work, but it can make your learning path visible when paired with a project.",
      action: certificateCount >= 1 ? "Pair your next credential with a project that uses what you learned." : "Pick one beginner-friendly credential aligned with the stack you want to build in.",
      href: "/skills/courses",
      actionLabel: "Explore learning paths",
    },
    {
      id: "english",
      label: "Communication readiness",
      shortLabel: "English confidence",
      icon: Languages,
      value: english ? `${english}/5` : "—",
      target: "4/5 confidence",
      status: scaleStatus(english),
      why: "Clear writing and spoken communication help you explain work to teammates, clients, and international opportunities.",
      action: english >= 4 ? "Practice explaining your best project in two clear minutes, without technical jargon." : "Write a short project summary in English and ask a mentor or AI tutor to improve it.",
      href: "/study",
      actionLabel: "Practice with Ustaad",
    },
    {
      id: "consistency",
      label: "Execution rhythm",
      shortLabel: "Study consistency",
      icon: Target,
      value: consistency ? `${consistency}/5` : "—",
      target: "4/5 routine",
      status: scaleStatus(consistency),
      why: "Skill compounds through regular practice. A small routine that survives busy weeks beats occasional all-nighters.",
      action: consistency >= 4 ? "Protect a weekly build block and use it to finish, publish, or improve one thing." : "Set a realistic 45-minute build block on three days this week—then keep it small enough to repeat.",
      href: "/dashboard",
      actionLabel: "Open your dashboard",
    },
  ];

  const nextMoves = track.actions;

  return (
    <div data-tour="reality-check" className="mx-auto max-w-6xl overflow-x-hidden px-4 py-8 sm:px-6 sm:py-10">
      <header className="animate-reveal max-w-4xl">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="violet">Reality Check</Badge>
          <span className="font-mono text-xs text-faint">the numbers do not wait · source-backed</span>
        </div>
        <div className="mt-5 flex items-start gap-3 sm:items-center sm:gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-violet/25 bg-violet/10 sm:h-14 sm:w-14">
            <Radar className="h-6 w-6 text-violet" />
          </div>
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-violet">Your direction: {direction}</p>
            <h1 className="mt-2 max-w-3xl text-balance text-[2.15rem] font-extrabold leading-[1.03] tracking-[-0.045em] text-ink sm:text-6xl">
              {track.headline}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              {track.description}
            </p>
          </div>
        </div>
        <div className="mt-8 grid overflow-hidden rounded-2xl border border-ink bg-ink text-background sm:grid-cols-3 sm:rounded-3xl">
          {heroBenchmarks.map((benchmark, index) => (
            <div key={benchmark.id} className={cn("px-4 py-5 sm:px-5", index < heroBenchmarks.length - 1 && "border-b border-background/15 sm:border-b-0 sm:border-r")}>
              <p className="font-mono text-3xl font-bold tracking-tight text-saffron">{benchmark.metric}</p>
              <p className="mt-2 text-sm font-semibold">{benchmark.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-background/65">{benchmark.context}</p>
            </div>
          ))}
        </div>
      </header>

      {!hydrated && (
        <div className="mt-8 rounded-2xl border border-line bg-surface-2 px-5 py-4 text-sm text-muted" role="status">
          Loading your profile signals…
        </div>
      )}

      <section className="animate-reveal mt-14" aria-labelledby="landscape-heading" style={{ animationDelay: "80ms" }}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-violet">{track.eyebrow}</p>
            <h2 id="landscape-heading" className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">This is what is moving around your path.</h2>
          </div>
          <p className="max-w-md text-sm text-muted">These are the signals that shape this path. Each one is sourced; none of them is a prediction about you.</p>
        </div>
        <div className="mt-6 grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
          {benchmarks.map((benchmark) => <BenchmarkCard key={benchmark.id} benchmark={benchmark} />)}
        </div>
      </section>

      <section className="animate-reveal mt-16" aria-labelledby="evidence-heading" style={{ animationDelay: "140ms" }}>
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-emerald">What can you show?</p>
            <h2 id="evidence-heading" className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Your degree is one signal. Build the others.</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted">These are your own onboarding answers, not a hidden score. If a signal is missing today, it becomes your clearest place to start—not a reason to freeze.</p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">{evidence.map((item) => <EvidenceCard key={item.id} item={item} />)}</div>
      </section>

      <section className="animate-reveal mt-16 overflow-hidden rounded-2xl border border-ink bg-ink px-5 py-7 text-background sm:rounded-3xl sm:px-8 sm:py-9" aria-labelledby="next-heading" style={{ animationDelay: "200ms" }}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-saffron"><Sparkles className="h-4 w-4" /><span className="font-mono text-xs font-semibold uppercase tracking-[0.16em]">Do not leave this as a feeling</span></div>
            <h2 id="next-heading" className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">In 30 days, have something real to point at.</h2>
            <p className="mt-2 text-sm leading-relaxed text-background/70">Not everything. One proof of work, one learning step, and one clear explanation of what you did. Momentum stops being abstract when another person can see it.</p>
          </div>
          <Link href={nextMoves[0].href} className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-saffron px-5 py-3 text-sm font-bold text-background transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background/80 sm:w-auto lg:self-auto">
            Start with {nextMoves[0].label} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {nextMoves.map((item, index) => (
            <div key={item.label} className="rounded-2xl border border-background/15 bg-background/5 p-4">
              <span className="font-mono text-xs text-saffron">0{index + 1}</span>
              <p className="mt-3 font-semibold">{item.label}</p>
              <p className="mt-1 text-sm leading-relaxed text-background/70">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs leading-relaxed text-faint sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-2xl"><FileText className="mr-1 inline h-3.5 w-3.5" />Reality Check uses published sources and your self-reported profile. It cannot predict admission, employment, salary, or your potential.</p>
        <a href="#landscape-heading" className="inline-flex min-h-11 items-center gap-1 self-start rounded-lg px-1 font-semibold text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron/60"><Globe2 className="h-3.5 w-3.5" /> View sources above</a>
      </footer>
    </div>
  );
}
