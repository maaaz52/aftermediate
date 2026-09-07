"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export function Brand({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
  nav?: boolean;
}) {
  if (compact) {
    return (
      <span className={cn("inline-flex select-none", className)}>
        <Image
          src="/logos/logo-mark.webp"
          alt="Aftermediate"
          width={40}
          height={34}
          priority
          className="h-auto w-auto"
        />
      </span>
    );
  }

  return (
    <span className={cn("inline-flex select-none", className)}>
      <Image
        src="/logos/logo-full.webp"
        alt="Aftermediate"
        width={180}
        height={34}
        priority
        className="h-auto w-auto"
      />
    </span>
  );
}