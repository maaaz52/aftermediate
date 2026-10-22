export const SOURCE_ALERT_KINDS = ["general", "merit-list", "selection-update"] as const;
export type SourceAlertKind = (typeof SOURCE_ALERT_KINDS)[number];

export function isSourceAlertKind(value: unknown): value is SourceAlertKind {
  return typeof value === "string" && (SOURCE_ALERT_KINDS as readonly string[]).includes(value);
}

export function sourceAlertSubject(kind: SourceAlertKind | null | undefined, entityLabel: string): string {
  if (kind === "merit-list") return `Merit list published: ${entityLabel}`;
  if (kind === "selection-update") return `Selection update: ${entityLabel}`;
  return `Reviewed update: ${entityLabel}`;
}

export function sourceAlertIntro(kind: SourceAlertKind | null | undefined): string {
  if (kind === "merit-list") return "A reviewed official merit-list update is available for an item you follow.";
  if (kind === "selection-update") return "A reviewed official selection or offer update is available for an item you follow.";
  return "There is a reviewed update for an item you follow on Aftermediate.";
}

