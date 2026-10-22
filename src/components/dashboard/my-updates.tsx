"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, CalendarDays, ChevronRight, ExternalLink, GraduationCap, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { deadlineDistanceLabel } from "@/lib/deadline-reminders";
import { followEntityDetail, type FollowEntityType } from "@/lib/source-follow";

type Follow = { entityType: FollowEntityType; entityId: string };
type Deadline = Follow & { label: string; dueDate: string; officialUrl: string };
type Update = Follow & { entityLabel: string; summary: string; officialUrl: string; alertKind: "general" | "merit-list" | "selection-update"; reviewedAt: string };
type UpdateData = { follows: Follow[]; deadlines: Deadline[]; updates: Update[] };

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

      <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
        {follows.slice(0, 8).map((follow) => {
          const detail = followEntityDetail(follow.entityType, follow.entityId);
          return detail ? <Link key={`${follow.entityType}:${follow.entityId}`} href={detail.href} className="rounded-full border border-line px-2.5 py-1 text-xs text-muted transition-colors hover:border-saffron/40 hover:text-ink">{detail.name}</Link> : null;
        })}
        {follows.length > 8 && <span className="px-2.5 py-1 text-xs text-faint">+{follows.length - 8} more</span>}
      </div>
    </section>
  );
}

