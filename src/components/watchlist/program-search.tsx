"use client";

import * as React from "react";
import universities from "@/data/universities.json";
import { useStudent } from "@/lib/store";
import { addEntry } from "@/lib/watchlist";
import type { WatchlistEntry } from "@/lib/watchlist";
import type { University, Stream } from "@/lib/types";

const UNIS = universities as unknown as University[];

interface ProgramSearchProps {
  watchlist: WatchlistEntry[];
  onAdd: (entry: WatchlistEntry) => void;
  onClose: () => void;
}

export function ProgramSearch({ watchlist, onAdd, onClose }: ProgramSearchProps) {
  const { profile } = useStudent();
  const stream = (profile.stream ?? "pre-engineering") as Stream;
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const streamUnis = UNIS.filter((u) => u.streams.includes(stream));
    const rows: { uni: University; program: University["programs"][number] }[] = [];
    for (const uni of streamUnis) {
      for (const prog of uni.programs) {
        if (
          !query ||
          uni.short.toLowerCase().includes(query.toLowerCase()) ||
          uni.name.toLowerCase().includes(query.toLowerCase()) ||
          prog.name.toLowerCase().includes(query.toLowerCase())
        ) {
          rows.push({ uni, program: prog });
        }
      }
    }
    return rows.slice(0, 50);
  }, [stream, query]);

  const tracked = React.useMemo(
    () => new Set(watchlist.map((e) => `${e.universityId}:${e.programName}`)),
    [watchlist]
  );

  const handleTrack = (uniId: string, progName: string) => {
    const result = addEntry(watchlist, {
      universityId: uniId,
      programName: progName,
      myMerit: profile.marks.fscObtained > 0 ? (profile.marks.fscObtained / profile.marks.fscTotal) * 100 : null,
      myStream: stream,
    }, UNIS);
    const added = result.find((e) => e.universityId === uniId && e.programName === progName);
    if (added) onAdd(added);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/60 pt-20 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border-2 border-ink bg-surface p-5 pixel-shadow">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-ink">Track a program</p>
          <button onClick={onClose} className="text-faint hover:text-ink transition-colors" aria-label="Close search">
            {'\u2715'}
          </button>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search universities or programs..."
          className="mt-3 w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-violet/50"
          autoFocus
        />

        <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-faint">No programs found.</p>
          ) : (
            filtered.map(({ uni, program }) => {
              const key = `${uni.id}:${program.name}`;
              const isTracked = tracked.has(key);
              return (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-surface-2 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{uni.short}</p>
                    <p className="text-xs text-muted">{program.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {program.closingMerit !== undefined && (
                      <span className="font-mono text-xs text-faint">{program.closingMerit}%</span>
                    )}
                    {isTracked ? (
                      <span className="rounded-lg border border-emerald/30 px-2.5 py-1 text-[11px] font-medium text-emerald">
                        Tracking {'\u2713'}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleTrack(uni.id, program.name)}
                        className="rounded-lg border border-violet/30 px-2.5 py-1 text-[11px] font-medium text-violet hover:bg-violet/10 transition-colors"
                      >
                        Track
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
