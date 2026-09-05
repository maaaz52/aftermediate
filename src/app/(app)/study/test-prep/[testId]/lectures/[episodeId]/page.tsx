"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CoursePlayer } from "@/components/skills/course-player";
import { useLocalStorage } from "@/lib/skills";
import { cn } from "@/lib/utils";
import { episodesFor, findTest, REGION_LABEL } from "@/lib/test-prep";

export default function TestPrepLectureEpisodePage({
  params,
}: {
  params: Promise<{ testId: string; episodeId: string }>;
}) {
  const { testId, episodeId } = React.use(params);
  const test = findTest(testId);
  const episodes = test ? episodesFor(testId) : [];
  const idx = episodes.findIndex((e) => e.episodeId === episodeId);
  const episode = episodes[idx];

  const [watched, setWatched] = useLocalStorage<string[]>(
    `aftermediate:test-prep:watched:${testId}`,
    []
  );

  if (!test || !episode) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Lecture not found.</h1>
        <Link href="/study/test-prep" className="mt-4 inline-block text-saffron">
          ← Back to all tests
        </Link>
      </div>
    );
  }

  const watchedEp = watched.includes(episodeId);
  const prev = idx > 0 ? episodes[idx - 1] : null;
  const next = idx < episodes.length - 1 ? episodes[idx + 1] : null;

  function toggleWatched() {
    setWatched((prevArr) =>
      prevArr.includes(episodeId) ? prevArr.filter((x) => x !== episodeId) : [...prevArr, episodeId]
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <Link href="/study/test-prep" className="hover:text-ink">
          All tests
        </Link>
        <span>/</span>
        <Link href={`/study/test-prep/${testId}`} className="hover:text-ink">
          {test.short}
        </Link>
        <span>/</span>
        <Link href={`/study/test-prep/${testId}/lectures`} className="hover:text-ink">
          Lectures
        </Link>
        <span>/</span>
        <span className="truncate text-ink">{episode.title}</span>
      </nav>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Badge variant={test.region === "pakistan" ? "saffron" : "violet"}>
          {REGION_LABEL[test.region]}
        </Badge>
        <span className="rounded-md bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-bold text-muted">
          {episode.playlistTitle} · Video {idx + 1} of {episodes.length}
        </span>
      </div>

      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-4xl">
        {episode.title}
      </h1>
      <p className="mt-1 text-sm text-muted">{test.name}</p>

      <div className="mt-6">
        <CoursePlayer videoId={episode.videoId} title={episode.title} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={toggleWatched}
          aria-pressed={watchedEp}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors",
            watchedEp
              ? "bg-emerald text-background"
              : "border-2 border-ink bg-surface text-ink hover:bg-surface-2"
          )}
        >
          <Check className="h-3.5 w-3.5" />
          {watchedEp ? "Watched ✓" : "Mark watched"}
        </button>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        {prev ? (
          <Link
            href={`/study/test-prep/${testId}/lectures/${prev.episodeId}`}
            className="group flex min-w-0 items-center gap-2 rounded-lg border-2 border-surface-2 bg-surface px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-saffron/40"
          >
            <ArrowLeft className="h-4 w-4 shrink-0 text-saffron" />
            <span className="truncate">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/study/test-prep/${testId}/lectures/${next.episodeId}`}
            className="group ml-auto flex min-w-0 items-center gap-2 rounded-lg border-2 border-surface-2 bg-surface px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-saffron/40"
          >
            <span className="truncate">{next.title}</span>
            <ArrowRight className="h-4 w-4 shrink-0 text-saffron" />
          </Link>
        )}
      </div>
    </div>
  );
}