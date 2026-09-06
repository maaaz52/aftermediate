import { findProgram } from "@/lib/watchlist";
import universities from "@/data/universities.json";
import type { University } from "@/lib/types";
import { jsonError, jsonOk } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireAuth } from "@/lib/http";

export const runtime = "nodejs";

/** Keep the parsed watchlist param bounded — it arrives in the URL, not a body. */
const MAX_PARAM_CHARS = 200_000;
const MAX_ENTRIES = 50;
/** Allow 30 checks per user per minute — the dashboard polls every few seconds. */
const RATE_MAX = 30;
const RATE_WINDOW_MS = 60 * 1000;

export async function GET(req: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.error;
    const { user } = auth;

    if (!checkRateLimit(`watchlist-check:${user.id}`, RATE_MAX, RATE_WINDOW_MS)) {
      return jsonError("Too many requests. Try again in a moment.", 429);
    }

    const url = new URL(req.url);
    const watchlistParam = url.searchParams.get("watchlist");
    if (!watchlistParam) {
      return jsonError("watchlist query param required", 400);
    }
    if (watchlistParam.length > MAX_PARAM_CHARS) {
      return jsonError("watchlist query param is too large", 413);
    }

    let watchlist: unknown[];
    try {
      watchlist = JSON.parse(watchlistParam);
    } catch {
      return jsonError("watchlist must be valid JSON array", 400);
    }

    if (!Array.isArray(watchlist)) {
      return jsonError("watchlist must be an array", 400);
    }
    if (watchlist.length > MAX_ENTRIES) {
      return jsonError(`watchlist cannot exceed ${MAX_ENTRIES} entries`, 400);
    }

    const unis = universities as unknown as University[];
    const entries = watchlist.map((entry: unknown) => {
      const e = entry as { id: string; universityId: string; programName: string; lastKnownMerit: number | null };
      const current = findProgram(unis, e.universityId, e.programName);
      return {
        id: e.id,
        currentMerit: current?.closingMerit ?? null,
        currentYear: current?.year ?? null,
        yearChanged: current?.year ? e.lastKnownMerit !== null && current.closingMerit !== e.lastKnownMerit : false,
        meritChanged: current?.closingMerit !== undefined && current.closingMerit !== null && e.lastKnownMerit !== null && current.closingMerit !== e.lastKnownMerit,
      };
    });

    return jsonOk({ entries });
  } catch (err) {
    console.error("watchlist check error", err);
    return jsonError("Internal server error", 500);
  }
}
