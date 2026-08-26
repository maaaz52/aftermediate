"use client";

import { TrendingUp, Zap, Radio } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SourceTag } from "@/components/stat";
import { data } from "@/lib/data";

const tooltipStyle = {
  background: "#0f0f17",
  border: "1px solid #23232f",
  borderRadius: 8,
  fontSize: 12,
};

const fieldTone: Record<string, string> = {
  high: "border-emerald/30 bg-emerald/10 text-emerald",
  medium: "border-saffron/30 bg-saffron/10 text-saffron",
};

export default function TrendsPage() {
  const exportsData = data.industry.itExports.map((d) => ({ year: d.year, value: d.value }));
  const unemploymentData = data.jobs.youthUnemployment;
  const incomeData = data.jobs.avgIncome.map((d) => ({ year: d.year, value: d.value / 1000 }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2">
        <Badge variant="info">Trends</Badge>
        <span className="font-mono text-xs text-faint">live market signal · sourced</span>
      </div>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">What the world is actually doing.</h1>
      <p className="mt-2 max-w-xl text-muted">
        The data your textbooks don't update fast enough to show you.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-widest text-muted">IT exports (FY26)</p>
          <p className="mt-2 font-mono text-3xl font-bold text-emerald">${data.industry.itExports.at(-1)?.value}B</p>
          <p className="text-xs text-muted">{data.industry.growth} · {data.industry.rank}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-widest text-muted">ICT companies</p>
          <p className="mt-2 font-mono text-3xl font-bold text-info">{data.industry.companies}</p>
          <p className="text-xs text-muted">driving {data.industry.servicesShare}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-widest text-muted">Govt. target</p>
          <p className="mt-2 font-mono text-3xl font-bold text-saffron">{data.industry.target}</p>
          <p className="text-xs text-muted">by 2030, Uraan Pakistan vision</p>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink sm:text-xl">
              <TrendingUp className="h-5 w-5 text-emerald" /> IT exports (US$B)
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={exportsData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="year" stroke="var(--color-faint)" fontSize={11} />
              <YAxis stroke="var(--color-faint)" fontSize={11} unit="B" />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#ececf1" }} />
              <Line type="monotone" dataKey="value" stroke="var(--color-emerald)" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-3"><SourceTag stat={{ value: data.industry.itExports.at(-1)?.value.toString() ?? "", year: data.industry.itExports.at(-1)?.year ?? "", source: data.industry.source, source_url: data.industry.source_url }} /></div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink sm:text-xl">
              <Zap className="h-5 w-5 text-danger" /> Youth unemployment (%)
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={unemploymentData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="year" stroke="var(--color-faint)" fontSize={11} />
              <YAxis stroke="var(--color-faint)" fontSize={11} unit="%" />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#ececf1" }} />
              <Bar dataKey="value" fill="var(--color-danger)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3"><SourceTag stat={{ value: "LFS 2024-25", year: "2025", source: data.jobs.source, source_url: data.jobs.source_url }} /></div>
        </Card>
      </div>

      <div className="mt-8">
        <div className="mb-5 flex items-center gap-2">
          <Radio className="h-5 w-5 text-violet" />
          <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Fields heating up right now</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.industry.fields.map((f) => (
            <Card key={f.name} className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-ink">{f.name}</h3>
                <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase ${fieldTone[f.demand]}`}>
                  {f.demand}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">{f.note}</p>
            </Card>
          ))}
        </div>
      </div>

      <Card className="mt-8 p-6">
        <h2 className="text-lg font-bold text-ink sm:text-xl">Average monthly income</h2>
        <p className="mt-1 text-sm text-muted">Why field choice is a financial decision.</p>
        <div className="mt-4 h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={incomeData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="year" stroke="var(--color-faint)" fontSize={11} />
              <YAxis stroke="var(--color-faint)" fontSize={11} unit="k" />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#ececf1" }} />
              <Line type="monotone" dataKey="value" stroke="var(--color-saffron)" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2"><SourceTag stat={{ value: "Rs 39,042 avg", year: "2024-25", source: data.jobs.source, source_url: data.jobs.source_url }} /></div>
      </Card>
    </div>
  );
}
