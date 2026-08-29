"use client";

import * as React from "react";
import { useStudent } from "@/lib/store";
import { removeEntry, updateEntry } from "@/lib/watchlist";
import type { WatchlistEntry } from "@/lib/watchlist";
import { WatchlistCard } from "./watchlist-card";
import { ProgramSearch } from "./program-search";
import universities from "@/data/universities.json";
import type { University } from "@/lib/types";

const UNIS = universities as unknown as University[];

interface CheckResult {
  id: string;
  currentMerit: number | null;
  currentYear: string | null;
  yearChanged: boolean;
  meritChanged: boolean;
}

function uniNameFor(id: string): string {
  return UNIS.find((u) => u.id === id)?.short ?? id;
}

export function WatchlistSection() {
  const { profile, update: storeUpdate } = useStudent();
  const watchlist = React.useMemo(() => profile.watchlist ?? [], [profile.watchlist]);

  // Keep a ref so doCheck and handlers always read the latest watchlist
  // without needing it in their dependency arrays (avoiding infinite cycles)
  const watchlistRef = React.useRef(watchlist);
  React.useEffect(() => {
    watchlistRef.current = watchlist;
  });

  const [checkResults, setCheckResults] = React.useState<Map<string, CheckResult>>(new Map());
  const [syncing, setSyncing] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);

  const doCheck = React.useCallback(async () => {
    const current = watchlistRef.current;
    if (current.length === 0) return;
    try {
      const res = await fetch(`/api/watchlist/check?watchlist=${encodeURIComponent(JSON.stringify(current))}`);
      if (!res.ok) return;
      const data = await res.json() as { entries: CheckResult[] };
      const map = new Map<string, CheckResult>();
      for (const e of data.entries) map.set(e.id, e);
      setCheckResults(map);

      // Only update lastCheckedAt — stable identity, entries unchanged
      const now = new Date().toISOString();
      const updated = current.map((entry) => {
        const result = map.get(entry.id);
        return result
          ? { ...entry, lastKnownMerit: result.currentMerit ?? entry.lastKnownMerit, lastCheckedAt: now }
          : entry;
      });
      storeUpdate({ watchlist: updated });

      for (const entry of current) {
        const result = map.get(entry.id);
        if (result?.meritChanged && entry.notifyEmail) {
          fetch("/api/watchlist/notify", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              entryId: entry.id,
              currentMerit: result.currentMerit,
              previousMerit: entry.lastKnownMerit,
              programName: entry.programName,
              universityName: uniNameFor(entry.universityId),
              lastNotifiedAt: entry.lastNotifiedAt,
            }),
          }).then((r) => {
            if (r.ok) r.json().then((d) => {
              if (d.sent) {
                const current2 = watchlistRef.current;
                const patched = current2.map((e) =>
                  e.id === entry.id ? { ...e, lastNotifiedAt: new Date().toISOString() } : e
                );
                storeUpdate({ watchlist: patched });
              }
            });
          }).catch(() => {});
        }
      }
    } catch {
      // check failure is non-blocking
    }
  }, [storeUpdate]);

  React.useEffect(() => {
    const timer = setTimeout(() => doCheck(), 1000);
    const id = setInterval(doCheck, 5 * 60 * 1000);
    return () => {
      clearTimeout(timer);
      clearInterval(id);
    };
  }, [doCheck]);

  const syncToServer = React.useCallback(async (updated: WatchlistEntry[]) => {
    setSyncing(true);
    try {
      await fetch("/api/watchlist/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ watchlist: updated }),
      });
    } catch {
      // sync failure is non-blocking
    } finally {
      setSyncing(false);
    }
  }, []);

  const handleAdd = React.useCallback((added: WatchlistEntry) => {
    const current = watchlistRef.current;
    const updated = [...current, added];
    storeUpdate({ watchlist: updated });
    syncToServer(updated);
  }, [storeUpdate, syncToServer]);

  const handleRemove = React.useCallback((id: string) => {
    const current = watchlistRef.current;
    const updated = removeEntry(current, id);
    storeUpdate({ watchlist: updated });
    syncToServer(updated);
  }, [storeUpdate, syncToServer]);

  const handleToggleEmail = React.useCallback((id: string, enabled: boolean) => {
    const current = watchlistRef.current;
    const updated = updateEntry(current, id, { notifyEmail: enabled });
    storeUpdate({ watchlist: updated });
    syncToServer(updated);
  }, [storeUpdate, syncToServer]);

  const handleRefresh = React.useCallback(() => {
    doCheck();
  }, [doCheck]);

  const sorted = React.useMemo(() => {
    const withGap = watchlist.map((e) => {
      const result = checkResults.get(e.id);
      const currentMerit = result?.currentMerit ?? e.lastKnownMerit;
      const gap = e.myMerit !== null && currentMerit !== null ? e.myMerit - currentMerit : null;
      return { entry: e, gap, changed: result?.meritChanged ?? false, currentMerit, currentYear: result?.currentYear ?? null };
    });

    const order = (g: number | null): number => {
      if (g === null || g === undefined) return 3;
      if (g < -5) return 0;
      if (g < 0) return 1;
      return 2;
    };

    withGap.sort((a, b) => order(a.gap) - order(b.gap));
    return withGap;
  }, [watchlist, checkResults]);

  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-base font-bold text-ink">Merit Watchlist</p>
          {watchlist.length > 0 && (
            <span className="rounded-full bg-emerald/15 px-2 py-0.5 text-[10px] font-semibold text-emerald">
              {watchlist.length} tracked
            </span>
          )}
          {syncing && (
            <span className="text-[10px] text-faint">syncing...</span>
          )}
        </div>
        <button
          onClick={() => setShowSearch(true)}
          className="rounded-lg border border-saffron/30 px-3 py-1.5 text-[11px] font-semibold text-saffron hover:bg-saffron/10 transition-colors"
        >
          + Track new program
        </button>
      </div>

      {watchlist.length === 0 ? (
        <div className="mt-6 text-center">
          <p className="text-3xl">{'\uD83C\uDFAF'}</p>
          <p className="mt-2 text-sm text-muted">
            Start by tracking your target programs from the Merit page or the search above.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {sorted.map(({ entry, changed, currentMerit, currentYear }) => (
            <WatchlistCard
              key={entry.id}
              entry={entry}
              currentMerit={currentMerit}
              currentYear={currentYear}
              changed={changed}
              onRefresh={handleRefresh}
              onRemove={handleRemove}
              onToggleEmail={handleToggleEmail}
              universityName={uniNameFor(entry.universityId)}
            />
          ))}
        </div>
      )}

      {showSearch && (
        <ProgramSearch
          watchlist={watchlist}
          onAdd={handleAdd}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}