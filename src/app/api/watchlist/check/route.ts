import { findProgram } from "@/lib/watchlist";
import universities from "@/data/universities.json";
import type { University } from "@/lib/types";
import { jsonError, jsonOk } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseJsonBody, requireAuth } from "@/lib/http";
import { parseWatchlist } from "@/lib/watchlist-validation";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 64 * 1024;
const MAX_ENTRIES = 50;
/** Allow 30 checks per user per minute; the dashboard normally polls every five minutes. */
const RATE_MAX = 30;
const RATE_WINDOW_MS = 60 * 1000;

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.error;
    const { user } = auth;

    if (!(await checkRateLimit(`watchlist-check:${user.id}`, RATE_MAX, RATE_WINDOW_MS))) {
      return jsonError("Too many requests. Try again in a moment.", 429);
    }

    const bodyResult = await parseJsonBody(req, MAX_BODY_BYTES);
    if (!bodyResult.ok) return bodyResult.error;
    const parsed = parseWatchlist(
      (bodyResult.value as { watchlist?: unknown } | null)?.watchlist,
      MAX_ENTRIES
    );
    if (!parsed.ok) return jsonError(parsed.error, 400);

    const unis = universities as unknown as University[];
    const entries = parsed.value.map((e) => {
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
