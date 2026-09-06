"use client";

import * as React from "react";
import { use } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Clock, ListVideo } from "lucide-react";
import { cn } from "@/lib/utils";
import coursesJson from "@/data/skills-courses.json";
import { pkr, useLocalStorage } from "@/lib/skills";
import { CoursePlayer } from "@/components/skills/course-player";
import type { CourseEpisode } from "@/components/skills/course-player";

type Course = (typeof coursesJson)[number] & {
  videoId?: string;
  playlistId?: string;
  episodes?: CourseEpisode[];
};

export default function CourseEpisodePage({
  params,
}: {
  params: Promise<{ id: string; episodeId: string }>;
}) {
  const { id, episodeId } = use(params);
  const course = (coursesJson as Course[]).find((c) => c.id === id);
  const episodes = course?.episodes ?? [];
  const idx = episodes.findIndex((e) => e.id === episodeId);
  const episode = episodes[idx];

  const [watchedEps, setWatchedEps] = useLocalStorage<string[]>(
    `aftermediate:skills:watched-episodes:${id}`,
    []
  );

  if (!course || !episode) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Episode not found.</h1>
        <Link href="/skills/courses" className="mt-4 inline-block text-accent">
          ← Back to courses
        </Link>
      </div>
    );
  }

  const watched = watchedEps.includes(episodeId);
  const prev = idx > 0 ? episodes[idx - 1] : null;
  const next = idx < episodes.length - 1 ? episodes[idx + 1] : null;

  function toggleWatched() {
    setWatchedEps((prev) =>
      prev.includes(episodeId) ? prev.filter((x) => x !== episodeId) : [...prev, episodeId]
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <Link href="/skills/courses" className="hover:text-ink">
          All courses
        </Link>
        <span>/</span>
        <Link href={`/skills/courses/${course.id}`} className="hover:text-ink">
          {course.title}
        </Link>
        <span>/</span>
        <span className="truncate text-ink">{episode.title}</span>
      </nav>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-accent/10 px-2 py-0.5 text-[11px] font-bold text-accent">
          Episode {idx + 1} of {episodes.length}
        </span>
        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted">
          <Clock className="h-3 w-3" /> {course.hours}h
        </span>
        <span
          className={cn(
            "rounded-md px-2 py-0.5 font-mono text-[11px] font-bold",
            course.costUsd === 0 ? "bg-emerald text-background" : "bg-surface-2 text-ink"
          )}
        >
          {course.costUsd === 0 ? "Free" : `$${course.costUsd} ≈ ${pkr(course.costUsd)}`}
        </span>
      </div>

      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        {episode.title}
      </h1>
      <p className="mt-1 text-sm text-muted">{course.provider}</p>

      <div className="mt-6">
        <CoursePlayer videoId={episode.videoId} title={episode.title} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={toggleWatched}
          aria-pressed={watched}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors",
            watched
              ? "bg-emerald text-background"
              : "border-2 border-ink bg-surface text-ink hover:bg-surface-2"
          )}
        >
          <Check className="h-3.5 w-3.5" />
          {watched ? "Watched ✓" : "Mark watched"}
        </button>
        <Link
          href={`/skills/courses/${course.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
        >
          <ListVideo className="h-4 w-4" /> All episodes
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        {prev ? (
          <Link
            href={`/skills/courses/${course.id}/${prev.id}`}
            className="group flex min-w-0 items-center gap-2 rounded-lg border-2 border-surface-2 bg-surface px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-accent/40"
          >
            <ArrowLeft className="h-4 w-4 shrink-0 text-accent" />
            <span className="truncate">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/skills/courses/${course.id}/${next.id}`}
            className="group ml-auto flex min-w-0 items-center gap-2 rounded-lg border-2 border-surface-2 bg-surface px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-accent/40"
          >
            <span className="truncate">{next.title}</span>
            <ArrowRight className="h-4 w-4 shrink-0 text-accent" />
          </Link>
        )}
      </div>
    </div>
  );
}