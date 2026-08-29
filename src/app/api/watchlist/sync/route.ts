import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const watchlist = body.watchlist;

    if (!Array.isArray(watchlist)) {
      return NextResponse.json({ error: "watchlist must be an array" }, { status: 400 });
    }

    const { error } = await supabase
      .from("profiles")
      .update({ watchlist })
      .eq("id", session.user.id);

    if (error) {
      console.error("watchlist sync error", error);
      return NextResponse.json({ error: "Sync failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("watchlist sync error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
