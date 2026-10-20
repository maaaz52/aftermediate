import { jsonError, jsonOk } from "@/lib/api-response";
import { parseJsonBody, requireAuth } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseWatchlist } from "@/lib/watchlist-validation";

export const runtime = "nodejs";

/** Keep the stored jsonb bounded so one user cannot bloat their own row. */
const MAX_ENTRIES = 50;
const MAX_PAYLOAD_CHARS = 200_000;
/** Cap syncs so a scripted client cannot burn write quota. */
const RATE_MAX = 30;
const RATE_WINDOW_MS = 60 * 1000;

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.error;
    const { supabase, user } = auth;

    if (!(await checkRateLimit(`watchlist-sync:${user.id}`, RATE_MAX, RATE_WINDOW_MS))) {
      return jsonError("Too many requests. Try again in a moment.", 429);
    }

    const bodyResult = await parseJsonBody(req, MAX_PAYLOAD_CHARS);
    if (!bodyResult.ok) return bodyResult.error;

    const parsed = parseWatchlist(
      (bodyResult.value as { watchlist?: unknown } | null)?.watchlist,
      MAX_ENTRIES
    );
    if (!parsed.ok) return jsonError(parsed.error, 400);

    const { error } = await supabase
      .from("profiles")
      .update({ watchlist: parsed.value })
      .eq("id", user.id);

    if (error) {
      console.error("watchlist sync error", error);
      return jsonError("Sync failed", 500);
    }

    return jsonOk({ ok: true });
  } catch (err) {
    console.error("watchlist sync error", err);
    return jsonError("Internal server error", 500);
  }
}
