import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Clock, ExternalLink, GraduationCap, Plane, Wallet } from "lucide-react";
import Link from "next/link";
import json from "@/data/abroad-countries.json";
import type { AbroadCountry } from "@/lib/types";
import { formatPkr } from "@/lib/abroad-planner";
import { monthlyLivingTotal } from "@/lib/abroad-filters";

const data = json as unknown as { dataYear: number; countries: AbroadCountry[] };

export function generateStaticParams() {
  return data.countries.map((c) => ({ id: c.id }));
}

function getCountry(id: string): AbroadCountry | undefined {
  return data.countries.find((c) => c.id === id);
}

const REGION_LABEL: Record<string, string> = {
  europe: "Europe",
  asia: "Asia",
  "north-america": "North America",
};

const LEVEL_LABEL: Record<string, string> = {
  ug: "Bachelor's",
  masters: "Master's",
  phd: "PhD",
};

function CostLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-xs">
      <span className="text-muted">{label}</span>
      <span className="font-mono text-ink">{value}</span>
    </div>
  );
}

export default async function CountryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getCountry(id);
  if (!c) notFound();

  const bigCity = c.living.bigCity;
  const smallCity = c.living.smallCity;
  const bigTotal = monthlyLivingTotal(c, "big");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href="/abroad/countries"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        All countries
      </Link>

      {/* Header */}
      <div className="mt-6 flex items-start gap-4">
        <span className="text-5xl">{c.flag}</span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            {c.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant="muted">{REGION_LABEL[c.region] ?? c.region}</Badge>
            <Badge variant={c.tuition.ug.max === 0 ? "emerald" : "info"}>
              {c.tuition.ug.max === 0 ? "No tuition (public)" : "Paid tuition"}
            </Badge>
            <span className="text-xs text-muted">{c.capital} · {c.language} · 1 {c.currency.code} ≈ PKR {Math.round(c.currency.toPkr)}</span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted">{c.intro}</p>

      {/* Quick stats */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-surface-2/60 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-faint">UG Tuition/yr</p>
          <p className="mt-1 text-sm font-bold text-ink">
            {c.tuition.ug.max === 0 ? "Free (public)" : `${formatPkr(c.tuition.ug.min)} – ${formatPkr(c.tuition.ug.max)}`}
          </p>
        </div>
        <div className="rounded-xl bg-surface-2/60 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-faint">Living (big city)</p>
          <p className="mt-1 text-sm font-bold text-ink">{formatPkr(bigTotal)}/mo</p>
        </div>
        <div className="rounded-xl bg-surface-2/60 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-faint">Post-study work</p>
          <p className="mt-1 text-sm font-bold text-ink">{c.postStudyWorkMonths} months</p>
        </div>
      </div>

      {/* Student visa */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-faint">
          <Plane className="h-3.5 w-3.5" />
          Student visa
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="saffron">{c.visa.type}</Badge>
          <span className="font-mono text-xs text-ink">{formatPkr(c.visa.feePkr)}</span>
          <span className="text-xs text-muted">· {c.visa.processingTime}</span>
        </div>
        <ul className="mt-3 space-y-1.5">
          {c.visa.keyPoints.map((kp) => (
            <li key={kp} className="flex gap-2 text-xs text-muted">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
              {kp}
            </li>
          ))}
        </ul>
      </section>

      {/* Intakes + Application deadlines */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">Intakes</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {c.intakes.map((i) => (
              <Badge key={i} variant="muted">{i}</Badge>
            ))}
          </div>
        </section>
        {c.applicationDeadlines && c.applicationDeadlines.length > 0 && (
          <section>
            <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-faint">
              <Clock className="h-3.5 w-3.5" />
              Application deadlines
            </h2>
            <div className="mt-3 space-y-2">
              {c.applicationDeadlines.map((d) => (
                <div key={d.intake} className="flex items-center justify-between text-xs">
                  <span className="text-muted">{d.intake}</span>
                  <span className="font-mono text-ink">{d.deadline}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Tuition */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-faint">
          <GraduationCap className="h-3.5 w-3.5" />
          Tuition per year (PKR)
        </h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-line">
          {(Object.keys(c.tuition) as ("ug" | "masters" | "phd")[]).map((level) => (
            <CostLine
              key={level}
              label={LEVEL_LABEL[level]}
              value={`${formatPkr(c.tuition[level].min)} – ${formatPkr(c.tuition[level].max)}`}
            />
          ))}
        </div>
      </section>

      {/* Living costs */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-faint">
          <Wallet className="h-3.5 w-3.5" />
          Monthly living costs (PKR)
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-surface-2/60 p-4">
            <p className="text-xs font-bold text-ink">Big city · {formatPkr(bigTotal)}/mo</p>
            <div className="mt-2">
              <CostLine label="Rent" value={formatPkr(bigCity.rent)} />
              <CostLine label="Food" value={formatPkr(bigCity.food)} />
              <CostLine label="Transport" value={formatPkr(bigCity.transport)} />
              <CostLine label="Utilities" value={formatPkr(bigCity.utilities)} />
              <CostLine label="Misc" value={formatPkr(bigCity.misc)} />
            </div>
          </div>
          <div className="rounded-xl bg-surface-2/60 p-4">
            <p className="text-xs font-bold text-ink">Small city · {formatPkr(monthlyLivingTotal(c, "small"))}/mo</p>
            <div className="mt-2">
              <CostLine label="Rent" value={formatPkr(smallCity.rent)} />
              <CostLine label="Food" value={formatPkr(smallCity.food)} />
              <CostLine label="Transport" value={formatPkr(smallCity.transport)} />
              <CostLine label="Utilities" value={formatPkr(smallCity.utilities)} />
              <CostLine label="Misc" value={formatPkr(smallCity.misc)} />
            </div>
          </div>
        </div>
      </section>

      {/* One-time costs */}
      <section className="mt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">One-time costs (PKR)</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-line">
          <CostLine label="Application fee" value={formatPkr(c.oneTime.applicationFee)} />
          <CostLine label="Visa fee" value={formatPkr(c.oneTime.visaFee)} />
          <CostLine label="Health insurance" value={formatPkr(c.oneTime.insurance)} />
          <CostLine label="Flight (round trip)" value={formatPkr(c.oneTime.flight)} />
        </div>
      </section>

      {/* Documents */}
      <section className="mt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">Documents checklist</h2>
        <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {c.documents.map((d) => (
            <li key={d} className="flex gap-2 text-xs text-muted">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
              {d}
            </li>
          ))}
        </ul>
      </section>

      {/* Required tests */}
      <section className="mt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">Required tests</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {c.requiredTests.map((t) => (
            <Link
              key={t}
              href={`/abroad/test-prep?country=${c.id}`}
              className="rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-saffron/40 hover:text-ink"
            >
              {t.toUpperCase()} →
            </Link>
          ))}
        </div>
      </section>

      {/* Top universities */}
      {c.topUniversities && c.topUniversities.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">Top universities</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {c.topUniversities.map((u) => (
              <div key={u.name} className="rounded-xl bg-surface-2/60 px-4 py-3">
                <p className="text-sm font-bold text-ink">{u.name}</p>
                {u.ranking && <p className="mt-0.5 text-[11px] text-saffron">{u.ranking}</p>}
                <p className="mt-1 text-xs text-muted">{u.programs.join(" · ")}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Scholarships available */}
      {c.scholarshipsAvailable && c.scholarshipsAvailable.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">Scholarships available</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {c.scholarshipsAvailable.map((s) => (
              <span key={s} className="rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 text-xs text-emerald-600">
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Pathway to admission */}
      <section className="mt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">Pathway to admission</h2>
        <ol className="mt-3 space-y-3">
          {c.pathway.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-saffron/15 font-mono text-xs font-bold text-saffron">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{step.title}</p>
                <p className="text-xs text-muted">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* After graduation */}
      <section className="mt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">After graduation</h2>
        <p className="mt-3 text-sm text-ink">{c.postStudyWork}</p>
        {c.workRights && (
          <p className="mt-2 text-xs text-muted">{c.workRights}</p>
        )}
      </section>

      {/* Climate */}
      {c.climate && (
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">Climate</h2>
          <p className="mt-3 text-sm text-muted">{c.climate}</p>
        </section>
      )}

      {/* Student life */}
      {c.studentLife && (
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">Student life</h2>
          <p className="mt-3 text-sm text-muted">{c.studentLife}</p>
        </section>
      )}

      {/* Culture tips */}
      {c.cultureTips && c.cultureTips.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">Culture tips for Pakistani students</h2>
          <div className="mt-3 space-y-2">
            {c.cultureTips.map((tip) => (
              <div key={tip} className="flex gap-2 text-xs text-muted">
                <span className="mt-1 text-saffron">→</span>
                {tip}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pros & cons */}
      <section className="mt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-faint">Pros & cons</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold text-emerald">Pros</p>
            <ul className="mt-1.5 space-y-1">
              {c.pros.map((p) => (
                <li key={p} className="flex gap-2 text-xs text-muted">
                  <span className="text-emerald">+</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold text-danger">Cons</p>
            <ul className="mt-1.5 space-y-1">
              {c.cons.map((con) => (
                <li key={con} className="flex gap-2 text-xs text-muted">
                  <span className="text-danger">–</span>
                  {con}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Sources */}
      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-6">
        {c.sources.map((s) => (
          <a
            key={s.url}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-saffron transition-colors hover:bg-saffron/5"
          >
            <ExternalLink className="h-3 w-3" />
            {s.label}
          </a>
        ))}
      </div>

      <p className="mt-10 text-xs text-faint">
        Data compiled {data.dataYear}. Fees change per cycle — verify on official pages before applying.
      </p>
    </div>
  );
}
