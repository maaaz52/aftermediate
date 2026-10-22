"use client";

import * as React from "react";
import { BellRing } from "lucide-react";

type Preferences = { officialSourceUpdates: boolean; deadlineReminders: boolean; meritAndSelectionUpdates: boolean };
const labels: { key: keyof Preferences; title: string; detail: string }[] = [
  { key: "officialSourceUpdates", title: "Official source updates", detail: "Reviewed admissions, eligibility, fee, and scholarship changes." },
  { key: "deadlineReminders", title: "Deadline reminders", detail: "Exact dates reviewed from official sources." },
  { key: "meritAndSelectionUpdates", title: "Merit and selection updates", detail: "Published merit lists and selection-result notices." },
];

export function NotificationPreferences() {
  const [preferences, setPreferences] = React.useState<Preferences | null>(null);
  const [saving, setSaving] = React.useState<keyof Preferences | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    fetch("/api/notification-preferences").then(async (response) => {
      if (!response.ok) throw new Error();
      return response.json() as Promise<{ preferences: Preferences }>;
    }).then((result) => { if (active) setPreferences(result.preferences); }).catch(() => { if (active) setError("Could not load email preferences."); });
    return () => { active = false; };
  }, []);

  async function toggle(key: keyof Preferences) {
    if (!preferences || saving) return;
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    setSaving(key);
    setError(null);
    try {
      const response = await fetch("/api/notification-preferences", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(next) });
      const result = await response.json().catch(() => ({})) as { preferences?: Preferences; error?: string };
      if (!response.ok || !result.preferences) throw new Error(result.error ?? "Could not save email preferences.");
      setPreferences(result.preferences);
    } catch (caught) {
      setPreferences(preferences);
      setError(caught instanceof Error ? caught.message : "Could not save email preferences.");
    } finally { setSaving(null); }
  }

  if (!preferences && !error) return null;
  return <section className="mt-5 border-t border-line pt-4" aria-labelledby="notification-preferences-heading">
    <div className="flex items-center gap-2"><BellRing className="h-4 w-4 text-saffron" aria-hidden="true" /><h4 id="notification-preferences-heading" className="text-xs font-semibold text-ink">Email preferences</h4></div>
    <p className="mt-1 text-xs text-muted">Choose which reviewed updates we can email you about. You can change these anytime.</p>
    {preferences && <div className="mt-3 grid gap-2 sm:grid-cols-3">{labels.map(({ key, title, detail }) => <button key={key} type="button" role="switch" aria-checked={preferences[key]} disabled={saving !== null} onClick={() => void toggle(key)} className="rounded-xl border border-line bg-surface/60 p-3 text-left transition-colors hover:border-saffron/35 disabled:opacity-60"><span className="flex items-center justify-between gap-3"><span className="text-xs font-semibold text-ink">{title}</span><span className={`h-5 w-9 rounded-full p-0.5 transition-colors ${preferences[key] ? "bg-saffron" : "bg-surface-2"}`}><span className={`block h-4 w-4 rounded-full bg-white transition-transform ${preferences[key] ? "translate-x-4" : "translate-x-0"}`} /></span></span><span className="mt-1 block text-[11px] leading-relaxed text-muted">{detail}</span></button>)}</div>}
    {error && <p role="alert" className="mt-2 text-xs text-danger">{error}</p>}
  </section>;
}
