import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/require-user";
import { jsonError, jsonOk } from "@/lib/api-response";

export const runtime = "nodejs";

/** Keep the stored jsonb bounded so one user cannot bloat their own row. */
const MAX_ENTRIES = 50;
const MAX_PAYLOAD_CHARS = 200_000;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const user = await requireUser(supabase);
    if (!user) return jsonError("Unauthorized", 401);

    const declared = Number(req.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > MAX_PAYLOAD_CHARS) {
      return jsonError("watchlist is too large", 413);
    }

    const text = await req.text();
    if (text.length > MAX_PAYLOAD_CHARS) {
      return jsonError("watchlist is too large", 413);
    }

    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return jsonError("watchlist must be valid JSON", 400);
    }

    const watchlist = (body as { watchlist?: unknown })?.watchlist;
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
