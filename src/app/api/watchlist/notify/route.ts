import { NextResponse } from "next/server";
import { findProgram } from "@/lib/watchlist";
import universities from "@/data/universities.json";
import type { University } from "@/lib/types";
import { parseJsonBody, requireAuth } from "@/lib/http";
import { jsonError } from "@/lib/api-response";
import { escapeHtml } from "@/lib/escape-html";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { absoluteUrl } from "@/lib/site";
import type { WatchlistEntry } from "@/lib/watchlist";
import { parseWatchlist } from "@/lib/watchlist-validation";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 8 * 1024;
const NOTIFY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const UNIS = universities as unknown as University[];

function isRateLimited(lastNotifiedAt: string | null): boolean {
  if (!lastNotifiedAt) return false;
  const timestamp = Date.parse(lastNotifiedAt);
  return Number.isFinite(timestamp) && Date.now() - timestamp < NOTIFY_COOLDOWN_MS;
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.error;
    const { supabase, user } = auth;

    if (!(await checkRateLimit(`watchlist-notify:${user.id}`, 10, 60 * 60 * 1000))) {
      return jsonError("Too many notification requests. Try again later.", 429);
    }

    const bodyResult = await parseJsonBody(req, MAX_BODY_BYTES);
    if (!bodyResult.ok) return bodyResult.error;
    const entryId = (bodyResult.value as { entryId?: unknown } | null)?.entryId;
    if (typeof entryId !== "string" || !entryId || entryId.length > 100) {
      return jsonError("Invalid watchlist entry", 400);
    }
    if (!user.email) return jsonError("User has no email", 400);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("watchlist")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) return jsonError("Could not load watchlist", 500);

    const parsedWatchlist = parseWatchlist(profile?.watchlist);
    if (!parsedWatchlist.ok) return jsonError("Stored watchlist is invalid", 500);
    const watchlist: WatchlistEntry[] = parsedWatchlist.value;
    const entry = watchlist.find((item) => item.id === entryId);
    if (!entry) return jsonError("Watchlist entry not found", 404);
    if (!entry.notifyEmail) return NextResponse.json({ sent: false, reason: "notifications-disabled" });
    if (isRateLimited(entry.lastNotifiedAt)) {
      return NextResponse.json({ sent: false, reason: "rate-limited" });
    }

    const current = findProgram(UNIS, entry.universityId, entry.programName);
    if (!current || current.closingMerit == null) {
      return NextResponse.json({ sent: false, reason: "no-current-merit" });
    }
    if (entry.lastKnownMerit == null || current.closingMerit === entry.lastKnownMerit) {
      return NextResponse.json({ sent: false, reason: "no-change" });
    }

    const now = new Date().toISOString();
    const claimedWatchlist = watchlist.map((item) =>
      item.id === entryId
        ? { ...item, lastKnownMerit: current.closingMerit, lastNotifiedAt: now }
        : item
    );
    const { data: claimed, error: claimError } = await supabase
      .from("profiles")
      .update({ watchlist: claimedWatchlist })
      .eq("id", user.id)
      .eq("watchlist", watchlist)
      .select("id")
      .maybeSingle();
    if (claimError) return jsonError("Could not reserve notification", 500);
    if (!claimed) return NextResponse.json({ sent: false, reason: "already-claimed" });

    const universityName = UNIS.find((university) => university.id === entry.universityId)?.short ?? entry.universityId;
    const sent = await sendEmail({
      from: "Merit Alerts <watchlist@aftermediate.site>",
      to: user.email,
      subject: `Merit update: ${universityName} — ${entry.programName}`,
      html: `
        <p>Your watchlist program has a new merit list:</p>
        <table style="border-collapse:collapse;margin:16px 0;font-family:monospace;">
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Program</td><td style="font-weight:bold;">${escapeHtml(universityName)} — ${escapeHtml(entry.programName)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Previous merit</td><td>${entry.lastKnownMerit}%</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">New merit</td><td style="font-weight:bold;">${current.closingMerit}%</td></tr>
        </table>
        <p><a href="${absoluteUrl("/dashboard")}" style="color:#7a5bd4;">Log in to see your full watchlist →</a></p>
      `,
    });

    if (!sent.ok) {
      await supabase
        .from("profiles")
        .update({ watchlist })
        .eq("id", user.id)
        .eq("watchlist", claimedWatchlist);
      return NextResponse.json({ sent: false, reason: "email-failed" });
    }

    return NextResponse.json({ sent: true, lastNotifiedAt: now, currentMerit: current.closingMerit });
  } catch (err) {
    console.error("watchlist notify error", err);
    return jsonError("Internal server error", 500);
  }
}
