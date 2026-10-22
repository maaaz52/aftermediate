"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, CalendarDays, ChevronRight, ExternalLink, GraduationCap, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { deadlineDistanceLabel } from "@/lib/deadline-reminders";
import { followEntityDetail, type FollowEntityType } from "@/lib/source-follow";
import { APPLICATION_STATUSES, applicationStatusLabel, type ApplicationPlan, type ApplicationStatus } from "@/lib/application-tracker";
import { applicationChecklist } from "@/lib/application-checklist";
import { applicationFocus } from "@/lib/application-focus";
import { NotificationPreferences } from "@/components/dashboard/notification-preferences";

type Follow = { entityType: FollowEntityType; entityId: string };
type Deadline = Follow & { label: string; dueDate: string; officialUrl: string };
type Update = Follow & { entityLabel: string; summary: string; officialUrl: string; alertKind: "general" | "merit-list" | "selection-update"; reviewedAt: string };
type UpdateData = { follows: Follow[]; deadlines: Deadline[]; updates: Update[]; plans: ApplicationPlan[] };

function updateLabel(kind: Update["alertKind"]) {
  if (kind === "merit-list") return "Merit list";
  if (kind === "selection-update") return "Selection update";
  return "Official update";
}

function UpdatesSkeleton() {
  return <div className="card-glass rounded-2xl p-5"><Skeleton className="h-5 w-36" /><Skeleton className="mt-4 h-20 w-full" /><Skeleton className="mt-3 h-20 w-full" /></div>;
}

export function MyUpdates() {
  const [data, setData] = React.useState<UpdateData | null>(null);
  const [error, setError] = React.useState(false);
  const [savingKey, setSavingKey] = React.useState<string | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    fetch("/api/my-updates")
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<UpdateData>;
      })
      .then((result) => { if (active) setData(result); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);

  if (!data && !error) return <UpdatesSkeleton />;
  if (error) return (
    <div className="rounded-2xl border border-danger/25 bg-danger/5 p-5">
      <p className="text-sm font-semibold text-ink">Your updates could not load</p>
      <p className="mt-1 text-xs text-muted">Refresh the page to try again. Your followed items and email alerts are unchanged.</p>
    </div>
  );

  const follows = data?.follows ?? [];
  const deadlines = data?.deadlines ?? [];
  const updates = data?.updates ?? [];
  const plans = data?.plans ?? [];
  const focus = applicationFocus(follows, deadlines, plans);

  async function savePlan(follow: Follow, status: ApplicationStatus, note: string, completedTaskIds: string[]) {
    const key = `${follow.entityType}:${follow.entityId}`;
    setSavingKey(key);
    setSaveError(null);
    try {
      const response = await fetch("/api/application-tracker", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entityType: follow.entityType, entityId: follow.entityId, status, note, completedTaskIds }),
      });
      const result = await response.json().catch(() => ({})) as { error?: string; updatedAt?: string };
      const updatedAt = result.updatedAt;
      if (!response.ok || typeof updatedAt !== "string") throw new Error(result.error ?? "Could not save your plan.");
      setData((current) => current ? {
        ...current,
        plans: [
          ...current.plans.filter((plan) => `${plan.entityType}:${plan.entityId}` !== key),
          { entityType: follow.entityType, entityId: follow.entityId, status, note, completedTaskIds, updatedAt },
        ],
      } : current);
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "Could not save your plan.");
    } finally {
      setSavingKey(null);
    }
  }
  if (follows.length === 0) return (
    <div className="rounded-2xl border border-dashed border-line px-5 py-7 text-center">
      <Bell className="mx-auto h-5 w-5 text-saffron" aria-hidden="true" />
      <h3 className="mt-2 text-sm font-bold text-ink">Your updates will appear here</h3>
      <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted">Follow a university or scholarship to collect its confirmed deadlines and reviewed official updates in one place.</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Link href="/pakistan/universities" className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-saffron/40 hover:text-saffron">Browse universities</Link>
        <Link href="/pakistan/scholarships" className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-saffron/40 hover:text-saffron">Browse scholarships</Link>
      </div>
    </div>
  );

  return (
    <section className="card-glass rounded-2xl p-5" aria-labelledby="my-updates-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-saffron" aria-hidden="true" />
            <h3 id="my-updates-heading" className="text-base font-bold text-ink">My updates</h3>
          </div>
          <p className="mt-1 text-xs text-muted">Confirmed dates and reviewed changes for what you follow.</p>
        </div>
        <span className="rounded-full bg-saffron/10 px-2.5 py-1 text-xs font-semibold text-saffron">{follows.length} following</span>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-ink"><CalendarDays className="h-3.5 w-3.5 text-saffron" /> Upcoming confirmed dates</div>
          {deadlines.length === 0 ? <p className="mt-3 text-xs leading-relaxed text-muted">No exact dates have been confirmed for your followed items yet. We will only show dates reviewed from official sources.</p> : (
            <div className="mt-3 space-y-2">
              {deadlines.map((deadline) => {
                const detail = followEntityDetail(deadline.entityType, deadline.entityId);
                return <div key={`${deadline.entityType}:${deadline.entityId}:${deadline.dueDate}:${deadline.label}`} className="rounded-xl border border-line bg-surface/60 p-3">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-semibold text-ink">{detail?.name ?? deadline.entityId}</p><p className="mt-0.5 text-xs text-muted">{deadline.label}</p></div><span className="shrink-0 font-mono text-xs font-semibold text-saffron">{deadlineDistanceLabel(deadline.dueDate)}</span></div>
                  <div className="mt-2 flex items-center justify-between gap-3"><Link href={detail?.href ?? "/dashboard"} className="text-xs font-medium text-saffron hover:underline">View details</Link><a href={deadline.officialUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink">Official <ExternalLink className="h-3 w-3" /></a></div>
                </div>;
              })}
            </div>
          )}
        </div>

        <div className="border-t border-line pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink"><Trophy className="h-3.5 w-3.5 text-saffron" /> Latest reviewed changes</div>
          {updates.length === 0 ? <p className="mt-3 text-xs leading-relaxed text-muted">No reviewed changes yet. When an official source changes and it is verified, you will see it here and receive an email.</p> : (
            <div className="mt-3 space-y-3">
              {updates.map((update) => {
                const detail = followEntityDetail(update.entityType, update.entityId);
                return <div key={`${update.entityType}:${update.entityId}:${update.reviewedAt}`} className="border-b border-line pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start gap-2"><GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-saffron" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><p className="text-xs font-semibold text-ink">{detail?.name ?? update.entityLabel}</p><span className="text-[10px] font-semibold uppercase tracking-wide text-saffron">{updateLabel(update.alertKind)}</span></div><p className="mt-1 text-xs leading-relaxed text-muted">{update.summary}</p><div className="mt-2 flex items-center gap-3"><Link href={detail?.href ?? "/dashboard"} className="inline-flex items-center gap-0.5 text-xs font-medium text-saffron hover:underline">Open item <ChevronRight className="h-3 w-3" /></Link><a href={update.officialUrl} target="_blank" rel="noreferrer" className="text-xs text-muted hover:text-ink">Official source</a></div></div></div>
                </div>;
              })}
            </div>
          )}
        </div>
      </div>

      {focus && (() => {
        const detail = followEntityDetail(focus.entityType, focus.entityId);
        return <div className="mt-5 rounded-xl border border-saffron/25 bg-saffron/5 p-4">
          <p className="text-xs font-semibold text-saffron">Your next action</p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-sm font-bold text-ink">{focus.title}</p><p className="mt-0.5 text-xs leading-relaxed text-muted">{detail?.name ?? focus.entityId}: {focus.detail}</p></div>
            <Link href={detail?.href ?? "/dashboard"} className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-saffron hover:underline">Open item <ChevronRight className="h-3 w-3" /></Link>
          </div>
        </div>;
      })()}

      <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
        {follows.slice(0, 8).map((follow) => {
          const detail = followEntityDetail(follow.entityType, follow.entityId);
          return detail ? <Link key={`${follow.entityType}:${follow.entityId}`} href={detail.href} className="rounded-full border border-line px-2.5 py-1 text-xs text-muted transition-colors hover:border-saffron/40 hover:text-ink">{detail.name}</Link> : null;
        })}
        {follows.length > 8 && <span className="px-2.5 py-1 text-xs text-faint">+{follows.length - 8} more</span>}
      </div>
      <div className="mt-5 border-t border-line pt-4">
        <p className="text-xs font-semibold text-ink">Application plan</p>
        <p className="mt-1 text-xs text-muted">Keep a private status and note for each followed item.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {follows.slice(0, 8).map((follow) => {
            const detail = followEntityDetail(follow.entityType, follow.entityId);
            const key = `${follow.entityType}:${follow.entityId}`;
            const plan = plans.find((item) => `${item.entityType}:${item.entityId}` === key);
            return detail ? <PlanEditor key={`${key}:${plan?.updatedAt ?? "new"}`} follow={follow} name={detail.name} plan={plan} saving={savingKey === key} onSave={savePlan} /> : null;
          })}
        </div>
        {saveError && <p role="alert" className="mt-3 text-xs text-danger">{saveError}</p>}
      </div>
      <NotificationPreferences />
    </section>
  );
}

function PlanEditor({ follow, name, plan, saving, onSave }: { follow: Follow; name: string; plan?: ApplicationPlan; saving: boolean; onSave: (follow: Follow, status: ApplicationStatus, note: string, completedTaskIds: string[]) => Promise<void> }) {
  const [status, setStatus] = React.useState<ApplicationStatus>(plan?.status ?? "considering");
  const [note, setNote] = React.useState(plan?.note ?? "");
  const [completedTaskIds, setCompletedTaskIds] = React.useState<string[]>(plan?.completedTaskIds ?? []);
  const tasks = React.useMemo(() => applicationChecklist(follow.entityType, follow.entityId), [follow.entityId, follow.entityType]);
  return <div className="rounded-xl border border-line bg-surface/60 p-3">
    <p className="truncate text-xs font-semibold text-ink">{name}</p>
    <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
      <input value={note} maxLength={1000} onChange={(event) => setNote(event.target.value)} onBlur={() => { if (!saving && (note !== (plan?.note ?? ""))) void onSave(follow, status, note, completedTaskIds); }} placeholder="Private note" className="h-9 min-w-0 rounded-lg border border-line bg-surface px-2.5 text-xs text-ink placeholder:text-faint" />
      <select value={status} onChange={(event) => { const next = event.target.value as ApplicationStatus; setStatus(next); void onSave(follow, next, note, completedTaskIds); }} disabled={saving} className="h-9 rounded-lg border border-line bg-surface px-2.5 text-xs font-medium text-ink disabled:opacity-60">
        {APPLICATION_STATUSES.map((option) => <option key={option} value={option}>{applicationStatusLabel(option)}</option>)}
      </select>
    </div>
    <details className="mt-3">
      <summary className="cursor-pointer text-xs font-medium text-saffron">Checklist {completedTaskIds.length}/{tasks.length}</summary>
      <div className="mt-2 space-y-2">
        {tasks.map((task) => {
          const checked = completedTaskIds.includes(task.id);
          return <label key={task.id} className="flex cursor-pointer items-start gap-2 text-xs text-muted">
            <input type="checkbox" checked={checked} disabled={saving} onChange={() => { const next = checked ? completedTaskIds.filter((id) => id !== task.id) : [...completedTaskIds, task.id]; setCompletedTaskIds(next); void onSave(follow, status, note, next); }} className="mt-0.5 h-3.5 w-3.5 accent-saffron" />
            <span><span className={checked ? "line-through text-faint" : "text-ink"}>{task.title}</span><span className="mt-0.5 block text-[11px] leading-relaxed text-faint">{task.detail}</span></span>
          </label>;
        })}
      </div>
    </details>
    {saving && <p className="mt-2 text-[11px] text-faint">Saving…</p>}
  </div>;
}

