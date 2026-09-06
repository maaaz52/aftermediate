"use client";

import * as React from "react";
import { generateAvatarSvg, type AvatarStyleId } from "@/lib/avatar";
import { cn } from "@/lib/utils";

/**
 * Lazy dicebear avatar. The style templates are ~120KB each and are
 * dynamic-imported on demand, so routes render only the user's chosen style
 * instead of shipping all ten. Shows a neutral placeholder until the SVG loads.
 */
export function Avatar({
  styleId,
  seed,
  className,
}: {
  styleId: AvatarStyleId;
  seed: string;
  className?: string;
}) {
  const [svg, setSvg] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    generateAvatarSvg(styleId, seed)
      .then((s) => {
        if (alive) setSvg(s);
      })
      .catch(() => {
        if (alive) setSvg(null);
      });
    return () => {
      alive = false;
    };
  }, [styleId, seed]);

  if (!svg) {
    return <div aria-hidden className={cn("h-full w-full bg-surface-2", className)} />;
  }
  return (
    <div
      aria-hidden
      className={cn("h-full w-full [&>svg]:h-full [&>svg]:w-full", className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}