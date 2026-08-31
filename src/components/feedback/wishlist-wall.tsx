"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { listFeatureRequests, toggleVote, type FeatureRequest } from "@/lib/feedback-api";

type Filter = "all" | "open" | "planning" | "shipped";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "planning", label: "In Planning" },
  { id: "shipped", label: "Shipped" },
];

const PRIORITY_STYLES: Record<string, string> = {
  p0: "border-red-500/50 bg-red-500/10 text-red-300",
  p1: "border-amber-500/50 bg-amber-500/10 text-amber-300",
  p2: "border-blue-500/50 bg-blue-500/10 text-blue-300",
};

export function WishlistWall({ refreshKey = 0 }: { refreshKey?: number }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [rows, setRows] = useState<FeatureRequest[]>([]);
  const [voted, setVoted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    // No synchronous setState here — react-hooks/set-state-in-effect only
    // allows updates after an await. Initial state is already loading=true,
    // so the mount spinner is unaffected.
    const data = await listFeatureRequests(filter);
    setRows(data);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    // Deferred via setTimeout like watchlist-section.tsx — react-hooks/
    // set-state-in-effect forbids calling setState synchronously in an effect.
    const timer = setTimeout(() => load(), 0);
    return () => clearTimeout(timer);
  }, [load, refreshKey]);

  const vote = async (id: string) => {
    const prev = voted[id] ?? false;
    setVoted((v) => ({ ...v, [id]: !prev }));
    setRows((rs) =>
      rs.map((r) => (r.id === id ? { ...r, votes_count: r.votes_count + (prev ? -1 : 1) } : r))
    );
    const res = await toggleVote(id);
    if (!res.ok) {
      setVoted((v) => ({ ...v, [id]: prev }));
      setRows((rs) =>
        rs.map((r) => (r.id === id ? { ...r, votes_count: r.votes_count - (prev ? -1 : 1) } : r))
      );
    }
  };

  return (
    <section aria-label="Feature wishlist" className="rounded-2xl border border-[#222] bg-[#0d0d12] p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-bold text-white">Feature wishlist</h2>
        <span className="font-mono text-xs text-faint">vote on what we build next</span>
        <div className="ml-auto flex flex-wrap gap-2" role="group" aria-label="Roadmap filter">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                filter === f.id
                  ? "border-blue-500/60 bg-blue-500/10 text-blue-300"
                  : "border-[#2a2a35] text-faint hover:border-[#3a3a48] hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-faint">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading ideas…
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-sm text-faint">Nothing here yet — be the first to add an idea above.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="flex items-start gap-4 rounded-xl border border-[#222] bg-[#111118] p-4">
              <button
                type="button"
                onClick={() => vote(row.id)}
                aria-pressed={voted[row.id] ?? false}
                aria-label={`Upvote ${row.name}`}
                className="flex shrink-0 flex-col items-center gap-0.5 rounded-lg border border-[#2a2a35] px-2.5 py-1.5 transition-colors hover:border-blue-500/50 aria-pressed:border-blue-500/60 aria-pressed:bg-blue-500/10"
              >
                <ArrowUp className={`h-4 w-4 ${voted[row.id] ? "text-blue-400" : "text-faint"}`} aria-hidden />
                <span className="text-sm font-bold tabular-nums text-white">{row.votes_count}</span>
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">{row.name}</h3>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${PRIORITY_STYLES[row.priority]}`}>
                    {row.priority}
                  </span>
                  {row.status !== "open" && (
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                        row.status === "shipped"
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                          : "border-violet-500/50 bg-violet-500/10 text-violet-300"
                      }`}
                    >
                      {row.status === "shipped" ? "Shipped" : "In planning"}
                    </span>
                  )}
                </div>
                {row.description && <p className="mt-1 text-sm text-[#a1a1b5]">{row.description}</p>}
                {row.use_case && <p className="mt-1 text-xs text-faint">Why: {row.use_case}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
