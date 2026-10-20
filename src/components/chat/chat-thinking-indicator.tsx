"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const STATUS_MESSAGES = [
  "Reviewing your question",
  "Checking the useful details",
  "Preparing a clear answer",
  "Putting the answer together",
] as const;

type ChatThinkingIndicatorProps = {
  className?: string;
};

/**
 * A transparent progress cue for streamed chat responses. It intentionally
 * describes the visible task, not hidden model reasoning.
 */
export function ChatThinkingIndicator({ className }: ChatThinkingIndicatorProps) {
  const [messageIndex, setMessageIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % STATUS_MESSAGES.length);
    }, 1800);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div
      role="status"
      aria-label="Assistant is preparing an answer"
      className={cn("flex min-w-52 items-center gap-2 py-0.5 font-mono text-xs text-muted", className)}
    >
      <span aria-hidden className="flex items-center gap-1">
        <i className="h-1.5 w-1.5 animate-pulse rounded-full bg-current motion-reduce:animate-none" />
        <i className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:180ms] motion-reduce:animate-none" />
        <i className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:360ms] motion-reduce:animate-none" />
      </span>
      <span aria-hidden>{STATUS_MESSAGES[messageIndex]}</span>
    </div>
  );
}
