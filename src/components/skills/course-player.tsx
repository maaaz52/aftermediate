"use client";

import * as React from "react";
import { Check, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CourseEpisode {
  id: string;
  title: string;
  videoId: string;
}

/**
 * YouTube player for a course page. The iframe only mounts after the user
 * clicks "Watch", so course pages stay light and nothing autoplays.
 *
 * Two shapes:
 * - `episodes` present → a picker lists each episode, plays the selected one,
 *   and reports watched episodes back up (per-episode progress).
 * - otherwise a single `videoId` (or a `playlistId` as a videoseries embed).
 */
export function CoursePlayer({
  episodes,
  videoId,
  playlistId,
  title,
  watched,
  onToggleWatched,
}: {
  episodes?: CourseEpisode[];
  videoId?: string;
  playlistId?: string;
  title: string;
  /** IDs of episodes marked watched (episodes mode only). */
  watched?: string[];
  onToggleWatched?: (id: string) => void;
}) {
  const [selected, setSelected] = React.useState<string | null>(null);
  const [playing, setPlaying] = React.useState(false);

  const ep = episodes?.find((e) => e.id === selected);
  const currentVideoId = ep?.videoId ?? videoId;
  const src = playlistId
    ? `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}&rel=0`
    : `https://www.youtube-nocookie.com/embed/${currentVideoId}?rel=0&modestbranding=1`;

  function select(id: string) {
    setSelected(id);
    setPlaying(true);
  }

  const showPlayer = playing;

  return (
    <div className="rounded-xl border-2 border-ink bg-ink/5 p-3">
      <p className="truncate px-1 font-mono text-[11px] font-bold uppercase tracking-widest text-muted">
        {episodes ? "Course lectures" : playlistId ? "Course playlist" : "Course video"} · {title}
      </p>

      {episodes ? (
        <ol className="mt-2 space-y-1.5">
          {episodes.map((e, i) => {
            const isOn = watched?.includes(e.id);
            const isActive = selected === e.id;
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => select(e.id)}
                  aria-current={isActive}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border-2 px-3 py-2 text-left transition-colors",
                    isActive
                      ? "border-accent bg-accent/5"
                      : "border-surface-2 bg-surface hover:border-accent/40"
                  )}
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-2 font-mono text-[11px] font-bold text-muted">
                    {isOn ? (
                      <Check className="h-3.5 w-3.5 text-emerald" strokeWidth={3} />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{e.title}</span>
                  <Play className="h-3.5 w-3.5 shrink-0 text-accent" />
                </button>
                {onToggleWatched && (
                  <button
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onToggleWatched(e.id);
                    }}
                    aria-pressed={!!isOn}
                    className="mt-1 inline-flex items-center gap-1 pl-10 text-[11px] font-bold text-muted hover:text-ink"
                  >
                    <Check className="h-3 w-3" />
                    {isOn ? "Watched" : "Mark watched"}
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      ) : null}

      {showPlayer ? (
        <div className="relative mt-2 aspect-video w-full overflow-hidden rounded-lg border-2 border-ink bg-black">
          <iframe
            src={src}
            title={ep?.title ?? title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      ) : episodes ? (
        <p className="mt-2 px-1 text-xs text-muted">Pick a lecture above to start watching.</p>
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="mt-2 flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-ink bg-surface transition-colors hover:bg-surface-2"
        >
          <span className={cn("grid h-12 w-12 place-items-center rounded-full bg-accent text-background")}>
            <Play className="h-5 w-5 fill-current" />
          </span>
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink">
            Watch here
          </span>
        </button>
      )}
    </div>
  );
}