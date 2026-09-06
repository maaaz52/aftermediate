"use client";

import * as React from "react";
import { Award, Clock, ExternalLink, ListFilter, Play, RotateCcw, Route, Search, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import coursesJson from "@/data/skills-courses.json";
import { pkr, pathProgress, skillPaths, sortByKey, trackCounts, useLocalStorage } from "@/lib/skills";
import type { CourseEpisode } from "@/components/skills/course-player";

type Course = (typeof coursesJson)[number] & {
  videoId?: string;
  playlistId?: string;
  episodes?: CourseEpisode[];
};
type Track = Course["track"];
type Level = Course["level"];
type SortKey = "rating" | "hours" | "cost" | "title";

const TRACK_LABELS: Record<Track, string> = {
  "web-dev": "Web Dev",
  design: "Design",
  data: "Data",
  ai: "AI",
  writing: "Writing",
  marketing: "Marketing",
  video: "Video",
  business: "Business",
};

const LEVEL_LABELS: Record<Level, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const LEVEL_STEP: Record<Level, number> = { beginner: 1, intermediate: 2, advanced: 3 };

const SORT_LABELS: Record<SortKey, string> = {
  rating: "Highest rated",
  hours: "Shortest",
  cost: "Cheapest",
  title: "Title A–Z",
};

function Stars({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <span className="font-mono text-xs tracking-tight text-amber" title={`${rating}/5`}>
      {"★".repeat(filled)}
      <span className="text-line">{"★".repeat(5 - filled)}</span>
    </span>
  );
}

function LevelMeter({ level }: { level: Level }) {
  const step = LEVEL_STEP[level];
  return (
    <span className="inline-flex items-center gap-1" title={`${LEVEL_LABELS[level]} difficulty`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={cn("h-2 w-2 border border-ink", i <= step ? "bg-accent" : "bg-surface-2")} />
      ))}
    </span>
  );
}

export function CourseExplorer() {
  const [track, setTrack] = React.useState<Track | null>(null);
  const [level, setLevel] = React.useState<Level | null>(null);
  const [freeOnly, setFreeOnly] = React.useState(false);
  const [sort, setSort] = React.useState<SortKey>("rating");
  const [q, setQ] = React.useState("");
  const [mode, setMode] = React.useState<"list" | "paths">("list");
  const [openPath, setOpenPath] = React.useState<string | null>(null);
  const [pathFocus, setPathFocus] = React.useState<string[] | null>(null);
  const [doneArr, setDoneArr] = useLocalStorage<string[]>("aftermediate:skills:paths", []);
  const done = React.useMemo(() => new Set(doneArr), [doneArr]);

  const counts = React.useMemo(() => trackCounts(coursesJson as Course[]), []);
  const total = (coursesJson as Course[]).length;

  const filtered = React.useMemo(() => {
    let list = coursesJson as Course[];
    if (track) list = list.filter((c) => c.track === track);
    if (level) list = list.filter((c) => c.level === level);
    if (freeOnly) list = list.filter((c) => c.costUsd === 0);
    if (pathFocus) list = list.filter((c) => pathFocus.includes(c.id));
    const needle = q.trim().toLowerCase();
    if (needle) list = list.filter((c) => (c.title + c.provider + c.description + c.why).toLowerCase().includes(needle));
    const key = sort === "cost" ? "costUsd" : sort;
    return sortByKey(list, key as keyof Course, sort === "rating" ? "desc" : "asc");
  }, [track, level, freeOnly, q, sort, pathFocus]);

  function clearFilters() {
    setTrack(null);
    setLevel(null);
    setFreeOnly(false);
    setPathFocus(null);
    setQ("");
  }

  function toggleDone(id: string) {
    setDoneArr((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function focusPath(courseIds: string[]) {
    setPathFocus(courseIds);
    setMode("list");
  }

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border-2 border-ink bg-surface p-0.5">
            {(["list", "paths"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors",
                  mode === m ? "bg-accent text-background" : "text-muted hover:text-ink"
                )}
              >
                {m === "list" ? <ListFilter className="h-3.5 w-3.5" /> : <Route className="h-3.5 w-3.5" />}
                {m === "list" ? "Browse" : "Skill Paths"}
              </button>
            ))}
          </div>
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search courses…"
              className="h-10 w-full rounded-lg border-2 border-ink bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setTrack(null)}
            className={cn(
              "rounded-full border-2 px-3 py-1 text-xs font-semibold transition-colors",
              !track ? "border-ink bg-ink text-background" : "border-line bg-surface text-muted hover:border-ink"
            )}
          >
            All · {total}
          </button>
          {(Object.keys(counts) as Track[]).map((t) => (
            <button
              key={t}
              onClick={() => setTrack(track === t ? null : t)}
              className={cn(
                "rounded-full border-2 px-3 py-1 text-xs font-semibold transition-colors",
                track === t ? "border-ink bg-ink text-background" : "border-line bg-surface text-muted hover:border-ink"
              )}
            >
              {TRACK_LABELS[t]} · {counts[t]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg border-2 border-ink bg-surface p-0.5">
            {([null, "beginner", "intermediate", "advanced"] as const).map((l) => (
              <button
                key={l ?? "all"}
                onClick={() => setLevel(l)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                  level === l ? "bg-accent text-background" : "text-muted hover:text-ink"
                )}
              >
                {l ? LEVEL_LABELS[l] : "All levels"}
              </button>
            ))}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted">
            <input
              type="checkbox"
              checked={freeOnly}
              onChange={(e) => setFreeOnly(e.target.checked)}
              className="h-4 w-4 accent-emerald"
            />
            Free only
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-9 rounded-lg border-2 border-ink bg-surface px-2 text-xs font-semibold text-ink focus:outline-none"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                Sort: {SORT_LABELS[k]}
              </option>
            ))}
          </select>
          <span className="ml-auto font-mono text-xs text-faint">
            {filtered.length} of {total} courses
          </span>
        </div>
      </div>

      {mode === "paths" ? (
        <div className="space-y-4">
          {skillPaths.map((p) => {
            const prog = pathProgress(p.id, done);
            const expanded = openPath === p.id;
            return (
              <div key={p.id} className="pixel-border bg-surface">
                <button
                  onClick={() => setOpenPath(expanded ? null : p.id)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left"
                >
                  <div>
                    <h3 className="font-display text-sm text-ink">{p.title}</h3>
                    <p className="mt-0.5 text-xs text-muted">{p.subtitle}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-xs text-muted">
                      {prog.done}/{prog.total} done · {prog.pct}%
                    </div>
                    <div className="mt-1 h-2 w-24 border border-line bg-surface-2">
                      <div className="h-full bg-emerald transition-all" style={{ width: `${prog.pct}%` }} />
                    </div>
                  </div>
                </button>
                {expanded && (
                  <div className="border-t border-line p-4">
                    <ol className="space-y-2">
                      {p.courseIds.map((cid, i) => {
                        const course = (coursesJson as Course[]).find((c) => c.id === cid);
                        if (!course) return null;
                        const checked = done.has(cid);
                        return (
                          <li key={cid} className="flex items-center gap-3">
                            <button
                              onClick={() => toggleDone(cid)}
                              aria-label={checked ? "Mark not done" : "Mark done"}
                              className={cn(
                                "grid h-5 w-5 shrink-0 place-items-center border-2 border-ink text-[10px] font-bold",
                                checked ? "bg-emerald text-background" : "bg-surface text-transparent"
                              )}
                            >
                              ✓
                            </button>
                            <span className="font-mono text-xs text-faint">{i + 1}</span>
                            <div className="min-w-0 flex-1">
                              <div className={cn("truncate text-sm", checked ? "text-faint line-through" : "text-ink")}>
                                {course.title}
                              </div>
                              <div className="text-xs text-muted">
                                {course.provider} · {course.hours}h · {pkr(course.costUsd)}
                              </div>
                            </div>
                            <button
                              onClick={() => focusPath(p.courseIds)}
                              className="shrink-0 rounded-md border border-line bg-surface-2 px-2 py-1 text-[11px] font-semibold text-muted transition-colors hover:border-ink hover:text-ink"
                            >
                              Show these
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <>
          {pathFocus && (
            <div className="flex items-center gap-2 rounded-lg border-2 border-accent/40 bg-accent/5 px-3 py-2 text-xs font-semibold text-accent">
              <Route className="h-3.5 w-3.5" />
              Showing only courses from a skill path
              <button onClick={() => setPathFocus(null)} className="ml-auto inline-flex items-center gap-1 hover:underline">
                <X className="h-3 w-3" /> Clear
              </button>
            </div>
          )}
          {filtered.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-line bg-surface p-10 text-center">
              <p className="font-display text-sm text-ink">No courses match</p>
              <p className="mt-1 text-sm text-muted">Try loosening the filters.</p>
              <button
                onClick={clearFilters}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-ink px-4 py-2 text-xs font-bold uppercase tracking-wide text-background transition-transform hover:-translate-y-0.5"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => {
                const focused = pathFocus?.includes(c.id);
                const hasVideo = Boolean(c.videoId || c.playlistId || c.episodes?.length);
                return (
                  <div
                    key={c.id}
                    className={cn(
                      "relative pixel-border bg-surface p-4",
                      focused && "ring-2 ring-accent/70",
                      hasVideo && "transition-transform hover:-translate-y-0.5"
                    )}
                  >
                    {hasVideo && (
                      <Link
                        href={`/skills/courses/${c.id}`}
                        aria-label={`Open ${c.title}`}
                        className="absolute inset-0 z-0 rounded-[inherit]"
                      />
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-ink">{c.title}</h3>
                        <p className="truncate text-xs text-muted">{c.provider}</p>
                      </div>
                      <Stars rating={c.rating} />
                    </div>
                    <p className="mt-2 line-clamp-3 min-h-[3.75rem] text-xs leading-relaxed text-muted">{c.description}</p>
                    <p className="mt-2 rounded-md bg-surface-2 px-2 py-1.5 text-[11px] leading-snug text-ink">
                      <span className="font-semibold">Why:</span> {c.why}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {hasVideo ? (
                        <Link
                          href={`/skills/courses/${c.id}`}
                          className="relative z-10 inline-flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-[11px] font-bold text-background transition-colors hover:brightness-110"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          {c.episodes?.length ? `${c.episodes.length} episodes` : "Watch course"}
                        </Link>
                      ) : (
                        <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-bold text-muted">
                          External course
                        </span>
                      )}
                      <span className="rounded-md bg-accent/10 px-2 py-0.5 text-[11px] font-bold text-accent">
                        {TRACK_LABELS[c.track]}
                      </span>
                      <LevelMeter level={c.level} />
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted">
                        <Clock className="h-3 w-3" /> {c.hours}h
                      </span>
                      {c.certificate && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald/10 px-2 py-0.5 text-[11px] font-bold text-emerald">
                          <Award className="h-3 w-3" /> Cert
                        </span>
                      )}
                      <span
                        className={cn(
                          "ml-auto rounded-md px-2 py-0.5 font-mono text-[11px] font-bold",
                          c.costUsd === 0 ? "bg-emerald text-background" : "bg-surface-2 text-ink"
                        )}
                        title={c.costUsd === 0 ? "Free" : `$${c.costUsd}`}
                      >
                        {c.costUsd === 0 ? "Free" : `$${c.costUsd} ≈ ${pkr(c.costUsd)}`}
                      </span>
                    </div>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="relative z-10 mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
                    >
                      Open course <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
