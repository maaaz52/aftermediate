"use client";

import * as React from "react";
import { ChevronDown, ExternalLink, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useStudent } from "@/lib/store";
import { STREAM_LABEL } from "@/lib/data";
import { filterUniversities } from "@/lib/pakistan-filters";
import type { PakistanUniversity, Stream } from "@/lib/types";
import json from "@/data/pakistan-universities.json";

const data = json as unknown as { dataYear: number; universities: PakistanUniversity[] };

const STREAM_FILTERS: { value: Stream | "all"; label: string }[] = [
  { value: "all", label: "All streams" },
  ...(Object.keys(STREAM_LABEL) as Stream[]).map((s) => ({
    value: s,
    label: STREAM_LABEL[s],
  })),
];

const TYPE_FILTERS: { value: "all" | "public" | "private"; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
];

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
      onClick={onClick}
      aria-pressed={active}
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

function UniversityCard({
  u,
  open,
  onToggle,
}: {
  u: PakistanUniversity;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="card-glass overflow-hidden rounded-2xl">
      <h3>
        <button
          type="button"
          id={`accordion-trigger-${u.id}`}
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={`accordion-panel-${u.id}`}
          className="flex w-full items-center gap-4 p-5 text-left"
        >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-saffron/15 font-mono text-lg font-bold text-saffron">
          {u.short.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold text-ink">{u.short}</span>
            <Badge variant="muted">{u.city}</Badge>
            <Badge variant={u.type === "public" ? "emerald" : "info"}>{u.type}</Badge>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted">{u.name}</p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="font-mono text-xs text-saffron">{u.ranking.label}</p>
          <p className="mt-0.5 text-[11px] text-faint">Test: {u.entryTest}</p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-faint transition-transform",
            open && "rotate-180"
          )}
        />
        </button>
      </h3>

      <div
        hidden={!open}
        id={`accordion-panel-${u.id}`}
        role="region"
        aria-labelledby={`accordion-trigger-${u.id}`}
        className="border-t border-line p-5"
      >
          <p className="text-sm leading-relaxed text-muted">{u.intro}</p>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
                Admission process
              </p>
              <ol className="mt-3 space-y-3">
                {u.admissionSteps.map((step, i) => (
                  <li key={step.title} className="flex gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-saffron/15 font-mono text-[10px] font-bold text-saffron">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">{step.title}</p>
                      <p className="text-xs text-muted">{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
                  Ranking
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="saffron">{u.ranking.label}</Badge>
                  <a
                    href={u.ranking.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted underline-offset-2 hover:text-saffron hover:underline"
                  >
                    source
                  </a>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
                  Fees
                </p>
                <p className="mt-2 text-sm text-ink">{u.fees.summary}</p>
                {u.fees.programFees && u.fees.programFees.length > 0 && (
                  <div className="mt-2 overflow-hidden rounded-lg border border-line">
                    {u.fees.programFees.map((pf) => (
                      <div
                        key={pf.program}
                        className="flex items-center justify-between border-b border-line/60 px-3 py-2 text-xs last:border-0"
                      >
                        <span className="text-muted">{pf.program}</span>
                        <span className="font-mono text-ink">
                          PKR {pf.perYear.toLocaleString()}/yr
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
              Best for
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {u.bestFields.map((bf) => (
                <div key={bf.field} className="rounded-lg bg-surface-2/60 px-3 py-2">
                  <p className="text-sm font-semibold text-ink">{bf.field}</p>
                  <p className="mt-0.5 text-xs text-muted">{bf.why}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
            {u.sourceUrls.map((url) => (
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

export function UniversitiesExplorer() {
  const { profile } = useStudent();
  const [query, setQuery] = React.useState("");
  const [stream, setStream] = React.useState<Stream | "all">(profile.stream ?? "all");
  const [type, setType] = React.useState<"all" | "public" | "private">("all");
  const [openId, setOpenId] = React.useState<string | null>(null);

  const filtered = filterUniversities(data.universities, { query, stream, type });

  // Reset the open card if it is no longer in the filtered list (React's
  // render-time state adjustment pattern for deriving state from props/filters).
  if (openId && !filtered.some((u) => u.id === openId)) {
    setOpenId(null);
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <Input
            className="pl-9"
            placeholder="Search by name, city, or field..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {STREAM_FILTERS.map((f) => (
          <Chip key={f.value} active={stream === f.value} onClick={() => setStream(f.value)}>
            {f.label}
          </Chip>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {TYPE_FILTERS.map((f) => (
          <Chip key={f.value} active={type === f.value} onClick={() => setType(f.value)}>
            {f.label}
          </Chip>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {filtered.map((u) => (
          <UniversityCard
            key={u.id}
            u={u}
            open={openId === u.id}
            onToggle={() => setOpenId(openId === u.id ? null : u.id)}
          />
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-faint">
            No universities match these filters.
          </p>
        )}
      </div>

      <p className="mt-6 text-xs text-faint">
        Data compiled {data.dataYear} from official university pages. Always confirm fees and
        deadlines on the official links before applying.
      </p>
    </div>
  );
}