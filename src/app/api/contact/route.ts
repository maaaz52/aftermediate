import { createClient } from "@/lib/supabase/server";
import { jsonError, jsonOk } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/http";
import { sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/escape-html";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NOTIFY_TO = "themz52@proton.me";

/**
 * Receives the landing-page contact form, stores it in contact_messages, and
 * emails the team a copy. The email is best-effort: a delivery failure must
 * not lose the message, which is already in the database by then.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const bodyResult = await parseJsonBody(req, MAX_BODY_BYTES);
    if (!bodyResult.ok) return bodyResult.error;
    const body = bodyResult.value as Record<string, unknown>;

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const rating = typeof body.rating === "number" ? Math.round(body.rating) : null;

    if (!name || name.length > 100) return jsonError("Enter your name.", 400);
    if (!EMAIL_RE.test(email) || email.length > 200) return jsonError("Enter a valid email address.", 400);
    if (!message || message.length > 5000) return jsonError("Enter a message.", 400);
    if (rating !== null && (rating < 1 || rating > 5)) return jsonError("Rating must be 1-5.", 400);

    const { error } = await supabase.from("contact_messages").insert({
      user_id: user?.id ?? null,
      name,
      email,
      message,
      rating,
    });
    if (error) {
      console.error("contact insert error", error.message);
      return jsonError("Could not save your message.", 500);
    }

    const sent = await sendEmail({
      from: "Aftermediate Contact <no-reply@aftermediate.site>",
      to: NOTIFY_TO,
      subject: `New contact message from ${name}`,
      html: `
        <div style="font-family:Plus Jakarta Sans,system-ui,sans-serif;max-width:560px;margin:0 auto;">
          <p style="color:#566073;font-size:15px;line-height:1.6;">New message from the Aftermediate contact form:</p>
          <table style="border-collapse:collapse;margin:16px 0;font-family:monospace;font-size:14px;">
            <tr><td style="padding:4px 12px 4px 0;color:#8a93a6;">Name</td><td style="font-weight:bold;">${escapeHtml(name)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#8a93a6;">Email</td><td>${escapeHtml(email)}</td></tr>
            ${rating !== null ? `<tr><td style="padding:4px 12px 4px 0;color:#8a93a6;">Rating</td><td>${rating}/5</td></tr>` : ""}
          </table>
          <div style="border:2px solid #191f2c;padding:16px;background:#f4f2eb;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(message)}</div>
        </div>
      `,
    });
    if (!sent.ok) {
      console.error("contact email failed", sent.reason);
    }

    return jsonOk({ ok: true });
  } catch (err) {
    console.error("contact error", err);
    return jsonError("Internal server error", 500);
  }
}