import { applicationChecklist } from "@/lib/application-checklist";
import type { ApplicationPlan } from "@/lib/application-tracker";
import type { FollowEntityType } from "@/lib/source-follow";

type Follow = { entityType: FollowEntityType; entityId: string };
type Deadline = Follow & { label: string; dueDate: string };

export type ApplicationFocus = Follow & {
  kind: "deadline" | "task" | "plan";
  title: string;
  detail: string;
};

function daysUntil(date: string, now: Date): number {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((Date.parse(`${date}T00:00:00Z`) - today) / 86_400_000);
}

export function applicationFocus(
  follows: Follow[],
  deadlines: Deadline[],
  plans: ApplicationPlan[],
  now = new Date()
): ApplicationFocus | null {
  const urgentDeadline = [...deadlines]
    .filter((deadline) => daysUntil(deadline.dueDate, now) >= 0 && daysUntil(deadline.dueDate, now) <= 14)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  if (urgentDeadline) {
    const days = daysUntil(urgentDeadline.dueDate, now);
    return {
      ...urgentDeadline,
      kind: "deadline",
      title: urgentDeadline.label,
      detail: days === 0 ? "This confirmed deadline is today." : days === 1 ? "This confirmed deadline is tomorrow." : `This confirmed deadline is in ${days} days.`,
    };
  }

  for (const follow of follows) {
    const plan = plans.find((item) => item.entityType === follow.entityType && item.entityId === follow.entityId);
    if (!plan) {
      return { ...follow, kind: "plan", title: "Set your application status", detail: "Start by choosing whether you are considering or preparing this option." };
    }
    if (plan.status === "decision-received") continue;
    const task = applicationChecklist(follow.entityType, follow.entityId).find((item) => !plan.completedTaskIds.includes(item.id));
    if (task) return { ...follow, kind: "task", title: task.title, detail: task.detail };
  }
  return null;
}

