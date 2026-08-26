"use client";

import * as React from "react";
import { Wallet, Plane, Award, ExternalLink, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SourceTag } from "@/components/stat";
import { data } from "@/lib/data";

function affordability(budget: number): { tier: string; desc: string; tone: "emerald" | "saffron" | "danger" }[] {
  if (!budget) return [];
  const out: { tier: string; desc: string; tone: "emerald" | "saffron" | "danger" }[] = [];
  if (budget >= 150000)
    out.push({ tier: "Private MBBS / engineering", desc: "Fees can hit PKR 1.8M/yr — above most budgets. Look at need-based aid.", tone: "danger" });
  if (budget >= 60000)
    out.push({ tier: "Private CS / business degree", desc: "FAST/private unis are in reach. Prioritize entry test + merit scholarship.", tone: "saffron" });
  if (budget >= 20000)
    out.push({ tier: "Public university (full)", desc: "Public tuition is heavily subsidized — this is the sweet spot.", tone: "emerald" });
  out.push({ tier: "Self-study + certifications", desc: "Free/low-cost certs (Google, CS50) can start your income in months.", tone: "emerald" });
  return out;
}

export default function MoneyPage() {
  const [budget, setBudget] = React.useState(0);
  const aff = affordability(budget);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2">
        <Badge variant="emerald">Money</Badge>
        <span className="font-mono text-xs text-faint">budget · abroad · scholarships</span>
      </div>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">Money is a merit factor too.</h1>
      <p className="mt-2 max-w-xl text-muted">
        The part nobody talks about: what you can actually afford, and how to afford more.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald" />
            <h2 className="text-lg font-bold text-ink sm:text-xl">Budget agent</h2>
          </div>
          <p className="mt-2 text-sm text-muted">What can your family comfortably spend per month (PKR)?</p>
          <Input type="number" className="mt-4 font-mono text-lg" placeholder="e.g. 50000"
            value={budget || ""} onChange={(e) => setBudget(Number(e.target.value))} />
          {aff.length > 0 && (
            <div className="mt-5 space-y-2.5">
              {aff.map((a) => (
                <div key={a.tier} className="rounded-xl border border-line bg-surface-2/50 p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink">{a.tier}</p>
                    <Badge variant={a.tone}>{a.tone === "emerald" ? "in reach" : a.tone === "saffron" ? "stretch" : "needs aid"}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">{a.desc}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-info" />
              <h2 className="text-lg font-bold text-ink sm:text-xl">~115,000 Pakistanis study abroad</h2>
            </div>
            <div className="mt-2"><SourceTag stat={data.abroad.totalAbroad} /></div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-saffron" />
              <h2 className="text-lg font-bold text-ink sm:text-xl">HEC funded 4,000+ scholarships</h2>
            </div>
            <p className="mt-2 text-sm text-muted">
              Pakistan runs one of South Asia's largest government scholarship programs. Apply — the
              competition is smaller than you think.
            </p>
          </Card>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="mb-5 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Study abroad, by the numbers</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.destinations.map((d) => (
            <Card key={d.country} className="p-5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{d.flag}</span>
                <h3 className="text-lg font-bold text-ink sm:text-xl">{d.country}</h3>
              </div>
              <p className="mt-1 font-mono text-xs text-info">{d.approxStudents} students</p>
              <div className="mt-3 space-y-1.5 text-sm">
                <p className="text-muted"><span className="text-faint">Tuition:</span> {d.tuition}</p>
                <p className="text-muted"><span className="text-faint">Living:</span> {d.living}</p>
                <p className="text-muted"><span className="text-faint">Post-study:</span> {d.postStudyWork}</p>
              </div>
              <p className="mt-3 text-xs text-emerald">{d.keyPoint}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-5 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Scholarships worth your time</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {data.scholarships.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-ink">{s.name}</h3>
                  <p className="text-xs text-muted">{s.funder} · {s.country} · {s.level}</p>
                </div>
                <Badge variant="saffron">{s.coverage.split("—")[0].trim()}</Badge>
              </div>
              <p className="mt-3 text-sm text-muted">{s.coverage}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {s.eligibility.slice(0, 3).map((e) => (
                  <span key={e} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">{e}</span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-mono text-xs text-faint">deadline: {s.deadline}</span>
                <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-saffron hover:underline">
                  Details <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
