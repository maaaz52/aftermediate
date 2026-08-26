import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-11 w-full rounded-lg border border-line bg-surface-2 px-3.5 py-2 text-sm text-ink placeholder:text-faint transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron/50 focus-visible:border-saffron/40 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
