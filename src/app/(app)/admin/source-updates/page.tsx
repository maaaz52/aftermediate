import { notFound } from "next/navigation";
import Link from "next/link";
import { SourceUpdateReviewPanel, type ReviewCandidate } from "@/components/admin/source-update-review-panel";
import { isConfiguredAdmin } from "@/lib/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CandidateRow = {
  id: string;
  source_monitor_id: string;
  source_snapshot_id: string;
  summary: string;
  detected_values: Record<string, string | null>;
  official_url: string;
  created_at: string;
};

type MonitorRow = { id: string; entity_type: "university" | "scholarship"; label: string };
type SnapshotRow = { id: string; content_excerpt: string };

export default async function SourceUpdatesPage() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!isConfiguredAdmin(user?.email)) notFound();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("source_update_candidates")
    .select("id, source_monitor_id, source_snapshot_id, summary, detected_values, official_url, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);
  if (error) throw new Error("Could not load source updates.");
  const rows = (data ?? []) as CandidateRow[];
  const monitorIds = [...new Set(rows.map((row) => row.source_monitor_id))];
  const snapshotIds = [...new Set(rows.map((row) => row.source_snapshot_id))];
  const [{ data: monitors }, { data: snapshots }] = await Promise.all([
    monitorIds.length ? admin.from("source_monitors").select("id, entity_type, label").in("id", monitorIds) : Promise.resolve({ data: [] }),
    snapshotIds.length ? admin.from("source_snapshots").select("id, content_excerpt").in("id", snapshotIds) : Promise.resolve({ data: [] }),
  ]);
  const monitorById = new Map(((monitors ?? []) as MonitorRow[]).map((monitor) => [monitor.id, monitor]));
  const snapshotById = new Map(((snapshots ?? []) as SnapshotRow[]).map((snapshot) => [snapshot.id, snapshot]));
  const candidates: ReviewCandidate[] = rows.flatMap((row) => {
    const monitor = monitorById.get(row.source_monitor_id);
    if (!monitor) return [];
    return [{
      id: row.id,
      summary: row.summary,
      officialUrl: row.official_url,
      createdAt: row.created_at,
      entityType: monitor.entity_type,
      entityLabel: monitor.label,
      detectedValues: row.detected_values ?? {},
      excerpt: snapshotById.get(row.source_snapshot_id)?.content_excerpt ?? null,
    }];
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-saffron">Private admin</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">Source update review</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Approve only changes you can verify on the linked official source. Approving a university update can also replace an estimated calendar window with an exact confirmed date.
      </p>
      <div className="mt-5"><Link href="/admin/source-health" className="text-xs font-semibold text-saffron hover:underline">View source health →</Link></div>
      <div className="mt-5"><SourceUpdateReviewPanel candidates={candidates} /></div>
    </div>
  );
}
