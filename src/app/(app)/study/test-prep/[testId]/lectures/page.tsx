"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronDown, Play, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/lib/skills";
import { cn } from "@/lib/utils";
import { contentFor, findTest, REGION_LABEL } from "@/lib/test-prep";

export default function TestPrepLecturesPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = React.use(params);
  const test = findTest(testId);
  const playlists = test ? contentFor(testId).playlists : [];
  const [openPlaylist, setOpenPlaylist] = React.useState<string | null>(
    () => playlists[0]?.id ?? null
  );
  const [watched] = useLocalStorage<string[]>(
    `aftermediate:test-prep:watched:${testId}`,
    []
  );

  if (!test) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Test not found.</h1>
        <Link href="/study/test-prep" className="mt-4 inline-block text-saffron">
          ← Back to all tests
        </Link>
      </div>
    );
  }

  const totalEpisodes = playlists.reduce((n, p) => n + p.episodes.length, 0);
  const watchedCount = playlists.flatMap((p) => p.episodes).filter((e) => watched.includes(e.id)).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/study/test-prep"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> All tests
      </Link>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          {test.short} Lectures
        </h1>
        <Badge variant={test.region === "pakistan" ? "saffron" : "violet"}>
          {REGION_LABEL[test.region]}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted">{test.name}</p>

      {totalEpisodes > 0 && (
        <p className="mt-3 text-xs text-muted">
          {watchedCount} of {totalEpisodes} lectures watched
        </p>
      )}

      {playlists.length === 0 ? (
        <div className="card-glass mt-6 rounded-2xl p-10 text-center">
          <p className="text-sm text-muted">No lectures added yet.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {playlists.map((p, pi) => {
            const isOpen = openPlaylist === p.id;
            const played = p.episodes.filter((e) => watched.includes(e.id)).length;
            return (
              <div
                key={p.id}
                className="card-glass overflow-hidden rounded-2xl"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenPlaylist(isOpen ? null : p.id)}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <PlayCircle className="h-5 w-5 shrink-0 text-saffron" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold text-ink">{p.title}</p>
                    <p className="text-xs text-faint">
                      {p.episodes.length} lectures{p.note ? ` · ${p.note}` : ""}
                      {played > 0 ? ` · ${played} watched` : ""}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn("h-4 w-4 shrink-0 text-faint transition-transform", isOpen && "rotate-180")}
                  />
                </button>

                {isOpen && (
                  <ol className="border-t border-line">
                    {p.episodes.map((e, ei) => {
                      const isOn = watched.includes(e.id);
                      return (
                        <li key={e.id}>
                          <Link
                            href={`/study/test-prep/${testId}/lectures/${e.id}`}
                            className="flex items-center gap-3 border-b border-line/60 px-4 py-3 transition-colors last:border-0 hover:bg-surface-2/60"
                          >
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-2 font-mono text-[11px] font-bold text-muted">
                              {isOn ? (
                                <Check className="h-3.5 w-3.5 text-emerald" strokeWidth={3} />
                              ) : (
                                ei + 1
                              )}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                              {e.title}
                            </span>
                            <span className="text-[11px] text-faint">
                              Playlist {pi + 1} · Video {ei + 1}
                            </span>
                            <Play className="h-3.5 w-3.5 shrink-0 text-saffron" />
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Link
        href={`/study/test-prep/${testId}/documents`}
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-saffron px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-soft"
      >
        View documents →
      </Link>
    </div>
  );
}