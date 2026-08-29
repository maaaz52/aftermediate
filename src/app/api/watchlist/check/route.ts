import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findProgram } from "@/lib/watchlist";
import universities from "@/data/universities.json";
import type { University } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const watchlistParam = url.searchParams.get("watchlist");
    if (!watchlistParam) {
      return NextResponse.json({ error: "watchlist query param required" }, { status: 400 });
    }

    let watchlist: unknown[];
    try {
      watchlist = JSON.parse(watchlistParam);
    } catch {
      return NextResponse.json({ error: "watchlist must be valid JSON array" }, { status: 400 });
    }

    if (!Array.isArray(watchlist)) {
      return NextResponse.json({ error: "watchlist must be an array" }, { status: 400 });
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

    return NextResponse.json({ entries });
  } catch (err) {
    console.error("watchlist check error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
