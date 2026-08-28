"use client";

import * as React from "react";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Crown,
  DollarSign,
  ExternalLink,
  FileText,
  GraduationCap,
  Landmark,
  Lightbulb,
  Search,
  Users,
} from "lucide-react";
import { formatPkr } from "@/lib/abroad-planner";
import {
  filterIvyUniversities,
  ivyScholarshipsList,
  ivyStats,
  ivyStories,
  ivyStrategy,
  ivyUniversities,
  TESTING_POLICY_LABELS,
} from "@/lib/ivy";
import type {
  AbroadScholarship,
  IvyStory,
  IvyStrategySection,
  IvyTestingPolicy,
  IvyTimelinePhase,
  IvyUniversity,
} from "@/lib/ivy";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ---- constants ----

const TABS = [
  { id: "profiles", label: "Profiles", icon: Landmark },
  { id: "strategy", label: "Strategy", icon: Lightbulb },
  { id: "aid", label: "Financial Aid", icon: DollarSign },
  { id: "criteria", label: "Criteria", icon: FileText },
  { id: "stories", label: "Stories", icon: Users },
  { id: "resources", label: "Resources", icon: BookOpen },
] as const;

type TabId = (typeof TABS)[number]["id"];

const POLICY_FILTERS: { value: IvyTestingPolicy | "all"; label: string }[] = [
  { value: "all", label: "All policies" },
  ...(Object.keys(TESTING_POLICY_LABELS) as IvyTestingPolicy[]).map((p) => ({
    value: p,
    label: TESTING_POLICY_LABELS[p],
  })),
];

type CriteriaSortKey =
  | "name"
  | "acceptanceRate"
  | "testingPolicy"
  | "satMid50"
  | "actMid50"
  | "english";
type SortDir = "asc" | "desc";

// Every URL shown in the Resources tab must already exist in the data files.
const DATA_URLS = new Set<string>([
  ...ivyUniversities.flatMap((u) => [
    ...u.sources.admissions,
    ...u.sources.aid,
    ...u.sources.cost,
    ...u.sources.english,
  ]),
  ...ivyStrategy.timeline.flatMap((p) => p.sourceUrls ?? []),
  ...(ivyStrategy.essays.sourceUrls ?? []),
  ...(ivyStrategy.recommendations.sourceUrls ?? []),
  ...(ivyStrategy.interviews.sourceUrls ?? []),
  ...ivyScholarshipsList.flatMap((s) => s.sourceUrls),
]);

const RESOURCE_GROUPS: { title: string; links: { label: string; url: string }[] }[] = [
  {
    title: "Official admissions sites",
    links: ivyUniversities.map((u) => ({
      label: u.name,
      url: u.sources.admissions[0],
    })),
  },
  {
    title: "Application platforms & aid",
    links: [
      { label: "Common App", url: "https://www.commonapp.org" },
      {
        label: "CSS Profile — international applicants",
        url: "https://cssprofile.collegeboard.org/international-applicants",
      },
    ].filter((l) => DATA_URLS.has(l.url)),
  },
  {
    title: "Tests",
    links: [
      { label: "College Board — SAT", url: "https://satsuite.collegeboard.org/sat" },
      {
        label: "College Board — international SAT registration",
        url: "https://satsuite.collegeboard.org/sat/registration/international-testing",
      },
      {
        label: "ACT — registration",
        url: "https://www.act.org/content/act/en/products-and-services/the-act/registration.html",
      },
      {
        label: "ETS — TOEFL iBT registration",
        url: "https://www.ets.org/toefl/test-takers/ibt/register.html",
      },
      { label: "IELTS", url: "https://ielts.org" },
    ].filter((l) => DATA_URLS.has(l.url)),
  },
  {
    title: "Pakistan support",
    links: [
      { label: "EducationUSA Pakistan", url: "https://www.educationusa.pk/" },
      {
        label: "USEFP — Fulbright Pakistan",
        url: "https://usefp.org/scholarships/fulbright-degree.cfm",
      },
      {
        label: "USEFP — Humphrey Fellowship (Pakistan)",
        url: "https://www.usefp.org/scholarships/humphrey.cfm",
      },
      {
        label: "EducationUSA — Opportunity Funds program",
        url: "https://educationusa.state.gov/foreign-institutions-and-governments/special-programs",
      },
    ].filter((l) => DATA_URLS.has(l.url)),
  },
];

// ---- helpers ----

function policyBadgeVariant(policy: IvyTestingPolicy): "saffron" | "info" | "muted" {
  switch (policy) {
    case "required":
      return "saffron";
    case "optional":
      return "info";
    case "flexible":
      return "muted";
  }
}

function englishMinimums(u: IvyUniversity): string {
  const parts: string[] = [];
  if (u.english.toeflMin !== null) parts.push(`TOEFL ${u.english.toeflMin}`);
  if (u.english.ieltsMin !== null) parts.push(`IELTS ${u.english.ieltsMin}`);
  if (u.english.duolingoMin !== null) parts.push(`Duolingo ${u.english.duolingoMin}`);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

function firstNumber(s: string | null): number {
  if (!s) return 0;
  const match = s.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function criteriaValue(u: IvyUniversity, key: CriteriaSortKey): string | number {
  switch (key) {
    case "name":
      return u.name;
    case "acceptanceRate":
      return u.acceptanceRate;
    case "testingPolicy":
      return u.testingPolicy;
    case "satMid50":
      return firstNumber(u.satMid50?.math ?? null);
    case "actMid50":
      return firstNumber(u.actMid50);
    case "english":
      return u.english.toeflMin ?? u.english.ieltsMin ?? u.english.duolingoMin ?? 0;
  }
}

function sortCriteria(list: IvyUniversity[], key: CriteriaSortKey, dir: SortDir): IvyUniversity[] {
  return [...list].sort((a, b) => {
    const va = criteriaValue(a, key);
    const vb = criteriaValue(b, key);
    const cmp =
      typeof va === "number" && typeof vb === "number"
        ? va - vb
        : String(va).localeCompare(String(vb));
    return dir === "asc" ? cmp : -cmp;
  });
}

// ---- shared primitives ----

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-saffron/40 bg-saffron/10 text-saffron"
          : "border-line bg-surface text-muted hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="card-glass rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">{label}</p>
        {Icon && <Icon className="h-4 w-4 shrink-0 text-saffron" />}
      </div>
      <p className="mt-1 text-lg font-bold text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{sub}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 first:mt-0">
      <h4 className="text-[11px] font-semibold uppercase tracking-widest text-faint">{title}</h4>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function SourceLinks({ urls, label }: { urls: string[]; label: string }) {
  return (
    <>
      {urls.map((url, i) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-saffron hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          {urls.length > 1 ? `${label} ${i + 1}` : label}
        </a>
      ))}
    </>
  );
}

// ---- Profiles tab ----

function UniversityCard({
  u,
  open,
  onToggle,
}: {
  u: IvyUniversity;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = `ivy-panel-${u.id}`;
  const triggerId = `ivy-trigger-${u.id}`;
  return (
    <div className="card-glass overflow-hidden rounded-2xl">
      <h3>
        <button
          type="button"
          id={triggerId}
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center gap-4 p-5 text-left"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-bold text-ink">{u.name}</span>
              <Badge variant="saffron">{u.acceptanceRate}% acceptance</Badge>
              <Badge variant={policyBadgeVariant(u.testingPolicy)}>
                {TESTING_POLICY_LABELS[u.testingPolicy]}
              </Badge>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted">
              {u.location} · Founded {u.founded} · {u.acceptanceRateCycle}
            </p>
          </div>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-faint transition-transform", open && "rotate-180")}
          />
        </button>
      </h3>

      <div
        id={panelId}
        hidden={!open}
        role="region"
        aria-labelledby={triggerId}
        className="border-t border-line p-5"
      >
        <Section title="Testing">
          <p className="text-sm leading-relaxed text-muted">{u.testingPolicyNote}</p>
          {(u.satMid50 || u.actMid50) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {u.satMid50 && (
                <Badge variant="muted">
                  SAT mid-50: Math {u.satMid50.math} · EBRW {u.satMid50.ebrw}
                </Badge>
              )}
              {u.actMid50 && <Badge variant="muted">ACT mid-50: {u.actMid50}</Badge>}
            </div>
          )}
          <p className="mt-3 text-xs leading-relaxed text-muted">{u.gpaBenchmark}</p>
        </Section>

        <Section title="English proficiency">
          {englishMinimums(u) !== "—" && (
            <p className="font-mono text-xs text-ink">{englishMinimums(u)}</p>
          )}
          <p className={cn("text-xs leading-relaxed text-muted", englishMinimums(u) !== "—" && "mt-2")}>
            {u.english.exceptions}
          </p>
        </Section>

        <Section title="Application">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-surface-2/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                Platform
              </p>
              <p className="mt-1 text-xs text-ink">{u.application.platform}</p>
            </div>
            <div className="rounded-lg bg-surface-2/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                Application fee
              </p>
              <p className="mt-1 font-mono text-sm text-ink">{formatPkr(u.application.feePkr)}</p>
              <p className="text-[11px] text-muted">${u.application.feeUsd} USD</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">{u.application.feeWaiver}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="muted">Early: {u.application.deadlines.early}</Badge>
            <Badge variant="muted">Regular: {u.application.deadlines.regular}</Badge>
            <Badge variant="muted">{u.application.deadlines.cycleYear} cycle</Badge>
          </div>
        </Section>

        <Section title="Cost">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-surface-2/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                Tuition ({u.cost.costCycle})
              </p>
              <p className="mt-1 font-mono text-sm text-ink">{formatPkr(u.cost.tuitionPkr)}</p>
              <p className="text-[11px] text-muted">${u.cost.tuitionUsd.toLocaleString("en-US")} USD</p>
            </div>
            <div className="rounded-lg bg-surface-2/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                Total cost ({u.cost.costCycle})
              </p>
              <p className="mt-1 font-mono text-sm text-ink">{formatPkr(u.cost.totalCostPkr)}</p>
              <p className="text-[11px] text-muted">
                ${u.cost.totalCostUsd.toLocaleString("en-US")} USD
              </p>
            </div>
          </div>
        </Section>

        <Section title="Financial aid">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={u.financialAid.intlPolicy === "need-blind" ? "emerald" : "info"}>
              {u.financialAid.intlPolicy === "need-blind"
                ? "Need-blind for internationals"
                : "Need-aware for internationals"}
            </Badge>
            {u.financialAid.avgAwardUsd !== null && (
              <span className="font-mono text-xs text-ink">
                Avg award {formatPkr(u.financialAid.avgAwardUsd * 278)}
              </span>
            )}
            {u.financialAid.percentIntlAid !== null && (
              <span className="text-xs text-muted">
                {u.financialAid.percentIntlAid}% of internationals receive aid
              </span>
            )}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">{u.financialAid.aidDetail}</p>
        </Section>

        <Section title="Unique programs">
          <ul className="space-y-1.5">
            {u.uniquePrograms.map((p) => (
              <li key={p} className="flex gap-2 text-xs text-muted">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
                {p}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Notable facts">
          <ul className="space-y-1.5">
            {u.notableFacts.map((f) => (
              <li key={f} className="flex gap-2 text-xs text-muted">
                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-saffron" />
                {f}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Sources">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <SourceLinks urls={u.sources.admissions} label="Admissions" />
            <SourceLinks urls={u.sources.aid} label="Financial aid" />
            <SourceLinks urls={u.sources.cost} label="Costs" />
            <SourceLinks urls={u.sources.english} label="English requirements" />
          </div>
        </Section>
      </div>
    </div>
  );
}

// ---- Strategy tab ----

function TimelinePhaseCard({
  phase,
  open,
  onToggle,
}: {
  phase: IvyTimelinePhase;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = `ivy-strategy-panel-${phase.id}`;
  const triggerId = `ivy-strategy-trigger-${phase.id}`;
  return (
    <div className="card-glass overflow-hidden rounded-2xl">
      <h3>
        <button
          type="button"
          id={triggerId}
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center gap-4 p-5 text-left"
        >
          <div className="min-w-0 flex-1">
            <Badge variant="saffron">{phase.phase}</Badge>
            <p className="mt-1 text-base font-bold text-ink">{phase.title}</p>
          </div>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-faint transition-transform", open && "rotate-180")}
          />
        </button>
      </h3>

      <div
        id={panelId}
        hidden={!open}
        role="region"
        aria-labelledby={triggerId}
        className="border-t border-line p-5"
      >
        <ol className="space-y-2">
          {phase.steps.map((step, i) => (
            <li key={step} className="flex gap-2 text-xs text-muted">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-saffron/15 font-mono text-[9px] font-bold text-saffron">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        {phase.sourceUrls && phase.sourceUrls.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <SourceLinks urls={phase.sourceUrls} label="Source" />
          </div>
        )}
      </div>
    </div>
  );
}

function StrategySectionCard({
  id,
  title,
  icon: Icon,
  section,
  open,
  onToggle,
}: {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  section: IvyStrategySection;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = `ivy-strategy-panel-${id}`;
  const triggerId = `ivy-strategy-trigger-${id}`;
  return (
    <div className="card-glass overflow-hidden rounded-2xl">
      <h3>
        <button
          type="button"
          id={triggerId}
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center gap-3 p-5 text-left"
        >
          <Icon className="h-4 w-4 shrink-0 text-saffron" />
          <span className="min-w-0 flex-1 text-base font-bold text-ink">{title}</span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-faint transition-transform", open && "rotate-180")}
          />
        </button>
      </h3>

      <div
        id={panelId}
        hidden={!open}
        role="region"
        aria-labelledby={triggerId}
        className="border-t border-line p-5"
      >
        <ol className="space-y-2">
          {section.tips.map((tip, i) => (
            <li key={tip} className="flex gap-2 text-xs text-muted">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-saffron/15 font-mono text-[9px] font-bold text-saffron">
                {i + 1}
              </span>
              {tip}
            </li>
          ))}
        </ol>
        {section.sourceUrls && section.sourceUrls.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <SourceLinks urls={section.sourceUrls} label="Source" />
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Financial Aid tab ----

function AidSchoolCard({ u }: { u: IvyUniversity }) {
  return (
    <div className="card-glass rounded-2xl p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-ink">{u.name}</span>
        <Badge variant={u.financialAid.intlPolicy === "need-blind" ? "emerald" : "info"}>
          {u.financialAid.intlPolicy === "need-blind"
            ? "Need-blind for internationals"
            : "Need-aware for internationals"}
        </Badge>
        {u.financialAid.avgAwardUsd !== null && (
          <span className="font-mono text-xs text-ink">
            Avg award {formatPkr(u.financialAid.avgAwardUsd * 278)}
          </span>
        )}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted">{u.financialAid.aidDetail}</p>
      {u.financialAid.percentIntlAid !== null && (
        <p className="mt-2 text-xs text-muted">
          {u.financialAid.percentIntlAid}% of international students receive financial aid.
        </p>
      )}
    </div>
  );
}

function FafsaCard() {
  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-4 w-4 shrink-0 text-saffron" />
        <h3 className="text-sm font-bold text-ink">Why no FAFSA for Pakistani students?</h3>
      </div>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
        <p>
          {
            "FAFSA (the Free Application for Federal Student Aid) is US federal financial aid for US citizens and eligible non-citizens, so international applicants — including Pakistanis — do not file it."
          }
        </p>
        <p>
          {
            "Instead, international aid applicants at the Ivies submit the CSS Profile, and some schools accept the ISFAA (International Student Financial Aid Application) in its place."
          }
        </p>
        <p>
          {
            "Schools may also request supporting IDOC documents such as tax returns, bank statements, and income letters. Requirements differ school by school — confirm each school's own forms and deadlines on its financial aid page before applying."
          }
        </p>
      </div>
    </div>
  );
}

function IvyScholarshipCard({
  s,
  open,
  onToggle,
}: {
  s: AbroadScholarship;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = `ivy-scholarship-panel-${s.id}`;
  const triggerId = `ivy-scholarship-trigger-${s.id}`;
  return (
    <div className="card-glass overflow-hidden rounded-2xl">
      <h3>
        <button
          type="button"
          id={triggerId}
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center gap-4 p-5 text-left"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-bold text-ink">{s.name}</span>
              <Badge variant={s.coverage === "full" ? "emerald" : "saffron"}>
                {s.coverage === "full" ? "Full funding" : "Partial funding"}
              </Badge>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted">{s.funder}</p>
          </div>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-faint transition-transform", open && "rotate-180")}
          />
        </button>
      </h3>

      <div
        id={panelId}
        hidden={!open}
        role="region"
        aria-labelledby={triggerId}
        className="border-t border-line p-5"
      >
        <p className="text-sm text-ink">{s.coverageDetail}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Badge variant="muted">Deadline: {s.deadline}</Badge>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
          {s.sourceUrls.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-saffron hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Official page
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Criteria tab ----

function SortableTh({
  label,
  column,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  column: CriteriaSortKey;
  sortKey: CriteriaSortKey;
  sortDir: SortDir;
  onSort: (key: CriteriaSortKey) => void;
}) {
  const active = sortKey === column;
  return (
    <th
      aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
      className="px-3 py-2.5"
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          "inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider transition-colors",
          active ? "text-saffron" : "text-faint hover:text-ink"
        )}
      >
        {label}
        <span aria-hidden="true" className="text-[9px]">
          {active ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </button>
    </th>
  );
}

function CriteriaTable({
  sortKey,
  sortDir,
  onSort,
}: {
  sortKey: CriteriaSortKey;
  sortDir: SortDir;
  onSort: (key: CriteriaSortKey) => void;
}) {
  const sorted = sortCriteria(ivyUniversities, sortKey, sortDir);
  return (
    <div className="card-glass overflow-hidden rounded-2xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-xs">
          <thead>
            <tr className="border-b border-line bg-surface-2/60">
              <SortableTh label="School" column="name" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <SortableTh
                label="Acceptance"
                column="acceptanceRate"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                label="Testing policy"
                column="testingPolicy"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                label="SAT mid-50"
                column="satMid50"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                label="ACT mid-50"
                column="actMid50"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                label="English minimums"
                column="english"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-faint">
                GPA benchmark
              </th>
              <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-faint">
                Source
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((u) => (
              <tr key={u.id} className="border-b border-line/60 last:border-0">
                <td className="px-3 py-2.5">
                  <a
                    href={u.sources.admissions[0]}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-ink hover:text-saffron"
                  >
                    {u.name}
                  </a>
                </td>
                <td className="px-3 py-2.5">
                  <span className="font-mono text-ink">{u.acceptanceRate}%</span>{" "}
                  <span className="text-faint">{u.acceptanceRateCycle}</span>
                </td>
                <td className="px-3 py-2.5">
                  <Badge variant={policyBadgeVariant(u.testingPolicy)}>
                    {TESTING_POLICY_LABELS[u.testingPolicy]}
                  </Badge>
                </td>
                <td className="px-3 py-2.5 font-mono text-muted">
                  {u.satMid50 ? `Math ${u.satMid50.math} · EBRW ${u.satMid50.ebrw}` : "—"}
                </td>
                <td className="px-3 py-2.5 font-mono text-muted">{u.actMid50 ?? "—"}</td>
                <td className="px-3 py-2.5 text-muted">{englishMinimums(u)}</td>
                <td className="max-w-[240px] px-3 py-2.5 text-muted">
                  <span className="line-clamp-2">{u.gpaBenchmark}</span>
                </td>
                <td className="px-3 py-2.5">
                  <a
                    href={u.sources.admissions[0]}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-saffron hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Source
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Stories tab ----

function StoryCard({ story }: { story: IvyStory }) {
  const illustrative = story.type === "illustrative";
  return (
    <div
      className={cn(
        "card-glass rounded-2xl p-5",
        illustrative && "border-dashed border-saffron/40"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {illustrative ? (
          <Badge variant="saffron">Illustrative profile — not a real person</Badge>
        ) : (
          <span className="text-base font-bold text-ink">{story.name}</span>
        )}
        <Badge variant="muted">{story.school}</Badge>
        <Badge variant="muted">{story.year}</Badge>
        {!illustrative && story.sourceUrl && (
          <a
            href={story.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-saffron hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Read the story
          </a>
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted">{story.background}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
            Challenges
          </p>
          <ul className="mt-2 space-y-1.5">
            {story.challenges.map((c) => (
              <li key={c} className="flex gap-2 text-xs text-muted">
                <span className="text-danger">–</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
            Why it worked
          </p>
          <ul className="mt-2 space-y-1.5">
            {story.keyFactors.map((f) => (
              <li key={f} className="flex gap-2 text-xs text-muted">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ---- Resources tab ----

function ResourceGroupCard({
  title,
  links,
}: {
  title: string;
  links: { label: string; url: string }[];
}) {
  return (
    <div className="card-glass rounded-2xl p-5">
      <h3 className="text-sm font-bold text-ink">{title}</h3>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={`${l.label}-${l.url}`}>
            <a
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-start gap-2 rounded-lg px-1 py-1 transition-colors"
            >
              <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-saffron" />
              <span className="min-w-0">
                <span className="block text-xs font-medium text-ink group-hover:text-saffron">
                  {l.label}
                </span>
                <span className="block truncate text-[10px] text-faint">
                  {l.url.replace(/^https?:\/\/(www\.)?/, "")}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---- main component ----

export function IvyExplorer() {
  const [activeTab, setActiveTab] = React.useState<TabId>("profiles");

  // Profiles tab
  const [query, setQuery] = React.useState("");
  const [policy, setPolicy] = React.useState<IvyTestingPolicy | "all">("all");
  const [openId, setOpenId] = React.useState<string | null>(null);

  // Strategy tab
  const [strategyOpenId, setStrategyOpenId] = React.useState<string | null>(null);

  // Financial Aid tab
  const [aidOpenId, setAidOpenId] = React.useState<string | null>(null);

  // Criteria tab
  const [sortKey, setSortKey] = React.useState<CriteriaSortKey>("name");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");

  const stats = ivyStats(ivyUniversities);
  const filtered = filterIvyUniversities(ivyUniversities, { query, testingPolicy: policy });
  const visibleOpenId = filtered.some((u) => u.id === openId) ? openId : null;
  const realStories = ivyStories.stories.filter((s) => s.type === "real");
  const illustrativeStories = ivyStories.stories.filter((s) => s.type === "illustrative");

  function toggleSort(key: CriteriaSortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Ivy League sections"
        className="flex gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1"
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`ivy-tab-${tab.id}`}
              aria-selected={active}
              aria-controls={`ivy-tabpanel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                active
                  ? "bg-saffron/15 text-saffron"
                  : "text-muted hover:bg-surface-2 hover:text-ink"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. Profiles */}
      <div
        role="tabpanel"
        id="ivy-tabpanel-profiles"
        aria-labelledby="ivy-tab-profiles"
        className={cn("mt-6", activeTab !== "profiles" && "hidden")}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Most competitive"
            icon={Crown}
            value={`${stats.mostCompetitive.acceptanceRate}%`}
            sub={`${stats.mostCompetitive.name} · ${stats.mostCompetitive.acceptanceRateCycle}`}
          />
          <StatCard
            label="Most generous aid"
            icon={Award}
            value={
              stats.mostGenerousAid
                ? formatPkr((stats.mostGenerousAid.financialAid.avgAwardUsd ?? 0) * 278)
                : "Not published"
            }
            sub={
              stats.mostGenerousAid
                ? `${stats.mostGenerousAid.name} average award`
                : "Average awards are unpublished at most Ivies"
            }
          />
          <StatCard
            label="Lowest sticker price"
            icon={DollarSign}
            value={formatPkr(stats.cheapestSticker.cost.totalCostPkr)}
            sub={`${stats.cheapestSticker.name} · ${stats.cheapestSticker.cost.costCycle}`}
          />
          <StatCard
            label="Need-blind for Pakistanis"
            icon={Users}
            value={`${stats.needBlindCount} of 8`}
            sub="Schools that are need-blind for international applicants"
          />
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <Input
              className="pl-9"
              placeholder="Search by name, location, or program..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {POLICY_FILTERS.map((p) => (
              <Chip key={p.value} active={policy === p.value} onClick={() => setPolicy(p.value)}>
                {p.label}
              </Chip>
            ))}
            <span className="font-mono text-[11px] text-faint">{filtered.length}/8 schools</span>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {filtered.length === 0 && (
            <div className="card-glass rounded-2xl p-8 text-center">
              <p className="text-sm text-muted">No universities match these filters.</p>
            </div>
          )}
          {filtered.map((u) => (
            <UniversityCard
              key={u.id}
              u={u}
              open={visibleOpenId === u.id}
              onToggle={() => setOpenId(visibleOpenId === u.id ? null : u.id)}
            />
          ))}
        </div>

        <p className="mt-8 font-mono text-[11px] text-faint">
          Testing policies, fees, and deadlines change per cycle — verify on each school&apos;s
          official page before applying.
        </p>
      </div>

      {/* 2. Strategy */}
      <div
        role="tabpanel"
        id="ivy-tabpanel-strategy"
        aria-labelledby="ivy-tab-strategy"
        className={cn("mt-6 space-y-4", activeTab !== "strategy" && "hidden")}
      >
        {ivyStrategy.timeline.map((phase) => (
          <TimelinePhaseCard
            key={phase.id}
            phase={phase}
            open={strategyOpenId === phase.id}
            onToggle={() => setStrategyOpenId(strategyOpenId === phase.id ? null : phase.id)}
          />
        ))}
        <StrategySectionCard
          id="essays"
          title="Essays"
          icon={FileText}
          section={ivyStrategy.essays}
          open={strategyOpenId === "essays"}
          onToggle={() => setStrategyOpenId(strategyOpenId === "essays" ? null : "essays")}
        />
        <StrategySectionCard
          id="recommendations"
          title="Recommendations"
          icon={Users}
          section={ivyStrategy.recommendations}
          open={strategyOpenId === "recommendations"}
          onToggle={() =>
            setStrategyOpenId(strategyOpenId === "recommendations" ? null : "recommendations")
          }
        />
        <StrategySectionCard
          id="interviews"
          title="Interviews"
          icon={Lightbulb}
          section={ivyStrategy.interviews}
          open={strategyOpenId === "interviews"}
          onToggle={() => setStrategyOpenId(strategyOpenId === "interviews" ? null : "interviews")}
        />
      </div>

      {/* 3. Financial Aid */}
      <div
        role="tabpanel"
        id="ivy-tabpanel-aid"
        aria-labelledby="ivy-tab-aid"
        className={cn("mt-6", activeTab !== "aid" && "hidden")}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {ivyUniversities.map((u) => (
            <AidSchoolCard key={u.id} u={u} />
          ))}
        </div>

        <div className="mt-6">
          <FafsaCard />
        </div>

        <div className="mt-8">
          <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-faint">
            External scholarships open to Pakistanis · {ivyScholarshipsList.length}
          </h2>
          <div className="space-y-4">
            {ivyScholarshipsList.map((s) => (
              <IvyScholarshipCard
                key={s.id}
                s={s}
                open={aidOpenId === s.id}
                onToggle={() => setAidOpenId(aidOpenId === s.id ? null : s.id)}
              />
            ))}
          </div>
        </div>

        <p className="mt-8 font-mono text-[11px] text-faint">
          Aid figures change per cycle — always confirm on each school&apos;s financial aid page.
        </p>
      </div>

      {/* 4. Criteria */}
      <div
        role="tabpanel"
        id="ivy-tabpanel-criteria"
        aria-labelledby="ivy-tab-criteria"
        className={cn("mt-6", activeTab !== "criteria" && "hidden")}
      >
        <CriteriaTable sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
        <p className="mt-3 text-[11px] text-faint">
          Click a column header to sort. Blank cells mean the school has not published that figure.
        </p>
      </div>

      {/* 5. Stories */}
      <div
        role="tabpanel"
        id="ivy-tabpanel-stories"
        aria-labelledby="ivy-tab-stories"
        className={cn("mt-6", activeTab !== "stories" && "hidden")}
      >
        <div className="space-y-4">
          {realStories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>

        {illustrativeStories.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-faint">
              Illustrative profiles · {illustrativeStories.length}
            </h2>
            <div className="space-y-4">
              {illustrativeStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. Resources */}
      <div
        role="tabpanel"
        id="ivy-tabpanel-resources"
        aria-labelledby="ivy-tab-resources"
        className={cn("mt-6", activeTab !== "resources" && "hidden")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {RESOURCE_GROUPS.map((g) => (
            <ResourceGroupCard key={g.title} title={g.title} links={g.links} />
          ))}
        </div>
        <p className="mt-8 font-mono text-[11px] text-faint">
          Every link on this page comes from the data behind this page — nothing invented.
        </p>
      </div>
    </div>
  );
}
