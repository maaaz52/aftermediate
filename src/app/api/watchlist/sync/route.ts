import { jsonError, jsonOk } from "@/lib/api-response";
import { parseJsonBody, requireAuth } from "@/lib/http";

export const runtime = "nodejs";

/** Keep the stored jsonb bounded so one user cannot bloat their own row. */
const MAX_ENTRIES = 50;
const MAX_PAYLOAD_CHARS = 200_000;

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.error;
    const { supabase, user } = auth;

    const bodyResult = await parseJsonBody(req, MAX_PAYLOAD_CHARS);
    if (!bodyResult.ok) return bodyResult.error;

    const watchlist = (bodyResult.value as { watchlist?: unknown })?.watchlist;
    if (!Array.isArray(watchlist)) {
      return jsonError("watchlist must be an array", 400);
    }
    if (watchlist.length > MAX_ENTRIES) {
      return jsonError(`watchlist cannot exceed ${MAX_ENTRIES} entries`, 400);
    }

    const { error } = await supabase
      .from("profiles")
      .update({ watchlist })
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
