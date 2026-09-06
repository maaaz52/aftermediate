import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/http";
import { getServerEnv } from "@/lib/server-env";
import { jsonError } from "@/lib/api-response";
import { escapeHtml } from "@/lib/escape-html";
import { sendEmail } from "@/lib/email";
import type { WatchlistEntry } from "@/lib/watchlist";

export const runtime = "nodejs";

const NOTIFY_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours per program

function isRateLimited(lastNotifiedAt: string | null): boolean {
  if (!lastNotifiedAt) return false;
  return Date.now() - new Date(lastNotifiedAt).getTime() < NOTIFY_COOLDOWN_MS;
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.error;
    const { supabase, user } = auth;

    const env = getServerEnv();
    const RESEND_API_KEY = env.resendApiKey;

    if (!RESEND_API_KEY) {
      return NextResponse.json({ sent: false, reason: "email-not-configured" });
    }

    const body = await req.json();
    const { entryId, currentMerit, previousMerit, programName, universityName } = body;

    if (typeof entryId !== "string" || !entryId || typeof programName !== "string" || !programName || typeof universityName !== "string" || !universityName) {
      return jsonError("Missing required fields", 400);
    }

    const userEmail = user.email;
    if (!userEmail) {
      return jsonError("User has no email", 400);
    }

    // Rate limit is enforced from the server's copy of the watchlist, never the
    // client's: a stale or edited `lastNotifiedAt` in the request cannot bypass it.
    const { data: profile } = await supabase
      .from("profiles")
      .select("watchlist")
      .eq("id", user.id)
      .maybeSingle();

    const watchlist = Array.isArray(profile?.watchlist) ? (profile.watchlist as WatchlistEntry[]) : [];
    const entry = watchlist.find((e) => e.id === entryId);

    if (!entry) {
      return jsonError("Watchlist entry not found", 404);
    }

    if (isRateLimited(entry.lastNotifiedAt)) {
      return NextResponse.json({ sent: false, reason: "rate-limited" });
    }

    // Record the notification before sending so two concurrent requests for
    // the same entry can't both pass the cooldown read and double-email.
    const now = new Date().toISOString();
    const updated = watchlist.map((e) => (e.id === entryId ? { ...e, lastNotifiedAt: now } : e));
    await supabase.from("profiles").update({ watchlist: updated }).eq("id", user.id);

    const resendRes = await sendEmail({
      from: "Merit Alerts <watchlist@aftermediate.site>",
      to: userEmail,
      subject: `🔔 Merit update: ${universityName} — ${programName}`,
      html: `
        <p>Your watchlist program has a new merit list:</p>
        <table style="border-collapse:collapse;margin:16px 0;font-family:monospace;">
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Program</td><td style="font-weight:bold;">${escapeHtml(universityName)} — ${escapeHtml(programName)}</td></tr>
          ${previousMerit !== null && previousMerit !== undefined ? `<tr><td style="padding:4px 12px 4px 0;color:#666;">Previous merit</td><td>${escapeHtml(previousMerit)}%</td></tr>` : ""}
          <tr><td style="padding:4px 12px 4px 0;color:#666;">New merit</td><td style="font-weight:bold;">${escapeHtml(currentMerit)}%</td></tr>
        </table>
        <p><a href="https://aftermediate.site/dashboard" style="color:#7a5bd4;">Log in to see your full watchlist →</a></p>
      `,
    });

    if (!resendRes.ok) {
      return NextResponse.json({ sent: false, reason: "email-failed" });
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("watchlist notify error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}