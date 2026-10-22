import { notFound } from "next/navigation";
import { Activity } from "lucide-react";
import { SourceHealthPanel, type SourceHealthMonitor } from "@/components/admin/source-health-panel";
import { isConfiguredAdmin } from "@/lib/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type MonitorRow = {
  id: string;
  entity_type: "university" | "scholarship";
  entity_id: string;
  label: string;
  source_url: string;
  active: boolean;
  last_checked_at: string | null;
  last_error: string | null;
};
type CandidateRow = { source_monitor_id: string; status: "pending" | "approved" | "rejected" };

export default async function SourceHealthPage() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!isConfiguredAdmin(user?.email)) notFound();

  const admin = createAdminClient();
  const [{ data: monitorData, error: monitorError }, { data: candidateData, error: candidateError }] = await Promise.all([
    admin.from("source_monitors").select("id, entity_type, entity_id, label, source_url, active, last_checked_at, last_error").order("label", { ascending: true }).limit(1000),
    admin.from("source_update_candidates").select("source_monitor_id, status").eq("status", "pending").limit(1000),
  ]);
  if (monitorError || candidateError) throw new Error("Could not load source health.");

  const pendingByMonitor = new Map<string, number>();
  for (const candidate of (candidateData ?? []) as CandidateRow[]) {
    pendingByMonitor.set(candidate.source_monitor_id, (pendingByMonitor.get(candidate.source_monitor_id) ?? 0) + 1);
  }
  const monitors: SourceHealthMonitor[] = ((monitorData ?? []) as MonitorRow[]).map((monitor) => ({
    id: monitor.id,
    entityType: monitor.entity_type,
    entityId: monitor.entity_id,
    label: monitor.label,
    sourceUrl: monitor.source_url,
    active: monitor.active,
    lastCheckedAt: monitor.last_checked_at,
    lastError: monitor.last_error,
    pendingReviews: pendingByMonitor.get(monitor.id) ?? 0,
  }));

  return <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[11px] font-semibold uppercase tracking-widest text-saffron">Private admin</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">Source health</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">A clear operational view of the official-source monitoring pipeline—what is covered, what has been checked, and what needs your judgment.</p></div><div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-emerald-700"><Activity className="h-5 w-5" aria-hidden="true" /></div></div>
    <div className="mt-8"><SourceHealthPanel monitors={monitors} pendingCount={candidateData?.length ?? 0} /></div>
  </div>;
}
