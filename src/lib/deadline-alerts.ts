import { deadlineDistanceLabel } from "@/lib/deadline-reminders";
import { escapeHtml } from "@/lib/escape-html";
import { sendEmail } from "@/lib/email";
import { sourceUpdateAlertLink } from "@/lib/source-update-alerts";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_REMINDERS_PER_DISPATCH = 25;

type DeadlineReminder = {
  delivery_id: string;
  user_id: string;
  entity_type: "university" | "scholarship";
  entity_id: string;
  entity_label: string;
  reminder_label: string;
  due_date: string;
  official_url: string;
};

function deadlineEmailHtml(reminder: DeadlineReminder): string {
  const item = escapeHtml(reminder.entity_label);
  const label = escapeHtml(reminder.reminder_label);
  const dueDate = escapeHtml(reminder.due_date);
  const officialUrl = escapeHtml(reminder.official_url);
  const itemUrl = escapeHtml(sourceUpdateAlertLink(reminder.entity_type, reminder.entity_id));
  return `
    <p>An official deadline for an item you follow is ${escapeHtml(deadlineDistanceLabel(reminder.due_date))}.</p>
    <p style="font-size:18px;font-weight:700;margin:16px 0 8px;">${item}</p>
    <table style="border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:4px 14px 4px 0;color:#666;">Event</td><td style="font-weight:600;">${label}</td></tr>
      <tr><td style="padding:4px 14px 4px 0;color:#666;">Official date</td><td style="font-weight:600;">${dueDate}</td></tr>
    </table>
    <p><a href="${itemUrl}" style="color:#7a5bd4;font-weight:600">View it on Aftermediate →</a></p>
    <p style="font-size:13px;color:#666;line-height:1.5">This reminder is based on a date reviewed from an official source. <a href="${officialUrl}">Check the official source</a> before taking action. You can stop these reminders at any time by unfollowing the item.</p>
  `;
}

/** Send each follower at most one reminder for a confirmed upcoming deadline. */
export async function dispatchDeadlineReminders(limit = MAX_REMINDERS_PER_DISPATCH) {
  const admin = createAdminClient();
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), MAX_REMINDERS_PER_DISPATCH));
  const { data, error } = await admin.rpc("claim_deadline_reminder_deliveries", {
    p_limit: safeLimit,
    p_days_ahead: 14,
  });
  if (error) {
    console.error("deadline reminder claim failed", error.message);
    return { claimed: 0, sent: 0, failed: 0 };
  }

  const reminders = (data ?? []) as DeadlineReminder[];
  let sent = 0;
  let failed = 0;
  await Promise.all(reminders.map(async (reminder) => {
    try {
      const { data: userResult, error: userError } = await admin.auth.admin.getUserById(reminder.user_id);
      const email = userResult.user?.email;
      if (userError || !email) {
        failed += 1;
        await admin.rpc("complete_deadline_reminder_delivery", {
          p_delivery_id: reminder.delivery_id, p_sent: false,
          p_error: "The follower account has no deliverable email address.", p_retry: false,
        });
        return;
      }
      const result = await sendEmail({
        from: "Aftermediate Deadlines <updates@aftermediate.site>",
        to: email,
        subject: `Deadline reminder: ${reminder.entity_label}`,
        html: deadlineEmailHtml(reminder),
      });
      if (!result.ok) {
        failed += 1;
        await admin.rpc("complete_deadline_reminder_delivery", {
          p_delivery_id: reminder.delivery_id, p_sent: false, p_error: result.reason,
          p_retry: result.reason !== "not-configured",
        });
        return;
      }
      sent += 1;
      await admin.rpc("complete_deadline_reminder_delivery", {
        p_delivery_id: reminder.delivery_id, p_sent: true, p_error: null, p_retry: false,
      });
    } catch (error) {
      failed += 1;
      console.error("deadline reminder delivery failed", error);
      await admin.rpc("complete_deadline_reminder_delivery", {
        p_delivery_id: reminder.delivery_id, p_sent: false,
        p_error: "Unexpected delivery error", p_retry: true,
      });
    }
  }));
  return { claimed: reminders.length, sent, failed };
}

