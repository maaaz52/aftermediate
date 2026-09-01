import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/require-user";
import { findProgram } from "@/lib/watchlist";
import universities from "@/data/universities.json";
import type { University } from "@/lib/types";
import { jsonError, jsonOk } from "@/lib/api-response";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const user = await requireUser(supabase);
    if (!user) return jsonError("Unauthorized", 401);

    const url = new URL(req.url);
    const watchlistParam = url.searchParams.get("watchlist");
    if (!watchlistParam) {
      return jsonError("watchlist query param required", 400);
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
