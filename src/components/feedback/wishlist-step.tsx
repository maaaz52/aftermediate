"use client";

import { useState } from "react";
import { Lightbulb, Send } from "lucide-react";
import { PRIORITIES, type PriorityId } from "@/lib/feedback-model";
import { submitFeatureRequest } from "@/lib/feedback-api";

export function WishlistStep({ onSubmitted }: { onSubmitted?: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [useCase, setUseCase] = useState("");
  const [priority, setPriority] = useState<PriorityId>("p1");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    const res = await submitFeatureRequest({
      name: name.trim(),
      description: description.trim(),
      useCase: useCase.trim(),
      priority,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDone(true);
    setName("");
    setDescription("");
    setUseCase("");
    setPriority("p1");
    onSubmitted?.();
  };

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-sm text-emerald-200">
        Idea added — see it on the wall below and watch the votes roll in.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm text-[#a1a1b5]">
        <Lightbulb className="h-4 w-4 text-amber-300" aria-hidden />
        Optional — have an idea for what we should build next?
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="Feature name"
        placeholder="Feature name — e.g. past-paper practice mode"
        className="w-full rounded-lg border border-[#2a2a35] bg-[#0d0d12] px-3 py-2 text-sm text-white placeholder:text-faint focus:border-blue-500/60 focus:outline-none"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-label="Feature description"
          placeholder="What is it?"
          className="min-h-[72px] w-full resize-y rounded-lg border border-[#2a2a35] bg-[#0d0d12] px-3 py-2 text-sm text-white placeholder:text-faint focus:border-blue-500/60 focus:outline-none"
        />
        <textarea
          value={useCase}
          onChange={(e) => setUseCase(e.target.value)}
          aria-label="Use case"
          placeholder="Who needs it and why?"
          className="min-h-[72px] w-full resize-y rounded-lg border border-[#2a2a35] bg-[#0d0d12] px-3 py-2 text-sm text-white placeholder:text-faint focus:border-blue-500/60 focus:outline-none"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-faint">Priority</span>
        {PRIORITIES.map((p) => {
          const active = priority === p.id;
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={active}
              onClick={() => setPriority(p.id)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                active
                  ? p.id === "p0"
                    ? "border-red-500/60 bg-red-500/10 text-red-300"
                    : p.id === "p1"
                      ? "border-amber-500/60 bg-amber-500/10 text-amber-300"
                      : "border-blue-500/60 bg-blue-500/10 text-blue-300"
                  : "border-[#2a2a35] text-faint hover:border-[#3a3a48] hover:text-white"
              }`}
            >
              {p.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={submit}
          disabled={!name.trim() || busy}
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
        >
          <Send className="h-4 w-4" aria-hidden />
          {busy ? "Adding…" : "Add to the wall"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
