"use client";

import * as React from "react";
import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Award, Check, Clock, ExternalLink } from "lucide-react";
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

const TRACK_LABELS: Record<string, string> = {
  "web-dev": "Web Dev",
  design: "Design",
  data: "Data",
  ai: "AI",
  writing: "Writing",
  marketing: "Marketing",
  video: "Video",
  business: "Business",
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const course = (coursesJson as Course[]).find((c) => c.id === id);

  const [watchedArr, setWatchedArr] = useLocalStorage<string[]>("aftermediate:skills:watched", []);
  const watched = watchedArr.includes(id);
  const [watchedEps, setWatchedEps] = useLocalStorage<string[]>(
    `aftermediate:skills:watched-episodes:${id}`,
    []
  );

  if (!course) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Course not found.</h1>
        <Link href="/skills/courses" className="mt-4 inline-block text-accent">
          ← Back to courses
        </Link>
      </div>
    );
  }

  const hasVideo = Boolean(course.videoId || course.playlistId || course.episodes?.length);

  function toggleWatched() {
    setWatchedArr((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleEpisodeWatched(epId: string) {
    setWatchedEps((prev) =>
      prev.includes(epId) ? prev.filter((x) => x !== epId) : [...prev, epId]
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link
        href="/skills/courses"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> All courses
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-accent/10 px-2 py-0.5 text-[11px] font-bold text-accent">
              {TRACK_LABELS[course.track] ?? course.track}
            </span>
            <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-bold text-muted">
              {LEVEL_LABELS[course.level] ?? course.level}
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted">
              <Clock className="h-3 w-3" /> {course.hours}h
            </span>
            {course.certificate && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald/10 px-2 py-0.5 text-[11px] font-bold text-emerald">
                <Award className="h-3 w-3" /> Certificate
              </span>
            )}
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
            {course.title}
          </h1>
          <p className="mt-1 text-sm text-muted">{course.provider}</p>
        </div>

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
      </div>

      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">{course.description}</p>
      <p className="mt-3 max-w-3xl rounded-lg bg-surface-2 px-3 py-2 text-xs leading-snug text-ink">
        <span className="font-semibold">Why:</span> {course.why}
      </p>

      {hasVideo && (
        <div className="mt-8">
          <CoursePlayer
            episodes={course.episodes}
            videoId={course.videoId}
            playlistId={course.playlistId}
            title={course.title}
            watched={course.episodes ? watchedEps : undefined}
            onToggleWatched={course.episodes ? toggleEpisodeWatched : undefined}
          />
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <a
          href={course.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-background transition-colors hover:brightness-110"
        >
          <ExternalLink className="h-4 w-4" /> Open course site
        </a>
        <Link href="/skills/courses" className="text-sm font-medium text-muted hover:text-ink">
          Browse more courses →
        </Link>
      </div>
    </div>
  );
}