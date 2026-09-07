"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { NotificationBadge } from "./notification-badge";
import { computeGap } from "@/lib/watchlist";
import type { WatchlistEntry } from "@/lib/watchlist";

interface WatchlistCardProps {
  entry: WatchlistEntry;
  currentMerit: number | null;
  currentYear: string | null;
  changed: boolean;
  onRefresh: () => void;
  onRemove: (id: string) => void;
  onToggleEmail: (id: string, enabled: boolean) => void;
  universityName: string;
}

export function WatchlistCard({
  entry,
  currentMerit,
  changed,
  onRefresh,
  onRemove,
  onToggleEmail,
  universityName,
}: WatchlistCardProps) {
  const gap = computeGap(entry.myMerit, currentMerit ?? entry.lastKnownMerit);

  const gapColor =
    gap === "safe" ? "bg-emerald" : gap === "tight" ? "bg-saffron" : gap === "reach" ? "bg-danger" : "bg-line";

  const gapLabel =
    gap === "safe"
      ? `safe (+${(entry.myMerit! - (currentMerit ?? entry.lastKnownMerit!)).toFixed(1)})`
      : gap === "tight"
        ? `tight (${(entry.myMerit! - (currentMerit ?? entry.lastKnownMerit!)).toFixed(1)})`
        : gap === "reach"
          ? `reach (${(entry.myMerit! - (currentMerit ?? entry.lastKnownMerit!)).toFixed(1)})`
          : "—";

  const displayMerit = currentMerit ?? entry.lastKnownMerit;

  const [now, setNow] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      clearTimeout(timer);
      clearInterval(id);
    };
  }, []);

  const lastCheckedLabel = React.useMemo(() => {
    if (!entry.lastCheckedAt || now === 0) return "never";
    const diff = now - new Date(entry.lastCheckedAt).getTime();
    if (diff < 60_000) return "moments ago";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return `${Math.floor(diff / 86_400_000)}d ago`;
  }, [entry.lastCheckedAt, now]);

  return (
    <div className="relative flex rounded-2xl border-2 border-ink bg-surface pixel-shadow">
      <div className={`w-2 shrink-0 rounded-l-2xl ${gapColor}`} />

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-ink">{universityName}</p>
            <p className="text-xs text-muted">{entry.programName}</p>
          </div>
          <div className="flex items-center gap-2">
            {changed && <NotificationBadge />}
            <button
              onClick={() => onToggleEmail(entry.id, !entry.notifyEmail)}
              className="relative p-2 text-faint hover:text-ink transition-colors"
              aria-label={entry.notifyEmail ? "Disable email alerts" : "Enable email alerts"}
            >
              {entry.notifyEmail ? "\uD83D\uDD14" : "\uD83D\uDD15"}
            </button>
            <button
              onClick={() => onRemove(entry.id)}
              className="p-2 text-faint hover:text-danger transition-colors"
              aria-label={`Remove ${entry.programName} from watchlist`}
            >
              {'\u2715'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-baseline gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-faint">Closing</span>
            <span className="font-mono text-lg font-bold text-ink">
              {displayMerit !== null ? `${displayMerit}%` : "\u2014"}
            </span>
            {entry.capturedYear && (
              <span className="text-[10px] text-faint">{entry.capturedYear}</span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-faint">My merit</span>
            <span className="font-mono text-base text-ink">
              {entry.myMerit !== null ? `${entry.myMerit}%` : "\u2014"}
            </span>
          </div>
          {gap !== null && (
            <Badge
              variant={
                gap === "safe" ? "emerald" : gap === "tight" ? "saffron" : "danger"
              }
              className="font-mono"
            >
              {gapLabel}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-faint">
          <span>Updated {lastCheckedLabel}</span>
          <button
            onClick={() => onRefresh()}
            className="rounded-lg border border-line px-2.5 py-1 text-[11px] font-medium text-ink hover:bg-surface-2 transition-colors"
          >
            Refresh now
          </button>
        </div>
      </div>
    </div>
  );
}
