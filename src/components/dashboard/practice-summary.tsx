"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { bestPercent, catalog } from "@/lib/practice";
import { useStudent } from "@/lib/store";
import { cn } from "@/lib/utils";

export function PracticeSummary() {
  const { profile } = useStudent();
  // 5-question sprints are habit practice, not readiness mocks — keep the
  // mock stats honest.
  const practice = profile.practice.filter((a) => a.mode !== "sprint");
  const testById = new Map(catalog().map((c) => [c.test.id, c.test]));
  const testIds = [...new Set(practice.map((a) => a.testId))];
  const lastFive = practice.slice(0, 5);

  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-base font-bold text-ink">Practice & Mocks</p>
        <Link
          href="/pakistan/self-assessment"
          className="text-sm font-medium text-saffron hover:underline"
        >
          Browse tests →
        </Link>
      </div>

      {practice.length === 0 ? (
        <div className="mt-4">
          <p className="text-sm text-muted">
            Mock tests are the fastest way to find your real merit.
          </p>
          <Link
            href="/pakistan/self-assessment"
            className={cn(buttonVariants({ size: "sm" }), "mt-3")}
          >
            Take your first mock
          </Link>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-muted">
              {practice.length} attempt{practice.length === 1 ? "" : "s"}
            </span>
            <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-muted">
              {testIds.length} test{testIds.length === 1 ? "" : "s"} taken
            </span>
          </div>

          {testIds.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
                Best % per test
              </p>
              <ul className="mt-2 space-y-1.5">
                {testIds.slice(0, 6).map((id) => {
                  const name = testById.get(id)?.short ?? id;
                  const best = bestPercent(practice, id);
                  return (
                    <li key={id} className="flex items-center gap-3 text-sm">
                      <span className="truncate text-ink">{name}</span>
                      <span className="ml-auto font-mono text-xs font-semibold text-ink">
                        {best !== null ? `${best.toFixed(1)}%` : "—"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="mt-4">
            <div className="flex h-12 items-end gap-1">
              {lastFive.map((a) => (
                <div
                  key={a.id}
                  title={`${a.percent.toFixed(1)}%`}
                  className={cn(
                    "flex-1 rounded-t-sm",
                    a.percent >= 60
                      ? "bg-emerald"
                      : a.percent >= 40
                        ? "bg-amber"
                        : "bg-danger"
                  )}
                  style={{ height: `${Math.max(4, Math.min(48, a.percent))}px` }}
                />
              ))}
            </div>
            <p className="mt-1.5 text-[10px] uppercase tracking-widest text-faint">
              Last 5 attempts
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
