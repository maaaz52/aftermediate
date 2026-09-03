"use client";

import * as React from "react";

/**
 * Hand-rolled SVG line/bar chart. Replaces recharts for the handful of static
 * series on /convince and /trends. No axes beyond year labels and a min/max
 * baseline; hover shows the value. `color` is a CSS color (var() allowed).
 */
interface Point {
  year: string;
  value: number;
}

const W = 320;
const H = 120;
const PAD = 6;

function scale(points: Point[]): { min: number; max: number; x: (i: number) => number; y: (v: number) => number } {
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => PAD + (i * (W - 2 * PAD)) / Math.max(1, points.length - 1);
  const y = (v: number) => PAD + ((max - v) / span) * (H - 2 * PAD);
  return { min, max, x, y };
}

export function MiniLineChart({ points, color }: { points: Point[]; color: string }) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const { x, y } = scale(points);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full" role="img" aria-label="chart">
      {points.map((p, i) => (
        <g key={p.year}>
          <rect x={x(i) - 12} y={0} width={24} height={H} fill="transparent"
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
          <circle cx={x(i)} cy={y(p.value)} r={hovered === i ? 5 : 3} fill={color} />
          {hovered === i && (
            <text x={x(i)} y={y(p.value) - 8} textAnchor="middle" fontSize={10} fill="currentColor"
              className="font-mono">
              {p.value}
            </text>
          )}
        </g>
      ))}
      <path d={path} fill="none" stroke={color} strokeWidth={2.5} />
      <g fontSize={10} fill="currentColor" className="font-mono opacity-70" textAnchor="middle">
        {points.map((p, i) => (
          <text key={p.year} x={x(i)} y={H - 2}>{p.year}</text>
        ))}
      </g>
    </svg>
  );
}

export function MiniBarChart({ points, color }: { points: Point[]; color: string }) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const { max, x } = scale(points);
  const slot = (W - 2 * PAD) / points.length;
  const barW = Math.min(28, slot * 0.6);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full" role="img" aria-label="chart">
      {points.map((p, i) => {
        const bh = ((H - 2 * PAD) * p.value) / (max || 1);
        return (
          <g key={p.year}>
            <rect
              x={x(i) - slot / 2} y={0} width={slot} height={H} fill="transparent"
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
            />
            <rect
              x={x(i) - barW / 2} y={H - PAD - bh} width={barW} height={bh}
              fill={color} rx={4}
            />
            {hovered === i && (
              <text x={x(i)} y={H - PAD - bh - 6} textAnchor="middle" fontSize={10} fill="currentColor" className="font-mono">
                {p.value}
              </text>
            )}
          </g>
        );
      })}
      <g fontSize={10} fill="currentColor" className="font-mono opacity-70" textAnchor="middle">
        {points.map((p, i) => (
          <text key={p.year} x={x(i)} y={H - 2}>{p.year}</text>
        ))}
      </g>
    </svg>
  );
}