import type { ApplicationPlan } from "@/lib/application-tracker";
import { applicationFocus, type ApplicationFocus } from "@/lib/application-focus";
import { escapeHtml } from "@/lib/escape-html";
import { sendEmail } from "@/lib/email";
import { absoluteUrl } from "@/lib/site";
import { followEntityDetail, isFollowEntityType, type FollowEntityType } from "@/lib/source-follow";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_WEEKLY_DIGESTS_PER_RUN = 10;

type DigestDelivery = { delivery_id: string; user_id: string };
type Follow = { entityType: FollowEntityType; entityId: string };
type Deadline = Follow & { label: string; dueDate: string };
type FollowRow = { entity_type: unknown; entity_id: unknown };

function digestContent(focus: ApplicationFocus) {
  const entity = followEntityDetail(focus.entityType, focus.entityId);
  const entityName = entity?.name ?? "your followed option";
  const itemHref = entity?.href ?? "/dashboard";
  const title = escapeHtml(focus.title);
  const detail = escapeHtml(focus.detail);
  const safeEntity = escapeHtml(entityName);
  const itemUrl = escapeHtml(absoluteUrl(itemHref));
  const dashboardUrl = escapeHtml(absoluteUrl("/dashboard"));
  const typeCopy = focus.kind === "deadline" ? "confirmed deadline" : focus.kind === "task" ? "application task" : "application plan";
  return {
    subject: `Your next action: ${focus.title.replace(/[\r\n]+/g, " ").trim().slice(0, 160)}`,
    html: `
      <p>Here is the one ${typeCopy} worth focusing on this week.</p>
      <p style="font-size:18px;font-weight:700;margin:16px 0 8px;">${title}</p>
      <p style="line-height:1.6">${detail}</p>
      <p style="color:#666;margin:16px 0 20px;">For: ${safeEntity}</p>
      <p><a href="${itemUrl}" style="color:#7a5bd4;font-weight:600">Open your application plan →</a></p>
      <p style="font-size:13px;color:#666;line-height:1.5">This optional weekly email is based on the options and application steps you track in Aftermediate. <a href="${dashboardUrl}">Manage email preferences</a>.</p>
    `,
  };
}

async function loadFocus(userId: string): Promise<ApplicationFocus | null> {
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const [followsResult, deadlinesResult, plansResult] = await Promise.all([
    admin.from("source_follows").select("entity_type, entity_id").eq("user_id", userId),
    admin.from("official_deadline_events").select("entity_type, entity_id, label, due_date").gte("due_date", today).order("due_date", { ascending: true }).limit(100),
    admin.from("application_tracker_entries").select("entity_type, entity_id, status, note, completed_task_ids, updated_at").eq("user_id", userId),
  ]);
  if (followsResult.error || deadlinesResult.error || plansResult.error) {
    throw new Error("Could not prepare weekly action digest.");
  }

  const follows = ((followsResult.data ?? []) as FollowRow[]).flatMap((follow): Follow[] => (
    isFollowEntityType(follow.entity_type) && typeof follow.entity_id === "string"
      ? [{ entityType: follow.entity_type, entityId: follow.entity_id }]
      : []
  ));
  const followed = new Set(follows.map((follow) => `${follow.entityType}:${follow.entityId}`));
  const deadlines = (deadlinesResult.data ?? []).flatMap((deadline): Deadline[] => (
    isFollowEntityType(deadline.entity_type) && typeof deadline.entity_id === "string" &&
    followed.has(`${deadline.entity_type}:${deadline.entity_id}`) &&
    typeof deadline.label === "string" && typeof deadline.due_date === "string"
      ? [{ entityType: deadline.entity_type, entityId: deadline.entity_id, label: deadline.label, dueDate: deadline.due_date }]
      : []
  ));
  const plans = (plansResult.data ?? []).flatMap((plan): ApplicationPlan[] => (
    isFollowEntityType(plan.entity_type) && typeof plan.entity_id === "string" &&
    followed.has(`${plan.entity_type}:${plan.entity_id}`) &&
    (plan.status === "considering" || plan.status === "preparing" || plan.status === "applied" || plan.status === "decision-received") &&
    typeof plan.note === "string" && typeof plan.updated_at === "string" &&
    Array.isArray(plan.completed_task_ids) && plan.completed_task_ids.every((task) => typeof task === "string")
      ? [{ entityType: plan.entity_type, entityId: plan.entity_id, status: plan.status, note: plan.note, completedTaskIds: plan.completed_task_ids, updatedAt: plan.updated_at }]
      : []
  ));
  return applicationFocus(follows, deadlines, plans);
}

async function complete(deliveryId: string, outcome: "sent" | "skipped" | "failed", error: string | null, retry: boolean) {
  const admin = createAdminClient();
  await admin.rpc("complete_weekly_action_digest_delivery", {
    p_delivery_id: deliveryId,
    p_outcome: outcome,
    p_error: error,
    p_retry: retry,
  });
}

/**
 * A capped, opt-in weekly digest. Delivery rows are claimed before email is
 * composed, making Vercel retries idempotent for each user/week.
 */
export async function dispatchWeeklyActionDigests(limit = MAX_WEEKLY_DIGESTS_PER_RUN) {
  const admin = createAdminClient();
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), MAX_WEEKLY_DIGESTS_PER_RUN));
  const { data, error } = await admin.rpc("claim_weekly_action_digest_deliveries", { p_limit: safeLimit });
  if (error) {
    console.error("weekly action digest claim failed", error.message);
    return { claimed: 0, sent: 0, skipped: 0, failed: 0 };
  }

  const deliveries = (data ?? []) as DigestDelivery[];
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  await Promise.all(deliveries.map(async (delivery) => {
    try {
      const [userResult, focus] = await Promise.all([
        admin.auth.admin.getUserById(delivery.user_id),
        loadFocus(delivery.user_id),
      ]);
      const email = userResult.data.user?.email;
      if (userResult.error || !email) {
        failed += 1;
        await complete(delivery.delivery_id, "failed", "The account has no deliverable email address.", false);
        return;
      }
      if (!focus) {
        skipped += 1;
        await complete(delivery.delivery_id, "skipped", null, false);
        return;
      }
      const content = digestContent(focus);
      const result = await sendEmail({
        from: "Aftermediate Weekly <updates@aftermediate.site>",
        to: email,
        subject: content.subject,
        html: content.html,
      });
      if (!result.ok) {
        failed += 1;
        await complete(delivery.delivery_id, "failed", result.reason, result.reason !== "not-configured");
        return;
      }
      sent += 1;
      await complete(delivery.delivery_id, "sent", null, false);
    } catch (error) {
      failed += 1;
      console.error("weekly action digest delivery failed", error);
      await complete(delivery.delivery_id, "failed", "Unexpected delivery error", true);
    }
  }));
  return { claimed: deliveries.length, sent, skipped, failed };
}

export { digestContent };
