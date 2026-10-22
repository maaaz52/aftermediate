import type { FollowEntityType } from "@/lib/source-follow";

export const APPLICATION_STATUSES = ["considering", "preparing", "applied", "decision-received"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type ApplicationPlan = {
  entityType: FollowEntityType;
  entityId: string;
  status: ApplicationStatus;
  note: string;
  updatedAt: string;
};

export function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return typeof value === "string" && (APPLICATION_STATUSES as readonly string[]).includes(value);
}

export function applicationStatusLabel(status: ApplicationStatus): string {
  return {
    considering: "Considering",
    preparing: "Preparing",
    applied: "Applied",
    "decision-received": "Decision received",
  }[status];
}

