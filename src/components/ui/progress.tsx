import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  tone?: "saffron" | "emerald" | "danger" | "info" | "violet";
}

const toneClasses: Record<NonNullable<ProgressProps["tone"]>, string> = {
  saffron: "bg-saffron",
  emerald: "bg-emerald",
  danger: "bg-danger",
  info: "bg-info",
  violet: "bg-violet",
};

function Progress({
  className,
  value = 0,
  max = 100,
  tone = "saffron",
  ...props
}: ProgressProps) {
  const pct = max === 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-2", className)}
      {...props}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          toneClasses[tone]
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export { Progress };
