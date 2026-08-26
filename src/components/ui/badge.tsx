import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "border-line bg-surface-2 text-ink",
        saffron: "border-saffron/30 bg-saffron/10 text-saffron",
        emerald: "border-emerald/30 bg-emerald/10 text-emerald",
        danger: "border-danger/30 bg-danger/10 text-danger",
        info: "border-info/30 bg-info/10 text-info",
        violet: "border-violet/30 bg-violet/10 text-violet",
        muted: "border-line bg-transparent text-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
