"use client";

import * as React from "react";
import { Check, ExternalLink, FileText, ShieldCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const CALENDAR_EVENTS = [
  ["announcement", "Admissions announced"],
  ["application", "Applications / deadline"],
  ["test", "Entry test"],
  ["merit", "Merit list / offer"],
  ["fee", "Fee submission"],
  ["intake", "Classes begin"],
] as const;

export type ReviewCandidate = {
  id: string;
  summary: string;
  officialUrl: string;
  createdAt: string;
  entityType: "university" | "scholarship";
  entityLabel: string;
  detectedValues: Record<string, string | null>;
  excerpt: string | null;
};

function CandidateCard({ candidate }: { candidate: ReviewCandidate }) {
  const router = useRouter();
  const [saving, setSaving] = React.useState<"approved" | "rejected" | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const isUniversity = candidate.entityType === "university";

  async function review(form: HTMLFormElement, decision: "approved" | "rejected") {
    setSaving(decision);
    setError(null);
    const formData = new FormData(form);
    const eventType = String(formData.get("eventType") ?? "");
    const timingLabel = String(formData.get("timingLabel") ?? "").trim();
    const deadlineLabel = String(formData.get("deadlineLabel") ?? "").trim();
    const deadlineDate = String(formData.get("deadlineDate") ?? "");
    if (decision === "approved" && Boolean(eventType) !== Boolean(timingLabel)) {
      setError("Choose a calendar event and enter its exact confirmed timing together, or leave both blank.");
      setSaving(null);
      return;
    }
    if (decision === "approved" && Boolean(deadlineLabel) !== Boolean(deadlineDate)) {
      setError("Enter a reminder label and its exact official date together, or leave both blank.");
      setSaving(null);
      return;
    }
    const response = await fetch("/api/admin/source-updates/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidateId: candidate.id,
        decision,
        note: String(formData.get("note") ?? "").trim(),
        eventType: decision === "approved" && eventType && timingLabel ? eventType : null,
        timingLabel: decision === "approved" && eventType && timingLabel ? timingLabel : null,
        deadlineLabel: decision === "approved" && deadlineLabel && deadlineDate ? deadlineLabel : null,
        deadlineDate: decision === "approved" && deadlineLabel && deadlineDate ? deadlineDate : null,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(typeof payload.error === "string" ? payload.error : "Could not save the review.");
      setSaving(null);
      return;
    }
    router.refresh();
  }

  return (
    <article className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-saffron">
            {candidate.entityType}
          </p>
          <h2 className="mt-1 text-base font-bold text-ink">{candidate.entityLabel}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">{candidate.summary}</p>
        </div>
        <time className="shrink-0 font-mono text-xs text-faint">
          detected {new Date(candidate.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
        </time>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(candidate.detectedValues).filter(([, value]) => value).map(([key, value]) => (
          <span key={key} className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted">
            <span className="font-medium text-ink">{key}: </span>{value}
          </span>
        ))}
      </div>

      <a
        href={candidate.officialUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-saffron underline-offset-4 hover:underline"
      >
        Open official source <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </a>

      {candidate.excerpt && (
        <details className="mt-4 rounded-xl border border-line bg-surface-2/40 px-3 py-2.5">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-medium text-muted">
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            Captured source text
          </summary>
          <p className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-muted">
            {candidate.excerpt.slice(0, 1800)}
          </p>
        </details>
      )}

      <form
        className="mt-5 border-t border-line pt-4"
        onSubmit={(event) => {
          event.preventDefault();
          void review(event.currentTarget, "approved");
        }}
      >
        {isUniversity && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-muted">
              Confirm a calendar event <span className="text-faint">(optional)</span>
              <select name="eventType" className="mt-1.5 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink">
                <option value="">Approve without changing calendar</option>
                {CALENDAR_EVENTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-muted">
              Exact confirmed date / range <span className="text-faint">(optional)</span>
              <input name="timingLabel" maxLength={120} placeholder="e.g. 18 July 2027" className="mt-1.5 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-faint" />
            </label>
          </div>
        )}
        <div className="mt-3 rounded-xl border border-saffron/20 bg-saffron/5 p-3">
          <p className="text-xs font-semibold text-ink">Send a deadline reminder <span className="font-normal text-faint">(optional)</span></p>
          <p className="mt-1 text-xs leading-relaxed text-muted">Use only an exact date shown on this official source. Followers receive one email when the weekly check sees it within 14 days.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-muted">
              Deadline or event label
              <input name="deadlineLabel" maxLength={120} placeholder="e.g. Application deadline" className="mt-1.5 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-faint" />
            </label>
            <label className="text-xs font-medium text-muted">
              Exact official date
              <input name="deadlineDate" type="date" min={new Date().toISOString().slice(0, 10)} className="mt-1.5 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" />
            </label>
          </div>
        </div>
        <label className="mt-3 block text-xs font-medium text-muted">
          Review note <span className="text-faint">(optional)</span>
          <textarea name="note" maxLength={1000} rows={2} placeholder="Why this was approved or rejected" className="mt-1.5 w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-faint" />
        </label>
        {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="submit" size="sm" disabled={saving !== null}>
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            {saving === "approved" ? "Saving…" : "Approve"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="danger"
            disabled={saving !== null}
            onClick={(event) => {
              const form = event.currentTarget.closest("form");
              if (form) void review(form, "rejected");
            }}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            {saving === "rejected" ? "Saving…" : "Reject"}
          </Button>
        </div>
      </form>
    </article>
  );
}

export function SourceUpdateReviewPanel({ candidates }: { candidates: ReviewCandidate[] }) {
  if (candidates.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-5 py-12 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-emerald" aria-hidden="true" />
        <h2 className="mt-3 text-base font-bold text-ink">Nothing waiting for review</h2>
        <p className="mt-1 text-sm text-muted">New official-source changes will appear here after the monitoring job detects them.</p>
      </div>
    );
  }
  return <div className="space-y-4">{candidates.map((candidate) => <CandidateCard key={candidate.id} candidate={candidate} />)}</div>;
}
