"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PixelCardProps extends React.HTMLAttributes<HTMLDivElement> {
  shadow?: "ink" | "accent" | "none";
  interactive?: boolean;
}

export function PixelCard({
  className,
  shadow = "ink",
  interactive = false,
  ...props
}: PixelCardProps) {
  const shadowClass =
    shadow === "ink"
      ? "shadow-[5px_5px_0_0_var(--color-ink)]"
      : shadow === "accent"
      ? "shadow-[5px_5px_0_0_var(--color-accent)]"
      : "";

  return (
    <div
      className={cn(
        "border-2 border-ink bg-surface",
        shadowClass,
        interactive &&
          "transition-transform duration-75 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[3px_3px_0_0_var(--color-ink)]",
        className
      )}
      {...props}
    />
  );
}
