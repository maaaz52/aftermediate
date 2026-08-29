import type { University } from "./types";

export interface WatchlistEntry {
  id: string;
  type: "university";
  universityId: string;
  programName: string;
  capturedMerit: number | null;
  capturedYear: string | null;
  capturedAt: string;
  lastKnownMerit: number | null;
  lastCheckedAt: string | null;
  myMerit: number | null;
  myStream: string | null;
  notifyEmail: boolean;
  lastNotifiedAt: string | null;
}

export interface AddEntryInput {
  universityId: string;
  programName: string;
  myMerit: number | null;
  myStream: string | null;
}

let _counter = 0;
function uid(): string {
  _counter++;
  return `wl_${Date.now()}_${_counter}`;
}

export function addEntry(
  watchlist: WatchlistEntry[],
  input: AddEntryInput,
  universities: University[]
): WatchlistEntry[] {
  const uni = universities.find((u) => u.id === input.universityId);
  if (!uni) return watchlist;
  const prog = uni.programs.find((p) => p.name === input.programName);
  if (!prog) return watchlist;

  const existing = watchlist.find(
    (e) => e.universityId === input.universityId && e.programName === input.programName
  );
  const now = new Date().toISOString();

  const entry: WatchlistEntry = {
    id: existing?.id ?? uid(),
    type: "university",
    universityId: input.universityId,
    programName: input.programName,
    capturedMerit: prog.closingMerit ?? null,
    capturedYear: prog.year ?? null,
    capturedAt: now,
    lastKnownMerit: existing?.lastKnownMerit ?? prog.closingMerit ?? null,
    lastCheckedAt: existing?.lastCheckedAt ?? now,
    myMerit: input.myMerit,
    myStream: input.myStream ?? null,
    notifyEmail: existing?.notifyEmail ?? true,
    lastNotifiedAt: existing?.lastNotifiedAt ?? null,
  };

  if (existing) {
    return watchlist.map((e) => (e.id === existing.id ? entry : e));
  }
  return [...watchlist, entry];
}

export function removeEntry(watchlist: WatchlistEntry[], id: string): WatchlistEntry[] {
  return watchlist.filter((e) => e.id !== id);
}

export function updateEntry(
  watchlist: WatchlistEntry[],
  id: string,
  patch: Partial<WatchlistEntry>
): WatchlistEntry[] {
  return watchlist.map((e) => (e.id === id ? { ...e, ...patch } : e));
}

export function computeGap(
  myMerit: number | null,
  closingMerit: number | null
): "safe" | "tight" | "reach" | null {
  if (myMerit === null || closingMerit === null) return null;
  const gap = myMerit - closingMerit;
  if (gap >= 0) return "safe";
  if (gap >= -5) return "tight";
  return "reach";
}

export function findProgram(
  universities: University[],
  universityId: string,
  programName: string
): { closingMerit: number; year: string } | null {
  const uni = universities.find((u) => u.id === universityId);
  if (!uni) return null;
  const prog = uni.programs.find((p) => p.name === programName);
  if (!prog || prog.closingMerit === undefined) return null;
  return { closingMerit: prog.closingMerit, year: prog.year ?? "" };
}
