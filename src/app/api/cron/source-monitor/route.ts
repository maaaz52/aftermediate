import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchWithTimeout } from "@/lib/fetch-timeout";
import { getServerEnv } from "@/lib/server-env";
import { dispatchSourceUpdateAlerts } from "@/lib/source-update-alerts";
import { dispatchDeadlineReminders } from "@/lib/deadline-alerts";
import {
  describeDetectedChange,
  extractSourceSignals,
  SOURCE_MONITOR_DEFINITIONS,
  sourceDefinition,
  sourceFingerprint,
  sourceTextFromHtml,
} from "@/lib/source-monitoring";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_SOURCES_PER_RUN = 12;
const FETCH_TIMEOUT_MS = 15_000;

type MonitorRow = {
  id: string;
  source_url: string;
  active: boolean;
  latest_content_hash: string | null;
};

function monitorSeedRows() {
  return SOURCE_MONITOR_DEFINITIONS.map((source) => ({
    id: source.id,
    entity_type: source.entityType,
    entity_id: source.entityId,
    label: source.label,
    source_url: source.sourceUrl,
    active: true,
  }));
}

function isAuthorized(request: Request): boolean {
  const secret = getServerEnv().cronSecret;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}

async function recordFailure(admin: ReturnType<typeof createAdminClient>, id: string, message: string) {
  await admin
    .from("source_monitors")
    .update({ last_checked_at: new Date().toISOString(), last_error: message.slice(0, 500) })
    .eq("id", id);
}

/**
 * Vercel invokes this route daily. It only fetches a short allowlist of
 * official URLs and creates a pending review record; it never publishes a
 * changed fee, deadline, or merit number blindly.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  // Add new catalogue sources without overriding an operator's active/paused
  // choice or replacing an existing monitoring history.
  const { error: seedError } = await admin
    .from("source_monitors")
    .upsert(monitorSeedRows(), { onConflict: "id", ignoreDuplicates: true });
  if (seedError) {
    console.error("source monitor: could not register monitored sources", seedError.message);
    return NextResponse.json({ error: "Could not register monitored sources" }, { status: 500 });
  }

  const monitorIds = SOURCE_MONITOR_DEFINITIONS.map((source) => source.id);
  const { data, error } = await admin
    .from("source_monitors")
    .select("id, source_url, active, latest_content_hash")
    .eq("active", true)
    .in("id", monitorIds)
    .order("last_checked_at", { ascending: true, nullsFirst: true })
    .limit(MAX_SOURCES_PER_RUN);

  if (error) {
    console.error("source monitor: could not load monitors", error.message);
    return NextResponse.json({ error: "Could not load monitored sources" }, { status: 500 });
  }

  const results: { id: string; status: "baseline" | "unchanged" | "candidate" | "failed" }[] = [];
  for (const monitor of (data ?? []) as MonitorRow[]) {
    const definition = sourceDefinition(monitor.id);
    // The allowlist is a security boundary. A stray database row cannot make
    // our server crawl an arbitrary private address or third-party site.
    if (!definition || definition.sourceUrl !== monitor.source_url) {
      await recordFailure(admin, monitor.id, "Monitor configuration does not match the application allowlist.");
      results.push({ id: monitor.id, status: "failed" });
      continue;
    }

    try {
      const response = await fetchWithTimeout(definition.sourceUrl, {
        cache: "no-store",
        headers: {
          "User-Agent": "AftermediateSourceMonitor/1.0 (+https://www.aftermediate.site)",
          Accept: "text/html,application/xhtml+xml",
        },
      }, FETCH_TIMEOUT_MS);
      if (!response.ok) {
        await recordFailure(admin, monitor.id, `Official source returned HTTP ${response.status}.`);
        results.push({ id: monitor.id, status: "failed" });
        continue;
      }

      const html = await response.text();
      const normalized = sourceTextFromHtml(html);
      if (normalized.length < 80) {
        await recordFailure(admin, monitor.id, "Official source returned too little readable content.");
        results.push({ id: monitor.id, status: "failed" });
        continue;
      }

      const hash = sourceFingerprint(normalized);
      const checkedAt = new Date().toISOString();
      if (monitor.latest_content_hash === hash) {
        await admin.from("source_monitors").update({ last_checked_at: checkedAt, last_error: null }).eq("id", monitor.id);
        results.push({ id: monitor.id, status: "unchanged" });
        continue;
      }

      const signals = extractSourceSignals(definition, html);
      const { data: snapshot, error: snapshotError } = await admin
        .from("source_snapshots")
        .insert({
          source_monitor_id: monitor.id,
          content_hash: hash,
          content_excerpt: normalized.slice(0, 12_000),
          extracted_signals: signals,
          http_status: response.status,
          fetched_at: checkedAt,
        })
        .select("id")
        .maybeSingle();

      if (snapshotError) {
        // A duplicate snapshot means another cron invocation already owns this
        // source revision. It is safe to treat it as unchanged.
        if (snapshotError.code === "23505") {
          await admin.from("source_monitors").update({ latest_content_hash: hash, last_checked_at: checkedAt, last_error: null }).eq("id", monitor.id);
          results.push({ id: monitor.id, status: "unchanged" });
          continue;
        }
        throw snapshotError;
      }

      await admin.from("source_monitors").update({ latest_content_hash: hash, last_checked_at: checkedAt, last_error: null }).eq("id", monitor.id);
      if (!monitor.latest_content_hash) {
        results.push({ id: monitor.id, status: "baseline" });
        continue;
      }

      const { error: candidateError } = await admin.from("source_update_candidates").insert({
        source_monitor_id: monitor.id,
        source_snapshot_id: snapshot?.id,
        status: "pending",
        summary: describeDetectedChange(definition, signals),
        detected_values: signals,
        official_url: definition.sourceUrl,
      });
      if (candidateError) throw candidateError;
      results.push({ id: monitor.id, status: "candidate" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown monitoring error";
      console.error("source monitor failed", { id: monitor.id, message });
      await recordFailure(admin, monitor.id, message);
      results.push({ id: monitor.id, status: "failed" });
    }
  }

  // Retry a small, already-reviewed email batch. This uses no extra Vercel
  // schedule and makes transient Resend failures recover automatically.
  const delivery = await dispatchSourceUpdateAlerts();
  const deadlineDelivery = await dispatchDeadlineReminders();
  return NextResponse.json({ ok: true, checked: results.length, results, delivery, deadlineDelivery });
}
