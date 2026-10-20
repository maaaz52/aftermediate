import type { WatchlistEntry } from "./watchlist";

type ParseResult =
  | { ok: true; value: WatchlistEntry[] }
  | { ok: false; error: string };

function nullableMerit(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100);
}

function nullableText(value: unknown, max: number): value is string | null {
  return value === null || (typeof value === "string" && value.length <= max);
}

function nullableTimestamp(value: unknown): value is string | null {
  return value === null || (
    typeof value === "string" &&
    value.length <= 64 &&
    Number.isFinite(Date.parse(value))
  );
}

/** Validate and copy untrusted watchlist JSON before it reaches profile storage. */
export function parseWatchlist(value: unknown, maxEntries = 50): ParseResult {
  if (!Array.isArray(value)) return { ok: false, error: "watchlist must be an array" };
  if (value.length > maxEntries) {
    return { ok: false, error: `watchlist cannot exceed ${maxEntries} entries` };
  }

  const ids = new Set<string>();
  const entries: WatchlistEntry[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return { ok: false, error: "Invalid watchlist entry" };
    }
    const row = item as Record<string, unknown>;
    if (
      typeof row.id !== "string" || !row.id || row.id.length > 100 || ids.has(row.id) ||
      row.type !== "university" ||
      typeof row.universityId !== "string" || !row.universityId || row.universityId.length > 100 ||
      typeof row.programName !== "string" || !row.programName || row.programName.length > 200 ||
      !nullableMerit(row.capturedMerit) ||
      !nullableText(row.capturedYear, 20) ||
      typeof row.capturedAt !== "string" || !nullableTimestamp(row.capturedAt) ||
      !nullableMerit(row.lastKnownMerit) ||
      !nullableTimestamp(row.lastCheckedAt) ||
      !nullableMerit(row.myMerit) ||
      !nullableText(row.myStream, 50) ||
      typeof row.notifyEmail !== "boolean" ||
      !nullableTimestamp(row.lastNotifiedAt)
    ) {
      return { ok: false, error: "Invalid watchlist entry" };
    }
    ids.add(row.id);
    entries.push({
      id: row.id,
      type: "university",
      universityId: row.universityId,
      programName: row.programName,
      capturedMerit: row.capturedMerit,
      capturedYear: row.capturedYear,
      capturedAt: row.capturedAt,
      lastKnownMerit: row.lastKnownMerit,
      lastCheckedAt: row.lastCheckedAt,
      myMerit: row.myMerit,
      myStream: row.myStream,
      notifyEmail: row.notifyEmail,
      lastNotifiedAt: row.lastNotifiedAt,
    });
  }
  return { ok: true, value: entries };
}
