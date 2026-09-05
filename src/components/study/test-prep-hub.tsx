"use client";

import * as React from "react";
import Link from "next/link";
import { Bookmark, ChevronDown, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLocalStorage } from "@/lib/skills";
import { cn } from "@/lib/utils";
import { ALL_TESTS, REGION_LABEL } from "@/lib/test-prep";
import type { Stream } from "@/lib/types";

const STREAM_FILTERS: { value: Stream | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pre-medical", label: "Pre-Medical" },
  { value: "pre-engineering", label: "Pre-Engineering" },
  { value: "ics", label: "ICS" },
  { value: "icom", label: "I.Com" },
  { value: "alevel", label: "A-Level" },
];

export function TestPrepHub() {
  const [region, setRegion] = React.useState<"all" | "pakistan" | "abroad">("all");
  const [stream, setStream] = React.useState<Stream | "all">("all");
  const [query, setQuery] = React.useState("");
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [savedOnly, setSavedOnly] = React.useState(false);
  const [savedTests, setSavedTests] = useLocalStorage<string[]>(
    "aftermediate:test-prep:saved",
    []
  );
  const menuRef = React.useRef<HTMLDivElement>(null);

  const toggleSaved = (id: string) =>
    setSavedTests((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_TESTS.filter((t) => {
      if (region !== "all" && t.region !== region) return false;
      if (stream !== "all" && !t.streams.includes(stream)) return false;
      if (savedOnly && !savedTests.includes(t.id)) return false;
      if (q && !(t.short.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.body.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [region, stream, query, savedOnly, savedTests]);

  // Close the card dropdown on outside click or route change.
  React.useEffect(() => {
    if (!openId) return;
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenId(null);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [openId]);

  return (
    <div>
      {/* ── Controls ── */}
      <div className="card-glass rounded-2xl p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["all", "pakistan", "abroad"] as const).map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={region === r}
                onClick={() => setRegion(r)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  region === r
                    ? "border-saffron/40 bg-saffron/10 text-saffron"
                    : "border-line bg-surface text-muted hover:text-ink"
                )}
              >
                {r === "all" ? "All regions" : REGION_LABEL[r]}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={savedOnly}
              onClick={() => setSavedOnly((v) => !v)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                savedOnly
                  ? "border-saffron/40 bg-saffron/10 text-saffron"
                  : "border-line bg-surface text-muted hover:text-ink"
              )}
            >
              Saved ({savedTests.length})
            </button>
          </div>
          <div className="relative lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <Input
              className="pl-9"
              placeholder="Search tests…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {region !== "abroad" && (
          <div className="mt-3 flex flex-wrap gap-2">
            {STREAM_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                aria-pressed={stream === f.value}
                onClick={() => setStream(f.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                  stream === f.value
                    ? "border-saffron/40 bg-saffron/10 text-saffron"
                    : "border-line bg-surface text-muted hover:text-ink"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div className="card-glass mt-5 rounded-2xl p-10 text-center">
          <p className="text-sm font-medium text-ink">
            {savedOnly
              ? "No saved tests yet."
              : "No tests match these filters."}
          </p>
          <p className="mt-1 text-xs text-muted">
            {savedOnly
              ? "Tap the bookmark on any test to save it here."
              : "Try a different region, stream, or search term."}
          </p>
          {(savedOnly || query || stream !== "all" || region !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSavedOnly(false);
                setQuery("");
                setStream("all");
                setRegion("all");
              }}
              className="mt-4 rounded-lg bg-saffron px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-soft"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => {
            const isOpen = openId === t.id;
            const isSaved = savedTests.includes(t.id);
            return (
              <div key={t.id} className="relative">
                <div
                  className={cn(
                    "card-glass flex flex-col rounded-2xl p-5 text-left transition-all",
                    isOpen ? "border-saffron/50 ring-1 ring-saffron/30" : "hover:-translate-y-0.5 hover:shadow-md"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-ink">{t.short}</span>
                        <Badge variant={t.region === "pakistan" ? "saffron" : "violet"}>
                          {REGION_LABEL[t.region]}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        aria-pressed={isSaved}
                        aria-label={`Save ${t.short}`}
                        onClick={() => toggleSaved(t.id)}
                        className={cn(
                          "rounded-lg p-1.5 transition-colors",
                          isSaved ? "text-saffron" : "text-faint hover:text-saffron"
                        )}
                      >
                        <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
                      </button>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-haspopup="menu"
                        onClick={() => setOpenId(isOpen ? null : t.id)}
                        className="rounded-lg p-1.5 text-faint transition-colors hover:text-ink"
                      >
                        <ChevronDown
                          className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-faint">
                    <span>{t.patternCount} sections</span>
                  </div>
                </div>

                {/* Card dropdown — Lectures / Documents */}
                {isOpen && (
                  <div
                    ref={menuRef}
                    role="menu"
                    aria-label={`${t.short} options`}
                    className="animate-rise absolute left-0 right-0 top-full z-20 mt-1.5 overflow-hidden rounded-xl border border-line bg-surface shadow-xl"
                  >
                    <Link
                      href={`/study/test-prep/${t.id}/lectures`}
                      onClick={() => setOpenId(null)}
                      className="block px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
                    >
                      Lectures
                    </Link>
                    <Link
                      href={`/study/test-prep/${t.id}/documents`}
                      onClick={() => setOpenId(null)}
                      className="block border-t border-line/60 px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
                    >
                      Documents
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-8 font-mono text-[11px] text-faint">
        All tests across Pakistan and abroad in one place. Fees and formats change per cycle — confirm
        on the official test site before booking.
      </p>
    </div>
  );
}