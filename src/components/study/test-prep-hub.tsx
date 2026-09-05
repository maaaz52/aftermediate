"use client";

import * as React from "react";
import { Bookmark, ChevronDown, ExternalLink, FileText, Link2, PlayCircle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CoursePlayer } from "@/components/skills/course-player";
import { R2VideoPlayer } from "@/components/study/r2-video-player";
import { useLocalStorage } from "@/lib/skills";
import { cn } from "@/lib/utils";
import { formatPkr } from "@/lib/abroad-planner";
import type { AbroadTest, EntryTest, Stream } from "@/lib/types";
import entryJson from "@/data/entry-tests.json";
import abroadJson from "@/data/abroad-tests.json";
import contentJson from "@/data/test-prep-content.json";

const entryData = entryJson as unknown as { tests: EntryTest[] };
const abroadData = abroadJson as unknown as { tests: AbroadTest[] };
const prepContent = contentJson as unknown as {
  content: { testId: string; playlists: TestPlaylist[]; resources: TestResource[]; videos: R2Video[] }[];
};

export interface TestPlaylist {
  id: string;
  title: string;
  provider: string;
  playlistId?: string;
  videoId?: string;
  note?: string;
}

export interface TestResource {
  id: string;
  title: string;
  type: "pdf" | "link";
  url: string;
  year?: number;
}

export interface R2Video {
  id: string;
  title: string;
  r2Key: string;
  note?: string;
}

type Region = "pakistan" | "abroad";

interface MergedTest {
  region: Region;
  id: string;
  short: string;
  name: string;
  body: string;
  fee: string;
  patternCount: number;
  streams: Stream[];
}

const REGION_LABEL: Record<Region, string> = {
  pakistan: "Pakistan",
  abroad: "Abroad",
};

const contentFor = (testId: string) =>
  prepContent.content.find((c) => c.testId === testId) ?? {
    testId,
    playlists: [],
    resources: [],
    videos: [],
  };

function normalizeTests(): MergedTest[] {
  const pakistan: MergedTest[] = entryData.tests.map((t) => ({
    region: "pakistan",
    id: t.id,
    short: t.short,
    name: t.name,
    body: t.conductingBody,
    fee: t.fee,
    patternCount: t.pattern.length,
    streams: t.streams,
  }));
  const abroad: MergedTest[] = abroadData.tests.map((t) => ({
    region: "abroad",
    id: t.id,
    short: t.short,
    name: t.name,
    body: "",
    fee: formatPkr(t.feePkr),
    patternCount: t.pattern.length,
    streams: [],
  }));
  return [...pakistan, ...abroad];
}

const ALL_TESTS = normalizeTests();

const STREAM_FILTERS: { value: Stream | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pre-medical", label: "Pre-Medical" },
  { value: "pre-engineering", label: "Pre-Engineering" },
  { value: "ics", label: "ICS" },
  { value: "icom", label: "I.Com" },
  { value: "alevel", label: "A-Level" },
];

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/60 py-2 text-sm last:border-0">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}

export function TestPrepHub() {
  const [region, setRegion] = React.useState<Region | "all">("all");
  const [stream, setStream] = React.useState<Stream | "all">("all");
  const [query, setQuery] = React.useState("");
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [savedOnly, setSavedOnly] = React.useState(false);
  const [savedTests, setSavedTests] = useLocalStorage<string[]>(
    "aftermediate:test-prep:saved",
    []
  );

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

  const open = filtered.find((t) => t.id === openId) ?? null;
  const detail = open ? contentFor(open.id) : null;
  const entry = open?.region === "pakistan" ? entryData.tests.find((t) => t.id === open.id) : null;
  const abroad = open?.region === "abroad" ? abroadData.tests.find((t) => t.id === open.id) : null;

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
            const content = contentFor(t.id);
            const hasContent =
              content.playlists.length > 0 ||
              content.resources.length > 0 ||
              content.videos.length > 0;
            const isSaved = savedTests.includes(t.id);
            return (
              <div
                key={t.id}
                className={cn(
                  "card-glass group flex flex-col rounded-2xl p-5 text-left transition-all",
                  isOpen ? "border-saffron/50 ring-1 ring-saffron/30" : "hover:-translate-y-0.5 hover:shadow-md"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls="test-prep-detail"
                    onClick={() => setOpenId(isOpen ? null : t.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-ink">{t.short}</span>
                      <Badge variant={t.region === "pakistan" ? "saffron" : "violet"}>
                        {REGION_LABEL[t.region]}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted">{t.name}</p>
                  </button>
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
                      aria-controls="test-prep-detail"
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
                  <span className="font-mono text-muted">{t.fee}</span>
                  {hasContent && (
                    <span className="text-saffron">● has prep content</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Detail panel ── */}
      {open && (
        <div id="test-prep-detail" className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* Left: test facts */}
          <div className="card-glass rounded-2xl p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-extrabold tracking-tight text-ink">{open.short}</h3>
              <Badge variant={open.region === "pakistan" ? "saffron" : "violet"}>
                {REGION_LABEL[open.region]}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted">{open.name}</p>

            <div className="mt-5">
              <DetailRow label="Conducting body" value={open.body || (abroad?.name ?? "")} />
              <DetailRow
                label="Fee"
                value={entry?.fee ?? formatPkr(abroad?.feePkr ?? 0)}
              />
              <DetailRow label="Frequency" value={entry?.frequency ?? abroad?.frequency ?? ""} />
              <DetailRow label="Validity" value={entry?.validity ?? abroad?.validity ?? ""} />
            </div>

            {/* Pattern */}
            {entry?.pattern.length ? (
              <div className="mt-5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
                  Test pattern
                </p>
                <div className="mt-2 overflow-hidden rounded-lg border border-line">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-line bg-surface-2/60">
                        <th className="px-3 py-2 font-semibold text-faint">Section</th>
                        <th className="px-3 py-2 font-semibold text-faint">Questions</th>
                        <th className="px-3 py-2 font-semibold text-faint">Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entry.pattern.map((p) => (
                        <tr key={p.section} className="border-b border-line/60 last:border-0">
                          <td className="px-3 py-2 font-medium text-ink">{p.section}</td>
                          <td className="px-3 py-2 text-muted">{p.questions ?? "—"}</td>
                          <td className="px-3 py-2 font-mono text-muted">{p.marks ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              abroad && (
                <div className="mt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
                    Test pattern
                  </p>
                  <div className="mt-2 overflow-hidden rounded-lg border border-line">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-line bg-surface-2/60">
                          <th className="px-3 py-2 font-semibold text-faint">Section</th>
                          <th className="px-3 py-2 font-semibold text-faint">Content</th>
                          <th className="px-3 py-2 font-semibold text-faint">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {abroad.pattern.map((p) => (
                          <tr key={p.section} className="border-b border-line/60 last:border-0">
                            <td className="px-3 py-2 font-medium text-ink">{p.section}</td>
                            <td className="px-3 py-2 text-muted">{p.content}</td>
                            <td className="px-3 py-2 font-mono text-muted">{p.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}

            {entry?.note && (
              <p className="mt-4 rounded-lg bg-surface-2/60 px-3 py-2 text-xs text-muted">
                {entry.note}
              </p>
            )}
          </div>

          {/* Right: prep content */}
          <div className="space-y-4">
            {detail && (
              <>
                <PrepSection
                  title="Lecture playlists"
                  icon={<PlayCircle className="h-4 w-4" />}
                  empty="No lecture playlists added yet."
                >
                  {detail.playlists.map((p) =>
                    p.playlistId || p.videoId ? (
                      <CoursePlayer
                        key={p.id}
                        title={p.title}
                        playlistId={p.playlistId}
                        videoId={p.videoId}
                      />
                    ) : (
                      <a
                        key={p.id}
                        href="#"
                        className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/40 p-3 transition-colors hover:border-saffron/40"
                      >
                        <PlayCircle className="h-5 w-5 shrink-0 text-saffron" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">{p.title}</p>
                          {p.note && <p className="truncate text-xs text-muted">{p.note}</p>}
                        </div>
                      </a>
                    )
                  )}
                </PrepSection>

                <PrepSection
                  title="Resources & PDFs"
                  icon={<FileText className="h-4 w-4" />}
                  empty="No resources added yet."
                >
                  {detail.resources.map((r) => (
                    <a
                      key={r.id}
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/40 p-3 transition-colors hover:border-saffron/40"
                    >
                      {r.type === "pdf" ? (
                        <FileText className="h-5 w-5 shrink-0 text-danger" />
                      ) : (
                        <Link2 className="h-5 w-5 shrink-0 text-info" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{r.title}</p>
                        <p className="text-[11px] text-faint">
                          {r.type === "pdf" ? "PDF" : "Link"}
                          {r.year ? ` · ${r.year}` : ""}
                        </p>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-faint" />
                    </a>
                  ))}
                </PrepSection>

                {detail.videos.length > 0 && (
                  <PrepSection
                    title="Videos"
                    icon={<PlayCircle className="h-4 w-4" />}
                    empty="No videos added yet."
                  >
                    {detail.videos.map((v) => (
                      <R2VideoPlayer key={v.id} title={v.title} r2Key={v.r2Key} />
                    ))}
                  </PrepSection>
                )}
              </>
            )}

            <div className="rounded-2xl border border-dashed border-line bg-surface/60 p-4">
              <p className="text-xs text-muted">
                Practice paper available{" "}
                <a
                  href={
                    open.region === "pakistan"
                      ? `/pakistan/self-assessment/${open.id}`
                      : `/abroad/self-assessment/${open.id}`
                  }
                  className="font-semibold text-saffron hover:underline"
                >
                  here →
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      <p className="mt-8 font-mono text-[11px] text-faint">
        All tests across Pakistan and abroad in one place. Fees and formats change per cycle — confirm
        on the official test site before booking.
      </p>
    </div>
  );
}

function PrepSection({
  title,
  icon,
  empty,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  empty: string;
  children: React.ReactNode;
}) {
  const hasItems = React.Children.count(children) > 0;
  return (
    <div className="card-glass rounded-2xl p-5">
      <p className="flex items-center gap-2 text-sm font-bold text-ink">
        <span className="text-saffron">{icon}</span>
        {title}
      </p>
      <div className="mt-3 space-y-2">
        {hasItems ? children : <p className="text-xs text-faint">{empty}</p>}
      </div>
    </div>
  );
}