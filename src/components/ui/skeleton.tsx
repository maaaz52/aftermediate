import { cn } from "@/lib/utils";

/**
 * Shimmering placeholder block. Mirrors the size/shape of the content it is
 * loading so the transition to real data feels seamless.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface-2", className)} />;
}