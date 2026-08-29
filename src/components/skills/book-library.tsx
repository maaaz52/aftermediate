"use client";

import * as React from "react";
import { BookOpen, ExternalLink, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import booksJson from "@/data/skills-books.json";
import { readDays, useLocalStorage } from "@/lib/skills";

type Book = (typeof booksJson)[number];
type Genre = Book["genre"];
type Level = Book["level"];
type SortKey = "rating" | "pages" | "year" | "title";

const GENRE_LABELS: Record<Genre, string> = {
  design: "Design",
  development: "Development",
  business: "Business",
  freelancing: "Freelancing",
  writing: "Writing",
  marketing: "Marketing",
  data: "Data",
  mindset: "Mindset",
};

const GENRE_TILE: Record<Genre, string> = {
  design: "bg-violet/10 text-violet",
  development: "bg-accent/10 text-accent",
  business: "bg-amber/10 text-amber",
  freelancing: "bg-emerald/10 text-emerald",
  writing: "bg-info/10 text-info",
  marketing: "bg-danger/10 text-danger",
  data: "bg-saffron/10 text-saffron",
  mindset: "bg-surface-2 text-muted",
};

const LEVEL_LABELS: Record<Level, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const SORT_LABELS: Record<SortKey, string> = {
  rating: "Highest rated",
  pages: "Shortest",
  year: "Newest",
  title: "Title A–Z",
};

interface QueueItem {
  id: string;
  progress: number;
}

const PAGES_PER_DAY = 40;

function Stars({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <span className="font-mono text-xs tracking-tight text-amber" title={`${rating}/5`}>
      {"★".repeat(filled)}
      <span className="text-line">{"★".repeat(5 - filled)}</span>
    </span>
  );
}

export function BookLibrary() {
  const [genre, setGenre] = React.useState<Genre | null>(null);
  const [q, setQ] = React.useState("");
  const [freeOnly, setFreeOnly] = React.useState(false);
  const [sort, setSort] = React.useState<SortKey>("rating");
  const [open, setOpen] = React.useState<Set<string>>(new Set());
  const [queue, setQueue] = useLocalStorage<QueueItem[]>("aftermediate:skills:queue", []);

  const books = booksJson as Book[];

  const counts = React.useMemo(() => {
    const out: Record<string, number> = {};
    for (const b of books) out[b.genre] = (out[b.genre] ?? 0) + 1;
    return out;
  }, [books]);

  const filtered = React.useMemo(() => {
    let list = books;
    if (genre) list = list.filter((b) => b.genre === genre);
    if (freeOnly) list = list.filter((b) => b.free);
    const needle = q.trim().toLowerCase();
    if (needle) list = list.filter((b) => (b.title + b.author + b.summary).toLowerCase().includes(needle));
    return [...list].sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "pages") return a.pages - b.pages;
      if (sort === "year") return b.year - a.year;
      return a.title.localeCompare(b.title);
    });
  }, [books, genre, freeOnly, q, sort]);

  function clearFilters() {
    setGenre(null);
    setFreeOnly(false);
    setQ("");
  }

  function toggleOpen(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleQueue(id: string) {
    setQueue((prev) => (prev.some((qi) => qi.id === id) ? prev.filter((qi) => qi.id !== id) : [...prev, { id, progress: 0 }]));
  }

  function updateProgress(id: string, progress: number) {
    setQueue((prev) => prev.map((qi) => (qi.id === id ? { ...qi, progress } : qi)));
  }

  function removeFromQueue(id: string) {
    setQueue((prev) => prev.filter((qi) => qi.id !== id));
  }

  const totalPages = React.useMemo(
    () => queue.reduce((sum, qi) => sum + (books.find((b) => b.id === qi.id)?.pages ?? 0), 0),
    [queue, books]
  );

  const finishDays = React.useMemo(() => {
    const remaining = queue.reduce((sum, qi) => {
      const book = books.find((b) => b.id === qi.id);
      if (!book) return sum;
      return sum + (book.pages * (100 - qi.progress)) / 100;
    }, 0);
    return readDays(Math.round(remaining), PAGES_PER_DAY);
  }, [queue, books]);

  return (
    <div className={cn("space-y-5", queue.length > 0 && "pb-40")}>
      {/* Controls */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search books, authors, topics…"
            className="h-10 w-full rounded-lg border-2 border-ink bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setGenre(null)}
            className={cn(
              "rounded-full border-2 px-3 py-1 text-xs font-semibold transition-colors",
              !genre ? "border-ink bg-ink text-background" : "border-line bg-surface text-muted hover:border-ink"
            )}
          >
            All · {books.length}
          </button>
          {(Object.keys(counts) as Genre[]).map((g) => (
            <button
              key={g}
              onClick={() => setGenre(genre === g ? null : g)}
              className={cn(
                "rounded-full border-2 px-3 py-1 text-xs font-semibold transition-colors",
                genre === g ? "border-ink bg-ink text-background" : "border-line bg-surface text-muted hover:border-ink"
              )}
            >
              {GENRE_LABELS[g]} · {counts[g]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted">
            <input type="checkbox" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} className="h-4 w-4 accent-emerald" />
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
          <span className="ml-auto font-mono text-xs text-faint">{filtered.length} of {books.length} books</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-line bg-surface p-10 text-center">
          <p className="font-display text-sm text-ink">No books match</p>
          <p className="mt-1 text-sm text-muted">Try a different genre or search.</p>
          <button
            onClick={clearFilters}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-ink px-4 py-2 text-xs font-bold uppercase tracking-wide text-background transition-transform hover:-translate-y-0.5"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => {
            const expanded = open.has(b.id);
            const inQueue = queue.find((qi) => qi.id === b.id);
            return (
              <div key={b.id} className="pixel-border bg-surface">
                <div className={cn("flex items-center gap-3 border-b-2 border-ink px-4 py-3", GENRE_TILE[b.genre])}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center border-2 border-ink bg-surface font-display text-xs">
                    {b.title.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-ink">{b.title}</h3>
                    <p className="truncate text-xs text-muted">{b.author}</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2">
                    <Stars rating={b.rating} />
                    <span className="font-mono text-[11px] text-faint">
                      {b.pages} pages · ~{readDays(b.pages, PAGES_PER_DAY)} days @ {PAGES_PER_DAY}/day
                    </span>
                    <span
                      className={cn(
                        "ml-auto rounded-md px-2 py-0.5 text-[11px] font-bold",
                        b.free ? "bg-emerald text-background" : "bg-surface-2 text-ink"
                      )}
                    >
                      {b.free ? "FREE" : "Paid"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-bold text-ink">{GENRE_LABELS[b.genre]}</span>
                    <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-muted">{LEVEL_LABELS[b.level]}</span>
                  </div>

                  <button
                    onClick={() => toggleOpen(b.id)}
                    className="mt-3 w-full rounded-lg border-2 border-line bg-surface-2 px-3 py-2 text-left text-xs font-semibold text-ink transition-colors hover:border-ink"
                  >
                    {expanded ? "Hide details" : "Summary + why read it"} <span className="float-right">▾</span>
                  </button>
                  {expanded && (
                    <div className="mt-2 space-y-2 text-xs leading-relaxed">
                      <p className="text-muted">{b.summary}</p>
                      <p className="rounded-md bg-accent/5 px-2 py-1.5 text-ink">
                        <span className="font-semibold text-accent">Why read it:</span> {b.whyRead}
                      </p>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    <a
                      href={b.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
                    >
                      {b.free ? "Read free" : "Get it"} <ExternalLink className="h-3 w-3" />
                    </a>
                    <button
                      onClick={() => toggleQueue(b.id)}
                      className={cn(
                        "ml-auto inline-flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-[11px] font-bold transition-colors",
                        inQueue
                          ? "border-emerald bg-emerald/10 text-emerald"
                          : "border-ink bg-surface text-ink hover:bg-surface-2"
                      )}
                    >
                      {inQueue ? (
                        <>
                          <BookOpen className="h-3 w-3" /> In queue ({inQueue.progress}%)
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3" /> Add to queue
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reading queue strip */}
      {queue.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-surface px-4 py-3 shadow-[0_-4px_0_0_var(--color-ink)]">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-ink">
              <span className="font-bold">{queue.length} book{queue.length > 1 ? "s" : ""} in queue</span>
              <span>{totalPages.toLocaleString("en-US")} total pages</span>
              <span className="text-emerald">≈ {finishDays} day{finishDays === 1 ? "" : "s"} to finish @ {PAGES_PER_DAY}/day</span>
              <button
                onClick={() => setQueue([])}
                className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-danger hover:underline"
              >
                <Trash2 className="h-3 w-3" /> Clear all
              </button>
            </div>
            <div className="mt-2 flex gap-3 overflow-x-auto pb-1">
              {queue.map((qi) => {
                const book = books.find((b) => b.id === qi.id);
                if (!book) return null;
                return (
                  <div key={qi.id} className="flex w-56 shrink-0 flex-col gap-1 rounded-lg border border-line bg-surface-2 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] font-semibold text-ink">{book.title}</span>
                      <button onClick={() => removeFromQueue(qi.id)} aria-label="Remove from queue" className="text-faint hover:text-danger">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={qi.progress}
                        onChange={(e) => updateProgress(qi.id, Number(e.target.value))}
                        className="h-1.5 flex-1 accent-emerald"
                      />
                      <span className="w-9 text-right font-mono text-[10px] text-muted">{qi.progress}%</span>
                    </div>
                    <span className="font-mono text-[10px] text-faint">
                      {Math.round(book.pages * (1 - qi.progress / 100))} pages left
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
