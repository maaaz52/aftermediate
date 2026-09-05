"use client";

import * as React from "react";
import { Loader2, Play } from "lucide-react";

/**
 * Lazy-mounted HTML5 video player for a Cloudflare R2-hosted lecture. The
 * signed URL is fetched on first play (never stored), and the <video> only
 * mounts after the user clicks — so the page stays light and nothing streams
 * until it's wanted.
 */
export function R2VideoPlayer({
  title,
  r2Key,
}: {
  title: string;
  r2Key: string;
}) {
  const [ready, setReady] = React.useState(false);
  const [src, setSrc] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function load() {
    setReady(true);
    try {
      const res = await fetch(`/api/test-prep/video?key=${encodeURIComponent(r2Key)}`);
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not load video.");
        return;
      }
      setSrc(data.url);
    } catch {
      setError("Could not load video.");
    }
  }

  if (error) {
    return (
      <div className="rounded-xl border border-line bg-surface-2/60 p-4 text-sm text-muted">
        {error}
      </div>
    );
  }

  if (!ready) {
    return (
      <button
        type="button"
        onClick={load}
        className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-line bg-surface-2/50 transition-colors hover:bg-surface-2"
      >
        <span className="grid h-12 w-12 place-items-center rounded-full bg-violet text-background">
          <Play className="h-5 w-5 fill-current" />
        </span>
        <span className="max-w-[90%] truncate px-4 text-center text-xs font-semibold text-ink">
          {title}
        </span>
      </button>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-line bg-black">
      {src ? (
        <video
          src={src}
          controls
          playsInline
          preload="none"
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
          <p className="text-xs text-white/80">Loading…</p>
        </div>
      )}
    </div>
  );
}