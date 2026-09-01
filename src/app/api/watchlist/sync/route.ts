import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/require-user";
import { jsonError, jsonOk } from "@/lib/api-response";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const user = await requireUser(supabase);
    if (!user) return jsonError("Unauthorized", 401);

    const body = await req.json();
    const watchlist = body.watchlist;

    if (!Array.isArray(watchlist)) {
      return jsonError("watchlist must be an array", 400);
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
