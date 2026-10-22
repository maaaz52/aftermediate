import abroadScholarships from "@/data/abroad-scholarships.json";
import pakistanScholarships from "@/data/pakistan-scholarships.json";
import { escapeHtml } from "@/lib/escape-html";
import { sendEmail } from "@/lib/email";
import { absoluteUrl } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_ALERTS_PER_DISPATCH = 25;

type AlertEntityType = "university" | "scholarship";

export type SourceUpdateAlert = {
  id: string;
  user_id: string;
  summary: string;
  official_url: string;
  entity_type: AlertEntityType;
  entity_id: string;
  entity_label: string;
};

type PakistanScholarshipCatalogue = { scholarships: { id: string; name: string }[] };
type AbroadScholarshipCatalogue = { scholarships: { id: string; name: string }[] };

function cataloguePath(entityType: AlertEntityType, entityId: string): string {
  if (entityType === "university") return `/pakistan/universities/${entityId}`;
  if ((pakistanScholarships as unknown as PakistanScholarshipCatalogue).scholarships.some((item) => item.id === entityId)) {
    return `/pakistan/scholarships/${entityId}`;
  }
  if ((abroadScholarships as unknown as AbroadScholarshipCatalogue).scholarships.some((item) => item.id === entityId)) {
    return `/abroad/scholarships/${entityId}`;
  }
  return "/dashboard";
}

export function sourceUpdateAlertLink(entityType: AlertEntityType, entityId: string): string {
  return absoluteUrl(cataloguePath(entityType, entityId));
}

function emailHtml(alert: SourceUpdateAlert): string {
  const entity = escapeHtml(alert.entity_label);
  const summary = escapeHtml(alert.summary);
  const officialUrl = escapeHtml(alert.official_url);
  const itemUrl = escapeHtml(sourceUpdateAlertLink(alert.entity_type, alert.entity_id));
  return `
    <p>There is a reviewed update for an item you follow on Aftermediate.</p>
    <p style="font-size:18px;font-weight:700;margin:16px 0 8px;">${entity}</p>
    <p style="line-height:1.6">${summary}</p>
    <p style="margin:20px 0"><a href="${itemUrl}" style="color:#7a5bd4;font-weight:600">View it on Aftermediate →</a></p>
    <p style="font-size:13px;color:#666;line-height:1.5">This email was sent because you chose to follow ${entity}. The change was detected on an official page and reviewed before this alert. <a href="${officialUrl}">Check the official source</a> before making an application decision. You can stop these alerts at any time by unfollowing the item.</p>
  `;
}

/**
 * Delivers a bounded batch of already-approved, queued alerts. The database
 * function claims each row first, so the review action and weekly monitor
 * cannot double-send the same update.
 */
export async function dispatchSourceUpdateAlerts(limit = MAX_ALERTS_PER_DISPATCH) {
  const admin = createAdminClient();
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), MAX_ALERTS_PER_DISPATCH));
  const { data, error } = await admin.rpc("claim_source_update_notifications", { p_limit: safeLimit });
  if (error) {
    console.error("source alert claim failed", error.message);
    return { claimed: 0, sent: 0, failed: 0 };
  }

  const alerts = (data ?? []) as SourceUpdateAlert[];
  let sent = 0;
  let failed = 0;
  await Promise.all(alerts.map(async (alert) => {
    try {
      const { data: userResult, error: userError } = await admin.auth.admin.getUserById(alert.user_id);
      const email = userResult.user?.email;
      if (userError || !email) {
        failed += 1;
        await admin.rpc("complete_source_update_notification", {
          p_notification_id: alert.id,
          p_sent: false,
          p_error: "The follower account has no deliverable email address.",
          p_retry: false,
        });
        return;
      }

      const result = await sendEmail({
        from: "Aftermediate Updates <updates@aftermediate.site>",
        to: email,
        subject: `Reviewed update: ${alert.entity_label}`,
        html: emailHtml(alert),
      });
      if (!result.ok) {
        failed += 1;
        await admin.rpc("complete_source_update_notification", {
          p_notification_id: alert.id,
          p_sent: false,
          p_error: result.reason,
          p_retry: result.reason !== "not-configured",
        });
        return;
      }

      sent += 1;
      await admin.rpc("complete_source_update_notification", {
        p_notification_id: alert.id,
        p_sent: true,
        p_error: null,
        p_retry: false,
      });
    } catch (error) {
      failed += 1;
      console.error("source alert delivery failed", error);
      await admin.rpc("complete_source_update_notification", {
        p_notification_id: alert.id,
        p_sent: false,
        p_error: "Unexpected delivery error",
        p_retry: true,
      });
    }
  }));
  return { claimed: alerts.length, sent, failed };
}

