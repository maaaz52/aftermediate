"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type Palette = Record<string, string>;

export const PALETTE: Palette = {
  B: "#2f55d4", // blue (primary)
  D: "#1a2f6d", // deep navy
  W: "#ffffff", // white
  K: "#191f2c", // ink
  G: "#1c9e62", // green
  Y: "#e8a33d", // amber
  R: "#d63d3d", // red
  S: "#b7c0d4", // steel
  C: "#f4f2eb", // cream
  T: "#1790b0", // teal
};

export function PixelArt({
  grid,
  palette = PALETTE,
  scale = 2,
  className,
}: {
  grid: string[];
  palette?: Palette;
  scale?: number;
  className?: string;
}) {
  const rows = grid.length;
  const cols = Math.max(...grid.map((r) => r.length));

  const cells: React.ReactNode[] = [];
  grid.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      const color = palette[ch];
      if (!color) continue;
      cells.push(
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={1}
          height={1}
          fill={color}
        />
      );
    }
  });

  return (
    <svg
      viewBox={`0 0 ${cols} ${rows}`}
      width={cols * scale}
      height={rows * scale}
      className={cn("pixelated", className)}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {cells}
    </svg>
  );
}
