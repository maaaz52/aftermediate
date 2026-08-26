"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const pixelButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-sans text-sm font-semibold whitespace-nowrap border-2 border-ink transition-all duration-75 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-50 select-none [&_svg]:size-4 [&_svg]:shrink-0 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
  {
    variants: {
      variant: {
        primary: "bg-accent text-white shadow-[4px_4px_0_0_var(--color-ink)] hover:bg-accent-soft",
        secondary: "bg-surface text-ink shadow-[4px_4px_0_0_var(--color-ink)] hover:bg-surface-2",
        outline: "bg-transparent text-ink shadow-[4px_4px_0_0_var(--color-line)] hover:shadow-[4px_4px_0_0_var(--color-ink)]",
        ghost: "border-transparent text-ink shadow-none hover:bg-surface-2 hover:border-line",
        danger: "bg-danger text-white shadow-[4px_4px_0_0_var(--color-ink)] hover:brightness-110",
        emerald: "bg-emerald text-white shadow-[4px_4px_0_0_var(--color-ink)] hover:brightness-110",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-8 px-3 text-xs",
        lg: "h-13 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface PixelButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof pixelButtonVariants> {}

const PixelButton = React.forwardRef<HTMLButtonElement, PixelButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(pixelButtonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
PixelButton.displayName = "PixelButton";

export { PixelButton, pixelButtonVariants };
