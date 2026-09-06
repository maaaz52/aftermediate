import { getServerEnv } from "@/lib/server-env";

/**
 * Sends email through Resend. Returns a short reason instead of throwing, so
 * callers pick the HTTP response without a try/catch. Callers that need an
 * "email not configured" early-exit still check getServerEnv().resendApiKey
 * themselves; this is a defensive second check for the same variable.
 */
export async function sendEmail(input: {
  to: string;
  from: string;
  subject: string;
  html: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const env = getServerEnv();
  if (!env.resendApiKey) return { ok: false, reason: "not-configured" };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: input.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    }),
  });

  if (!res.ok) {
    console.error("sendEmail: resend error", await res.text());
    return { ok: false, reason: "email-failed" };
  }
  return { ok: true };
}