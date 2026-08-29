import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

function isRateLimited(lastNotifiedAt: string | null): boolean {
  if (!lastNotifiedAt) return false;
  const cooldown = 24 * 60 * 60 * 1000; // 24 hours
  return Date.now() - new Date(lastNotifiedAt).getTime() < cooldown;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!RESEND_API_KEY) {
      return NextResponse.json({ sent: false, reason: "email-not-configured" });
    }

    const body = await req.json();
    const { entryId, currentMerit, previousMerit, programName, universityName, lastNotifiedAt } = body;

    if (!entryId || !programName || !universityName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (isRateLimited(lastNotifiedAt)) {
      return NextResponse.json({ sent: false, reason: "rate-limited" });
    }

    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json({ error: "User has no email" }, { status: 400 });
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Merit Alerts <watchlist@aftermediate.site>",
        to: userEmail,
        subject: `🔔 Merit update: ${universityName} — ${programName}`,
        html: `
          <p>Your watchlist program has a new merit list:</p>
          <table style="border-collapse:collapse;margin:16px 0;font-family:monospace;">
            <tr><td style="padding:4px 12px 4px 0;color:#666;">Program</td><td style="font-weight:bold;">${universityName} — ${programName}</td></tr>
            ${previousMerit !== null && previousMerit !== undefined ? `<tr><td style="padding:4px 12px 4px 0;color:#666;">Previous merit</td><td>${previousMerit}%</td></tr>` : ""}
            <tr><td style="padding:4px 12px 4px 0;color:#666;">New merit</td><td style="font-weight:bold;">${currentMerit}%</td></tr>
          </table>
          <p><a href="https://aftermediate.site/dashboard" style="color:#7a5bd4;">Log in to see your full watchlist →</a></p>
        `,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error("resend error", errText);
      return NextResponse.json({ sent: false, reason: "email-failed" });
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("watchlist notify error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
