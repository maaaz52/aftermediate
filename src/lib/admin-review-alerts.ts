import { parseAdminEmails } from "@/lib/admin-access";
import { escapeHtml } from "@/lib/escape-html";
import { sendEmail } from "@/lib/email";
import { getServerEnv } from "@/lib/server-env";
import { absoluteUrl } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";

type PendingCandidate = {
  id: string;
  summary: string;
  created_at: string;
  source_monitors: { label: string } | { label: string }[] | null;
};

function monitorLabel(candidate: PendingCandidate): string {
  const monitor = Array.isArray(candidate.source_monitors)
    ? candidate.source_monitors[0]
    : candidate.source_monitors;
  return monitor?.label ?? "Official source update";
}

export function adminReviewDigestSubject(count: number): string {
  return `${count} source update${count === 1 ? "" : "s"} ${count === 1 ? "needs" : "need"} review`;
}

function emailHtml(candidates: PendingCandidate[], total: number): string {
  const visible = candidates.slice(0, 12);
  const list = visible.map((candidate) => (
    `<li style="margin:0 0 12px"><strong>${escapeHtml(monitorLabel(candidate))}</strong><br><span style="color:#555;line-height:1.45">${escapeHtml(candidate.summary)}</span></li>`
  )).join("");
  const remaining = total - visible.length;
  return `
    <p>${total} official-source update${total === 1 ? " is" : "s are"} waiting for your review.</p>
    <ul style="padding-left:20px">${list}</ul>
    ${remaining > 0 ? `<p style="color:#666">+ ${remaining} more waiting in the dashboard.</p>` : ""}
    <p style="margin:20px 0"><a href="${escapeHtml(absoluteUrl("/admin/source-updates"))}" style="color:#7a5bd4;font-weight:600">Review source updates →</a></p>
    <p style="font-size:13px;color:#666;line-height:1.5">These changes were detected on official pages. Review each source before publishing dates, fees, eligibility, merit, or scholarship information to students.</p>
  `;
}

/**
 * Sends one compact weekly reminder to each configured administrator when
 * source candidates are pending. It intentionally includes all open items so
 * a missed email never hides a change from the review workflow.
 */
export async function sendPendingSourceReviewDigest() {
  const recipients = [...parseAdminEmails(getServerEnv().adminEmails)];
  if (recipients.length === 0) return { recipients: 0, pending: 0, sent: 0 };

  const admin = createAdminClient();
  const { data, error, count } = await admin
    .from("source_update_candidates")
    .select("id, summary, created_at, source_monitors!inner(label)", { count: "exact" })
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(12);
  if (error) {
    console.error("admin review digest read failed", error.message);
    return { recipients: recipients.length, pending: 0, sent: 0 };
  }

  const pending = (data ?? []) as PendingCandidate[];
  // Keep the fallback to the loaded slice if an older client/server omits the count.
  const pendingCount = count ?? pending.length;
  if (pendingCount === 0) return { recipients: recipients.length, pending: 0, sent: 0 };

  const result = await Promise.all(recipients.map((to) => sendEmail({
    from: "Aftermediate Updates <updates@aftermediate.site>",
    to,
    subject: adminReviewDigestSubject(pendingCount),
    html: emailHtml(pending, pendingCount),
  })));
  return { recipients: recipients.length, pending: pendingCount, sent: result.filter((item) => item.ok).length };
}

