"use client";

import Link from "next/link";
import { CalendarDays, CheckCircle2, ExternalLink, MapPin } from "lucide-react";
import type { PersonalCalendarItem } from "@/lib/personal-application-calendar";
import { followEntityDetail } from "@/lib/source-follow";

export function ApplicationCalendar({ items }: { items: PersonalCalendarItem[] }) {
  if (items.length === 0) return null;
  return <section className="mt-5 border-t border-line pt-5" aria-labelledby="application-calendar-heading">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-saffron" aria-hidden="true" /><h4 id="application-calendar-heading" className="text-sm font-semibold text-ink">Application calendar</h4></div><p className="mt-1 text-xs leading-relaxed text-muted">Official dates are marked confirmed. The rest are clearly labelled planning windows, not promises.</p></div>
      <div className="flex gap-2 text-[11px]"><span className="rounded-full bg-emerald-500/10 px-2 py-1 font-semibold text-emerald-700">Confirmed</span><span className="rounded-full bg-surface-2 px-2 py-1 font-semibold text-muted">Typical window</span></div>
    </div>
    <div className="mt-4 grid gap-3 lg:grid-cols-2">
      {items.map((item) => {
        const detail = followEntityDetail(item.entityType, item.entityId);
        const name = detail?.name ?? item.name;
        return <details key={`${item.entityType}:${item.entityId}`} className="group rounded-xl border border-line bg-surface/60 p-3" open={items.length === 1}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3"><span className="min-w-0"><span className="block truncate text-xs font-semibold text-ink">{name}</span><span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted"><MapPin className="h-3 w-3" />{item.events.filter((event) => event.confidence === "confirmed").length} confirmed · {item.events.length} milestones</span></span><span className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-saffron group-open:hidden">View</span><span className="hidden rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted group-open:inline">Close</span></summary>
          <ol className="mt-4 space-y-0 border-l border-line pl-4">
            {item.events.map((event) => <li key={event.id} className="relative pb-4 last:pb-0"><span className={`absolute -left-[21px] top-0.5 h-3 w-3 rounded-full border-2 border-surface ${event.confidence === "confirmed" ? "bg-emerald-500" : "bg-saffron/60"}`} /><div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1"><div><p className="text-xs font-semibold text-ink">{event.label}</p><p className="mt-0.5 text-[11px] leading-relaxed text-muted">{event.detail}</p></div><span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${event.confidence === "confirmed" ? "bg-emerald-500/10 text-emerald-700" : "bg-surface-2 text-muted"}`}>{event.timing}</span></div><a href={event.sourceUrl} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted hover:text-ink">{event.confidence === "confirmed" ? "Official source" : "Planning source"}<ExternalLink className="h-2.5 w-2.5" /></a></li>)}
          </ol>
          <Link href={detail?.href ?? item.href} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-saffron hover:underline"><CheckCircle2 className="h-3.5 w-3.5" />Open application details</Link>
        </details>;
      })}
    </div>
  </section>;
}
