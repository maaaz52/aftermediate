"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { CLOSINGS, type SentimentResult, type ToneId } from "@/lib/feedback-model";
import { useStudent } from "@/lib/store";
import { ShareStoryCard } from "./share-story-card";

const TAG_STYLES: Record<string, string> = {
  "highly-positive": "border-emerald/40 bg-emerald/10 text-emerald",
  positive: "border-saffron/40 bg-saffron/10 text-saffron",
  constructive: "border-amber/40 bg-amber/10 text-amber",
  critical: "border-danger/40 bg-danger/10 text-danger",
};

const TAG_LABELS: Record<string, string> = {
  "highly-positive": "Highly positive",
  positive: "Positive",
  constructive: "Constructive criticism",
  critical: "Critical feedback",
};

export function Celebration({
  result,
  tone,
  rating,
  quote,
  recommendTo,
  hasMedia,
  submittedAt,
  playConfetti = confetti,
}: {
  result: SentimentResult;
  tone: ToneId;
  rating: number;
  quote: string;
  recommendTo: string[];
  hasMedia: boolean;
  submittedAt: string;
  playConfetti?: (opts?: confetti.Options) => void;
}) {
  const { profile } = useStudent();
  const firstName = profile.name.split(" ")[0] || "friend";

  useEffect(() => {
    if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    playConfetti({ particleCount: 120, spread: 75, origin: { y: 0.6 } });
  }, [playConfetti]);

  return (
    <section aria-label="Thank you" className="mt-6 rounded-2xl border border-line bg-surface p-4 sm:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-saffron">Your voice landed</p>
      <h2 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">
        Thank you, {firstName}.
      </h2>
      <p className="mt-2 max-w-lg text-muted">{CLOSINGS[tone]}</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${TAG_STYLES[result.tag]}`}>
          {TAG_LABELS[result.tag]}
        </span>
        <span className="rounded-full border border-line px-3 py-1 font-mono text-xs text-faint">
          {result.score}/100
        </span>
        <span className="font-mono text-xs text-faint">{rating}/10</span>
      </div>
      {hasMedia && (
        <p className="mt-3 rounded-lg border border-amber/30 bg-amber/5 px-3 py-2 text-xs text-amber">
          Your media is in review — we&apos;ll check it before anything appears publicly.
        </p>
      )}

      <div className="mt-8">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-faint">Share your story</h3>
        <ShareStoryCard
          name={profile.name || "A student"}
          tone={tone}
          rating={rating}
          quote={quote}
          personas={recommendTo}
          date={submittedAt}
        />
      </div>

      <a
        href="#wishlist"
        className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-saffron transition-colors hover:text-saffron-soft"
      >
        Vote on the wishlist ↓
      </a>
    </section>
  );
}
